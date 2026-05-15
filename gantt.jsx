// Gantt / Cronograma view

const HITO_AREA = {
  'Acta inicio':       'Operacional',
  'Acta final':        'Operacional',
  'Certificación':     'Operacional',
  'Puesta operación':  'Operacional',
  'Carpeta cierre':    'Administrativa',
  'Pago':              'Financiera',
};
const AREA_COLOR = {
  'Operacional':   '#2563EB',
  'Administrativa':'#6D28D9',
  'Financiera':    '#15803D',
};
const AREA_BG = {
  'Operacional':   'var(--blue-50)',
  'Administrativa':'var(--violet-100)',
  'Financiera':    'var(--green-100)',
};

const PHASE_FILL = {
  '05. Gestion por iniciar Obra': { bg: 'linear-gradient(180deg,#A78BFA,#7C3AED)' },
  '06. En obra':                  { bg: 'linear-gradient(180deg,#60A5FA,#1E40AF)' },
  '07. Cierre Administrativo':    { bg: 'linear-gradient(180deg,#FB923C,#C04A0A)' },
  '08. Mesa de cierres':          { bg: 'linear-gradient(180deg,#FBBF24,#92590A)' },
  '10. Finiquitado':              { bg: 'linear-gradient(180deg,#4ADE80,#15803D)' },
};

function GanttPage({ data, openProject }) {
  const { proyectos, hitos, comunicaciones, today } = data;
  const [area, setArea] = React.useState('Todas');
  const [status, setStatus] = React.useState('todos');
  const [tipo, setTipo] = React.useState('todos');
  const [showFiniquitados, setShowFiniquitados] = React.useState(false);
  const [groupBy, setGroupBy] = React.useState('tipo'); // tipo | persona | none
  const [zoom, setZoom] = React.useState(1); // 1 = default

  // Range
  const allDates = proyectos.flatMap(p => [p.fecha_asignacion, p.fecha_inicio_prog, p.fecha_termino_prog]).filter(Boolean);
  const minDate = allDates.reduce((a,b) => a < b ? a : b);
  const maxDate = allDates.reduce((a,b) => a > b ? a : b);
  const start = new Date(minDate + 'T12:00:00Z'); start.setUTCDate(1);
  const end = new Date(maxDate + 'T12:00:00Z'); end.setUTCDate(28);
  end.setUTCMonth(end.getUTCMonth() + 1);
  const totalDays = Math.ceil((end - start) / 86400000);
  const PX_PER_DAY = 8 * zoom;
  const TIMELINE_W = totalDays * PX_PER_DAY;
  const ROW_H = 44;
  const LEFT_W = 320;

  // Filter projects
  const filtered = proyectos.filter(p => {
    if (!showFiniquitados && !p.activo) return false;
    if (status !== 'todos' && p.estatus !== status) return false;
    if (tipo !== 'todos' && p.tipo !== tipo) return false;
    return true;
  });

  // Filter hitos by area
  const hitosFiltered = hitos.filter(h => area === 'Todas' || HITO_AREA[h.tipo] === area);
  const hitosByProj = {};
  hitosFiltered.forEach(h => { (hitosByProj[h.id_proyecto] = hitosByProj[h.id_proyecto] || []).push(h); });

  // Juntas (eventos programados)
  const juntasByProj = {};
  comunicaciones.filter(c => c.tipo === 'junta').forEach(c => {
    (juntasByProj[c.id_proyecto] = juntasByProj[c.id_proyecto] || []).push(c);
  });

  // Group projects
  const groups = {};
  filtered.forEach(p => {
    let k = '__all__';
    if (groupBy === 'tipo') k = p.tipo + ' · ' + p.proyecto;
    else if (groupBy === 'persona') k = p.persona_servmac;
    (groups[k] = groups[k] || []).push(p);
  });
  const groupKeys = Object.keys(groups).sort((a,b) => groups[b].length - groups[a].length);

  // Date helpers
  const dateToX = (iso) => {
    if (!iso) return 0;
    const d = new Date(iso + 'T12:00:00Z');
    return Math.max(0, ((d - start) / 86400000) * PX_PER_DAY);
  };
  const todayX = dateToX(today);

  // Month/week ticks
  const months = [];
  let m = new Date(start);
  while (m <= end) {
    months.push({ date: new Date(m), x: dateToX(m.toISOString().slice(0,10)) });
    m.setUTCMonth(m.getUTCMonth() + 1);
  }
  const monthNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  // Upcoming events (next 21 days from today)
  const todayD = new Date(today + 'T12:00:00Z');
  const horizon = new Date(todayD); horizon.setDate(horizon.getDate() + 21);
  const upcoming = hitos
    .filter(h => h.estatus !== 'cumplido')
    .filter(h => area === 'Todas' || HITO_AREA[h.tipo] === area)
    .map(h => ({
      kind: 'hito', date: h.fecha_programada,
      titulo: h.tipo, proyecto: h.id_proyecto,
      area: HITO_AREA[h.tipo], responsable: h.responsable,
      atrasado: h.estatus === 'atrasado',
    }))
    .filter(e => {
      const d = new Date(e.date + 'T12:00:00Z');
      return d <= horizon;
    })
    .sort((a,b) => new Date(a.date) - new Date(b.date))
    .slice(0, 30);

  const projMap = Object.fromEntries(proyectos.map(p => [p.id, p]));

  // Stats by area
  const statsByArea = ['Operacional','Administrativa','Financiera'].map(a => {
    const pend = hitos.filter(h => HITO_AREA[h.tipo] === a && h.estatus !== 'cumplido').length;
    const atras = hitos.filter(h => HITO_AREA[h.tipo] === a && h.estatus === 'atrasado').length;
    const next7 = hitos.filter(h => {
      if (HITO_AREA[h.tipo] !== a || h.estatus === 'cumplido') return false;
      const d = new Date(h.fecha_programada + 'T12:00:00Z');
      const days = (d - todayD) / 86400000;
      return days >= 0 && days <= 7;
    }).length;
    return { area: a, pend, atras, next7 };
  });

  return (
    <div className="stack-md">
      {/* Top: area stats */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {statsByArea.map(s => (
          <div key={s.area} className="kpi" style={{ borderLeft: '4px solid ' + AREA_COLOR[s.area] }}>
            <div className="row between">
              <div>
                <div className="kpi-label" style={{ color: AREA_COLOR[s.area] }}>● {s.area}</div>
                <div className="kpi-value" style={{ fontSize: 26 }}>{s.pend}<span className="kpi-unit"> pendientes</span></div>
              </div>
              <div className="stack-xs" style={{ textAlign: 'right', fontSize: 12 }}>
                <div><span className="cell-strong" style={{ color: 'var(--red-600)' }}>{s.atras}</span> <span className="muted">atrasados</span></div>
                <div><span className="cell-strong" style={{ color: 'var(--orange-600)' }}>{s.next7}</span> <span className="muted">próximos 7 días</span></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: 14 }}>
        <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
          <div className="chips">
            <div className="muted" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', alignSelf:'center', marginRight: 4 }}>Área:</div>
            {['Todas','Operacional','Administrativa','Financiera'].map(a => (
              <div key={a} className={'chip ' + (area === a ? 'active' : '')} onClick={() => setArea(a)}
                   style={area === a && a !== 'Todas' ? { background: AREA_COLOR[a], borderColor: AREA_COLOR[a] } : {}}>
                {a !== 'Todas' && <span style={{ width: 8, height: 8, borderRadius: 4, background: AREA_COLOR[a], display: 'inline-block', marginRight: 4 }}/>}
                {a}
              </div>
            ))}
          </div>
          <div className="chips" style={{ marginLeft: 'auto' }}>
            <div className="muted" style={{ fontSize: 11, fontWeight: 600, alignSelf:'center', marginRight: 4 }}>Agrupar:</div>
            {[['tipo','Por tipo de proyecto'],['persona','Por persona'],['none','Sin agrupar']].map(([k,l]) => (
              <div key={k} className={'chip ' + (groupBy === k ? 'active' : '')} onClick={() => setGroupBy(k)}>{l}</div>
            ))}
          </div>
        </div>
        <div className="row" style={{ gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
          <div className="chips">
            <div className={'chip ' + (tipo === 'todos' ? 'active' : '')} onClick={() => setTipo('todos')}>Todos los tipos</div>
            <div className={'chip ' + (tipo === 'Obra Menor' ? 'active' : '')} onClick={() => setTipo('Obra Menor')}>Obra Menor</div>
            <div className={'chip ' + (tipo === 'Servicing' ? 'active' : '')} onClick={() => setTipo('Servicing')}>Servicing</div>
          </div>
          <div className="chips">
            <div className={'chip ' + (showFiniquitados ? 'active' : '')} onClick={() => setShowFiniquitados(!showFiniquitados)}>
              Incluir finiquitados
            </div>
          </div>
          <div style={{ marginLeft: 'auto' }} className="row">
            <span className="muted" style={{ fontSize: 11 }}>Zoom</span>
            <button className="btn btn-sm" onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}>−</button>
            <span className="mono" style={{ fontSize: 12, minWidth: 30, textAlign: 'center' }}>{Math.round(zoom*100)}%</span>
            <button className="btn btn-sm" onClick={() => setZoom(Math.min(2.5, zoom + 0.25))}>+</button>
          </div>
        </div>
      </div>

      {/* Layout: Gantt + Upcoming side panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'flex-start' }}>
        {/* Gantt */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="card-head" style={{ padding: '16px 20px 12px', margin: 0, borderBottom: '1px solid var(--line)' }}>
            <h3>Cronograma de proyectos</h3>
            <span className="sub">· {filtered.length} proyectos · {start.toISOString().slice(0,7)} → {end.toISOString().slice(0,7)}</span>
            <div className="right">
              <Legend/>
            </div>
          </div>
          <div style={{ overflow: 'auto', maxHeight: 720 }}>
            <div style={{ display: 'grid', gridTemplateColumns: `${LEFT_W}px ${TIMELINE_W}px`, position: 'relative' }}>
              {/* Header row */}
              <div style={{ position: 'sticky', top: 0, left: 0, zIndex: 4, background: 'var(--bg-warm)', borderBottom: '1px solid var(--line)', borderRight: '1px solid var(--line)', padding: '10px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', height: 44, boxSizing: 'border-box' }}>
                Proyecto
              </div>
              <div style={{ position: 'sticky', top: 0, zIndex: 3, background: 'var(--bg-warm)', borderBottom: '1px solid var(--line)', height: 44, position: 'relative' }}>
                <svg width={TIMELINE_W} height={44} style={{ display: 'block' }}>
                  {months.map((mo, i) => (
                    <g key={i}>
                      <line x1={mo.x} y1={0} x2={mo.x} y2={44} stroke="#E4E8F0" />
                      <text x={mo.x + 6} y={28} fontSize="11" fontWeight="600" fill="#0F172A">
                        {monthNames[mo.date.getUTCMonth()]} <tspan fill="#94A3B8">{mo.date.getUTCFullYear().toString().slice(2)}</tspan>
                      </text>
                    </g>
                  ))}
                  {/* today marker */}
                  <line x1={todayX} y1={0} x2={todayX} y2={44} stroke="#F26B1F" strokeWidth="2" />
                  <rect x={todayX-22} y={6} width="44" height="16" rx="3" fill="#F26B1F"/>
                  <text x={todayX} y={18} fontSize="10" fontWeight="700" fill="#fff" textAnchor="middle">HOY</text>
                </svg>
              </div>

              {/* Body */}
              {groupKeys.map(gk => (
                <React.Fragment key={gk}>
                  {groupBy !== 'none' && (
                    <>
                      <div style={{ gridColumn: '1 / -1', background: 'var(--bg-warm)', padding: '8px 14px', borderBottom: '1px solid var(--line)', borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', left: 0 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--blue-900)' }}>{gk}</span>
                        <span className="muted" style={{ fontSize: 11 }}>{groups[gk].length} proyectos</span>
                      </div>
                    </>
                  )}
                  {groups[gk].map(p => {
                    const xStart = dateToX(p.fecha_inicio_prog);
                    const xEnd = dateToX(p.fecha_termino_prog);
                    const w = Math.max(8, xEnd - xStart);
                    const xAsig = dateToX(p.fecha_asignacion);
                    const phaseFill = PHASE_FILL[p.estatus];
                    const projHitos = hitosByProj[p.id] || [];
                    const projJuntas = juntasByProj[p.id] || [];

                    return (
                      <React.Fragment key={p.id}>
                        <div onClick={() => openProject(p.id)} style={{
                          padding: '8px 14px', borderBottom: '1px solid var(--line)', borderRight: '1px solid var(--line)',
                          position: 'sticky', left: 0, background: 'var(--card)', zIndex: 2,
                          cursor: 'pointer', height: ROW_H, boxSizing: 'border-box',
                          display: 'flex', alignItems: 'center', gap: 10
                        }}>
                          <Avatar name={p.persona_servmac} size={26}/>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="cell-strong" style={{ fontSize: 12.5, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.sucursal}</div>
                            <div className="cell-id" style={{ fontSize: 10.5 }}>CR {p.cr} · {p.proyecto}</div>
                          </div>
                        </div>
                        <div style={{ position: 'relative', height: ROW_H, borderBottom: '1px solid var(--line)', background: '#fff' }}>
                          {/* month grid */}
                          {months.map((mo, i) => <div key={i} style={{ position:'absolute', left: mo.x, top: 0, bottom: 0, width: 1, background: '#F0F2F7' }}/>)}
                          {/* today line */}
                          <div style={{ position:'absolute', left: todayX, top: 0, bottom: 0, width: 2, background: 'rgba(242,107,31,0.35)' }}/>

                          {/* Asignación marker (small thin line back to where assignment happened) */}
                          {xAsig < xStart && (
                            <div style={{ position:'absolute', left: xAsig, top: ROW_H/2 - 0.5, width: xStart - xAsig, height: 1, background: 'var(--muted-2)', borderTop: '1px dashed var(--muted-2)' }}/>
                          )}
                          {/* Bar */}
                          <div
                            onClick={() => openProject(p.id)}
                            title={`${p.sucursal} · ${fmtDate(p.fecha_inicio_prog)} → ${fmtDate(p.fecha_termino_prog)}`}
                            style={{
                              position: 'absolute',
                              left: xStart, top: 10, height: ROW_H - 20, width: w,
                              background: phaseFill?.bg || '#94A3B8',
                              borderRadius: 5, cursor: 'pointer',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                              display: 'flex', alignItems: 'center', paddingLeft: 8,
                              color: '#fff', fontSize: 10.5, fontWeight: 600,
                              overflow: 'hidden', whiteSpace: 'nowrap'
                            }}>
                            {w > 90 && (statusMap[p.estatus]?.short2 || '')}
                          </div>

                          {/* Hitos */}
                          {projHitos.map(h => {
                            const x = dateToX(h.fecha_programada);
                            const color = AREA_COLOR[HITO_AREA[h.tipo]];
                            const cumplido = h.estatus === 'cumplido';
                            const atrasado = h.estatus === 'atrasado';
                            return (
                              <div key={h.id}
                                title={`${h.tipo} — ${fmtDate(h.fecha_programada)}${h.fecha_real ? ' (cumplido ' + fmtDate(h.fecha_real) + ')' : ''}`}
                                style={{
                                  position: 'absolute', left: x - 7, top: ROW_H/2 - 7,
                                  width: 14, height: 14, transform: 'rotate(45deg)',
                                  background: cumplido ? color : atrasado ? '#fff' : '#fff',
                                  border: `2px solid ${atrasado ? 'var(--red-600)' : color}`,
                                  borderRadius: 2, zIndex: 2, cursor: 'pointer',
                                  boxShadow: cumplido ? 'none' : '0 1px 3px rgba(0,0,0,0.15)'
                                }}/>
                            );
                          })}

                          {/* Juntas marker */}
                          {projJuntas.map(c => {
                            const x = dateToX(c.fecha);
                            return (
                              <div key={c.id}
                                title={`Junta · ${c.resumen} (${fmtDate(c.fecha)})`}
                                style={{
                                  position: 'absolute', left: x - 4, top: 4,
                                  width: 8, height: 8, borderRadius: '50%',
                                  background: '#fff', border: '2px solid #6D28D9',
                                  zIndex: 3
                                }}/>
                            );
                          })}
                        </div>
                      </React.Fragment>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming events panel */}
        <div className="card" style={{ padding: 0, position: 'sticky', top: 16 }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
            <h3 style={{ margin: 0, fontSize: 14 }}>Próximos 21 días</h3>
            <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>Citas y entregables programados</div>
          </div>
          <div style={{ maxHeight: 600, overflowY: 'auto' }}>
            {upcoming.length === 0 && <div className="empty">Sin eventos próximos</div>}
            {upcoming.map((e, i) => {
              const p = projMap[e.proyecto];
              const d = new Date(e.date + 'T12:00:00Z');
              const daysOut = Math.round((d - todayD) / 86400000);
              return (
                <div key={i} onClick={() => openProject(e.proyecto)} style={{
                  padding: '12px 16px', borderBottom: '1px solid var(--line)',
                  cursor: 'pointer', display: 'grid', gridTemplateColumns: '46px 1fr', gap: 12
                }}>
                  <div style={{
                    background: e.atrasado ? 'var(--red-100)' : AREA_BG[e.area],
                    color: e.atrasado ? 'var(--red-600)' : AREA_COLOR[e.area],
                    borderRadius: 8, padding: '6px 4px', textAlign: 'center'
                  }}>
                    <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {monthNames[d.getUTCMonth()]}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1 }}>{d.getUTCDate()}</div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="row" style={{ gap: 6, marginBottom: 2 }}>
                      <span className="tag" style={{ background: AREA_BG[e.area], color: AREA_COLOR[e.area], borderColor:'transparent', fontSize: 10 }}>● {e.area}</span>
                      {e.atrasado && <span className="tag" style={{ background: 'var(--red-100)', color: 'var(--red-600)', borderColor:'transparent', fontSize: 10 }}>⚠ atrasado</span>}
                      {!e.atrasado && daysOut <= 2 && <span className="tag" style={{ background: 'var(--orange-100)', color: 'var(--orange-700)', borderColor:'transparent', fontSize: 10 }}>{daysOut === 0 ? 'hoy' : daysOut === 1 ? 'mañana' : `en ${daysOut} días`}</span>}
                    </div>
                    <div className="cell-strong" style={{ fontSize: 13 }}>{e.titulo}</div>
                    <div className="cell-sub" style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p?.sucursal} · CR {p?.cr}</div>
                    <div className="row" style={{ gap: 6, marginTop: 4 }}>
                      <Avatar name={e.responsable} size={18}/>
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>{e.responsable}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Legend() {
  const items = [
    { color: '#7C3AED', label: 'Gestión' },
    { color: '#1E40AF', label: 'En obra' },
    { color: '#C04A0A', label: 'Cierre admin' },
    { color: '#92590A', label: 'Mesa' },
    { color: '#15803D', label: 'Finiquitado' },
  ];
  return (
    <div className="row" style={{ gap: 14, fontSize: 11, color: 'var(--muted)', flexWrap: 'wrap' }}>
      <div className="row" style={{ gap: 4 }}>
        {items.map(i => (
          <span key={i.label} title={i.label} style={{ width: 12, height: 12, borderRadius: 3, background: i.color }}/>
        ))}
        <span style={{ marginLeft: 6 }}>fase</span>
      </div>
      <span style={{ width: 1, height: 16, background: 'var(--line)' }}/>
      <div className="row" style={{ gap: 6 }}>
        <span style={{ width: 10, height: 10, transform:'rotate(45deg)', background: '#2563EB', borderRadius: 2 }}/>
        <span>hito cumplido</span>
      </div>
      <div className="row" style={{ gap: 6 }}>
        <span style={{ width: 10, height: 10, transform:'rotate(45deg)', background: '#fff', border:'2px solid #2563EB', borderRadius: 2 }}/>
        <span>pendiente</span>
      </div>
      <div className="row" style={{ gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius:'50%', background:'#fff', border:'2px solid #6D28D9' }}/>
        <span>junta</span>
      </div>
    </div>
  );
}

Object.assign(window, { GanttPage });
