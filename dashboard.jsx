// Dashboard view — KPIs and charts

function Dashboard({ data, navigate, openProject }) {
  const { proyectos, snapshots, hitos, financiero, weeks, today } = data;

  // ---- Derived KPIs ----
  const activos = proyectos.filter(p => p.activo);
  const finiquitados = proyectos.filter(p => !p.activo);
  const totalImporteActivo = activos.reduce((s, p) => s + p.importe_contratado, 0);

  const atorados = activos.filter(p => p.semanas_en_fase >= 4);
  const importeAtorado = atorados.reduce((s, p) => s + p.importe_contratado, 0);

  const enTiempo = activos.filter(p => p.entregable === 'En tiempo' || p.entregable === 'Entregado ET').length;
  const pctEnTiempo = activos.length ? Math.round(enTiempo / activos.length * 100) : 0;

  const cierresPorSemana = [];
  weeks.forEach((wk, i) => {
    const snapsThisWeek = snapshots.filter(s => s.semana === wk);
    // count transitions: how many projects moved to a "later" status from previous week
    let advances = 0;
    const prevWk = i > 0 ? weeks[i-1] : null;
    if (prevWk) {
      const prevMap = {};
      snapshots.filter(s => s.semana === prevWk).forEach(s => prevMap[s.id_proyecto] = s.estatus);
      snapsThisWeek.forEach(s => {
        const a = prevMap[s.id_proyecto];
        if (a && a !== s.estatus) {
          const ai = STATUS_ORDER.indexOf(a), bi = STATUS_ORDER.indexOf(s.estatus);
          if (bi > ai) advances++;
        }
      });
    }
    cierresPorSemana.push(advances);
  });
  const velPort = cierresPorSemana.slice(-1)[0];
  const velPortPrev = cierresPorSemana.slice(-2, -1)[0] || 0;
  const velDelta = velPort - velPortPrev;

  const edadProm = Math.round(activos.reduce((s, p) => s + p.semanas_en_pipeline, 0) / (activos.length || 1));

  // Funnel by status
  const funnel = STATUS_ORDER.map(st => {
    const items = proyectos.filter(p => p.estatus === st);
    const imp = items.reduce((s,p) => s + p.importe_contratado, 0);
    return { estatus: st, count: items.length, importe: imp };
  });
  const funnelMax = Math.max(...funnel.map(f => f.count), 1);

  // Age distribution (semanas en pipeline buckets)
  const ageBuckets = [
    { lbl: '0–4', min: 0, max: 4 },
    { lbl: '5–8', min: 5, max: 8 },
    { lbl: '9–12', min: 9, max: 12 },
    { lbl: '13–16', min: 13, max: 16 },
    { lbl: '17+', min: 17, max: 999 },
  ];
  ageBuckets.forEach(b => b.count = activos.filter(p => p.semanas_en_pipeline >= b.min && p.semanas_en_pipeline <= b.max).length);
  const ageMax = Math.max(...ageBuckets.map(b => b.count), 1);

  // Concentración de retraso por persona SERVMAC
  const personas = [...new Set(activos.map(p => p.persona_servmac))];
  const concentr = personas.map(name => {
    const total = activos.filter(p => p.persona_servmac === name).length;
    const atrasos = activos.filter(p => p.persona_servmac === name && (p.entregable === 'Fuera de tiempo' || p.semanas_en_fase >= 4 || p.entregable === 'Emproblemada 3eros')).length;
    return { name, total, atrasos, pct: total ? atrasos / total : 0 };
  }).sort((a,b) => b.atrasos - a.atrasos);

  // Cohort: agrupar por semana de asignación, ver cuántas semanas para finiquitar (o "in flight")
  const cohorts = {};
  proyectos.forEach(p => {
    const wk = p.fecha_asignacion?.slice(0,7); // YYYY-MM
    if (!wk) return;
    cohorts[wk] = cohorts[wk] || { total: 0, finiquitados: 0, en_cierre: 0, en_obra: 0, gestion: 0, importe: 0 };
    cohorts[wk].total++;
    cohorts[wk].importe += p.importe_contratado;
    const sn = parseInt(p.estatus.split('.')[0]);
    if (sn >= 10) cohorts[wk].finiquitados++;
    else if (sn >= 7) cohorts[wk].en_cierre++;
    else if (sn >= 6) cohorts[wk].en_obra++;
    else cohorts[wk].gestion++;
  });
  const cohortKeys = Object.keys(cohorts).sort();

  // Hitos vencidos
  const hitosAtrasados = hitos.filter(h => h.estatus === 'atrasado').length;

  // Cumplimiento de fechas (hitos cumplidos en tiempo vs tarde)
  const hCumplidos = hitos.filter(h => h.estatus === 'cumplido');
  const hEnTiempo = hCumplidos.filter(h => h.fecha_real && h.fecha_real <= h.fecha_programada).length;
  const pctCumpl = hCumplidos.length ? Math.round(hEnTiempo / hCumplidos.length * 100) : 0;

  return (
    <div className="stack-md">
      {/* Top: Big KPI cards */}
      <div className="kpi-grid">
        <KPI
          featured="featured"
          label="Importe activo en cartera"
          value={fmtMoney(totalImporteActivo)}
          delta={`${activos.length} proyectos activos`}
          deltaDir="flat"
          spark={cierresPorSemana.map(v => v + 1)}
          sparkColor="#F26B1F"
        />
        <KPI
          label="Velocidad portafolio"
          value={velPort}
          unit="proy/sem"
          delta={velDelta >= 0 ? `+${velDelta} vs semana ant.` : `${velDelta} vs semana ant.`}
          deltaDir={velDelta > 0 ? 'up' : velDelta < 0 ? 'down' : 'flat'}
          spark={cierresPorSemana}
          sparkColor="#2563EB"
        />
        <KPI
          featured="featured-orange"
          label="Importe atorado"
          value={fmtMoney(importeAtorado)}
          delta={`${atorados.length} proyectos ≥ 4 sem sin movimiento`}
          deltaDir="flat"
        />
        <KPI
          label="Cumplimiento fechas meta"
          value={pctCumpl}
          unit="%"
          delta={`${hCumplidos.length} hitos · ${hitosAtrasados} atrasados`}
          deltaDir={pctCumpl >= 70 ? 'up' : 'down'}
        />
      </div>

      <div className="kpi-grid">
        <KPI label="Edad promedio activos" value={edadProm} unit="sem" delta="desde asignación" deltaDir="flat" />
        <KPI label="Proyectos en tiempo" value={pctEnTiempo} unit="%" delta={`${enTiempo} de ${activos.length} activos`} deltaDir={pctEnTiempo >= 60 ? 'up' : 'down'} />
        <KPI label="Hitos atrasados" value={hitosAtrasados} delta="que requieren acción" deltaDir={hitosAtrasados > 5 ? 'down' : 'flat'} />
        <KPI label="Finiquitados YTD" value={finiquitados.length} delta="proyectos cerrados 2026" deltaDir="up" />
      </div>

      {window.SugerenciasCard && <SugerenciasCard openProject={openProject} navigate={navigate}/>}

      {/* Funnel + Velocidad */}
      <div className="dash-grid">
        <div className="card">
          <div className="card-head">
            <h3>Embudo por fase</h3>
            <span className="sub">· {proyectos.length} proyectos total</span>
            <div className="right">
              <span className="muted" style={{ fontSize: 12 }}>Importe en cada fase</span>
            </div>
          </div>
          <div>
            {funnel.map((f, i) => {
              const colors = ['#6D28D9','#2563EB','#F26B1F','#C58200','#15803D'];
              const w = (f.count / funnelMax * 100).toFixed(0);
              const s = statusMap[f.estatus];
              return (
                <div key={i} className="funnel-row">
                  <div className="cell-strong" style={{ fontSize: 13 }}>{s?.short || f.estatus}</div>
                  <div className="funnel-bar">
                    <div className="fill" style={{ width: w + '%', background: colors[i] }} />
                    <div className={"lbl " + (w < 20 ? 'dark' : '')} style={{ left: w < 20 ? (w + 1) + '%' : 10 }}>
                      {f.count} {f.count === 1 ? 'proyecto' : 'proyectos'}
                    </div>
                  </div>
                  <div className="mono num" style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtMoney(f.importe)}</div>
                  <div className="mono num" style={{ fontSize: 12, color: 'var(--muted)' }}>{Math.round(f.count/proyectos.length*100)}%</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Velocidad del portafolio</h3>
            <span className="sub">· avances de fase por semana</span>
          </div>
          <BarChart values={cierresPorSemana} labels={weeks.map(w => w.replace(/\s+\d{4}$/,''))} color="#2563EB" />
          <div className="row between" style={{ marginTop: 14, fontSize: 12, color: 'var(--muted)' }}>
            <div><span className="cell-strong" style={{ fontSize: 18 }}>{cierresPorSemana.reduce((a,b)=>a+b,0)}</span> avances acumulados en 15 sem</div>
            <div>último corte: <span className="cell-strong">{weeks.slice(-1)[0]}</span></div>
          </div>
        </div>
      </div>

      {/* Age + Concentración */}
      <div className="dash-grid">
        <div className="card">
          <div className="card-head">
            <h3>Distribución de edad</h3>
            <span className="sub">· semanas en pipeline (activos)</span>
          </div>
          <BarChart values={ageBuckets.map(b => b.count)} labels={ageBuckets.map(b => b.lbl + ' sem')} color="#F26B1F" horizontal={false} />
          <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>
            <span style={{ color: 'var(--red-600)', fontWeight: 700 }}>● {ageBuckets.slice(3).reduce((s,b)=>s+b.count,0)}</span>{' '}
            proyectos con más de 12 semanas — candidatos a revisión ejecutiva.
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Concentración de retraso</h3>
            <span className="sub">· por persona SERVMAC</span>
          </div>
          <div className="stack-sm">
            {concentr.map(p => (
              <div key={p.name} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 60px', gap: 12, alignItems: 'center' }}>
                <div className="row" style={{ gap: 8 }}>
                  <Avatar name={p.name} size={22} />
                  <span style={{ fontSize: 12.5, fontWeight: 500 }}>{p.name}</span>
                </div>
                <div style={{ background: 'var(--bg)', height: 18, borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: ((p.atrasos/Math.max(1,p.total))*100)+'%', background: 'linear-gradient(90deg,#F26B1F,#C04A0A)' }} />
                  <div style={{ position: 'absolute', inset: 0, padding: '0 8px', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                    {p.atrasos > 0 && `${p.atrasos} con retraso`}
                  </div>
                </div>
                <div className="mono num" style={{ fontSize: 12, color: 'var(--muted)' }}>{p.atrasos}/{p.total}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cohort + Atorados list */}
      <div className="dash-grid">
        <div className="card">
          <div className="card-head">
            <h3>Cohort por mes de asignación</h3>
            <span className="sub">· estado actual del grupo</span>
          </div>
          <table className="cohort-tbl" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr>
                <th className="first">Cohorte</th>
                <th>Total</th>
                <th>Gestión</th>
                <th>En obra</th>
                <th>Cierre</th>
                <th>Finiquitado</th>
                <th>Importe</th>
              </tr>
            </thead>
            <tbody>
              {cohortKeys.map(k => {
                const c = cohorts[k];
                const pctF = c.total ? c.finiquitados / c.total : 0;
                const cell = (v, color) => (
                  <td className="cohort-cell" style={{ background: v ? color : 'transparent', color: v ? '#fff' : 'var(--muted-2)', fontWeight: v ? 700 : 400 }}>{v || '–'}</td>
                );
                return (
                  <tr key={k}>
                    <td className="first mono">{k}</td>
                    <td className="cell-strong">{c.total}</td>
                    {cell(c.gestion, '#6D28D9')}
                    {cell(c.en_obra, '#2563EB')}
                    {cell(c.en_cierre, '#F26B1F')}
                    {cell(c.finiquitados, '#15803D')}
                    <td className="mono">{fmtMoney(c.importe)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Proyectos atorados</h3>
            <span className="sub">· ≥ 4 semanas en la misma fase</span>
            <div className="right">
              <button className="btn btn-sm btn-ghost" onClick={() => navigate('proyectos')}>Ver todos →</button>
            </div>
          </div>
          <div className="stack-sm" style={{ maxHeight: 280, overflowY: 'auto' }}>
            {atorados.sort((a,b)=>b.semanas_en_fase-a.semanas_en_fase).slice(0, 6).map(p => (
              <div key={p.id} onClick={() => openProject(p.id)} style={{ display:'grid', gridTemplateColumns:'1fr 90px 70px', gap:12, alignItems:'center', padding:'10px 12px', background:'var(--bg)', borderRadius: 8, cursor:'pointer' }}>
                <div className="stack-xs" style={{ gap: 2 }}>
                  <div className="cell-strong" style={{ fontSize: 13 }}>{p.sucursal}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{p.proyecto} · CR {p.cr}</div>
                </div>
                <StatusBadge value={p.estatus} />
                <div className="mono num" style={{ fontSize: 12, color: 'var(--red-600)', fontWeight: 700 }}>{p.semanas_en_fase} sem</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ProveedoresSection data={data} openProject={openProject}/>
    </div>
  );
}

function ProveedoresSection({ data, openProject }) {
  const E = window.SERVMAC_EXTRAS;
  if (!E?.proveedores?.length) return null;

  const rows = E.proveedores.map(p => {
    const subs = E.proyecto_proveedores.filter(s => s.id_proveedor === p.id);
    const importe = subs.reduce((s, x) => s + (x.importe || 0), 0);
    const pagado = subs.reduce((s, x) => s + (x.importe_pagado || 0), 0);
    const proys = new Set(subs.map(s => s.id_proyecto)).size;
    const personal = (p.equipos || []).reduce((s, e) => s + (e.integrantes || 0), 0);
    return { ...p, importe, pagado, proys, personal };
  });
  const totalAsig = rows.reduce((s, r) => s + r.importe, 0) || 1;
  const totalPag  = rows.reduce((s, r) => s + r.pagado, 0);
  const totalPers = rows.reduce((s, r) => s + r.personal, 0);

  // Distribución por especialidad
  const byEsp = {};
  rows.forEach(r => { byEsp[r.especialidad] = (byEsp[r.especialidad] || 0) + r.importe; });
  const espList = Object.entries(byEsp).sort((a,b) => b[1] - a[1]);

  // Top 5 proveedores por monto
  const top = [...rows].sort((a,b) => b.importe - a.importe).slice(0, 5);
  const maxImp = top[0]?.importe || 1;

  // Facturas vencidas
  const facturasVenc = (E.facturas || []).filter(f => f.estatus_pago === 'vencida');
  const montoVenc = facturasVenc.reduce((s, f) => s + (f.total || 0), 0);

  const espColors = ['#1E40AF','#F26B1F','#7C3AED','#15803D','#DC2626','#0EA5E9','#C58200','#0F766E'];

  return (
    <div className="stack-md" style={{ marginTop: 8 }}>
      <div className="row" style={{ alignItems: 'center', gap: 10, marginBottom: -8 }}>
        <div style={{ width: 4, height: 22, background: 'var(--orange-500)', borderRadius: 2 }}/>
        <h2 style={{ margin: 0, fontSize: 17, letterSpacing: '-0.01em' }}>Proveedores</h2>
        <span className="muted" style={{ fontSize: 12.5 }}>· vista financiera y operativa</span>
      </div>

      <div className="kpi-grid">
        <KPI label="Proveedores activos" value={rows.length} delta={totalPers + ' personas en campo'} deltaDir="flat"/>
        <KPI featured="featured" label="Subcontratado total" value={fmtMoney(totalAsig)} delta={Math.round(totalPag/totalAsig*100) + '% pagado'} deltaDir="up"/>
        <KPI label="Por pagar a terceros" value={fmtMoney(totalAsig - totalPag)} delta={(totalAsig - totalPag > 0 ? 'pendiente liberación' : 'al corriente')} deltaDir="flat"/>
        <KPI featured={facturasVenc.length ? 'featured-orange' : ''} label="Facturas vencidas" value={facturasVenc.length} delta={fmtMoney(montoVenc)} deltaDir={facturasVenc.length ? 'down' : 'flat'}/>
      </div>

      <div className="dash-grid">
        <div className="card">
          <div className="card-head">
            <h3>Top proveedores por importe</h3>
            <span className="sub">· {rows.length} proveedores totales</span>
          </div>
          <div className="stack-sm">
            {top.map((r, i) => (
              <div key={r.id} style={{ display:'grid', gridTemplateColumns:'24px 1fr 200px 110px', gap: 10, alignItems:'center' }}>
                <div className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>#{i+1}</div>
                <div>
                  <div className="cell-strong" style={{ fontSize: 13 }}>{r.nombre}</div>
                  <div className="cell-id">{r.especialidad} · {r.proys} proyectos · {r.personal} personas</div>
                </div>
                <div style={{ height: 10, background: 'var(--bg)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: (r.importe/maxImp*100)+'%', background: 'linear-gradient(90deg, var(--blue-700), var(--orange-500))', borderRadius: 4 }}/>
                </div>
                <div className="mono num" style={{ fontSize: 13, textAlign:'right' }}>
                  <strong>{fmtMoney(r.importe)}</strong>
                  <div className="cell-id">{Math.round(r.pagado/Math.max(1,r.importe)*100)}% pagado</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Distribución por especialidad</h3>
          </div>
          <ProveedorDonut entries={espList} colors={espColors}/>
          <div className="stack-sm" style={{ marginTop: 12 }}>
            {espList.map(([esp, monto], i) => (
              <div key={esp} className="row" style={{ gap: 8, fontSize: 12 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: espColors[i % espColors.length] }}/>
                <span style={{ flex: 1 }}>{esp}</span>
                <span className="mono num">{fmtMoney(monto)}</span>
                <span className="muted mono" style={{ width: 40, textAlign: 'right' }}>{Math.round(monto/totalAsig*100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Carga financiera por proveedor</h3>
          <span className="sub">· contratado vs pagado</span>
          <div className="right">
            <button className="btn btn-sm btn-ghost" onClick={() => window.SERVMAC_TOAST?.('Abre la sección Proveedores en el sidebar')}>Ver todos →</button>
          </div>
        </div>
        <table className="tbl">
          <thead><tr><th>Proveedor</th><th>Especialidad</th><th>Proyectos</th><th>Personal</th><th className="num">Contratado</th><th className="num">Pagado</th><th>% pago</th></tr></thead>
          <tbody>
            {rows.sort((a,b) => b.importe - a.importe).map(r => (
              <tr key={r.id}>
                <td><span className="cell-strong">{r.nombre}</span><div className="cell-id">⭐ {r.rating}</div></td>
                <td>{r.especialidad}</td>
                <td className="mono">{r.proys}</td>
                <td className="mono">{r.personal}</td>
                <td className="num mono"><strong>{fmtMoney(r.importe)}</strong></td>
                <td className="num mono">{fmtMoney(r.pagado)}</td>
                <td>
                  <div style={{ width: 80, height: 6, background:'var(--bg)', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: (r.pagado/Math.max(1,r.importe)*100)+'%', background: 'var(--green-500, #22c55e)', borderRadius: 3 }}/>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProveedorDonut({ entries, colors }) {
  const total = entries.reduce((s, [_, v]) => s + v, 0) || 1;
  const r = 56, cx = 80, cy = 80, sw = 22;
  let acc = 0;
  const C = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 160 160" style={{ width: 160, height: 160, display: 'block', margin: '0 auto' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#eef1f6" strokeWidth={sw}/>
      {entries.map(([esp, v], i) => {
        const frac = v / total;
        const len = C * frac;
        const dash = `${len} ${C - len}`;
        const offset = -acc * C;
        acc += frac;
        return (
          <circle key={esp} cx={cx} cy={cy} r={r} fill="none"
                  stroke={colors[i % colors.length]} strokeWidth={sw}
                  strokeDasharray={dash} strokeDashoffset={offset}
                  transform={`rotate(-90 ${cx} ${cy})`}/>
        );
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="11" fill="#94a3b8" fontWeight="600">TOTAL</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="15" fontWeight="800">{fmtMoney(total)}</text>
    </svg>
  );
}

function BarChart({ values, labels, color = '#2563EB', horizontal = false }) {
  const max = Math.max(...values, 1);
  const W = 540, H = 140, pad = 24, top = 14;
  const bw = (W - pad * 2) / values.length;
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
      <line x1={pad} y1={H-pad} x2={W-pad/2} y2={H-pad} stroke="#E4E8F0" />
      {values.map((v, i) => {
        const h = ((H - pad - top) * v / max);
        const x = pad + i * bw + bw * 0.18;
        const y = H - pad - h;
        const bw2 = bw * 0.64;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw2} height={h} rx="3" fill={color} opacity={i === values.length - 1 ? 1 : 0.75} />
            <text x={x + bw2/2} y={y - 4} fontSize="10" fontWeight="600" textAnchor="middle" fill="#0F172A">{v}</text>
            <text x={x + bw2/2} y={H-pad+13} fontSize="9.5" textAnchor="middle" fill="#64748B">{labels[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}

Object.assign(window, { Dashboard });
