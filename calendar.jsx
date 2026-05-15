// Calendar / Agenda view + project mini-Gantt

const VISIT_TYPE = {
  CITA: 'cita',         // junta programada
  ENTREGA: 'entrega',   // hito/entregable
  FIRMA: 'firma',       // firma o certificación
  VISITA: 'visita',     // visita técnica a obra
};

// Map hito → visit type
const HITO_VISIT = {
  'Acta inicio':      { kind: VISIT_TYPE.FIRMA,   label: 'Firma Acta inicio',  duration: 60 },
  'Acta final':       { kind: VISIT_TYPE.FIRMA,   label: 'Firma Acta final',   duration: 60 },
  'Certificación':    { kind: VISIT_TYPE.FIRMA,   label: 'Certificación',      duration: 90 },
  'Puesta operación': { kind: VISIT_TYPE.ENTREGA, label: 'Puesta en operación',duration: 120 },
  'Carpeta cierre':   { kind: VISIT_TYPE.ENTREGA, label: 'Entrega carpeta cierre', duration: 30 },
  'Pago':             { kind: VISIT_TYPE.ENTREGA, label: 'Trámite de pago',    duration: 30 },
};
const KIND_COLOR = {
  [VISIT_TYPE.CITA]:    { bg: 'var(--violet-100)', fg: 'var(--violet-600)', bar: '#6D28D9' },
  [VISIT_TYPE.ENTREGA]: { bg: 'var(--orange-100)', fg: 'var(--orange-700)', bar: '#F26B1F' },
  [VISIT_TYPE.FIRMA]:   { bg: 'var(--blue-100)',   fg: 'var(--blue-700)',   bar: '#2563EB' },
  [VISIT_TYPE.VISITA]:  { bg: 'var(--green-100)',  fg: 'var(--green-600)',  bar: '#15803D' },
};
const KIND_LABEL = {
  [VISIT_TYPE.CITA]: 'Cita',
  [VISIT_TYPE.ENTREGA]: 'Entrega',
  [VISIT_TYPE.FIRMA]: 'Firma',
  [VISIT_TYPE.VISITA]: 'Visita',
};
const KIND_ICON = {
  [VISIT_TYPE.CITA]: '☎',
  [VISIT_TYPE.ENTREGA]: '📦',
  [VISIT_TYPE.FIRMA]: '✎',
  [VISIT_TYPE.VISITA]: '📍',
};

function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h;
}

// Build all visits from hitos + comunicaciones (juntas). Sourced from "Add-on" simulated extraction.
function deriveVisitas(data) {
  const visitas = [];
  const projMap = Object.fromEntries(data.proyectos.map(p => [p.id, p]));

  data.hitos.forEach(h => {
    if (h.estatus === 'cumplido') return;
    const meta = HITO_VISIT[h.tipo];
    if (!meta) return;
    const p = projMap[h.id_proyecto];
    if (!p) return;
    const seed = hashStr(h.id);
    const hour = 9 + (seed % 8);  // 9–16
    const min = [0, 15, 30, 45][(seed >>> 4) % 4];
    visitas.push({
      id: 'v-' + h.id,
      source: 'hito',
      sourceId: h.id,
      proyecto: h.id_proyecto,
      fecha: h.fecha_programada,
      hora: `${String(hour).padStart(2,'0')}:${String(min).padStart(2,'0')}`,
      duracion: meta.duration,
      kind: meta.kind,
      titulo: meta.label,
      ubicacion: p.sucursal,
      asistentes: [p.persona_servmac, p.persona_cliente],
      origen: 'Detectado automáticamente desde correo',
      estatus: h.estatus === 'atrasado' ? 'atrasado' : 'programado',
      notas: `Auto-generado desde hito ${h.tipo}.`,
    });
  });

  // Juntas from comunicaciones — translate to future visits where possible, keep as past records too
  data.comunicaciones.filter(c => c.tipo === 'junta').forEach(c => {
    const p = projMap[c.id_proyecto];
    if (!p) return;
    const seed = hashStr(c.id);
    const hour = 10 + (seed % 7);
    const min = [0, 30][seed % 2];
    visitas.push({
      id: 'v-' + c.id,
      source: 'comm',
      sourceId: c.id,
      proyecto: c.id_proyecto,
      fecha: c.fecha,
      hora: `${String(hour).padStart(2,'0')}:${String(min).padStart(2,'0')}`,
      duracion: 60,
      kind: VISIT_TYPE.CITA,
      titulo: c.resumen,
      ubicacion: 'Sucursal ' + p.sucursal,
      asistentes: [c.origen, c.destino],
      origen: 'Extraído de junta',
      estatus: new Date(c.fecha) < new Date(data.today) ? 'realizada' : 'programada',
      notas: c.resumen,
    });
  });

  // Add a few "near term" simulated requests from the email add-on for activos
  data.proyectos.filter(p => p.activo).slice(0, 14).forEach((p, i) => {
    const seed = hashStr(p.id + 'syn');
    const offset = 1 + (i % 14); // tomorrow .. +2 weeks
    const baseDate = new Date(data.today + 'T12:00:00Z');
    baseDate.setUTCDate(baseDate.getUTCDate() + offset);
    const hour = 9 + (seed % 8);
    const min = [0, 15, 30, 45][(seed >>> 4) % 4];
    const titulos = [
      'Visita técnica solicitada por sucursal',
      'Recorrido pre-entrega',
      'Cita firma de plano modificado',
      'Conciliación de cantidad de obra',
      'Junta semanal de obra',
      'Validación de carpeta cierre',
    ];
    const kinds = [VISIT_TYPE.VISITA, VISIT_TYPE.VISITA, VISIT_TYPE.FIRMA, VISIT_TYPE.CITA, VISIT_TYPE.CITA, VISIT_TYPE.ENTREGA];
    visitas.push({
      id: 'v-syn-' + p.id,
      source: 'addon',
      sourceId: null,
      proyecto: p.id,
      fecha: baseDate.toISOString().slice(0, 10),
      hora: `${String(hour).padStart(2,'0')}:${String(min).padStart(2,'0')}`,
      duracion: 60,
      kind: kinds[seed % kinds.length],
      titulo: titulos[seed % titulos.length],
      ubicacion: p.sucursal,
      asistentes: [p.persona_servmac, p.persona_cliente],
      origen: 'Add-on Gmail · clasificador Claude',
      estatus: 'propuesta',
      notas: 'Detectado en correo entrante. Confirmar con cliente.',
    });
  });

  return visitas.sort((a, b) => {
    const k = a.fecha.localeCompare(b.fecha);
    return k !== 0 ? k : a.hora.localeCompare(b.hora);
  });
}

// ======= Calendar Page =======
function CalendarPage({ data, openProject }) {
  const visitas = React.useMemo(() => deriveVisitas(data), [data]);
  const today = data.today;
  const [view, setView] = React.useState('semana'); // 'semana' | 'mes' | 'dia'
  const [cursor, setCursor] = React.useState(today); // YYYY-MM-DD anchor
  const [kindFilter, setKindFilter] = React.useState('todas');

  const projMap = Object.fromEntries(data.proyectos.map(p => [p.id, p]));
  const todayD = new Date(today + 'T12:00:00Z');

  const filtered = visitas.filter(v => kindFilter === 'todas' || v.kind === kindFilter);

  // Tomorrow's agenda
  const tomorrow = new Date(todayD); tomorrow.setUTCDate(todayD.getUTCDate() + 1);
  const tomorrowKey = tomorrow.toISOString().slice(0,10);
  const tomorrowAgenda = filtered.filter(v => v.fecha === tomorrowKey);
  const todayAgenda = filtered.filter(v => v.fecha === today);

  // Stats
  const next7 = filtered.filter(v => {
    const d = new Date(v.fecha + 'T12:00:00Z');
    const diff = (d - todayD) / 86400000;
    return diff >= 0 && diff < 7;
  });
  const propuestas = filtered.filter(v => v.estatus === 'propuesta');
  const atrasadas  = filtered.filter(v => v.estatus === 'atrasado');

  return (
    <div className="stack-md">
      {/* Hero — Mañana's agenda */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 16 }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, var(--blue-900), var(--blue-700))', color: '#fff', border: 'none', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -20, top: -20, width: 160, height: 160, background: 'radial-gradient(circle, rgba(242,107,31,0.3), transparent 70%)' }}/>
          <div style={{ position: 'relative' }}>
            <div className="row" style={{ gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#FFB87A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Mañana</span>
              <span className="mono" style={{ fontSize: 12, color: '#b1c1dd' }}>{fmtDateLong(tomorrowKey)}</span>
            </div>
            <div style={{ fontSize: 38, fontWeight: 700, letterSpacing: '-0.025em', marginTop: 6 }}>
              {tomorrowAgenda.length} <span style={{ fontSize: 16, fontWeight: 500, color: '#b1c1dd' }}>citas y entregables</span>
            </div>
            <div className="muted" style={{ color: '#b1c1dd', fontSize: 12, marginTop: 4 }}>
              {tomorrowAgenda.filter(v => v.kind === 'firma').length} firmas · {tomorrowAgenda.filter(v => v.kind === 'visita').length} visitas · {tomorrowAgenda.filter(v => v.kind === 'cita').length} juntas · {tomorrowAgenda.filter(v => v.kind === 'entrega').length} entregas
            </div>
            <div className="stack-sm" style={{ marginTop: 14, maxHeight: 180, overflowY: 'auto', paddingRight: 6 }}>
              {tomorrowAgenda.slice(0, 6).map(v => {
                const p = projMap[v.proyecto];
                return (
                  <div key={v.id} onClick={() => openProject(v.proyecto)} style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 10px', display: 'grid', gridTemplateColumns: '60px 1fr', gap: 10 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'IBM Plex Mono' }}>{v.hora}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.titulo}</div>
                      <div style={{ fontSize: 11, color: '#b1c1dd', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p?.sucursal} · CR {p?.cr}</div>
                    </div>
                  </div>
                );
              })}
              {tomorrowAgenda.length === 0 && <div style={{ color: '#b1c1dd', fontSize: 12, padding: '8px 0' }}>Sin eventos programados para mañana.</div>}
            </div>
          </div>
        </div>

        <KPI label="Hoy" value={todayAgenda.length} unit="eventos" delta={fmtDateLong(today)} deltaDir="flat"/>
        <KPI label="Próximos 7 días" value={next7.length} delta={`${atrasadas.length} atrasadas`} deltaDir={atrasadas.length ? 'down' : 'flat'}/>
        <KPI label="Propuestas pendientes" value={propuestas.length} delta="Add-on Gmail · por confirmar" deltaDir="flat" featured="featured-orange"/>
      </div>

      {/* Toolbar */}
      <div className="card" style={{ padding: 14 }}>
        <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
          <div className="chips">
            {[['semana','Semana'], ['mes','Mes'], ['dia','Día']].map(([k,l]) => (
              <div key={k} className={'chip ' + (view === k ? 'active' : '')} onClick={() => setView(k)}>{l}</div>
            ))}
          </div>
          <div className="row" style={{ gap: 6 }}>
            <button className="btn btn-sm" onClick={() => setCursor(today)}>Hoy</button>
            <button className="btn btn-sm btn-ghost" onClick={() => setCursor(shiftDate(cursor, view, -1))}>‹</button>
            <button className="btn btn-sm btn-ghost" onClick={() => setCursor(shiftDate(cursor, view, +1))}>›</button>
            <span className="cell-strong" style={{ fontSize: 14, marginLeft: 8 }}>{labelFor(cursor, view)}</span>
          </div>
          <div className="chips" style={{ marginLeft: 'auto' }}>
            <div className="muted" style={{ fontSize: 11, fontWeight: 600, alignSelf: 'center', marginRight: 4 }}>Tipo:</div>
            <div className={'chip ' + (kindFilter === 'todas' ? 'active' : '')} onClick={() => setKindFilter('todas')}>Todas</div>
            {Object.values(VISIT_TYPE).map(k => (
              <div key={k} className={'chip ' + (kindFilter === k ? 'active' : '')} onClick={() => setKindFilter(k)}>
                <span style={{ width: 8, height: 8, borderRadius: 4, background: KIND_COLOR[k].bar, display: 'inline-block', marginRight: 6 }}/>
                {KIND_LABEL[k]}
              </div>
            ))}
          </div>
        </div>
      </div>

      {view === 'semana' && <WeekView cursor={cursor} visitas={filtered} projMap={projMap} today={today} openProject={openProject}/>}
      {view === 'mes'    && <MonthView cursor={cursor} visitas={filtered} projMap={projMap} today={today} onDayClick={(d) => { setCursor(d); setView('dia'); }}/>}
      {view === 'dia'    && <DayView cursor={cursor} visitas={filtered} projMap={projMap} today={today} openProject={openProject}/>}
    </div>
  );
}

function shiftDate(iso, view, dir) {
  const d = new Date(iso + 'T12:00:00Z');
  if (view === 'semana') d.setUTCDate(d.getUTCDate() + dir * 7);
  else if (view === 'mes') d.setUTCMonth(d.getUTCMonth() + dir);
  else d.setUTCDate(d.getUTCDate() + dir);
  return d.toISOString().slice(0, 10);
}
function labelFor(iso, view) {
  const d = new Date(iso + 'T12:00:00Z');
  if (view === 'semana') {
    const monday = startOfWeek(d);
    const sunday = new Date(monday); sunday.setUTCDate(monday.getUTCDate() + 6);
    return `${monday.getUTCDate()} ${MONTHS_S[monday.getUTCMonth()]} – ${sunday.getUTCDate()} ${MONTHS_S[sunday.getUTCMonth()]} ${sunday.getUTCFullYear()}`;
  }
  if (view === 'mes') return `${MONTHS_L[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  return fmtDateLong(iso);
}
const MONTHS_S = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const MONTHS_L = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DOW_S = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

function startOfWeek(d) {
  const r = new Date(d);
  const day = (r.getUTCDay() + 6) % 7; // monday=0
  r.setUTCDate(r.getUTCDate() - day);
  return r;
}

function WeekView({ cursor, visitas, projMap, today, openProject }) {
  const monday = startOfWeek(new Date(cursor + 'T12:00:00Z'));
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setUTCDate(monday.getUTCDate() + i);
    return d;
  });
  const byDay = {};
  visitas.forEach(v => { (byDay[v.fecha] = byDay[v.fecha] || []).push(v); });

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {days.map((d, i) => {
          const key = d.toISOString().slice(0,10);
          const isToday = key === today;
          const items = (byDay[key] || []).sort((a,b) => a.hora.localeCompare(b.hora));
          return (
            <div key={i} style={{
              borderRight: i < 6 ? '1px solid var(--line)' : 'none',
              minHeight: 480,
              background: isToday ? 'var(--blue-50)' : '#fff',
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ padding: '12px 10px 10px', borderBottom: '1px solid var(--line)', background: isToday ? 'rgba(37,99,235,0.08)' : 'var(--bg-warm)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: isToday ? 'var(--blue-700)' : 'var(--muted)' }}>{DOW_S[i]}</div>
                <div className="row" style={{ gap: 6 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: isToday ? 'var(--blue-700)' : 'var(--text)' }}>{d.getUTCDate()}</div>
                  {isToday && <span style={{ background: 'var(--orange-500)', color: '#fff', padding: '2px 6px', borderRadius: 4, fontSize: 9, fontWeight: 700, alignSelf: 'flex-start', marginTop: 8 }}>HOY</span>}
                  <span className="muted" style={{ fontSize: 11, marginLeft: 'auto', alignSelf: 'center' }}>{items.length}</span>
                </div>
              </div>
              <div style={{ padding: 8, flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {items.map(v => <EventCard key={v.id} v={v} p={projMap[v.proyecto]} onClick={() => openProject(v.proyecto)} compact/>)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MonthView({ cursor, visitas, projMap, today, onDayClick }) {
  const ref = new Date(cursor + 'T12:00:00Z');
  const first = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), 1));
  const startGrid = startOfWeek(first);
  const days = Array.from({ length: 42 }, (_, i) => { const d = new Date(startGrid); d.setUTCDate(startGrid.getUTCDate()+i); return d; });
  const byDay = {};
  visitas.forEach(v => { (byDay[v.fecha] = byDay[v.fecha] || []).push(v); });

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'var(--bg-warm)', borderBottom: '1px solid var(--line)' }}>
        {DOW_S.map(d => <div key={d} style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)' }}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {days.map((d, i) => {
          const key = d.toISOString().slice(0,10);
          const isToday = key === today;
          const inMonth = d.getUTCMonth() === ref.getUTCMonth();
          const items = (byDay[key] || []).sort((a,b) => a.hora.localeCompare(b.hora));
          return (
            <div key={i} onClick={() => onDayClick(key)} style={{
              borderRight: ((i+1) % 7) ? '1px solid var(--line)' : 'none',
              borderBottom: '1px solid var(--line)',
              minHeight: 110, padding: 8, cursor: 'pointer',
              background: isToday ? 'var(--blue-50)' : inMonth ? '#fff' : 'var(--bg-warm)',
              opacity: inMonth ? 1 : 0.55,
            }}>
              <div className="row" style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: isToday ? 700 : 500, color: isToday ? 'var(--blue-700)' : 'var(--text)' }}>{d.getUTCDate()}</span>
                {isToday && <span style={{ marginLeft: 'auto', background: 'var(--orange-500)', color: '#fff', padding: '1px 5px', borderRadius: 3, fontSize: 9, fontWeight: 700 }}>HOY</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {items.slice(0, 3).map(v => (
                  <div key={v.id} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, background: KIND_COLOR[v.kind].bg, color: KIND_COLOR[v.kind].fg, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <span className="mono">{v.hora}</span> {v.titulo}
                  </div>
                ))}
                {items.length > 3 && <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>+ {items.length - 3} más</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayView({ cursor, visitas, projMap, today, openProject }) {
  const items = visitas.filter(v => v.fecha === cursor).sort((a,b) => a.hora.localeCompare(b.hora));
  const hours = Array.from({ length: 11 }, (_, i) => 8 + i); // 8h-18h
  return (
    <div className="card" style={{ padding: 0 }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <h3 style={{ margin: 0, fontSize: 15 }}>{fmtDateLong(cursor)}</h3>
        <span className="muted" style={{ fontSize: 12 }}>· {items.length} eventos</span>
        {cursor === today && <span style={{ background: 'var(--orange-500)', color: '#fff', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>HOY</span>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', position: 'relative' }}>
        {hours.map((h, i) => (
          <React.Fragment key={h}>
            <div style={{ padding: '20px 12px', textAlign: 'right', fontSize: 11, color: 'var(--muted)', borderBottom: '1px solid var(--line)', fontFamily: 'IBM Plex Mono' }}>{String(h).padStart(2,'0')}:00</div>
            <div style={{ borderLeft: '1px solid var(--line)', borderBottom: '1px solid var(--line)', minHeight: 60, position: 'relative', padding: 6 }}>
              {items.filter(v => parseInt(v.hora) === h).map(v => (
                <div key={v.id} onClick={() => openProject(v.proyecto)}>
                  <EventCard v={v} p={projMap[v.proyecto]} onClick={() => openProject(v.proyecto)} />
                </div>
              ))}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function EventCard({ v, p, onClick, compact }) {
  const k = KIND_COLOR[v.kind];
  const propuesta = v.estatus === 'propuesta';
  const atrasada = v.estatus === 'atrasado';
  return (
    <div onClick={onClick} style={{
      background: '#fff', borderLeft: `3px solid ${k.bar}`,
      borderRadius: 5, padding: compact ? '6px 8px' : '10px 12px',
      boxShadow: 'var(--shadow-sm)', cursor: 'pointer', fontSize: 11.5,
      marginBottom: compact ? 0 : 6,
      borderTop: propuesta ? '1px dashed ' + k.bar : 'none',
      borderRight: propuesta ? '1px dashed ' + k.bar : 'none',
      borderBottom: propuesta ? '1px dashed ' + k.bar : 'none',
      opacity: atrasada ? 0.85 : 1,
    }}>
      <div className="row" style={{ gap: 4, marginBottom: 2 }}>
        <span className="mono" style={{ fontWeight: 700, color: k.bar }}>{v.hora}</span>
        <span style={{ fontSize: 9, padding: '1px 4px', background: k.bg, color: k.fg, borderRadius: 3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{KIND_LABEL[v.kind]}</span>
        {propuesta && <span style={{ fontSize: 9, padding: '1px 4px', background: 'var(--orange-100)', color: 'var(--orange-700)', borderRadius: 3, fontWeight: 700 }}>propuesta</span>}
        {atrasada && <span style={{ fontSize: 9, padding: '1px 4px', background: 'var(--red-100)', color: 'var(--red-600)', borderRadius: 3, fontWeight: 700 }}>⚠</span>}
      </div>
      <div style={{ fontSize: compact ? 11.5 : 13, fontWeight: 600, lineHeight: 1.25, color: 'var(--text)' }}>{v.titulo}</div>
      <div className="cell-sub" style={{ marginTop: 2, fontSize: 10.5 }}>{p?.sucursal} · CR {p?.cr}</div>
    </div>
  );
}

// ======= Visitas tab inside ProjectDetail =======
function VisitasTab({ project, data, openProject }) {
  const visitas = React.useMemo(() => deriveVisitas(data).filter(v => v.proyecto === project.id), [data, project.id]);
  const todayD = new Date(data.today + 'T12:00:00Z');
  const futuras = visitas.filter(v => new Date(v.fecha) >= todayD);
  const pasadas = visitas.filter(v => new Date(v.fecha) < todayD);

  return (
    <div className="stack-md">
      <div className="row" style={{ gap: 12 }}>
        <div className="kpi" style={{ flex: 1, padding: '14px 16px' }}>
          <div className="kpi-label">Próximas</div>
          <div className="kpi-value" style={{ fontSize: 26 }}>{futuras.length}</div>
        </div>
        <div className="kpi" style={{ flex: 1, padding: '14px 16px' }}>
          <div className="kpi-label">Propuestas por confirmar</div>
          <div className="kpi-value" style={{ fontSize: 26 }}>{visitas.filter(v => v.estatus === 'propuesta').length}</div>
        </div>
        <div className="kpi" style={{ flex: 1, padding: '14px 16px' }}>
          <div className="kpi-label">Realizadas</div>
          <div className="kpi-value" style={{ fontSize: 26 }}>{pasadas.length}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Próximas visitas y citas</h3>
          <button className="btn btn-sm btn-accent" onClick={()=>window.SERVMAC_OPEN_MODAL('visita',{projectId: project.id})}><Icon name="plus" size={13}/> Agendar visita</button>
        </div>
        <div className="stack-sm">
          {futuras.length === 0 && <div className="empty">Sin visitas futuras programadas</div>}
          {futuras.map(v => <VisitRow key={v.id} v={v}/>)}
        </div>
      </div>

      {pasadas.length > 0 && (
        <div className="card">
          <div className="card-head"><h3>Histórico</h3><span className="sub">· {pasadas.length} realizadas</span></div>
          <div className="stack-sm">
            {pasadas.slice(0, 10).map(v => <VisitRow key={v.id} v={v} past/>)}
          </div>
        </div>
      )}
    </div>
  );
}

function VisitRow({ v, past }) {
  const k = KIND_COLOR[v.kind];
  const d = new Date(v.fecha + 'T12:00:00Z');
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '60px 90px 1fr 160px 80px', gap: 14, alignItems: 'center', padding: '12px 14px', background: 'var(--bg)', borderRadius: 10, opacity: past ? 0.7 : 1 }}>
      <div style={{ background: k.bg, color: k.fg, borderRadius: 8, padding: '6px 4px', textAlign: 'center' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{MONTHS_S[d.getUTCMonth()]}</div>
        <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1 }}>{d.getUTCDate()}</div>
      </div>
      <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: k.bar }}>{v.hora}</div>
      <div>
        <div className="row" style={{ gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 9, padding: '1px 5px', background: k.bg, color: k.fg, borderRadius: 3, fontWeight: 700, textTransform: 'uppercase' }}>{KIND_LABEL[v.kind]}</span>
          {v.estatus === 'propuesta' && <span style={{ fontSize: 9, padding: '1px 5px', background: 'var(--orange-100)', color: 'var(--orange-700)', borderRadius: 3, fontWeight: 700 }}>propuesta · {v.origen}</span>}
          {v.estatus === 'atrasado' && <span style={{ fontSize: 9, padding: '1px 5px', background: 'var(--red-100)', color: 'var(--red-600)', borderRadius: 3, fontWeight: 700 }}>⚠ atrasado</span>}
        </div>
        <div className="cell-strong">{v.titulo}</div>
        <div className="cell-sub">📍 {v.ubicacion} · {v.duracion} min</div>
      </div>
      <div className="av-row">
        {v.asistentes.map((a, i) => <span key={i} className="row" style={{ gap: 4, fontSize: 11 }}><Avatar name={a} size={20}/>{a}</span>).reduce((acc, x, i) => acc.concat(i > 0 ? [<span key={'s'+i} style={{ color:'var(--muted-2)', fontSize: 10 }}>·</span>, x] : [x]), [])}
      </div>
      <div style={{ textAlign: 'right' }}>
        {v.estatus === 'propuesta' ? (
          <button className="btn btn-sm btn-accent">Confirmar</button>
        ) : (
          <button className="btn btn-sm btn-ghost">Ver</button>
        )}
      </div>
    </div>
  );
}

// ======= Project mini-Gantt by phases & tasks =======
function ProjectGanttSection({ project, data }) {
  const projHitos = data.hitos.filter(h => h.id_proyecto === project.id);
  const E = window.SERVMAC_EXTRAS;
  if (!E.cronograma_fases) E.cronograma_fases = {};

  // Lazy initialize a stored editable phase model
  if (!E.cronograma_fases[project.id]) {
    const fin = project.fecha_inicio_prog && project.fecha_termino_prog
      ? daysBetween(project.fecha_inicio_prog, project.fecha_termino_prog) : 60;
    E.cronograma_fases[project.id] = [
      { id: 'PH-1', name: 'Gestión por iniciar', color: '#7C3AED',
        start: project.fecha_asignacion, end: project.fecha_inicio_prog || addDaysISO(project.fecha_asignacion, 14),
        tasks: [
          { id: 'T-1', name: 'Levantamiento de información', from: 0, to: 0.3 },
          { id: 'T-2', name: 'Aprobación interna', from: 0.3, to: 0.7 },
          { id: 'T-3', name: 'Firma Acta inicio', from: 0.7, to: 1.0, hito_tipo: 'Acta inicio' },
        ]
      },
      { id: 'PH-2', name: 'En obra', color: '#1E40AF',
        start: project.fecha_inicio_prog || addDaysISO(project.fecha_asignacion, 14),
        end: addDaysISO(project.fecha_inicio_prog || addDaysISO(project.fecha_asignacion, 14), fin * 0.7),
        tasks: [
          { id: 'T-4', name: 'Ejecución de obra', from: 0, to: 0.7 },
          { id: 'T-5', name: 'Certificación', from: 0.7, to: 0.9, hito_tipo: 'Certificación' },
          { id: 'T-6', name: 'Puesta en operación', from: 0.9, to: 1.0, hito_tipo: 'Puesta operación' },
        ]
      },
      { id: 'PH-3', name: 'Cierre administrativo', color: '#C04A0A',
        start: addDaysISO(project.fecha_inicio_prog || addDaysISO(project.fecha_asignacion, 14), fin * 0.7),
        end: project.fecha_termino_prog || addDaysISO(project.fecha_asignacion, 80),
        tasks: [
          { id: 'T-7', name: 'Acta final', from: 0, to: 0.4, hito_tipo: 'Acta final' },
          { id: 'T-8', name: 'Integración carpeta de cierre', from: 0.3, to: 0.8, hito_tipo: 'Carpeta cierre' },
          { id: 'T-9', name: 'Trámite y pago', from: 0.7, to: 1.0, hito_tipo: 'Pago' },
        ]
      },
    ];
  }
  const phases = E.cronograma_fases[project.id];

  const [vista, setVista] = React.useState('auto'); // auto | semana | quincena | mes
  const [showCriticas, setShowCriticas] = React.useState(false);

  // Compute global range
  const start = new Date(project.fecha_asignacion + 'T12:00:00Z');
  const end = new Date((project.fecha_termino_prog || addDaysISO(project.fecha_asignacion, 80)) + 'T12:00:00Z');
  const totalDays = Math.max(1, (end - start) / 86400000);
  const W = 620;
  const dx = (iso) => ((new Date(iso + 'T12:00:00Z') - start) / 86400000) / totalDays * W;
  const todayD = new Date(data.today + 'T12:00:00Z');
  const todayX = dx(data.today);
  const todayInRange = todayD >= start && todayD <= end;
  const diasHastaInicio = Math.round((start - todayD) / 86400000);
  const diasDesdeFin = Math.round((todayD - end) / 86400000);

  // Time scale ticks based on vista
  const ticks = (() => {
    const out = [];
    const stepDays = vista === 'semana' ? 7 : vista === 'quincena' ? 15 : vista === 'mes' ? 30 : Math.ceil(totalDays / 5);
    for (let d = 0; d <= totalDays; d += stepDays) {
      out.push(d);
    }
    if (out[out.length - 1] !== Math.round(totalDays)) out.push(Math.round(totalDays));
    return out;
  })();

  const refresh = () => window.SERVMAC_RERENDER();

  const addFase = () => window.SERVMAC_OPEN_MODAL('fase', { projectId: project.id });
  const editFase = (phId) => window.SERVMAC_OPEN_MODAL('fase', { projectId: project.id, faseId: phId });
  const delFase = (ph) => window.SERVMAC_OPEN_MODAL('confirm-delete', {
    label: ph.name,
    onConfirm: () => { const i = phases.indexOf(ph); if (i >= 0) phases.splice(i, 1); refresh(); window.SERVMAC_TOAST('Fase eliminada'); }
  });
  const addTarea = (phId) => window.SERVMAC_OPEN_MODAL('tarea', { projectId: project.id, faseId: phId });
  const editTarea = (phId, tId) => window.SERVMAC_OPEN_MODAL('tarea', { projectId: project.id, faseId: phId, tareaId: tId });
  const delTarea = (ph, t) => window.SERVMAC_OPEN_MODAL('confirm-delete', {
    label: t.name,
    onConfirm: () => { const i = ph.tasks.indexOf(t); if (i >= 0) ph.tasks.splice(i, 1); refresh(); window.SERVMAC_TOAST('Tarea eliminada'); }
  });

  return (
    <div className="card">
      <div className="card-head" style={{ flexWrap: 'wrap', gap: 12 }}>
        <h3>Cronograma por fases y tareas</h3>
        <span className="sub">· {Math.round(totalDays)} días · {fmtDate(project.fecha_asignacion)} → {fmtDate(end.toISOString().slice(0,10))}</span>
        <div className="row" style={{ gap: 6, marginLeft: 'auto', flexWrap: 'wrap' }}>
          <div className="chips" style={{ gap: 4 }}>
            {[['auto','Auto'],['semana','Semana'],['quincena','Quincena'],['mes','Mes']].map(([k,l]) => (
              <button key={k} className={'chip ' + (vista === k ? 'active' : '')} onClick={() => setVista(k)} style={{ padding: '4px 10px', fontSize: 11 }}>{l}</button>
            ))}
          </div>
          <button className={'btn btn-sm ' + (showCriticas ? 'btn-accent' : 'btn-ghost')} onClick={() => setShowCriticas(v => !v)} title="Resaltar ruta crítica">⚑ Ruta crítica</button>
          <button className="btn btn-sm btn-accent" onClick={addFase}><Icon name="plus" size={13}/> Fase</button>
        </div>
      </div>
      <div style={{ position: 'relative', overflowX: 'auto' }}>
        {!todayInRange && (
          <div className="row" style={{ gap: 10, padding: '10px 14px', margin: '0 0 10px', background: diasHastaInicio > 0 ? 'var(--blue-50, #eff6ff)' : 'var(--orange-100, #ffe3ce)', border: '1px solid ' + (diasHastaInicio > 0 ? 'var(--blue-100)' : 'var(--orange-100)'), borderRadius: 8, color: 'var(--text)', fontSize: 13 }}>
            <span style={{ background: 'var(--orange-500)', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em' }}>HOY · {fmtDate(data.today)}</span>
            {diasHastaInicio > 0
              ? <span>El proyecto inicia en <strong>{diasHastaInicio} días</strong></span>
              : <span>El proyecto terminó hace <strong style={{ color: 'var(--orange-700)' }}>{diasDesdeFin} días</strong> · revisar cierre administrativo</span>}
          </div>
        )}
        {/* Time scale */}
        <svg width={W + 240} viewBox={`0 0 ${W + 240} 26`} height="26" style={{ display: 'block' }}>
          <line x1="240" y1="22" x2={240 + W} y2="22" stroke="var(--line)"/>
          {ticks.map((d, i) => {
            const t = d / totalDays;
            const dt = new Date(start); dt.setUTCDate(start.getUTCDate() + Math.round(d));
            return (
              <g key={i}>
                <line x1={240 + W*t} y1="18" x2={240 + W*t} y2="22" stroke="var(--muted-2)"/>
                <text x={240 + W*t} y="14" fontSize="10" fill="var(--muted)" textAnchor="middle">{fmtDate(dt.toISOString().slice(0,10))}</text>
              </g>
            );
          })}
        </svg>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {phases.map((ph, pi) => {
            const phStart = dx(ph.start);
            const phEnd = dx(ph.end);
            const phW = Math.max(2, phEnd - phStart);
            const phDays = daysBetween(ph.start, ph.end);
            return (
              <React.Fragment key={ph.id || pi}>
                {/* Phase row */}
                <div style={{ display: 'grid', gridTemplateColumns: `240px ${W}px`, alignItems: 'center', padding: '8px 0', borderTop: pi > 0 ? '1px solid var(--line)' : 'none' }}>
                  <div style={{ paddingRight: 12, minWidth: 0 }}>
                    <div className="row" style={{ gap: 6, alignItems: 'center' }}>
                      <div style={{ fontSize: 10, color: ph.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Fase {pi+1}</div>
                      <button className="btn btn-sm btn-ghost icon-only" style={{ width: 22, height: 22, marginLeft: 'auto' }} onClick={() => addTarea(ph.id)} title="Agregar tarea"><Icon name="plus" size={11}/></button>
                      <button className="btn btn-sm btn-ghost icon-only" style={{ width: 22, height: 22 }} onClick={() => editFase(ph.id)} title="Editar fase"><Icon name="edit" size={11}/></button>
                      <button className="btn btn-sm btn-ghost icon-only" style={{ width: 22, height: 22 }} onClick={() => delFase(ph)} title="Eliminar fase"><Icon name="trash" size={11}/></button>
                    </div>
                    <div className="cell-strong">{ph.name}</div>
                    <div className="cell-id">{fmtDate(ph.start)} → {fmtDate(ph.end)}</div>
                  </div>
                  <div style={{ position: 'relative', height: 28 }}>
                    <div style={{ position: 'absolute', left: phStart, top: 0, height: 28, width: phW, background: ph.color, opacity: 0.25, borderRadius: 4 }}/>
                    <div style={{ position: 'absolute', left: phStart, top: 0, height: 28, width: phW, border: `1.5px solid ${ph.color}`, borderRadius: 4 }}/>
                  </div>
                </div>
                {/* Task rows */}
                {ph.tasks.map((t, ti) => {
                  const tStart = addDaysISO(ph.start, t.from * phDays);
                  const tEnd = addDaysISO(ph.start, t.to * phDays);
                  const x = dx(tStart);
                  const w = Math.max(8, dx(tEnd) - x);
                  const hito = t.hito_tipo ? projHitos.find(h => h.tipo === t.hito_tipo) : null;
                  const cumplido = hito?.estatus === 'cumplido';
                  const atrasado = hito?.estatus === 'atrasado';
                  const esCritica = t.critica || (showCriticas && t.hito_tipo);
                  return (
                    <div key={t.id || ti} style={{ display: 'grid', gridTemplateColumns: `240px ${W}px`, alignItems: 'center', padding: '4px 0', background: esCritica && showCriticas ? 'rgba(220,38,38,0.04)' : 'transparent' }}>
                      <div style={{ paddingLeft: 16, paddingRight: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 14, height: 14, borderRadius: 3, background: cumplido ? ph.color : '#fff', border: `1.5px solid ${atrasado ? 'var(--red-600)' : ph.color}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff', fontWeight: 700, flexShrink: 0 }}>{cumplido ? '✓' : ''}</span>
                        <span style={{ fontSize: 12.5, color: 'var(--text)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                        {t.hito_tipo && <span className="cell-id" style={{ fontSize: 10 }}>hito</span>}
                        <button className="btn btn-sm btn-ghost icon-only" style={{ width: 20, height: 20 }} onClick={() => editTarea(ph.id, t.id)} title="Editar"><Icon name="edit" size={10}/></button>
                        <button className="btn btn-sm btn-ghost icon-only" style={{ width: 20, height: 20 }} onClick={() => delTarea(ph, t)} title="Eliminar"><Icon name="trash" size={10}/></button>
                      </div>
                      <div style={{ position: 'relative', height: 18 }}>
                        <div style={{ position: 'absolute', left: x, top: 4, height: 10, width: w, background: cumplido ? ph.color : `${ph.color}33`, border: `1px solid ${esCritica && showCriticas ? '#DC2626' : ph.color}`, borderRadius: 3 }}/>
                        {hito && (
                          <div title={`${hito.tipo} — programado ${fmtDate(hito.fecha_programada)}`} style={{ position: 'absolute', left: dx(hito.fecha_programada) - 5, top: 2, width: 10, height: 10, transform: 'rotate(45deg)', background: cumplido ? ph.color : '#fff', border: `2px solid ${atrasado ? 'var(--red-600)' : ph.color}`, borderRadius: 1 }}/>
                        )}
                      </div>
                    </div>
                  );
                })}
                {ph.tasks.length === 0 && (
                  <div style={{ padding: '10px 16px', display: 'grid', gridTemplateColumns: `240px ${W}px` }}>
                    <button className="btn btn-sm btn-ghost" onClick={() => addTarea(ph.id)} style={{ fontSize: 11, justifyContent: 'flex-start' }}><Icon name="plus" size={11}/> Agregar primera tarea a "{ph.name}"</button>
                    <div/>
                  </div>
                )}
              </React.Fragment>
            );
          })}

          {/* Add new phase row */}
          <div style={{ padding: '12px 0', borderTop: '1px dashed var(--line)' }}>
            <button className="btn btn-sm btn-ghost" onClick={addFase} style={{ marginLeft: 12, fontSize: 11 }}><Icon name="plus" size={12}/> Agregar nueva fase</button>
          </div>
        </div>

        {/* Today overlay line */}
        {todayInRange && (
          <div style={{ position: 'absolute', top: 26, bottom: 50, left: 240 + todayX, width: 2, background: 'var(--orange-500)', pointerEvents: 'none', zIndex: 2 }}>
            <div style={{ position: 'absolute', top: -4, left: -16, background: 'var(--orange-500)', color: '#fff', padding: '1px 6px', borderRadius: 3, fontSize: 9, fontWeight: 700 }}>HOY</div>
          </div>
        )}

        {/* Legend */}
        <div className="row" style={{ gap: 16, padding: '12px 14px', marginTop: 10, borderTop: '1px solid var(--line)', flexWrap: 'wrap', fontSize: 11, color: 'var(--muted)' }}>
          <span style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Leyenda:</span>
          {phases.map(ph => (
            <span key={ph.id} className="row" style={{ gap: 5 }}>
              <span style={{ width: 14, height: 8, background: ph.color, borderRadius: 2 }}/>
              <span style={{ color: 'var(--text)' }}>{ph.name}</span>
            </span>
          ))}
          <span className="row" style={{ gap: 5 }}>
            <span style={{ width: 10, height: 10, background: '#1E40AF', transform: 'rotate(45deg)', display: 'inline-block', marginRight: 2 }}/>
            <span>Hito cumplido</span>
          </span>
          <span className="row" style={{ gap: 5 }}>
            <span style={{ width: 10, height: 10, background: '#fff', border: '2px solid var(--red-600)', transform: 'rotate(45deg)', display: 'inline-block', marginRight: 2 }}/>
            <span>Hito atrasado</span>
          </span>
          <span className="row" style={{ gap: 5 }}>
            <span style={{ width: 2, height: 12, background: 'var(--orange-500)' }}/>
            <span>Línea de hoy</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function daysBetween(a, b) { return Math.max(1, (new Date(b) - new Date(a)) / 86400000); }
function addDaysISO(iso, n) { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + Math.round(n)); return d.toISOString().slice(0,10); }

Object.assign(window, { CalendarPage, VisitasTab, ProjectGanttSection, deriveVisitas });
