// Projects list view with filters

function ProjectsList({ data, openProject, initialFilter }) {
  const { proyectos } = data;
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState(initialFilter?.estatus || 'todos');
  const [tipoFilter, setTipoFilter] = React.useState('todos');
  const [showAtorados, setShowAtorados] = React.useState(initialFilter?.atorados || false);
  const [showActive, setShowActive] = React.useState(true);
  const [sortKey, setSortKey] = React.useState('edad');

  const filtered = React.useMemo(() => {
    let list = proyectos.slice();
    if (showActive) list = list.filter(p => p.activo);
    if (statusFilter !== 'todos') list = list.filter(p => p.estatus === statusFilter);
    if (tipoFilter !== 'todos') list = list.filter(p => p.tipo === tipoFilter);
    if (showAtorados) list = list.filter(p => p.semanas_en_fase >= 4);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => (p.sucursal + ' ' + p.proyecto + ' ' + p.cr + ' ' + p.descripcion).toLowerCase().includes(q));
    }
    list.sort((a,b) => {
      if (sortKey === 'edad') return b.semanas_en_pipeline - a.semanas_en_pipeline;
      if (sortKey === 'fase') return b.semanas_en_fase - a.semanas_en_fase;
      if (sortKey === 'importe') return b.importe_contratado - a.importe_contratado;
      if (sortKey === 'fecha') return new Date(a.fecha_meta || '2099') - new Date(b.fecha_meta || '2099');
      return 0;
    });
    return list;
  }, [proyectos, search, statusFilter, tipoFilter, showAtorados, showActive, sortKey]);

  const counts = STATUS_ORDER.map(s => ({ s, n: proyectos.filter(p => p.estatus === s && (showActive ? p.activo : true)).length }));

  return (
    <div className="stack-md">
      {/* Filter bar */}
      <div className="card" style={{ padding: 14 }}>
        <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
          <div className="search" style={{ minWidth: 320 }}>
            <Icon name="search" size={14} />
            <input placeholder="Buscar por sucursal, CR, proyecto…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="chips" style={{ marginLeft: 'auto' }}>
            <div className={'chip ' + (statusFilter === 'todos' ? 'active' : '')} onClick={() => setStatusFilter('todos')}>Todos <span className="ct">{proyectos.filter(p => showActive ? p.activo : true).length}</span></div>
            {counts.map(c => (
              <div key={c.s} className={'chip ' + (statusFilter === c.s ? 'active' : '')} onClick={() => setStatusFilter(c.s)}>
                {statusMap[c.s].short} <span className="ct">{c.n}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="row" style={{ gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
          <div className="chips">
            <div className={'chip ' + (tipoFilter === 'todos' ? 'active' : '')} onClick={() => setTipoFilter('todos')}>Todos los tipos</div>
            <div className={'chip ' + (tipoFilter === 'Obra Menor' ? 'active' : '')} onClick={() => setTipoFilter('Obra Menor')}>Obra Menor</div>
            <div className={'chip ' + (tipoFilter === 'Servicing' ? 'active' : '')} onClick={() => setTipoFilter('Servicing')}>Servicing</div>
          </div>
          <div className="chips">
            <div className={'chip ' + (showAtorados ? 'active' : '')} onClick={() => setShowAtorados(!showAtorados)}>
              ⚠ Sólo atorados (≥4 sem)
            </div>
            <div className={'chip ' + (!showActive ? 'active' : '')} onClick={() => setShowActive(!showActive)}>
              Incluir cerrados
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
            <span className="muted" style={{ fontSize: 12 }}>Ordenar:</span>
            <select value={sortKey} onChange={e => setSortKey(e.target.value)} style={{ border:'1px solid var(--line-strong)', borderRadius:6, padding:'5px 10px', fontSize:12, background:'var(--card)' }}>
              <option value="edad">Edad pipeline ↓</option>
              <option value="fase">Semanas en fase ↓</option>
              <option value="importe">Importe ↓</option>
              <option value="fecha">Fecha meta ↑</option>
            </select>
          </div>
        </div>
      </div>

      <div className="row between" style={{ padding: '0 4px' }}>
        <div className="muted" style={{ fontSize: 12 }}>
          Mostrando <span className="cell-strong" style={{ color: 'var(--text)' }}>{filtered.length}</span> de {proyectos.length} proyectos
          {' · '}importe filtrado: <span className="mono" style={{ color: 'var(--text)' }}>{fmtMoney(filtered.reduce((s,p)=>s+p.importe_contratado,0))}</span>
        </div>
        <button className="btn btn-sm btn-ghost"><Icon name="download" size={14}/> Exportar</button>
      </div>

      {/* Table */}
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 240 }}>Sucursal · CR</th>
              <th style={{ width: 130 }}>Tipo / Asig.</th>
              <th>Proyecto</th>
              <th style={{ width: 130 }}>Estatus</th>
              <th style={{ width: 130 }}>Entregable</th>
              <th style={{ width: 100 }}>Asignados</th>
              <th style={{ width: 80 }}>Edad</th>
              <th style={{ width: 80 }}>En fase</th>
              <th style={{ width: 100 }} className="num">Importe</th>
              <th style={{ width: 96 }}>Fecha meta</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const atorado = p.semanas_en_fase >= 4;
              return (
                <tr key={p.id} onClick={() => openProject(p.id)}>
                  <td>
                    <div className="cell-strong">{p.sucursal}</div>
                    <div className="cell-id">CR {p.cr}</div>
                  </td>
                  <td>
                    <TipoTag tipo={p.tipo}/>
                    <div className="cell-sub">{p.asignacion}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{p.proyecto}</div>
                    <div className="cell-sub" style={{ maxWidth: 320, whiteSpace: 'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.descripcion}</div>
                  </td>
                  <td><StatusBadge value={p.estatus}/></td>
                  <td><DeliveryDot value={p.entregable}/></td>
                  <td>
                    <div className="av-row">
                      <Avatar name={p.persona_servmac} size={22} />
                      <Avatar name={p.persona_cliente} size={22} />
                    </div>
                  </td>
                  <td className="mono num" style={{ fontSize: 12.5 }}>{p.semanas_en_pipeline} sem</td>
                  <td className="mono num" style={{ fontSize: 12.5, color: atorado ? 'var(--red-600)' : 'var(--text)', fontWeight: atorado ? 700 : 400 }}>
                    {atorado && '● '}{p.semanas_en_fase} sem
                  </td>
                  <td className="mono num">{fmtMoney(p.importe_contratado)}</td>
                  <td className="mono">{fmtDate(p.fecha_meta)}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan="10"><div className="empty">No hay proyectos que coincidan con los filtros</div></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

Object.assign(window, { ProjectsList });
