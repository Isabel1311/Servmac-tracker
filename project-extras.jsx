// New project tabs: Bitácora · Plan vs Real · Proveedores · Materiales / Facturas

const fmt$k = (n) => '$' + (n / 1000).toFixed(0) + 'k';
const fmt$ = (n) => '$' + (n || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 });

// =================== BITÁCORA DE OBRA ===================
function BitacoraTab({ project, data }) {
  const E = window.SERVMAC_EXTRAS;
  const entries = React.useMemo(() => E.bitacora_obra.filter(b => b.id_proyecto === project.id).sort((a, b) => b.fecha.localeCompare(a.fecha)), [project.id]);
  const [adding, setAdding] = React.useState(false);
  const [shareId, setShareId] = React.useState(null);

  const todayEntry = entries[0];
  const promAvance = entries.length ? Math.round(entries.reduce((s, e) => s + e.avance_pct, 0) / entries.length) : 0;
  const personasProm = entries.length ? Math.round(entries.reduce((s, e) => s + e.personal, 0) / entries.length) : 0;

  return (
    <div className="stack-md">
      <div className="row" style={{ gap: 12 }}>
        <KPI label="Entradas registradas" value={entries.length}/>
        <KPI label="Avance último reporte" value={todayEntry ? todayEntry.avance_pct + '%' : '—'} delta={todayEntry?.fecha} deltaDir="flat"/>
        <KPI label="Personal promedio en obra" value={personasProm}/>
        <div className="kpi" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
          <button className="btn btn-accent" onClick={() => window.SERVMAC_OPEN_MODAL('bitacora',{projectId: project.id})}><Icon name="plus" size={13}/> Nueva entrada</button>
        </div>
      </div>

      {adding && <BitacoraForm project={project} onClose={() => setAdding(false)}/>}

      <div className="stack-md">
        {entries.map(e => (
          <BitacoraEntry key={e.id} e={e} project={project} onShare={() => setShareId(e.id)}/>
        ))}
        {entries.length === 0 && <div className="empty">Aún no hay entradas de bitácora. Crea la primera entrada para iniciar el seguimiento diario.</div>}
      </div>

      {shareId && <ShareModal entry={entries.find(e => e.id === shareId)} project={project} onClose={() => setShareId(null)}/>}
    </div>
  );
}

function BitacoraEntry({ e, project, onShare }) {
  const dateD = new Date(e.fecha + 'T12:00:00Z');
  return (
    <div className="card" style={{ padding: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr auto', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
        <div style={{ background:'var(--blue-50)', color:'var(--blue-700)', borderRadius:8, padding:'8px 4px', textAlign:'center' }}>
          <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>{['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB'][dateD.getUTCDay()]}</div>
          <div style={{ fontSize:22, fontWeight:700, lineHeight:1 }}>{dateD.getUTCDate()}</div>
          <div style={{ fontSize:9, color:'var(--muted)' }}>{['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][dateD.getUTCMonth()]}</div>
        </div>
        <div>
          <div className="row" style={{ gap: 8, marginBottom: 4 }}>
            <Avatar name={e.autor} size={22}/>
            <span className="cell-strong">{e.autor}</span>
            <span className="muted" style={{ fontSize:11 }}>· {e.clima} · {e.personal} personas en obra</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text)' }}>{e.descripcion}</div>
          <div className="row" style={{ gap: 10, marginTop: 6, fontSize: 11, color: 'var(--muted)' }}>
            <span><strong style={{ color:'var(--text)' }}>Avance:</strong> {e.avance_pct}%</span>
            <span><strong style={{ color:'var(--text)' }}>Siguiente:</strong> {e.siguiente}</span>
            {e.incidencias !== 'Sin incidencias' && <span style={{ color:'var(--red-600)', fontWeight:600 }}>⚠ {e.incidencias}</span>}
          </div>
        </div>
        <div className="stack-xs" style={{ alignItems:'flex-end' }}>
          <div style={{ width: 100 }}>
            <div style={{ height: 6, background: 'var(--bg)', borderRadius: 3 }}>
              <div style={{ height: '100%', width: e.avance_pct + '%', background: 'linear-gradient(90deg, var(--blue-500), var(--orange-500))', borderRadius: 3 }}/>
            </div>
          </div>
          <div className="row" style={{ gap: 6 }}>
            <span className="muted" style={{ fontSize: 11 }}>📷 {e.fotos_count}</span>
            <button className="btn btn-sm btn-ghost">Editar</button>
            <button className="btn btn-sm btn-accent" onClick={onShare}>Compartir cierre</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BitacoraForm({ project, onClose }) {
  const [avance, setAvance] = React.useState(50);
  return (
    <div className="card" style={{ borderLeft: '4px solid var(--orange-500)' }}>
      <div className="card-head"><h3>Nueva entrada de bitácora</h3><span className="sub">· {project.sucursal}</span></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field label="Fecha"><input type="date" defaultValue={new Date().toISOString().slice(0,10)}/></Field>
        <Field label="Autor"><input defaultValue={project.persona_servmac}/></Field>
        <Field label="Clima"><select defaultValue="Soleado"><option>Soleado</option><option>Parcialmente nublado</option><option>Nublado</option><option>Lluvia ligera</option><option>Lluvia</option></select></Field>
        <Field label="Personal en obra"><input type="number" defaultValue="6"/></Field>
        <Field label={`Avance global: ${avance}%`} full>
          <input type="range" min="0" max="100" value={avance} onChange={(e) => setAvance(e.target.value)} style={{ width: '100%' }}/>
        </Field>
        <Field label="Trabajos realizados" full><textarea rows="3" placeholder="Detalle de actividades del día..."/></Field>
        <Field label="Incidencias"><input placeholder="Sin incidencias"/></Field>
        <Field label="Siguiente jornada"><input placeholder="Continuar acabados..."/></Field>
        <Field label="Fotos" full>
          <div style={{ border: '2px dashed var(--line)', borderRadius: 8, padding: 16, textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>
            📷 Arrastra fotos aquí o haz clic para seleccionar
          </div>
        </Field>
      </div>
      <div className="row" style={{ justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-accent" onClick={onClose}>Guardar entrada</button>
      </div>
    </div>
  );
}

function Field({ label, children, full }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : 'auto' }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}

function ShareModal({ entry, project, onClose }) {
  const msg = `📍 *${project.sucursal}* · CR ${project.cr}
🗓️ Reporte de cierre del día — ${entry.fecha}

${entry.descripcion}

📊 *Avance global:* ${entry.avance_pct}%
👷 *Personal:* ${entry.personal} personas
🌤️ *Clima:* ${entry.clima}
⚠️ *Incidencias:* ${entry.incidencias}
➡️ *Siguiente jornada:* ${entry.siguiente}

— ${entry.autor} · SERVMAC`;
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.5)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'#fff', borderRadius:12, padding:24, width:520, boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
        <h3 style={{ marginTop: 0 }}>Compartir resumen de cierre</h3>
        <textarea readOnly value={msg} style={{ width:'100%', height: 280, fontFamily:'IBM Plex Mono, monospace', fontSize: 12, padding: 12, borderRadius: 8 }}/>
        <div className="row" style={{ gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>
          <button className="btn btn-ghost" onClick={() => { navigator.clipboard.writeText(msg); }}>Copiar</button>
          <button className="btn" style={{ background:'#25D366', color:'#fff' }}>WhatsApp</button>
          <button className="btn btn-accent">Enviar por correo</button>
        </div>
      </div>
    </div>
  );
}

// =================== PLAN VS REAL ===================
function PlanRealTab({ project, data }) {
  const E = window.SERVMAC_EXTRAS;
  const acts = React.useMemo(() => E.plan_actividades.filter(a => a.id_proyecto === project.id), [project.id]);
  const todayD = new Date(data.today + 'T12:00:00Z');

  // Compute global metrics
  const totalPeso = acts.reduce((s, a) => s + a.peso, 0);
  const realAvance = acts.reduce((s, a) => s + a.peso * a.avance, 0) / totalPeso;
  // Planned avance = % of days elapsed for each activity
  const plannedAvance = acts.reduce((s, a) => {
    const ps = new Date(a.planned_start), pe = new Date(a.planned_end);
    const elapsed = (todayD - ps) / (pe - ps);
    return s + a.peso * Math.min(100, Math.max(0, elapsed * 100));
  }, 0) / totalPeso;
  const desviacion = realAvance - plannedAvance;
  const criticas = acts.filter(a => a.critica);
  const atrasadasCrit = criticas.filter(a => {
    const pe = new Date(a.planned_end);
    return a.avance < 100 && todayD > pe;
  });

  const start = new Date(project.fecha_asignacion + 'T12:00:00Z');
  const end = new Date(project.fecha_termino_prog + 'T12:00:00Z');
  const totalDays = Math.max(1, (end - start) / 86400000);
  const W = 720;
  const dx = (iso) => Math.max(0, ((new Date(iso + 'T12:00:00Z') - start) / 86400000) / totalDays * W);
  const todayX = dx(data.today);

  return (
    <div className="stack-md">
      <div className="row" style={{ gap: 12 }}>
        <KPI label="Avance real" value={Math.round(realAvance) + '%'} featured="featured-orange"/>
        <KPI label="Avance planeado" value={Math.round(plannedAvance) + '%'}/>
        <KPI label="Desviación" value={(desviacion >= 0 ? '+' : '') + Math.round(desviacion) + ' pts'}
             delta={desviacion < -5 ? 'Atraso significativo' : desviacion < 0 ? 'Atraso leve' : 'En tiempo'}
             deltaDir={desviacion < 0 ? 'down' : 'up'}
             featured={desviacion < -5 ? 'featured-red' : ''}/>
        <KPI label="Actividades críticas atrasadas" value={atrasadasCrit.length} delta={`de ${criticas.length} totales`} deltaDir="flat" featured={atrasadasCrit.length > 0 ? 'featured-red' : ''}/>
      </div>

      {atrasadasCrit.length > 0 && (
        <div className="card" style={{ background: 'linear-gradient(135deg, var(--red-50), #fff)', border: '1px solid var(--red-100)' }}>
          <div className="row" style={{ gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <h3 style={{ margin: 0, color: 'var(--red-600)' }}>Ruta crítica en riesgo</h3>
          </div>
          <p style={{ margin: '0 0 10px', fontSize: 13 }}>Las siguientes actividades de la ruta crítica están atrasadas y comprometen la fecha de término:</p>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
            {atrasadasCrit.map(a => <li key={a.id}><strong>{a.nombre}</strong> · planeado al {a.planned_end} · avance {a.avance}%</li>)}
          </ul>
          <div className="row" style={{ gap: 8, marginTop: 12 }}>
            <button className="btn btn-sm btn-accent">Proponer plan de recuperación</button>
            <button className="btn btn-sm btn-ghost">Reagendar ruta crítica</button>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        <div className="card-head" style={{ padding: '14px 18px', margin: 0, borderBottom: '1px solid var(--line)' }}>
          <h3>Plan vs Real</h3>
          <span className="sub">· barra clara = plan · barra sólida = real · diamante = hito · línea roja = ruta crítica</span>
          <div className="row" style={{ gap: 6, marginLeft: 'auto' }}>
            <button className="btn btn-sm btn-accent" onClick={() => window.SERVMAC_OPEN_MODAL('actividad', { projectId: project.id })}><Icon name="plus" size={13}/> Actividad</button>
          </div>
        </div>
        <div style={{ position: 'relative', overflowX: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `260px ${W}px 88px`, alignItems: 'stretch', minWidth: 260 + W + 88 }}>
          <div style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', borderBottom: '1px solid var(--line)', background: 'var(--bg-warm, #f9fafb)' }}>Actividad</div>
          <div style={{ borderBottom: '1px solid var(--line)', position: 'relative', height: 30, background: 'var(--bg-warm, #f9fafb)' }}>
            {[0, 0.2, 0.4, 0.6, 0.8, 1].map((t, i, arr) => {
              const d = new Date(start); d.setUTCDate(start.getUTCDate() + Math.round(totalDays * t));
              const isFirst = i === 0, isLast = i === arr.length - 1;
              return (
                <React.Fragment key={t}>
                  <span className="mono" style={{
                    position: 'absolute', left: W*t, top: 9, fontSize: 10, color: 'var(--muted)', whiteSpace: 'nowrap',
                    transform: isFirst ? 'translateX(0)' : isLast ? 'translateX(-100%)' : 'translateX(-50%)'
                  }}>{d.toISOString().slice(5,10)}</span>
                  <span style={{ position: 'absolute', left: W*t, top: 22, bottom: 0, width: 1, background: 'var(--line)' }}/>
                </React.Fragment>
              );
            })}
            <div style={{ position: 'absolute', left: todayX, top: 0, bottom: 0, width: 2, background: 'rgba(242,107,31,0.7)' }} title="Hoy"/>
            <div style={{ position: 'absolute', left: todayX - 14, top: -1, padding: '1px 4px', fontSize: 9, fontWeight: 700, color: '#fff', background: 'var(--orange-500, #F26B1F)', borderRadius: 3 }}>HOY</div>
          </div>
          <div style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', textAlign: 'right', borderBottom: '1px solid var(--line)', background: 'var(--bg-warm, #f9fafb)' }}>Avance</div>

          {acts.map(a => {
            const px = dx(a.planned_start);
            const pw = Math.max(4, dx(a.planned_end) - px);
            const rx = dx(a.real_start);
            const rw = Math.max(4, dx(a.real_end) - rx);
            const faseColor = a.fase === 'Gestión' ? '#7C3AED' : a.fase === 'En obra' ? '#1E40AF' : '#C04A0A';
            const atrasada = a.avance < 100 && todayD > new Date(a.planned_end + 'T12:00:00Z');
            return (
              <React.Fragment key={a.id}>
                <div style={{ padding: '10px 14px', borderTop: '1px solid var(--line)' }}>
                  <div className="row" style={{ gap: 6 }}>
                    {a.critica && <span style={{ color: 'var(--red-600)', fontSize: 11 }}>●</span>}
                    <span className="cell-strong" style={{ fontSize: 12.5 }}>{a.nombre}</span>
                  </div>
                  <div className="cell-id" style={{ fontSize: 10.5, display:'flex', alignItems:'center', gap: 6, marginTop: 2 }}>
                    <span>{a.fase} · peso {a.peso}</span>
                    <button className="btn btn-sm btn-ghost icon-only" style={{ width: 20, height: 20, marginLeft:'auto' }} title="Avance" onClick={() => {
                      window.SERVMAC_PROMPT({
                        title: '% de avance',
                        subtitle: a.nombre,
                        label: 'Porcentaje (0-100)',
                        type: 'number', min: 0, max: 100,
                        defaultValue: String(a.avance),
                        icon: 'check',
                        toast: 'Avance actualizado',
                        onSubmit: (v) => { a.avance = Math.max(0, Math.min(100, parseInt(v) || 0)); window.SERVMAC_RERENDER(); }
                      });
                    }}><Icon name="check" size={11}/></button>
                    <button className="btn btn-sm btn-ghost icon-only" style={{ width: 20, height: 20 }} title="Editar actividad" onClick={() => window.SERVMAC_OPEN_MODAL('actividad', { projectId: project.id, activityId: a.id })}><Icon name="edit" size={11}/></button>
                    <button className="btn btn-sm btn-ghost icon-only" style={{ width: 20, height: 20 }} title="Eliminar" onClick={() => {
                      if (confirm('Eliminar "' + a.nombre + '"?')) {
                        const i = E.plan_actividades.indexOf(a); if (i >= 0) E.plan_actividades.splice(i, 1);
                        window.SERVMAC_RERENDER(); window.SERVMAC_TOAST('Actividad eliminada');
                      }
                    }}><Icon name="trash" size={11}/></button>
                  </div>
                </div>
                <div style={{ position: 'relative', height: 44, borderTop: '1px solid var(--line)' }}>
                  {/* Light grid */}
                  {[0.2, 0.4, 0.6, 0.8].map(t => <span key={t} style={{ position: 'absolute', left: W*t, top: 0, bottom: 0, width: 1, background: 'rgba(0,0,0,0.04)' }}/>)}
                  {/* Planned bar (ghost) */}
                  <div style={{ position: 'absolute', left: px, top: 12, height: 8, width: pw, background: faseColor + '1f', border: `1px dashed ${faseColor}`, borderRadius: 3 }}/>
                  {/* Real bar — solid portion */}
                  <div style={{ position: 'absolute', left: rx, top: 24, height: 8, width: rw * (a.avance / 100), background: a.critica ? '#DC2626' : faseColor, borderRadius: 3 }}/>
                  {/* Real bar — remaining */}
                  <div style={{ position: 'absolute', left: rx + rw * (a.avance / 100), top: 24, height: 8, width: rw * (1 - a.avance / 100), background: '#E2E8F0', borderRadius: 3 }}/>
                  {/* Today line */}
                  <div style={{ position: 'absolute', left: todayX, top: 0, bottom: 0, width: 2, background: 'rgba(242,107,31,0.5)' }}/>
                </div>
                <div style={{ padding: '10px 14px', textAlign: 'right', borderTop: '1px solid var(--line)' }}>
                  <span className="cell-strong" style={{ color: atrasada ? 'var(--red-600)' : 'var(--text)' }}>{a.avance}%</span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
        </div>
      </div>
    </div>
  );
}

// =================== PROVEEDORES DEL PROYECTO ===================
function ProveedoresProyectoTab({ project, data, openProveedor }) {
  const E = window.SERVMAC_EXTRAS;
  const subs = E.proyecto_proveedores.filter(s => s.id_proyecto === project.id);
  const provs = subs.map(s => ({ ...s, proveedor: E.proveedores.find(p => p.id === s.id_proveedor) }));
  const facts = E.facturas.filter(f => f.id_proyecto === project.id);

  const totalSub = provs.reduce((s, p) => s + p.importe, 0);
  const totalPag = provs.reduce((s, p) => s + p.importe_pagado, 0);
  const pctSub = (totalSub / project.importe_contratado) * 100;

  return (
    <div className="stack-md">
      <div className="row" style={{ gap: 12 }}>
        <KPI label="Proveedores asignados" value={provs.length}/>
        <KPI label="Importe subcontratado" value={fmt$k(totalSub)} delta={`${pctSub.toFixed(0)}% del contrato`} deltaDir="flat"/>
        <KPI label="Pagado a proveedores" value={fmt$k(totalPag)} delta={`${((totalPag / totalSub) * 100).toFixed(0)}% liberado`} deltaDir="up"/>
        <KPI label="Por pagar" value={fmt$k(totalSub - totalPag)} featured={(totalSub - totalPag) > totalSub * 0.5 ? 'featured-orange' : ''}/>
      </div>

      <div className="card">
        <div className="card-head"><h3>Proveedores y subcontratos</h3><button className="btn btn-sm btn-accent" onClick={()=>window.SERVMAC_OPEN_MODAL('proveedor',{projectId: project.id})}><Icon name="plus" size={13}/> Asignar proveedor</button></div>
        <div className="stack-sm">
          {provs.map(s => (
            <div key={s.id} onClick={() => openProveedor && openProveedor(s.id_proveedor)} style={{ display:'grid', gridTemplateColumns:'1fr auto auto auto', gap:14, alignItems:'center', padding:'12px 14px', background:'var(--bg)', borderRadius:10, cursor:'pointer' }}>
              <div>
                <div className="row" style={{ gap:8, marginBottom:2 }}>
                  <span className="cell-strong">{s.proveedor?.nombre}</span>
                  <span className="tag" style={{ fontSize:10 }}>{s.scope}</span>
                  <span className="tag" style={{ fontSize:10, background: s.estatus === 'cerrado' ? 'var(--green-100)' : s.estatus === 'en curso' ? 'var(--blue-100)' : 'var(--orange-100)', color: s.estatus === 'cerrado' ? 'var(--green-600)' : s.estatus === 'en curso' ? 'var(--blue-700)' : 'var(--orange-700)' }}>{s.estatus}</span>
                </div>
                <div className="cell-sub">Equipo: {s.equipo_nombre} · {s.inicio} → {s.fin}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div className="cell-strong">{fmt$(s.importe)}</div>
                <div className="cell-id">contratado</div>
              </div>
              <div style={{ width: 120 }}>
                <div style={{ height: 6, background:'var(--bg-warm)', borderRadius: 3 }}>
                  <div style={{ height:'100%', width: (s.importe_pagado / s.importe * 100) + '%', background: 'var(--green-500)', borderRadius: 3 }}/>
                </div>
                <div className="cell-id" style={{ marginTop: 4, textAlign: 'right' }}>{((s.importe_pagado / s.importe) * 100).toFixed(0)}% pagado</div>
              </div>
              <button className="btn btn-sm btn-ghost">Ver</button>
            </div>
          ))}
          {provs.length === 0 && <div className="empty">Sin proveedores asignados a este proyecto</div>}
        </div>
      </div>

      <FacturasTable facts={facts} provMap={Object.fromEntries(E.proveedores.map(p => [p.id, p]))} projectId={project.id}/>
    </div>
  );
}

// =================== MATERIALES / FACTURAS ===================
function MaterialesTab({ project, data }) {
  const E = window.SERVMAC_EXTRAS;
  const mats = E.materiales.filter(m => m.id_proyecto === project.id);
  const facts = E.facturas.filter(f => f.id_proyecto === project.id);
  const provMap = Object.fromEntries(E.proveedores.map(p => [p.id, p]));

  const totalMat = mats.reduce((s, m) => s + m.total, 0);
  const totalFact = facts.reduce((s, f) => s + f.total, 0);
  const vencidas = facts.filter(f => f.estatus_pago === 'vencida');
  const pendientes = facts.filter(f => f.estatus_pago === 'pendiente');

  const [tab, setTab] = React.useState('materiales');

  return (
    <div className="stack-md">
      <div className="row" style={{ gap: 12 }}>
        <KPI label="Total materiales" value={fmt$k(totalMat)} delta={`${mats.length} partidas`} deltaDir="flat"/>
        <KPI label="Total facturas" value={fmt$k(totalFact)} delta={`${facts.length} CFDI`} deltaDir="flat"/>
        <KPI label="Facturas vencidas" value={vencidas.length} delta={fmt$k(vencidas.reduce((s,f)=>s+f.total,0))} deltaDir="down" featured={vencidas.length > 0 ? 'featured-red' : ''}/>
        <KPI label="Por programar" value={pendientes.length} delta={fmt$k(pendientes.reduce((s,f)=>s+f.total,0))} deltaDir="flat" featured="featured-orange"/>
      </div>

      <div className="row" style={{ gap: 6 }}>
        <div className={'chip ' + (tab === 'materiales' ? 'active' : '')} onClick={() => setTab('materiales')}>Materiales ({mats.length})</div>
        <div className={'chip ' + (tab === 'facturas' ? 'active' : '')} onClick={() => setTab('facturas')}>Facturas ({facts.length})</div>
        <div className={'chip ' + (tab === 'flujo' ? 'active' : '')} onClick={() => setTab('flujo')}>Flujo de pagos</div>
        <button className="btn btn-sm btn-accent" style={{ marginLeft: 'auto' }} onClick={()=>window.SERVMAC_OPEN_MODAL('material',{projectId: project.id})}><Icon name="plus" size={13}/> Subir factura / Material</button>
        <button className="btn btn-sm btn-ghost" onClick={()=>window.SERVMAC_OPEN_MODAL('material',{projectId: project.id})}><Icon name="plus" size={13}/> Material</button>
      </div>

      {tab === 'materiales' && (
        <div className="card" style={{ padding: 0 }}>
          <table className="tbl">
            <thead><tr><th>Descripción</th><th>Cantidad</th><th>Costo unit</th><th>Total</th><th>Proveedor</th><th>Factura</th><th>Estatus</th><th>Fecha</th></tr></thead>
            <tbody>
              {mats.map(m => (
                <tr key={m.id}>
                  <td><span className="cell-strong">{m.descripcion}</span></td>
                  <td className="mono">{m.cantidad} {m.unidad}</td>
                  <td className="mono">{fmt$(m.costo_unit)}</td>
                  <td className="mono"><strong>{fmt$(m.total)}</strong></td>
                  <td>{m.proveedor}</td>
                  <td className="mono cell-id">{m.factura_id?.split('-F')[1] ? 'F-' + m.factura_id.split('-F')[1] : '—'}</td>
                  <td><span className="tag" style={{ fontSize:10, background: m.estatus === 'entregado' ? 'var(--green-100)' : m.estatus === 'parcial' ? 'var(--orange-100)' : 'var(--blue-100)', color: m.estatus === 'entregado' ? 'var(--green-600)' : m.estatus === 'parcial' ? 'var(--orange-700)' : 'var(--blue-700)' }}>{m.estatus}</span></td>
                  <td className="mono cell-id">{m.fecha}</td>
                </tr>
              ))}
              {mats.length === 0 && <tr><td colSpan="8" className="empty">Sin materiales registrados</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'facturas' && <FacturasTable facts={facts} provMap={provMap} projectId={project.id}/>}

      {tab === 'flujo' && <FlujoPagos facts={facts}/>}
    </div>
  );
}

function FacturasTable({ facts, provMap, projectId }) {
  const estatusColor = {
    pagada:    { bg:'var(--green-100)', fg:'var(--green-600)' },
    pendiente: { bg:'var(--orange-100)', fg:'var(--orange-700)' },
    vencida:   { bg:'var(--red-100)', fg:'var(--red-600)' },
    programada:{ bg:'var(--blue-100)', fg:'var(--blue-700)' },
  };
  const del = (fId, folio) => {
    window.SERVMAC_OPEN_MODAL('confirm-delete', {
      label: 'Factura ' + folio,
      onConfirm: () => {
        const arr = window.SERVMAC_EXTRAS.facturas;
        const i = arr.findIndex(x => x.id === fId);
        if (i >= 0) arr.splice(i, 1);
        window.SERVMAC_RERENDER();
        window.SERVMAC_TOAST('Factura eliminada');
      }
    });
  };
  return (
    <div className="card" style={{ padding: 0 }}>
      <div className="card-head" style={{ padding: '14px 18px', margin: 0, borderBottom: '1px solid var(--line)' }}>
        <h3>Facturas y CFDI</h3>
        {projectId && <button className="btn btn-sm btn-accent" onClick={() => window.SERVMAC_OPEN_MODAL('factura', { projectId })}><Icon name="plus" size={13}/> Nueva factura</button>}
      </div>
      <table className="tbl">
        <thead><tr><th>Folio</th><th>Fecha</th><th>Concepto</th><th>Tipo</th><th>Proveedor</th><th>Subtotal</th><th>IVA</th><th>Total</th><th>Forma pago</th><th>Estatus</th><th></th></tr></thead>
        <tbody>
          {facts.map(f => (
            <tr key={f.id}>
              <td className="mono cell-strong">{f.folio}</td>
              <td className="mono cell-id">{f.fecha}</td>
              <td>{f.concepto}</td>
              <td><span className="tag" style={{ fontSize: 10 }}>{f.tipo}</span></td>
              <td className="cell-id">{provMap[f.id_proveedor]?.nombre || '—'}</td>
              <td className="mono">{fmt$(f.subtotal)}</td>
              <td className="mono cell-id">{fmt$(f.iva)}</td>
              <td className="mono"><strong>{fmt$(f.total)}</strong></td>
              <td className="cell-id">{f.forma_pago}</td>
              <td><span className="tag" style={{ fontSize: 10, background: estatusColor[f.estatus_pago].bg, color: estatusColor[f.estatus_pago].fg, borderColor: 'transparent' }}>{f.estatus_pago}</span></td>
              <td>
                <div className="row" style={{ gap: 2 }}>
                  <button className="btn btn-sm btn-ghost icon-only" title="Editar" onClick={() => window.SERVMAC_OPEN_MODAL('factura', { projectId: f.id_proyecto, facturaId: f.id })}><Icon name="edit" size={13}/></button>
                  <button className="btn btn-sm btn-ghost icon-only" title="Eliminar" onClick={() => del(f.id, f.folio)}><Icon name="trash" size={13}/></button>
                </div>
              </td>
            </tr>
          ))}
          {facts.length === 0 && <tr><td colSpan="11" className="empty">Sin facturas registradas — usa <strong>+ Nueva factura</strong> para agregar la primera.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function FlujoPagos({ facts }) {
  // Group by month
  const byMonth = {};
  facts.forEach(f => {
    const k = f.fecha.slice(0, 7);
    byMonth[k] = byMonth[k] || { pagada: 0, pendiente: 0, programada: 0, vencida: 0 };
    byMonth[k][f.estatus_pago] += f.total;
  });
  const months = Object.keys(byMonth).sort();
  const maxV = Math.max(...Object.values(byMonth).map(m => m.pagada + m.pendiente + m.programada + m.vencida));

  return (
    <div className="card">
      <div className="card-head"><h3>Flujo de pagos por mes</h3></div>
      <div style={{ display:'grid', gridTemplateColumns: `repeat(${months.length}, 1fr)`, gap: 12, alignItems: 'end', minHeight: 220 }}>
        {months.map(m => {
          const v = byMonth[m];
          const tot = v.pagada + v.pendiente + v.programada + v.vencida;
          const H = 200;
          return (
            <div key={m} style={{ textAlign: 'center' }}>
              <div style={{ height: H, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <div title={`Vencida ${fmt$(v.vencida)}`} style={{ height: v.vencida / maxV * H, background: 'var(--red-500)' }}/>
                <div title={`Pendiente ${fmt$(v.pendiente)}`} style={{ height: v.pendiente / maxV * H, background: 'var(--orange-500)' }}/>
                <div title={`Programada ${fmt$(v.programada)}`} style={{ height: v.programada / maxV * H, background: 'var(--blue-500)' }}/>
                <div title={`Pagada ${fmt$(v.pagada)}`} style={{ height: v.pagada / maxV * H, background: 'var(--green-500)' }}/>
              </div>
              <div className="mono" style={{ fontSize: 11, fontWeight: 600, marginTop: 6 }}>{m}</div>
              <div className="cell-id" style={{ fontSize: 10 }}>{fmt$k(tot)}</div>
            </div>
          );
        })}
      </div>
      <div className="row" style={{ gap: 16, marginTop: 14, fontSize: 12, color: 'var(--muted)' }}>
        <span className="row" style={{ gap: 4 }}><span style={{ width:10,height:10,background:'var(--green-500)' }}/>Pagada</span>
        <span className="row" style={{ gap: 4 }}><span style={{ width:10,height:10,background:'var(--blue-500)' }}/>Programada</span>
        <span className="row" style={{ gap: 4 }}><span style={{ width:10,height:10,background:'var(--orange-500)' }}/>Pendiente</span>
        <span className="row" style={{ gap: 4 }}><span style={{ width:10,height:10,background:'var(--red-500)' }}/>Vencida</span>
      </div>
    </div>
  );
}

Object.assign(window, { BitacoraTab, PlanRealTab, ProveedoresProyectoTab, MaterialesTab });
