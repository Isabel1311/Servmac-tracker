// ============= MI DÍA PAGE =============
function MiDiaPage({ data, openProject }) {
  const E = window.SERVMAC_EXTRAS;
  const user = E.usuario_activo;
  const today = data.today;
  const todayD = new Date(today + 'T12:00:00Z');

  // Filter por usuario
  const proyectosMios = data.proyectos.filter(p => p.activo && p.persona_servmac && (p.persona_servmac.split(' ')[0] === user.nombre.split(' ')[0] || p.persona_servmac === user.nombre));

  const visitasHoy = (window.deriveVisitas ? window.deriveVisitas(data) : []).filter(v => {
    const p = data.proyectos.find(x => x.id === v.proyecto);
    return v.fecha === today && p && proyectosMios.some(pm => pm.id === p.id);
  });
  const visitasManiana = (window.deriveVisitas ? window.deriveVisitas(data) : []).filter(v => {
    const d = new Date(v.fecha + 'T12:00:00Z');
    const diff = (d - todayD) / 86400000;
    const p = data.proyectos.find(x => x.id === v.proyecto);
    return diff > 0 && diff <= 1 && p && proyectosMios.some(pm => pm.id === p.id);
  });

  const hitosUrgentes = data.hitos.filter(h => {
    if (h.estatus === 'cumplido') return false;
    const p = data.proyectos.find(x => x.id === h.id_proyecto);
    if (!p || !proyectosMios.some(pm => pm.id === p.id)) return false;
    const d = new Date(h.fecha_programada + 'T12:00:00Z');
    return (d - todayD) / 86400000 <= 7;
  }).sort((a,b) => a.fecha_programada.localeCompare(b.fecha_programada));

  const bloqueosAbiertos = [];
  proyectosMios.forEach(p => {
    (E.bugs[p.id] || []).forEach(b => bloqueosAbiertos.push({ ...b, projectId: p.id, sucursal: p.sucursal }));
  });

  const facturasVencidas = E.facturas.filter(f => {
    if (f.estatus_pago !== 'vencida') return false;
    return proyectosMios.some(p => p.id === f.id_proyecto);
  });

  const projectsByStatus = {};
  proyectosMios.forEach(p => {
    const k = statusMap[p.estatus]?.short || p.estatus;
    projectsByStatus[k] = (projectsByStatus[k] || 0) + 1;
  });

  return (
    <div className="stack-md">
      <div className="card" style={{ background: 'linear-gradient(135deg, var(--blue-900), var(--blue-700))', color: '#fff', border: 'none' }}>
        <div className="row" style={{ gap: 16, alignItems: 'center' }}>
          <Avatar name={user.nombre} size={56}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#FFB87A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Hola, {user.nombre.split(' ')[0]}</div>
            <h2 style={{ margin: '4px 0', color:'#fff', fontSize: 24 }}>Tu día — {fmtDateLong(today)}</h2>
            <div className="row" style={{ gap: 24, fontSize: 13, color: '#b1c1dd', marginTop: 6 }}>
              <span><strong style={{ color: '#fff', fontSize: 18 }}>{proyectosMios.length}</strong> proyectos asignados</span>
              <span><strong style={{ color: '#fff', fontSize: 18 }}>{visitasHoy.length}</strong> visitas hoy</span>
              <span><strong style={{ color: '#fff', fontSize: 18 }}>{hitosUrgentes.length}</strong> hitos próximos</span>
              <span><strong style={{ color: '#fff', fontSize: 18 }}>{bloqueosAbiertos.length}</strong> bloqueos abiertos</span>
            </div>
          </div>
          <button className="btn btn-accent">Marcar día como cerrado</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="card-head"><h3>Agenda de hoy</h3><span className="sub">· {visitasHoy.length} eventos</span></div>
          <div className="stack-sm">
            {visitasHoy.length === 0 && <div className="muted" style={{ padding: 12, fontSize: 13 }}>Sin visitas o citas programadas para hoy ✓</div>}
            {visitasHoy.map(v => {
              const p = data.proyectos.find(x => x.id === v.proyecto);
              return (
                <div key={v.id} className="row" style={{ gap: 12, padding: '10px 12px', background: 'var(--bg-soft, #f8f9fc)', borderRadius: 8, cursor: 'pointer' }} onClick={() => openProject(v.proyecto)}>
                  <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--blue-700)', minWidth: 50 }}>{v.hora}</div>
                  <div style={{ flex: 1 }}>
                    <div className="cell-strong">{v.titulo}</div>
                    <div className="cell-id">{p?.sucursal} · CR {p?.cr}</div>
                  </div>
                  <span className="pill pill-blue">{v.kind}</span>
                </div>
              );
            })}
          </div>
          {visitasManiana.length > 0 && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px dashed var(--line)' }}>
              <div className="muted" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Mañana ({visitasManiana.length})</div>
              {visitasManiana.slice(0, 3).map(v => {
                const p = data.proyectos.find(x => x.id === v.proyecto);
                return (
                  <div key={v.id} className="row" style={{ gap: 10, padding: '6px 0', fontSize: 12 }}>
                    <span className="mono" style={{ color: 'var(--muted)' }}>{v.hora}</span>
                    <span>{v.titulo} · <span className="muted">{p?.sucursal}</span></span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-head"><h3>Hitos próximos (7 días)</h3><span className="sub">· {hitosUrgentes.length}</span></div>
          <div className="stack-sm">
            {hitosUrgentes.length === 0 && <div className="muted" style={{ padding: 12, fontSize: 13 }}>Sin hitos urgentes ✓</div>}
            {hitosUrgentes.slice(0, 8).map(h => {
              const p = data.proyectos.find(x => x.id === h.id_proyecto);
              const d = new Date(h.fecha_programada + 'T12:00:00Z');
              const diff = Math.round((d - todayD) / 86400000);
              return (
                <div key={h.id} className="row" style={{ gap: 12, padding: '8px 12px', background: 'var(--bg-soft, #f8f9fc)', borderRadius: 8, cursor: 'pointer' }} onClick={() => openProject(h.id_proyecto)}>
                  <span className={'pill ' + (diff < 0 ? 'pill-red' : diff <= 2 ? 'pill-orange' : 'pill-blue')}>
                    {diff < 0 ? `${-diff}d tarde` : diff === 0 ? 'hoy' : diff === 1 ? 'mañana' : `+${diff}d`}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div className="cell-strong">{h.tipo}</div>
                    <div className="cell-id">{p?.sucursal}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="card-head"><h3>Tus bloqueos abiertos</h3></div>
          <div className="stack-sm">
            {bloqueosAbiertos.length === 0 && <div className="muted" style={{ padding: 12, fontSize: 13 }}>Sin bloqueos abiertos ✓</div>}
            {bloqueosAbiertos.slice(0, 6).map(b => (
              <div key={b.id} className="bug-row" onClick={() => openProject(b.projectId)} style={{ cursor: 'pointer' }}>
                <div className={'bug-sev bug-sev-' + b.severidad}>!</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{b.titulo}</div>
                  <div className="muted" style={{ fontSize: 11 }}>{b.sucursal} · {b.impacto_dias}d impacto</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Tus proyectos por estatus</h3></div>
          <div className="stack-sm">
            {Object.entries(projectsByStatus).map(([k,v]) => (
              <div key={k} className="row" style={{ gap: 10 }}>
                <span style={{ fontSize: 13 }}>{k}</span>
                <div style={{ flex: 1, height: 8, background: 'var(--bg)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: (v/proyectosMios.length*100)+'%', background: 'var(--blue-600)' }}/>
                </div>
                <span className="mono" style={{ fontSize: 12, fontWeight: 700 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============= FORECAST 4 SEMANAS =============
function ForecastPage({ data, openProject }) {
  const E = window.SERVMAC_EXTRAS;
  const today = new Date(data.today + 'T12:00:00Z');
  const semanas = Array.from({ length: 4 }, (_, i) => {
    const s = new Date(today); s.setDate(today.getDate() + i*7);
    const e = new Date(today); e.setDate(today.getDate() + (i+1)*7 - 1);
    return { idx: i+1, start: s, end: e };
  });

  const forecast = semanas.map(sem => {
    const startISO = sem.start.toISOString().slice(0,10);
    const endISO = sem.end.toISOString().slice(0,10);
    const cierres = data.proyectos.filter(p => p.activo && p.fecha_termino_prog && p.fecha_termino_prog >= startISO && p.fecha_termino_prog <= endISO);
    const visitas = (window.deriveVisitas ? window.deriveVisitas(data) : []).filter(v => v.fecha >= startISO && v.fecha <= endISO);
    const hitos = data.hitos.filter(h => h.estatus !== 'cumplido' && h.fecha_programada >= startISO && h.fecha_programada <= endISO);
    const facturasCobro = (E.facturas || []).filter(f => f.estatus_pago === 'pendiente' && f.fecha >= startISO && f.fecha <= endISO);
    const ingresos = facturasCobro.reduce((s,f) => s + f.total, 0);
    return { ...sem, cierres, visitas, hitos, ingresos };
  });

  const totalIngresos = forecast.reduce((s, w) => s + w.ingresos, 0);
  const totalCierres = forecast.reduce((s, w) => s + w.cierres.length, 0);
  const totalVisitas = forecast.reduce((s, w) => s + w.visitas.length, 0);

  return (
    <div className="stack-md">
      <div className="kpi-grid">
        <KPI featured="featured" label="Proyectos a cerrar" value={totalCierres} delta="próximas 4 semanas" deltaDir="flat"/>
        <KPI label="Cobros proyectados" value={fmtMoney(totalIngresos)} delta="basado en facturas pendientes" deltaDir="up"/>
        <KPI label="Visitas agendadas" value={totalVisitas} delta="con/sin confirmación" deltaDir="flat"/>
        <KPI label="Hitos programados" value={forecast.reduce((s,w) => s + w.hitos.length, 0)}/>
      </div>

      <div className="card">
        <div className="card-head"><h3>Forecast semanal</h3></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {forecast.map(w => (
            <div key={w.idx} style={{ background: 'var(--bg-soft, #f8f9fc)', borderRadius: 12, padding: 14, border: w.idx === 1 ? '2px solid var(--orange-500)' : '1px solid var(--line)' }}>
              <div className="muted" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Semana {w.idx} {w.idx === 1 && '· esta semana'}</div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{w.start.toISOString().slice(5,10)} → {w.end.toISOString().slice(5,10)}</div>
              <div style={{ marginTop: 12 }}>
                <div className="row" style={{ marginBottom: 6 }}>
                  <span style={{ flex: 1, fontSize: 12 }}>Cierres</span>
                  <strong className="mono">{w.cierres.length}</strong>
                </div>
                <div className="row" style={{ marginBottom: 6 }}>
                  <span style={{ flex: 1, fontSize: 12 }}>Visitas</span>
                  <strong className="mono">{w.visitas.length}</strong>
                </div>
                <div className="row" style={{ marginBottom: 6 }}>
                  <span style={{ flex: 1, fontSize: 12 }}>Hitos</span>
                  <strong className="mono">{w.hitos.length}</strong>
                </div>
                <div className="row" style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed var(--line)' }}>
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 700 }}>Ingresos</span>
                  <strong className="mono" style={{ color: 'var(--green-600)' }}>{fmtMoney(w.ingresos)}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Cierres proyectados — detalle</h3></div>
        <table className="tbl">
          <thead><tr><th>Semana</th><th>Proyecto</th><th>Estatus</th><th>Responsable</th><th>Importe</th></tr></thead>
          <tbody>
            {forecast.flatMap(w => w.cierres.map(p => ({ ...p, semana: w.idx }))).map(p => (
              <tr key={p.id} onClick={() => openProject(p.id)} style={{ cursor: 'pointer' }}>
                <td><span className="pill pill-blue">S{p.semana}</span></td>
                <td><strong>{p.sucursal}</strong></td>
                <td><StatusBadge value={p.estatus}/></td>
                <td>{p.persona_servmac}</td>
                <td className="mono"><strong>{fmtMoney(p.importe_contratado)}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============= RENTABILIDAD =============
function RentabilidadPage({ data, openProject }) {
  const E = window.SERVMAC_EXTRAS;
  const rows = data.proyectos.map(p => {
    const subs = E.proyecto_proveedores.filter(s => s.id_proyecto === p.id);
    const subc = subs.reduce((s,x) => s + x.importe, 0);
    const mats = (E.materiales || []).filter(m => m.id_proyecto === p.id);
    const matsT = mats.reduce((s,m) => s + (m.total || 0), 0);
    const facturas = (E.facturas || []).filter(f => f.id_proyecto === p.id);
    const directos = facturas.filter(f => ['servicio','mano de obra'].includes(f.tipo)).reduce((s,f) => s + f.total, 0);
    const contrato = p.importe_contratado || 0;
    const costoTotal = subc + matsT + directos;
    const margenBruto = contrato - costoTotal;
    const margenPct = contrato > 0 ? (margenBruto / contrato * 100) : 0;
    return { p, contrato, subc, matsT, directos, costoTotal, margenBruto, margenPct };
  }).filter(r => r.contrato > 0).sort((a,b) => b.margenPct - a.margenPct);

  const totalContrato = rows.reduce((s,r) => s + r.contrato, 0);
  const totalCosto    = rows.reduce((s,r) => s + r.costoTotal, 0);
  const totalMargen   = totalContrato - totalCosto;
  const margenPromedio = rows.length ? (rows.reduce((s,r) => s + r.margenPct, 0) / rows.length) : 0;

  const rentables = rows.filter(r => r.margenPct >= 20).length;
  const enRiesgo  = rows.filter(r => r.margenPct < 5).length;
  const negativos = rows.filter(r => r.margenPct < 0).length;

  return (
    <div className="stack-md">
      <div className="kpi-grid">
        <KPI featured="featured" label="Margen bruto total" value={fmtMoney(totalMargen)} delta={`${(totalMargen/totalContrato*100).toFixed(1)}% sobre contratos`} deltaDir="up"/>
        <KPI label="Margen promedio" value={margenPromedio.toFixed(1) + '%'} delta="ponderado por proyecto" deltaDir="flat"/>
        <KPI label="Proyectos rentables ≥20%" value={rentables}/>
        <KPI featured={negativos ? 'featured-red' : (enRiesgo ? 'featured-orange' : '')} label="En riesgo / pérdida" value={enRiesgo + negativos} delta={`${negativos} con margen negativo`} deltaDir={negativos ? 'down' : 'flat'}/>
      </div>

      <div className="card">
        <div className="card-head"><h3>Distribución de márgenes</h3></div>
        <MargenHist rows={rows}/>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="card-head" style={{ padding: '14px 18px', margin: 0, borderBottom: '1px solid var(--line)' }}>
          <h3>Rentabilidad por proyecto</h3>
          <span className="sub">· {rows.length} proyectos · ordenado por margen %</span>
        </div>
        <table className="tbl">
          <thead><tr>
            <th>Proyecto</th><th className="num">Contratado</th><th className="num">Subcontratos</th>
            <th className="num">Materiales</th><th className="num">Directos</th><th className="num">Costo total</th>
            <th className="num">Margen $</th><th>Margen %</th>
          </tr></thead>
          <tbody>
            {rows.map(r => {
              const pct = r.margenPct;
              const cls = pct < 0 ? 'pill-red' : pct < 5 ? 'pill-orange' : pct < 20 ? 'pill-blue' : 'pill-green';
              return (
                <tr key={r.p.id} onClick={() => openProject(r.p.id)} style={{ cursor:'pointer' }}>
                  <td><strong>{r.p.sucursal}</strong><div className="cell-id">CR {r.p.cr}</div></td>
                  <td className="num mono"><strong>{fmtMoney(r.contrato)}</strong></td>
                  <td className="num mono cell-id">{fmtMoney(r.subc)}</td>
                  <td className="num mono cell-id">{fmtMoney(r.matsT)}</td>
                  <td className="num mono cell-id">{fmtMoney(r.directos)}</td>
                  <td className="num mono">{fmtMoney(r.costoTotal)}</td>
                  <td className="num mono"><strong style={{ color: pct < 0 ? 'var(--red-600)' : 'var(--text)' }}>{fmtMoney(r.margenBruto)}</strong></td>
                  <td><span className={'pill ' + cls}>{pct.toFixed(1)}%</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MargenHist({ rows }) {
  const buckets = [
    { l: '< 0%', test: r => r.margenPct < 0, color: '#dc2626' },
    { l: '0-5%', test: r => r.margenPct >= 0 && r.margenPct < 5, color: '#F26B1F' },
    { l: '5-10%', test: r => r.margenPct >= 5 && r.margenPct < 10, color: '#FBBF24' },
    { l: '10-20%', test: r => r.margenPct >= 10 && r.margenPct < 20, color: '#3B82F6' },
    { l: '20-30%', test: r => r.margenPct >= 20 && r.margenPct < 30, color: '#15803D' },
    { l: '> 30%', test: r => r.margenPct >= 30, color: '#0F766E' },
  ];
  buckets.forEach(b => { b.n = rows.filter(b.test).length; });
  const max = Math.max(...buckets.map(b => b.n), 1);
  return (
    <div className="row" style={{ gap: 18, alignItems: 'flex-end', minHeight: 160 }}>
      {buckets.map(b => (
        <div key={b.l} style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ height: 130, display: 'flex', alignItems: 'flex-end' }}>
            <div style={{ width: '100%', height: (b.n / max * 100) + '%', background: b.color, borderRadius: '4px 4px 0 0', minHeight: 4, transition: 'height .4s' }}/>
          </div>
          <div className="mono" style={{ marginTop: 6, fontSize: 13, fontWeight: 700 }}>{b.n}</div>
          <div className="muted" style={{ fontSize: 11 }}>{b.l}</div>
        </div>
      ))}
    </div>
  );
}

// ============= HEATMAP PRODUCTIVIDAD =============
function HeatmapPage({ data, openProject }) {
  const E = window.SERVMAC_EXTRAS;
  const personas = E.catalogos.personas_servmac;

  const rows = personas.map(persona => {
    const proys = data.proyectos.filter(p => p.activo && p.persona_servmac && p.persona_servmac.split(' ')[0] === persona.nombre.split(' ')[0]);
    const enTiempo = proys.filter(p => p.entregable === 'En tiempo' || p.entregable === 'Entregado ET').length;
    const atrasados = proys.filter(p => p.entregable === 'Fuera de tiempo').length;
    const bloqueos = proys.reduce((s,p) => s + (E.bugs[p.id]?.length || 0), 0);
    const importe = proys.reduce((s,p) => s + (p.importe_contratado || 0), 0);
    const score = proys.length === 0 ? 0 : (enTiempo / proys.length * 100) - (atrasados / proys.length * 30) - (bloqueos * 3);
    return { persona, proys: proys.length, enTiempo, atrasados, bloqueos, importe, score: Math.max(0, Math.min(100, score)) };
  }).sort((a,b) => b.score - a.score);

  const regionesAll = [...new Set(data.proyectos.map(p => p.region).filter(Boolean))];
  const regRows = regionesAll.map(region => {
    const proys = data.proyectos.filter(p => p.activo && p.region === region);
    const enTiempo = proys.filter(p => p.entregable === 'En tiempo').length;
    const atrasados = proys.filter(p => p.entregable === 'Fuera de tiempo').length;
    const importe = proys.reduce((s,p) => s + p.importe_contratado, 0);
    const score = proys.length ? (enTiempo / proys.length * 100) : 0;
    return { region, proys: proys.length, enTiempo, atrasados, importe, score };
  }).sort((a,b) => b.score - a.score);

  const heatColor = (n, max) => {
    if (max === 0) return '#f1f5f9';
    const v = n / max;
    if (v === 0) return '#f8fafc';
    if (v < 0.25) return '#dbeafe';
    if (v < 0.5)  return '#93c5fd';
    if (v < 0.75) return '#3b82f6';
    return '#1e40af';
  };

  // Build heatmap data: personas (rows) x estatus (cols)
  const estatusList = ['05. Gestion por iniciar Obra','06. En obra','07. Cierre Administrativo','08. Mesa de cierres','10. Finiquitado'];
  const grid = personas.map(persona => {
    const proys = data.proyectos.filter(p => p.persona_servmac && p.persona_servmac.split(' ')[0] === persona.nombre.split(' ')[0]);
    return {
      persona,
      cells: estatusList.map(est => proys.filter(p => p.estatus === est).length),
      total: proys.length,
    };
  });
  const maxCell = Math.max(...grid.flatMap(g => g.cells), 1);

  return (
    <div className="stack-md">
      <div className="card">
        <div className="card-head"><h3>Productividad por persona</h3><span className="sub">· score ponderado · proyectos activos</span></div>
        <div className="stack-sm">
          {rows.map(r => (
            <div key={r.persona.id} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 80px 60px 60px 100px 90px', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
              <div className="row" style={{ gap: 8 }}>
                <Avatar name={r.persona.nombre} size={28}/>
                <div>
                  <div className="cell-strong" style={{ fontSize: 13 }}>{r.persona.nombre}</div>
                  <div className="cell-id">{r.persona.rol}</div>
                </div>
              </div>
              <div style={{ position: 'relative', height: 10, background: 'var(--bg)', borderRadius: 999 }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: r.score + '%', background: r.score > 70 ? 'var(--green-500, #22c55e)' : r.score > 40 ? 'var(--orange-500)' : 'var(--red-600)', borderRadius: 999 }}/>
              </div>
              <span className="mono" style={{ fontSize: 13, fontWeight: 700, textAlign: 'right' }}>{r.score.toFixed(0)}</span>
              <span className="mono" style={{ fontSize: 12, color: 'var(--green-600)', textAlign: 'right' }}>✓{r.enTiempo}</span>
              <span className="mono" style={{ fontSize: 12, color: 'var(--red-600)', textAlign: 'right' }}>⚠{r.atrasados}</span>
              <span className="mono" style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'right' }}>{r.bloqueos} bloq.</span>
              <span className="mono" style={{ fontSize: 12, textAlign: 'right' }}>{fmtMoney(r.importe)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Heatmap: persona × fase</h3></div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 4 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 6, fontSize: 11, color: 'var(--muted)' }}>Persona</th>
                {estatusList.map(e => <th key={e} style={{ padding: 6, fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>{statusMap[e]?.short}</th>)}
                <th style={{ padding: 6, fontSize: 11, color: 'var(--muted)' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {grid.map(g => (
                <tr key={g.persona.id}>
                  <td style={{ padding: 6, fontSize: 13, fontWeight: 600 }}>{g.persona.nombre}</td>
                  {g.cells.map((n,i) => (
                    <td key={i} style={{ textAlign: 'center', padding: '14px 6px', background: heatColor(n, maxCell), borderRadius: 6, color: n / maxCell > 0.5 ? '#fff' : 'var(--text)', fontWeight: 700, fontFamily: 'IBM Plex Mono', fontSize: 13 }}>
                      {n || '·'}
                    </td>
                  ))}
                  <td style={{ textAlign: 'center', padding: 6, fontFamily: 'IBM Plex Mono', fontWeight: 700, color: 'var(--muted)' }}>{g.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Productividad por región</h3></div>
        <table className="tbl">
          <thead><tr><th>Región</th><th>Proyectos</th><th>En tiempo</th><th>Atrasados</th><th>Importe</th><th>Score</th></tr></thead>
          <tbody>
            {regRows.map(r => (
              <tr key={r.region}>
                <td><strong>{r.region}</strong></td>
                <td className="mono">{r.proys}</td>
                <td className="mono" style={{ color:'var(--green-600)' }}>{r.enTiempo}</td>
                <td className="mono" style={{ color:'var(--red-600)' }}>{r.atrasados}</td>
                <td className="mono">{fmtMoney(r.importe)}</td>
                <td><div style={{ width: 100, height: 6, background:'var(--bg)', borderRadius: 3 }}><div style={{ height:'100%', width: r.score+'%', background: r.score > 70 ? 'var(--green-600)' : r.score > 40 ? 'var(--orange-500)' : 'var(--red-600)', borderRadius: 3 }}/></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

Object.assign(window, { MiDiaPage, ForecastPage, RentabilidadPage, HeatmapPage });
