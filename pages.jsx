// Global Hitos, Comunicaciones, Financiero pages

function HitosPage({ data, openProject }) {
  const { hitos, proyectos } = data;
  const [filter, setFilter] = React.useState('atrasados');
  const projMap = Object.fromEntries(proyectos.map(p => [p.id, p]));
  const list = hitos.filter(h => filter === 'todos' || h.estatus === filter)
                    .sort((a,b) => new Date(a.fecha_programada) - new Date(b.fecha_programada));

  const counts = {
    atrasados: hitos.filter(h => h.estatus === 'atrasado').length,
    pendientes: hitos.filter(h => h.estatus === 'pendiente').length,
    cumplido: hitos.filter(h => h.estatus === 'cumplido').length,
  };

  return (
    <div className="stack-md">
      <div className="kpi-grid" style={{ gridTemplateColumns:'repeat(3, 1fr)' }}>
        <KPI featured="featured-orange" label="Atrasados" value={counts.atrasados} delta="hitos vencidos sin cumplir" deltaDir="flat"/>
        <KPI label="Pendientes" value={counts.pendientes} delta="próximos por cumplir" deltaDir="flat"/>
        <KPI label="Cumplidos" value={counts.cumplido} delta="ytd 2026" deltaDir="up"/>
      </div>

      <div className="row" style={{ gap: 10 }}>
        <div className="chips">
          {[['atrasados','atrasado'],['pendientes','pendiente'],['cumplido','cumplido'],['todos','todos']].map(([l,k]) => (
            <div key={k} className={'chip ' + (filter === k ? 'active' : '')} onClick={() => setFilter(k)}>
              {l[0].toUpperCase()+l.slice(1)} {k !== 'todos' && <span className="ct">{hitos.filter(h => h.estatus === k).length}</span>}
            </div>
          ))}
        </div>
        <div className="muted" style={{ marginLeft: 'auto', fontSize: 12 }}>{list.length} hitos</div>
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 70 }}></th>
              <th style={{ width: 160 }}>Tipo</th>
              <th>Proyecto</th>
              <th style={{ width: 140 }}>Responsable</th>
              <th style={{ width: 120 }}>Programada</th>
              <th style={{ width: 120 }}>Real</th>
              <th style={{ width: 80 }}>Estatus</th>
            </tr>
          </thead>
          <tbody>
            {list.map(h => {
              const p = projMap[h.id_proyecto];
              const color = h.estatus === 'cumplido' ? 'var(--green-600)' : h.estatus === 'atrasado' ? 'var(--red-600)' : 'var(--muted)';
              const bg = h.estatus === 'cumplido' ? 'var(--green-100)' : h.estatus === 'atrasado' ? 'var(--red-100)' : 'var(--bg)';
              const icon = h.estatus === 'cumplido' ? '✓' : h.estatus === 'atrasado' ? '⚠' : '○';
              return (
                <tr key={h.id} onClick={() => openProject(h.id_proyecto)}>
                  <td><div style={{ width: 30, height: 30, borderRadius:'50%', background: bg, color, display:'grid', placeItems:'center', fontWeight:700 }}>{icon}</div></td>
                  <td className="cell-strong">{h.tipo}</td>
                  <td>
                    <div className="cell-strong">{p?.sucursal}</div>
                    <div className="cell-sub">{p?.proyecto} · CR {p?.cr}</div>
                  </td>
                  <td><span className="row" style={{ gap: 6 }}><Avatar name={h.responsable} size={22}/>{h.responsable}</span></td>
                  <td className="mono">{fmtDate(h.fecha_programada)}</td>
                  <td className="mono">{fmtDate(h.fecha_real)}</td>
                  <td><span style={{ color, fontWeight: 600, fontSize: 12 }}>{h.estatus}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ComunicacionesPage({ data, openProject }) {
  const { comunicaciones, proyectos } = data;
  const [filter, setFilter] = React.useState('todos');
  const projMap = Object.fromEntries(proyectos.map(p => [p.id, p]));
  const tipos = ['todos', 'correo cliente', 'correo SERVMAC', 'WhatsApp', 'junta'];
  const list = comunicaciones.filter(c => filter === 'todos' || c.tipo === filter);

  const tipoStyle = {
    'correo cliente':  { bg: 'var(--blue-50)',   color: 'var(--blue-700)' },
    'correo SERVMAC':  { bg: 'var(--orange-50)', color: 'var(--orange-700)' },
    'WhatsApp':        { bg: 'var(--green-100)', color: 'var(--green-600)' },
    'junta':           { bg: 'var(--violet-100)', color: 'var(--violet-600)' },
  };

  return (
    <div className="stack-md">
      <div className="kpi-grid">
        {tipos.slice(1).map(t => {
          const n = comunicaciones.filter(c => c.tipo === t).length;
          return <KPI key={t} label={t} value={n} delta="últimos 90 días" deltaDir="flat"/>;
        })}
      </div>

      <div className="row">
        <div className="chips">
          {tipos.map(t => (
            <div key={t} className={'chip ' + (filter === t ? 'active' : '')} onClick={() => setFilter(t)}>{t}</div>
          ))}
        </div>
        <div className="muted" style={{ marginLeft: 'auto', fontSize: 12 }}>{list.length} eventos</div>
      </div>

      <div className="tbl-wrap">
        {list.slice(0, 150).map(c => {
          const p = projMap[c.id_proyecto];
          const t = tipoStyle[c.tipo] || {};
          return (
            <div key={c.id} onClick={() => openProject(c.id_proyecto)} className="com-row" style={{ cursor: 'pointer' }}>
              <div className="mono" style={{ fontSize: 12 }}>{fmtDate(c.fecha)}</div>
              <div className="tag" style={{ background: t.bg, color: t.color, borderColor: 'transparent' }}>{c.tipo}</div>
              <div>
                <div className="cell-strong">{c.resumen}</div>
                <div className="cell-sub">{c.origen} → {c.destino} · {p?.sucursal} ({p?.proyecto})</div>
              </div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'right' }}>CR {p?.cr}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FinancieroPage({ data, openProject }) {
  const { financiero, proyectos } = data;
  const projMap = Object.fromEntries(proyectos.map(p => [p.id, p]));

  const totalPres = financiero.reduce((s,f) => s + f.presupuestado, 0);
  const totalCobr = financiero.reduce((s,f) => s + f.cobrado_cliente, 0);
  const totalPag = financiero.reduce((s,f) => s + f.pagado_proveedor, 0);
  const pendCobro = totalPres - totalCobr;
  const margenAcumulado = totalCobr - totalPag;

  // Importe atorado por estatus financiero
  const porStatus = {};
  financiero.forEach(f => {
    porStatus[f.estatus_financiero] = (porStatus[f.estatus_financiero] || 0) + f.presupuestado;
  });

  return (
    <div className="stack-md">
      <div className="kpi-grid">
        <KPI featured="featured" label="Cartera total" value={fmtMoney(totalPres)} delta={`${financiero.length} proyectos`} deltaDir="flat"/>
        <KPI label="Cobrado cliente" value={fmtMoney(totalCobr)} delta={Math.round(totalCobr/totalPres*100)+'% del total'} deltaDir="up"/>
        <KPI featured="featured-orange" label="Pendiente de cobro" value={fmtMoney(pendCobro)} delta="capital aún no facturado/cobrado" deltaDir="flat"/>
        <KPI label="Margen acumulado" value={fmtMoney(margenAcumulado)} delta="cobrado − pagado a proveedor" deltaDir="up"/>
      </div>

      <div className="dash-grid">
        <div className="card">
          <div className="card-head"><h3>Distribución por estatus financiero</h3></div>
          {Object.entries(porStatus).map(([k, v]) => {
            const color = k === 'Cerrado' ? '#15803D' : k === 'En cobro' ? '#F26B1F' : k === 'Parcial' ? '#2563EB' : '#94A3B8';
            return (
              <div key={k} style={{ display:'grid', gridTemplateColumns:'120px 1fr 100px', gap: 12, alignItems:'center', marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{k}</div>
                <div style={{ background:'var(--bg)', borderRadius:4, height: 22, overflow:'hidden' }}>
                  <div style={{ background: color, height:'100%', width: (v/totalPres*100)+'%' }}/>
                </div>
                <div className="mono num" style={{ fontSize: 12 }}>{fmtMoney(v)}</div>
              </div>
            );
          })}
        </div>
        <div className="card">
          <div className="card-head"><h3>Top 5 proyectos por importe</h3></div>
          <div className="stack-sm">
            {financiero.slice().sort((a,b) => b.presupuestado - a.presupuestado).slice(0, 5).map(f => {
              const p = projMap[f.id_proyecto];
              return (
                <div key={f.id} onClick={() => openProject(f.id_proyecto)} style={{ display:'grid', gridTemplateColumns:'1fr 100px 100px', gap: 12, alignItems:'center', padding:'10px 12px', background:'var(--bg)', borderRadius:8, cursor:'pointer' }}>
                  <div>
                    <div className="cell-strong">{p?.sucursal}</div>
                    <div className="cell-sub">{p?.proyecto}</div>
                  </div>
                  <StatusBadge value={p?.estatus}/>
                  <div className="mono num cell-strong">{fmtMoney(f.presupuestado)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Proyecto</th>
              <th style={{ width: 100 }}>Estatus</th>
              <th className="num" style={{ width: 110 }}>Presupuesto</th>
              <th className="num" style={{ width: 110 }}>Conciliado</th>
              <th className="num" style={{ width: 110 }}>Cobrado cliente</th>
              <th className="num" style={{ width: 110 }}>Pagado proveedor</th>
              <th style={{ width: 110 }}>Estatus fin.</th>
            </tr>
          </thead>
          <tbody>
            {financiero.sort((a,b) => b.presupuestado - a.presupuestado).map(f => {
              const p = projMap[f.id_proyecto];
              const statusColor = {
                'Pendiente': 'var(--muted)',
                'Parcial': 'var(--blue-600)',
                'En cobro': 'var(--orange-600)',
                'Cerrado': 'var(--green-600)',
              };
              return (
                <tr key={f.id} onClick={() => openProject(f.id_proyecto)}>
                  <td>
                    <div className="cell-strong">{p?.sucursal}</div>
                    <div className="cell-sub">{p?.proyecto} · CR {p?.cr}</div>
                  </td>
                  <td><StatusBadge value={p?.estatus}/></td>
                  <td className="num mono">{fmtMoney(f.presupuestado)}</td>
                  <td className="num mono">{fmtMoney(f.conciliado)}</td>
                  <td className="num mono">{fmtMoney(f.cobrado_cliente)}</td>
                  <td className="num mono">{fmtMoney(f.pagado_proveedor)}</td>
                  <td><span style={{ color: statusColor[f.estatus_financiero], fontWeight: 600, fontSize: 12 }}>● {f.estatus_financiero}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

Object.assign(window, { HitosPage, ComunicacionesPage, FinancieroPage });
