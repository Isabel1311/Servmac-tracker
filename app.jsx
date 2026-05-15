// Main app — routing + shell

function App() {
  const data = window.SERVMAC_DATA;
  const [, force] = React.useReducer(x => x + 1, 0);
  React.useEffect(() => { window.SERVMAC_RERENDER = force; return () => { delete window.SERVMAC_RERENDER; }; }, []);
  const [view, setView] = React.useState('dashboard');
  const [openId, setOpenId] = React.useState(null);
  const [openProv, setOpenProv] = React.useState(null);
  const [drawerFull, setDrawerFull] = React.useState(false);
  const [provFull, setProvFull] = React.useState(false);
  const [initialFilter, setInitialFilter] = React.useState(null);

  const navigate = (v, filter) => { setView(v); if (filter) setInitialFilter(filter); else setInitialFilter(null); };
  const openProject = (id) => setOpenId(id);
  const close = () => setOpenId(null);

  // KPI badge counts for sidebar
  const atrasados = data.hitos.filter(h => h.estatus === 'atrasado').length;
  const atorados  = data.proyectos.filter(p => p.activo && p.semanas_en_fase >= 4).length;

  const navItems = [
    { k: 'dashboard',     l: 'Panel Directivo', i: 'dashboard' },
    { k: 'mi-dia',        l: 'Mi día',           i: 'person' },
    { k: 'proyectos',     l: 'Proyectos',       i: 'folder',   badge: atorados ? atorados : null },
    { k: 'kanban',        l: 'Kanban',          i: 'dashboard' },
    { k: 'proveedores',   l: 'Proveedores',     i: 'truck' },
    { k: 'cronograma',    l: 'Cronograma',      i: 'clock' },
    { k: 'agenda',        l: 'Agenda',          i: 'calendar' },
    { k: 'inbox',         l: 'Bandeja Add-on',  i: 'inbox',    badge: window.SERVMAC_EXTRAS?.inbox?.filter(x=>x.estatus==='nuevo').length || null },
    { k: 'hitos',         l: 'Hitos',           i: 'flag',     badge: atrasados ? atrasados : null },
    { k: 'comunicaciones',l: 'Comunicaciones',  i: 'mail' },
    { k: 'templates',     l: 'Templates msj',   i: 'mail' },
    { k: 'financiero',    l: 'Financiero',      i: 'money' },
    { k: 'rentabilidad',  l: 'Rentabilidad',    i: 'chart' },
    { k: 'forecast',      l: 'Forecast 4 sem',  i: 'chart' },
    { k: 'heatmap',       l: 'Productividad',   i: 'users' },
    { k: 'plantillas',    l: 'Plantillas',      i: 'folder' },
    { k: 'catalogos',     l: 'Catálogos',       i: 'folder' },
  ];

  const headerByView = {
    dashboard:    { title: 'Panel Directivo', crumb: 'Visión ejecutiva del portafolio · semana ' + data.weeks.slice(-1)[0] },
    proyectos:    { title: 'Proyectos', crumb: data.proyectos.filter(p => p.activo).length + ' activos · ' + data.proyectos.length + ' total' },
    proveedores:  { title: 'Proveedores', crumb: 'Subcontratistas, equipos, costos y pagos' },
    cronograma:   { title: 'Cronograma', crumb: 'Gantt operacional, administrativo y financiero · citas y recordatorios' },
    agenda:       { title: 'Agenda', crumb: 'Calendario de visitas, firmas y entregas · alimentado por el add-on de Gmail' },
    inbox:        { title: 'Bandeja del Add-on Gmail', crumb: 'Mensajes clasificados por Claude · acciones sugeridas por aprobar' },
    hitos:        { title: 'Hitos', crumb: 'Actas, certificaciones, puesta en operación, carpeta y pago' },
    comunicaciones:{ title: 'Comunicaciones', crumb: 'Correos, juntas y WhatsApp clasificados' },
    financiero:   { title: 'Financiero', crumb: 'Presupuestos, conciliados, cobros y pagos' },
    catalogos:    { title: 'Catálogos', crumb: 'Listas maestras editables · personas, proveedores, tipos' },
    'mi-dia':     { title: 'Mi día', crumb: 'Agenda, hitos y pendientes filtrados por ti' },
    kanban:       { title: 'Tablero Kanban', crumb: 'Proyectos por fase · arrastra para mover' },
    forecast:     { title: 'Forecast 4 semanas', crumb: 'Proyección de cierres, visitas y cobros' },
    rentabilidad: { title: 'Rentabilidad', crumb: 'Margen por proyecto: contrato - subcontratos - materiales' },
    heatmap:      { title: 'Productividad', crumb: 'Carga y desempeño por persona y región' },
    plantillas:   { title: 'Plantillas de proyecto', crumb: 'Acelera la creación de proyectos similares' },
    templates:    { title: 'Templates de mensajes', crumb: 'Plantillas para correo y WhatsApp' },
    resumen:      { title: 'Resumen ejecutivo', crumb: 'Reporte semanal automático para Dirección' },
    settings:     { title: 'Ajustes', crumb: 'Tema, recordatorios y preferencias' },
    alertas:      { title: 'Alertas semanales', crumb: 'Resumen de banderas rojas y proyectos a vigilar esta semana' },
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">SM</div>
          <div>
            <div className="brand-name">SERVMAC Tracker</div>
            <div className="brand-sub">Portafolio Noreste · 2026</div>
          </div>
        </div>

        <div className="nav-section">Operación</div>
        {navItems.map(it => (
          <div key={it.k} className={'nav-item ' + (view === it.k ? 'active' : '')} onClick={() => navigate(it.k)}>
            <Icon name={it.i} size={17}/>
            <span>{it.l}</span>
            {it.badge != null && <span className="badge">{it.badge}</span>}
          </div>
        ))}

        <div className="nav-section">Reportes</div>
        <div className={'nav-item ' + (view === 'resumen' ? 'active' : '')} onClick={() => navigate('resumen')}><Icon name="chart" size={17}/><span>Resumen ejecutivo</span></div>
        <div className={'nav-item ' + (view === 'alertas' ? 'active' : '')} onClick={() => navigate('alertas')}><Icon name="bell" size={17}/><span>Alertas semanales</span></div>
        <div className={'nav-item ' + (view === 'settings' ? 'active' : '')} onClick={() => navigate('settings')}><Icon name="edit" size={17}/><span>Ajustes</span></div>

        <div className="sidebar-bottom">
          <div className="row" style={{ gap: 8, color: '#93a4c2', fontSize: 11 }}>
            <Icon name="clock" size={14}/>
            <span>Último corte: <strong style={{ color: '#fff' }}>{data.weeks.slice(-1)[0]}</strong></span>
          </div>
          <div className="who">
            <Avatar name="Isabel D." size={32} />
            <div>
              <div className="name">Isabel D.</div>
              <div className="role">Dirección portafolio</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <h1>{headerByView[view].title}</h1>
            <div className="crumb">{headerByView[view].crumb}</div>
          </div>
          <div className="topbar-right">
            <div className="search" style={{ minWidth: 240 }}>
              <Icon name="search" size={14}/>
              <input placeholder="Buscar proyecto, CR, sucursal…" />
              <span className="muted mono" style={{ fontSize: 11 }}>⌘K</span>
            </div>
            <NotificationsBell data={data} openProject={openProject}/>
            <button className="btn" onClick={()=>window.SERVMAC_TOAST?.('Exportación en preparación')}><Icon name="download" size={14}/> Exportar</button>
            <button className="btn btn-accent" onClick={()=>window.SERVMAC_OPEN_MODAL?.('new-project')}><Icon name="plus" size={14}/> Nuevo proyecto</button>
          </div>
        </header>

        <div className="content">
          {view === 'dashboard'     && <Dashboard data={data} navigate={navigate} openProject={openProject}/>}
          {view === 'proyectos'     && <ProjectsList data={data} openProject={openProject} initialFilter={initialFilter}/>}
          {view === 'proveedores'   && <ProveedoresPage data={data} openProveedor={(id)=>setOpenProv(id)} openProject={openProject}/>}
          {view === 'cronograma'    && <GanttPage data={data} openProject={openProject}/>}
          {view === 'agenda'        && <CalendarPage data={data} openProject={openProject}/>}
          {view === 'inbox'         && <InboxPage data={data} openProject={openProject}/>}
          {view === 'hitos'         && <HitosPage data={data} openProject={openProject}/>}
          {view === 'comunicaciones'&& <ComunicacionesPage data={data} openProject={openProject}/>}
          {view === 'financiero'    && <FinancieroPage data={data} openProject={openProject}/>}
          {view === 'catalogos'     && <CatalogosPage/>}
          {view === 'mi-dia'        && <MiDiaPage data={data} openProject={openProject}/>}
          {view === 'kanban'        && <KanbanPage data={data} openProject={openProject}/>}
          {view === 'forecast'      && <ForecastPage data={data} openProject={openProject}/>}
          {view === 'rentabilidad'  && <RentabilidadPage data={data} openProject={openProject}/>}
          {view === 'heatmap'       && <HeatmapPage data={data} openProject={openProject}/>}
          {view === 'plantillas'    && <PlantillasPage data={data} openProject={openProject}/>}
          {view === 'templates'     && <TemplatesPage data={data} openProject={openProject}/>}
          {view === 'resumen'       && <ResumenEjecutivoPage data={data} openProject={openProject}/>}
          {view === 'settings'      && <SettingsPage/>}
          {view === 'alertas'       && <AlertasPage data={data} openProject={openProject}/>}
        </div>
      </main>

      <div className={'drawer-overlay ' + ((openId || openProv) ? 'open' : '')} onClick={() => { close(); setOpenProv(null); setDrawerFull(false); setProvFull(false); }}/>
      <div className={'drawer ' + (openId ? 'open' : '') + (drawerFull ? ' drawer-fullscreen' : '')}>
        {openId && <ProjectDetail data={data} projectId={openId} onClose={() => { close(); setDrawerFull(false); }} fullscreen={drawerFull} toggleFullscreen={() => setDrawerFull(v => !v)}/>}
      </div>
      <div className={'drawer ' + (openProv ? 'open' : '') + (provFull ? ' drawer-fullscreen' : '')}>
        {openProv && <ProveedorDetail data={data} proveedorId={openProv} onClose={() => { setOpenProv(null); setProvFull(false); }} openProject={openProject} fullscreen={provFull} toggleFullscreen={() => setProvFull(v => !v)}/>}
      </div>

      <ModalHost data={data}/>
      <ToastHost/>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);
