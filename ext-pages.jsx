// New top-level pages: Proveedores · Inbox add-on · Mapa · Notifications bell · Export agenda

// ============== PROVEEDORES PAGE ==============
function ProveedoresPage({ data, openProveedor, openProject }) {
  const E = window.SERVMAC_EXTRAS;
  const [q, setQ] = React.useState('');
  const [esp, setEsp] = React.useState('todas');

  const rows = E.proveedores.map(p => {
    const subs = E.proyecto_proveedores.filter(s => s.id_proveedor === p.id);
    const importe = subs.reduce((s, x) => s + x.importe, 0);
    const pagado = subs.reduce((s, x) => s + x.importe_pagado, 0);
    const proyectos = new Set(subs.map(s => s.id_proyecto)).size;
    const integrantes = p.equipos.reduce((s, e) => s + e.integrantes, 0);
    return { ...p, importe, pagado, proyectos, integrantes, subs };
  });

  const especialidades = [...new Set(E.proveedores.map(p => p.especialidad))];
  const filtered = rows.filter(r => {
    if (esp !== 'todas' && r.especialidad !== esp) return false;
    if (q && !r.nombre.toLowerCase().includes(q.toLowerCase()) && !r.especialidad.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const totalAsig = rows.reduce((s, r) => s + r.importe, 0);
  const totalPag = rows.reduce((s, r) => s + r.pagado, 0);
  const totalEq = rows.reduce((s, r) => s + r.integrantes, 0);

  // Top providers by importe
  const top = [...rows].sort((a, b) => b.importe - a.importe).slice(0, 6);
  const maxImp = top[0]?.importe || 1;

  return (
    <div className="stack-md">
      <div className="row" style={{ gap: 12 }}>
        <KPI label="Proveedores activos" value={E.proveedores.length}/>
        <KPI label="Subcontratado total" value={fmt$k(totalAsig)} delta={`${((totalPag/totalAsig)*100).toFixed(0)}% pagado`} deltaDir="up"/>
        <KPI label="Personal en campo" value={totalEq} delta="entre todos los equipos" deltaDir="flat"/>
        <KPI label="Facturas vencidas" value={E.facturas.filter(f => f.estatus_pago === 'vencida').length} featured="featured-red"/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="card-head"><h3>Top proveedores por importe contratado</h3></div>
          <div className="stack-sm">
            {top.map(r => (
              <div key={r.id} onClick={() => openProveedor(r.id)} style={{ display:'grid', gridTemplateColumns:'1fr 200px 120px', alignItems:'center', gap: 12, cursor:'pointer', padding: '6px 0' }}>
                <div>
                  <div className="cell-strong">{r.nombre}</div>
                  <div className="cell-id">{r.especialidad} · {r.proyectos} proyectos</div>
                </div>
                <div>
                  <div style={{ height: 12, background:'var(--bg)', borderRadius: 3 }}>
                    <div style={{ height:'100%', width: (r.importe/maxImp*100)+'%', background:'linear-gradient(90deg, var(--blue-700), var(--orange-500))', borderRadius:3 }}/>
                  </div>
                </div>
                <div style={{ textAlign:'right' }} className="mono">{fmt$k(r.importe)}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Distribución por especialidad</h3></div>
          <div className="stack-sm">
            {especialidades.map(e => {
              const ts = rows.filter(r => r.especialidad === e).reduce((s,r) => s + r.importe, 0);
              const pct = ts / totalAsig * 100;
              return (
                <div key={e}>
                  <div className="row" style={{ marginBottom: 3 }}>
                    <span className="cell-strong" style={{ fontSize: 12 }}>{e}</span>
                    <span className="mono" style={{ marginLeft:'auto', fontSize: 11 }}>{fmt$k(ts)} <span className="muted">· {pct.toFixed(0)}%</span></span>
                  </div>
                  <div style={{ height: 6, background:'var(--bg)', borderRadius: 3 }}>
                    <div style={{ height:'100%', width: pct+'%', background:'var(--blue-600)', borderRadius: 3 }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="row" style={{ padding: 14, borderBottom: '1px solid var(--line)', gap: 8 }}>
          <input placeholder="Buscar proveedor o especialidad…" value={q} onChange={e=>setQ(e.target.value)} style={{ flex: 1, maxWidth: 320 }}/>
          <div className="chips">
            <div className={'chip '+(esp==='todas'?'active':'')} onClick={()=>setEsp('todas')}>Todas</div>
            {especialidades.map(e => (
              <div key={e} className={'chip '+(esp===e?'active':'')} onClick={()=>setEsp(e)}>{e}</div>
            ))}
          </div>
          <button className="btn btn-sm btn-accent" style={{ marginLeft:'auto' }}>+ Dar de alta proveedor</button>
        </div>
        <table className="tbl">
          <thead><tr><th>Proveedor</th><th>Especialidad</th><th>Región</th><th>Equipos</th><th>Personal</th><th>Proyectos</th><th>Contratado</th><th>Pagado</th><th>% pago</th><th>Rating</th></tr></thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} onClick={()=>openProveedor(r.id)} style={{ cursor: 'pointer' }}>
                <td><span className="cell-strong">{r.nombre}</span><div className="cell-id">{r.rfc}</div></td>
                <td>{r.especialidad}</td>
                <td className="cell-id">{r.region}</td>
                <td className="mono">{r.equipos.length}</td>
                <td className="mono">{r.integrantes}</td>
                <td className="mono">{r.proyectos}</td>
                <td className="mono"><strong>{fmt$k(r.importe)}</strong></td>
                <td className="mono cell-id">{fmt$k(r.pagado)}</td>
                <td><div style={{ width:60, height: 5, background:'var(--bg)', borderRadius: 3 }}><div style={{ height:'100%', width: (r.pagado/Math.max(1,r.importe)*100)+'%', background:'var(--green-500)', borderRadius:3 }}/></div></td>
                <td>⭐ {r.rating.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============== PROVEEDOR DETAIL DRAWER ==============
function ProveedorDetail({ data, proveedorId, onClose, openProject, fullscreen, toggleFullscreen }) {
  const E = window.SERVMAC_EXTRAS;
  const p = E.proveedores.find(x => x.id === proveedorId);
  if (!p) return null;
  const subs = E.proyecto_proveedores.filter(s => s.id_proveedor === proveedorId);
  const facts = E.facturas.filter(f => f.id_proveedor === proveedorId);
  const projMap = Object.fromEntries(data.proyectos.map(pr => [pr.id, pr]));

  const importe = subs.reduce((s, x) => s + x.importe, 0);
  const pagado = subs.reduce((s, x) => s + x.importe_pagado, 0);
  const porPagar = importe - pagado;
  const vencidas = facts.filter(f => f.estatus_pago === 'vencida');

  return (
    <>
        <div className="drawer-head">
          <div className="row" style={{ justifyContent:'space-between' }}>
            <div>
              <div className="cell-id">Proveedor · {p.rfc}</div>
              <h2 style={{ margin:'4px 0' }}>{p.nombre}</h2>
              <div className="row" style={{ gap: 10 }}>
                <span className="tag">{p.especialidad}</span>
                <span className="muted" style={{ fontSize: 12 }}>{p.region} · ⭐ {p.rating}</span>
              </div>
            </div>
            <button className="btn btn-ghost" onClick={toggleFullscreen} title={fullscreen ? 'Reducir' : 'Pantalla completa'} style={{ marginRight: 4 }}><Icon name={fullscreen ? 'shrink' : 'expand'} size={16}/></button>
            <button className="btn btn-ghost" onClick={onClose}>✕</button>
          </div>
          <div className="row" style={{ gap: 16, marginTop: 16, fontSize: 12, color:'var(--muted)' }}>
            <span><Icon name="phone" size={12}/> {p.telefono || '—'}</span>
            <span><Icon name="mail" size={12}/> {p.email || '—'}</span>
            <span><Icon name="pin" size={12}/> {p.direccion || '—'}</span>
          </div>
        </div>
        <div className="drawer-body stack-md">
          <div className="row" style={{ gap: 12 }}>
            <KPI label="Proyectos activos" value={subs.length}/>
            <KPI label="Total contratado" value={fmt$k(importe)} featured="featured-blue"/>
            <KPI label="Pagado" value={fmt$k(pagado)} delta={((pagado/importe)*100).toFixed(0)+'%'} deltaDir="up"/>
            <KPI label="Por pagar" value={fmt$k(porPagar)} featured={vencidas.length > 0 ? 'featured-red' : ''}/>
          </div>

          <div className="card">
            <div className="card-head"><h3>Equipos de trabajo</h3><button className="btn btn-sm btn-accent right">+ Agregar equipo</button></div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap: 10 }}>
              {p.equipos.map(eq => (
                <div key={eq.id} style={{ padding:12, background:'var(--bg)', borderRadius: 10 }}>
                  <div className="row"><span className="cell-strong">{eq.nombre}</span><span className="mono" style={{ marginLeft:'auto' }}>{eq.integrantes} personas</span></div>
                  <div className="cell-sub">Líder: {eq.lider}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h3>Proyectos asignados</h3></div>
            <div className="stack-sm">
              {subs.map(s => {
                const pr = projMap[s.id_proyecto];
                return (
                  <div key={s.id} onClick={() => openProject(s.id_proyecto)} style={{ display:'grid', gridTemplateColumns:'1fr auto auto', gap: 12, padding:'10px 12px', background:'var(--bg)', borderRadius:8, cursor:'pointer' }}>
                    <div>
                      <div className="cell-strong">{pr?.sucursal}</div>
                      <div className="cell-id">{s.scope} · {s.equipo_nombre}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div className="mono"><strong>{fmt$k(s.importe)}</strong></div>
                      <div className="cell-id">{((s.importe_pagado/s.importe)*100).toFixed(0)}% pagado</div>
                    </div>
                    <span className="tag" style={{ alignSelf:'center', fontSize: 10 }}>{s.estatus}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <FacturasTable facts={facts} provMap={{ [p.id]: p }}/>
        </div>
    </>
  );
}

// ============== INBOX (Gmail add-on) ==============
function InboxPage({ data, openProject }) {
  const E = window.SERVMAC_EXTRAS;
  const [filter, setFilter] = React.useState('nuevo');
  const [selected, setSelected] = React.useState(E.inbox[0]?.id);

  const items = E.inbox.filter(x => filter === 'todos' || x.estatus === filter);
  const item = E.inbox.find(x => x.id === selected) || items[0];

  const counts = {
    nuevo: E.inbox.filter(x => x.estatus === 'nuevo').length,
    sugerido: E.inbox.filter(x => x.estatus === 'sugerido').length,
    procesado: E.inbox.filter(x => x.estatus === 'procesado').length,
    ignorado: E.inbox.filter(x => x.estatus === 'ignorado').length,
  };

  const tipoIcon = { 'correo cliente':'📧', 'correo SERVMAC':'📧', 'WhatsApp':'💬', 'junta':'📅' };
  const intencionLabel = {
    cita_solicitada:'Cita solicitada', documento_entregar:'Documento por entregar',
    firma_solicitada:'Firma requerida', consulta_estatus:'Consulta de estatus',
    aprobacion_requerida:'Aprobación requerida', reporte_avance:'Reporte de avance', aviso_pago:'Aviso de pago',
  };
  const intencionColor = {
    cita_solicitada:'var(--violet-600)', documento_entregar:'var(--orange-700)', firma_solicitada:'var(--blue-700)',
    consulta_estatus:'var(--muted)', aprobacion_requerida:'var(--red-600)', reporte_avance:'var(--green-600)', aviso_pago:'var(--green-600)',
  };

  return (
    <div className="stack-md">
      <div className="card" style={{ background:'linear-gradient(135deg, #1e293b, #0f172a)', color:'#fff', border:'none' }}>
        <div className="row" style={{ gap: 16 }}>
          <div style={{ background:'rgba(242,107,31,0.2)', padding:10, borderRadius:10, fontSize: 24 }}>🤖</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize: 11, fontWeight:700, color:'#FFB87A', textTransform:'uppercase', letterSpacing:'0.1em' }}>Add-on Gmail · Clasificador Claude</div>
            <h2 style={{ margin:'4px 0', color:'#fff' }}>{counts.nuevo} mensajes nuevos · {counts.sugerido} con acción sugerida</h2>
            <div style={{ fontSize: 13, color:'#b1c1dd' }}>Cada correo es analizado: identifica intención, proyecto relacionado y propone una acción (crear cita, registrar entrega, programar firma…) antes de tu aprobación.</div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-ghost" style={{ background:'rgba(255,255,255,0.1)', color:'#fff', borderColor:'transparent' }}>Configurar reglas</button>
            <button className="btn btn-accent">Procesar nuevos</button>
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'380px 1fr', gap: 16 }}>
        <div className="card" style={{ padding: 0 }}>
          <div className="row" style={{ padding: 12, borderBottom:'1px solid var(--line)', gap: 4 }}>
            {[['nuevo','Nuevos',counts.nuevo],['sugerido','Sugeridos',counts.sugerido],['procesado','Procesados',counts.procesado],['ignorado','Ignorados',counts.ignorado]].map(([k,l,c]) => (
              <div key={k} className={'chip '+(filter===k?'active':'')} onClick={()=>setFilter(k)} style={{ fontSize:11 }}>{l} <span style={{ marginLeft:4, opacity:0.6 }}>{c}</span></div>
            ))}
          </div>
          <div style={{ maxHeight: 600, overflowY: 'auto' }}>
            {items.map(x => (
              <div key={x.id} onClick={()=>setSelected(x.id)} style={{ padding:'12px 14px', borderBottom:'1px solid var(--line)', cursor:'pointer', background: selected === x.id ? 'var(--blue-50)' : '#fff', borderLeft: selected === x.id ? '3px solid var(--orange-500)' : '3px solid transparent' }}>
                <div className="row" style={{ gap:6, marginBottom: 4 }}>
                  <span>{tipoIcon[x.tipo] || '📧'}</span>
                  <span className="cell-strong" style={{ fontSize: 12 }}>{x.remitente}</span>
                  <span className="cell-id" style={{ marginLeft:'auto', fontSize: 10 }}>{x.fecha}</span>
                </div>
                <div style={{ fontSize: 12.5, color:'var(--text)', marginBottom: 4, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{x.asunto}</div>
                <div className="row" style={{ gap: 6 }}>
                  <span style={{ fontSize: 10, fontWeight:700, color: intencionColor[x.intencion], padding:'1px 5px', background: 'var(--bg)', borderRadius: 3 }}>● {intencionLabel[x.intencion]}</span>
                  <span className="cell-id" style={{ fontSize: 10 }}>{Math.round(x.confianza*100)}%</span>
                  {x.adjuntos > 0 && <span className="cell-id" style={{ fontSize: 10 }}>📎 {x.adjuntos}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          {item ? (
            <div>
              <div className="row" style={{ gap: 8, marginBottom: 6 }}>
                <span className="tag">{tipoIcon[item.tipo]} {item.tipo}</span>
                <span className="tag" style={{ background:'var(--blue-100)', color:'var(--blue-700)', borderColor:'transparent' }}>{intencionLabel[item.intencion]}</span>
                <span className="cell-id" style={{ marginLeft:'auto' }}>Confianza: {Math.round(item.confianza*100)}%</span>
              </div>
              <h3 style={{ margin:'4px 0' }}>{item.asunto}</h3>
              <div className="row" style={{ gap: 12, fontSize: 12, color:'var(--muted)', marginBottom: 14 }}>
                <span><strong style={{ color:'var(--text)' }}>De:</strong> {item.remitente}</span>
                <span><strong style={{ color:'var(--text)' }}>Proyecto:</strong> <a onClick={()=>openProject(item.id_proyecto)} style={{ cursor:'pointer', color: 'var(--blue-700)' }}>{item.proyecto_sucursal} · CR {item.proyecto_cr}</a></span>
                <span><strong style={{ color:'var(--text)' }}>Fecha:</strong> {item.fecha}</span>
              </div>
              <div style={{ padding: 14, background:'var(--bg)', borderRadius: 8, fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>{item.preview}</div>

              <div style={{ padding: 14, background:'linear-gradient(135deg, var(--orange-50, #FFF4EC), #fff)', border:'1px solid var(--orange-200, #FFD6B5)', borderRadius: 10, marginBottom: 14 }}>
                <div className="row" style={{ gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 18 }}>✨</span>
                  <span className="cell-strong">Acción sugerida por Claude</span>
                </div>
                <div style={{ fontSize: 13, marginBottom: 10 }}>{item.accion}</div>
                <div className="row" style={{ gap: 8 }}>
                  <button className="btn btn-sm btn-accent">Aceptar y crear</button>
                  <button className="btn btn-sm btn-ghost">Editar antes de crear</button>
                  <button className="btn btn-sm btn-ghost">Ignorar</button>
                </div>
              </div>

              <div className="row" style={{ justifyContent:'space-between' }}>
                <button className="btn btn-ghost">Abrir en Gmail ↗</button>
                <button className="btn btn-ghost" onClick={()=>openProject(item.id_proyecto)}>Ver proyecto →</button>
              </div>
            </div>
          ) : <div className="empty">Selecciona un mensaje</div>}
        </div>
      </div>
    </div>
  );
}

// ============== MAPA ==============
function MapaPage({ data, openProject }) {
  const E = window.SERVMAC_EXTRAS;
  const [hover, setHover] = React.useState(null);

  // Project status map per sucursal
  const sucs = E.sucursales.map(s => {
    const projs = s.proyectos.map(id => data.proyectos.find(p => p.id === id)).filter(Boolean);
    const activos = projs.filter(p => p.activo).length;
    const atrasados = projs.filter(p => p.activo && p.entregable === 'Fuera de tiempo').length;
    const monto = projs.reduce((sum, p) => sum + (p.importe_contratado || 0), 0);
    const main = projs[0];
    return { ...s, projs, activos, atrasados, monto, main };
  });

  // Project map: lat/lng -> SVG coordinates (Mexico approx: lat 14-33, lng -118 to -86)
  const W = 900, H = 560;
  const project = (lat, lng) => {
    const x = (lng + 118) / 32 * W;
    const y = (33 - lat) / 19 * H;
    return [x, y];
  };

  const totalAct = sucs.reduce((s, x) => s + x.activos, 0);
  const totalAtr = sucs.reduce((s, x) => s + x.atrasados, 0);

  return (
    <div className="stack-md">
      <div className="row" style={{ gap: 12 }}>
        <KPI label="Sucursales con proyectos" value={sucs.length}/>
        <KPI label="Proyectos activos" value={totalAct}/>
        <KPI label="Sucursales con atraso" value={sucs.filter(s => s.atrasados > 0).length} featured={totalAtr > 0 ? 'featured-red' : ''}/>
        <KPI label="Regiones cubiertas" value={new Set(sucs.map(s => s.region)).size}/>
      </div>

      <div className="card" style={{ padding: 0, position:'relative', overflow:'hidden' }}>
        <div style={{ padding: 16, borderBottom:'1px solid var(--line)' }}>
          <h3 style={{ margin: 0 }}>Distribución geográfica</h3>
          <div className="muted" style={{ fontSize: 12 }}>Tamaño del círculo = importe contratado · Color = estatus dominante</div>
        </div>
        <div style={{ position:'relative', background: 'linear-gradient(180deg, #EAF1FB 0%, #F5F8FE 100%)' }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', display:'block' }}>
            {/* Stylized Mexico outline (rough silhouette via path) */}
            <path d="M 100 220 Q 150 180 220 200 L 280 180 Q 350 170 420 220 L 480 280 Q 560 320 640 340 L 720 380 Q 780 420 800 480 L 720 510 Q 600 500 500 470 L 380 440 Q 280 420 220 380 Q 160 340 130 290 Z" fill="#D5E2F5" stroke="#A9C0E2" strokeWidth="1.5"/>
            {/* Baja California */}
            <path d="M 50 180 Q 80 170 110 200 L 130 280 Q 140 340 100 360 Q 70 340 60 280 Z" fill="#D5E2F5" stroke="#A9C0E2" strokeWidth="1.5"/>
            {/* Yucatán */}
            <path d="M 700 320 Q 760 290 800 310 Q 820 340 800 380 Q 760 390 720 370 Z" fill="#D5E2F5" stroke="#A9C0E2" strokeWidth="1.5"/>

            {/* Region labels */}
            {[
              { name:'Noroeste', x: 130, y: 230 },
              { name:'Norte',    x: 280, y: 230 },
              { name:'Noreste',  x: 420, y: 250 },
              { name:'Bajío',    x: 380, y: 330 },
              { name:'Occidente',x: 280, y: 360 },
              { name:'Centro',   x: 460, y: 360 },
              { name:'Sur',      x: 460, y: 440 },
              { name:'Sureste',  x: 720, y: 360 },
            ].map(r => <text key={r.name} x={r.x} y={r.y} fontSize="11" fill="#7A8CA8" fontWeight="600">{r.name}</text>)}

            {sucs.map((s, i) => {
              const [x, y] = project(s.lat, s.lng);
              const r = 6 + Math.log10(Math.max(1, s.monto / 100000)) * 4;
              const color = s.atrasados > 0 ? '#DC2626' : s.activos > 0 ? '#F26B1F' : '#2563EB';
              return (
                <g key={s.nombre} style={{ cursor: 'pointer' }} onMouseEnter={() => setHover(s.nombre)} onMouseLeave={() => setHover(null)} onClick={() => s.main && openProject(s.main.id)}>
                  <circle cx={x} cy={y} r={r + 6} fill={color} opacity="0.15"/>
                  <circle cx={x} cy={y} r={r} fill={color} opacity="0.85" stroke="#fff" strokeWidth="1.5"/>
                  {s.atrasados > 0 && <text x={x} y={y+3} fontSize="9" fill="#fff" fontWeight="700" textAnchor="middle">{s.atrasados}</text>}
                  {hover === s.nombre && (
                    <g>
                      <rect x={x+10} y={y-30} width="180" height="50" rx="6" fill="#0F172A" opacity="0.95"/>
                      <text x={x+20} y={y-14} fontSize="11" fill="#fff" fontWeight="700">{s.nombre}</text>
                      <text x={x+20} y={y+2} fontSize="10" fill="#b1c1dd">{s.activos} activos · {s.atrasados} atrasados</text>
                      <text x={x+20} y={y+15} fontSize="10" fill="#FFB87A">{fmt$k(s.monto)} contratado</text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
        <div className="row" style={{ padding: 12, gap: 16, fontSize: 11, color:'var(--muted)', borderTop: '1px solid var(--line)' }}>
          <span className="row" style={{ gap: 6 }}><span style={{ width:10, height:10, borderRadius:'50%', background:'#DC2626' }}/>Con atraso</span>
          <span className="row" style={{ gap: 6 }}><span style={{ width:10, height:10, borderRadius:'50%', background:'#F26B1F' }}/>Activo en tiempo</span>
          <span className="row" style={{ gap: 6 }}><span style={{ width:10, height:10, borderRadius:'50%', background:'#2563EB' }}/>Cerrado</span>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="card-head" style={{ padding:'14px 18px', borderBottom:'1px solid var(--line)', margin: 0 }}><h3>Sucursales</h3></div>
        <table className="tbl">
          <thead><tr><th>Sucursal</th><th>Región</th><th>Activos</th><th>Atrasados</th><th>Importe</th><th></th></tr></thead>
          <tbody>
            {sucs.sort((a,b)=>b.monto-a.monto).map(s => (
              <tr key={s.nombre} onClick={()=>s.main && openProject(s.main.id)} style={{ cursor:'pointer' }}>
                <td><span className="cell-strong">{s.nombre}</span></td>
                <td>{s.region}</td>
                <td className="mono">{s.activos}</td>
                <td className="mono" style={{ color: s.atrasados > 0 ? 'var(--red-600)' : 'inherit' }}>{s.atrasados}</td>
                <td className="mono">{fmt$k(s.monto)}</td>
                <td className="cell-id">{s.projs.length} proyectos</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============== NOTIFICATIONS BELL ==============
function NotificationsBell({ data, openProject }) {
  const E = window.SERVMAC_EXTRAS;
  const [open, setOpen] = React.useState(false);
  const [readIds, setReadIds] = React.useState(new Set());

  const notifs = E.notificaciones;
  const unread = notifs.filter(n => !readIds.has(n.id)).length;
  const iconFor = (t) => t === 'warn' ? '⚠️' : t === 'clock' ? '⏰' : t === 'mail' ? '✉' : '🔔';
  const tipoColor = { alerta:'var(--red-600)', recordatorio:'var(--orange-500)', addon:'var(--blue-600)' };

  return (
    <div style={{ position: 'relative' }}>
      <button className="btn btn-ghost" style={{ position:'relative' }} onClick={()=>setOpen(!open)}>
        <Icon name="bell" size={16}/>
        {unread > 0 && <span style={{ position:'absolute', top: 2, right: 2, background:'var(--orange-500)', color:'#fff', borderRadius: 10, padding:'0 5px', fontSize: 9, fontWeight: 700 }}>{unread}</span>}
      </button>
      {open && (
        <>
          <div onClick={()=>setOpen(false)} style={{ position:'fixed', inset:0, zIndex: 50 }}/>
          <div style={{ position:'absolute', right: 0, top: '110%', width: 380, background:'#fff', boxShadow:'0 12px 32px rgba(0,0,0,0.18)', borderRadius: 10, zIndex: 51, maxHeight: 480, overflowY:'auto', border:'1px solid var(--line)' }}>
            <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--line)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <strong style={{ fontSize: 13 }}>Notificaciones</strong>
              <button className="btn btn-sm btn-ghost" onClick={()=>setReadIds(new Set(notifs.map(n => n.id)))}>Marcar todo como leído</button>
            </div>
            {notifs.length === 0 && <div className="empty">Sin notificaciones</div>}
            {notifs.map(n => (
              <div key={n.id} onClick={()=>{ setReadIds(new Set([...readIds, n.id])); openProject(n.proyecto); setOpen(false); }} style={{ padding:'10px 16px', borderBottom:'1px solid var(--line)', cursor:'pointer', background: readIds.has(n.id) ? '#fff' : 'var(--blue-50)', display:'grid', gridTemplateColumns:'24px 1fr', gap: 10 }}>
                <div style={{ fontSize: 16, color: tipoColor[n.tipo] }}>{iconFor(n.icono)}</div>
                <div>
                  <div className="cell-strong" style={{ fontSize: 12.5 }}>{n.titulo}</div>
                  <div className="cell-id" style={{ fontSize: 11 }}>{n.detalle}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

Object.assign(window, { ProveedoresPage, ProveedorDetail, InboxPage, MapaPage, NotificationsBell });
