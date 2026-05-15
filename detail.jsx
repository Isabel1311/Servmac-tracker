// Project detail drawer

function ProjectDetail({ data, projectId, onClose, fullscreen, toggleFullscreen }) {
  const { proyectos, snapshots, hitos, financiero, comunicaciones, weeks } = data;
  const p = proyectos.find(p => p.id === projectId);
  const [tab, setTab] = React.useState('overview');

  if (!p) return null;

  const projSnaps = weeks.map(wk => snapshots.find(s => s.id_proyecto === projectId && s.semana === wk)).filter(Boolean);
  const projHitos = hitos.filter(h => h.id_proyecto === projectId);
  const projComs = comunicaciones.filter(c => c.id_proyecto === projectId);
  const fin = financiero.find(f => f.id_proyecto === projectId);

  return (
    <>
      {/* Header */}
      <div className="drawer-head">
        <div className="row between" style={{ marginBottom: 12 }}>
          <div className="row" style={{ gap: 8 }}>
            <TipoTag tipo={p.tipo} />
            <span className="tag">{p.asignacion}</span>
            <span className="tag mono">CR {p.cr}</span>
            <span className="tag mono">{p.region}</span>
          </div>
          <div className="row" style={{ gap: 6 }}>
            <button className="drawer-close" onClick={() => window.SERVMAC_OPEN_MODAL('compartir-publico', { projectId: p.id })} title="Compartir vista pública"><Icon name="link" size={18}/></button>
            <button className="drawer-close" onClick={() => window.SERVMAC_OPEN_MODAL('informe', { projectId: p.id })} title="Generar informe"><Icon name="download" size={18}/></button>
            <button className="drawer-close" onClick={() => window.SERVMAC_OPEN_MODAL('edit-project', { projectId: p.id })} title="Editar proyecto"><Icon name="edit" size={18}/></button>
            <button className="drawer-close" onClick={toggleFullscreen} title={fullscreen ? 'Reducir' : 'Pantalla completa'}><Icon name={fullscreen ? 'shrink' : 'expand'} size={18}/></button>
            <button className="drawer-close" onClick={onClose} title="Cerrar"><Icon name="close" size={20} /></button>
          </div>
        </div>
        <div className="row" style={{ gap: 16, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: 22, letterSpacing: '-0.02em', fontWeight: 700 }}>{p.sucursal}</h2>
            <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{p.proyecto} · {p.descripcion}</div>
            <div className="cell-id" style={{ marginTop: 8 }}>{p.id}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Importe contratado</div>
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>{fmtMoney(p.importe_contratado)}</div>
            <div className="muted mono" style={{ fontSize: 11 }}>{fmtMoneyFull(p.importe_contratado)} MXN</div>
          </div>
        </div>

        <div className="row" style={{ gap: 10, marginTop: 16 }}>
          <StatusBadge value={p.estatus} />
          <span className="muted" style={{ fontSize: 12 }}>· sub-estatus:</span>
          <span style={{ fontSize: 12.5, fontWeight: 500 }}>{p.sub_estatus}</span>
          <span className="muted" style={{ fontSize: 12 }}>· entregable:</span>
          <DeliveryDot value={p.entregable} />
        </div>

        <div className="drawer-tabs">
          {[
            { k: 'overview', l: 'Resumen', i: 'dashboard' },
            { k: 'plan', l: 'Plan vs Real', i: 'chart' },
            { k: 'validaciones', l: 'Validar avances', i: 'check' },
            { k: 'bitacora', l: 'Bitácora', i: 'clipboard' },
            { k: 'visitas', l: 'Visitas', i: 'calendar' },
            { k: 'revisiones', l: 'Revisiones', i: 'users' },
            { k: 'cierre', l: 'Cierre Admin.', i: 'flag' },
            { k: 'comentarios', l: 'Comentarios', i: 'mail' },
            { k: 'actividad', l: 'Actividad', i: 'history' },
            { k: 'hse', l: 'HSE', i: 'alert' },
            { k: 'fotos', l: 'Fotos IA', i: 'box' },
            { k: 'gantt', l: 'Cronograma', i: 'clock' },
            { k: 'proveedores', l: 'Proveedores', i: 'truck' },
            { k: 'materiales', l: 'Materiales', i: 'box' },
            { k: 'fin', l: 'Financiero', i: 'money' },
            { k: 'hitos', l: 'Hitos', i: 'flag', count: projHitos.length },
            { k: 'comm', l: 'Comunicaciones', i: 'mail', count: projComs.length },
            { k: 'timeline', l: 'Histórico', i: 'history' },
          ].map(t => (
            <button key={t.k} onClick={() => setTab(t.k)} className={'drawer-tab ' + (tab === t.k ? 'active' : '')}>
              <Icon name={t.i} size={13}/>
              <span>{t.l}</span>
              {t.count != null && <span className="drawer-tab-count">{t.count}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="drawer-body">
        {tab === 'overview' && <OverviewTab p={p} projSnaps={projSnaps} projHitos={projHitos} fin={fin}/>}
        {tab === 'plan' && <PlanRealTab project={p} data={data}/>}
        {tab === 'bitacora' && <BitacoraTab project={p} data={data}/>}
        {tab === 'visitas' && <VisitasTab project={p} data={data}/>}
        {tab === 'gantt' && <ProjectGanttSection project={p} data={data}/>}
        {tab === 'proveedores' && <ProveedoresProyectoTab project={p} data={data}/>}
        {tab === 'materiales' && <MaterialesTab project={p} data={data}/>}
        {tab === 'timeline' && <TimelineTab p={p} projSnaps={projSnaps} weeks={weeks}/>}
        {tab === 'hitos' && <HitosTab hitos={projHitos}/>}
        {tab === 'comm' && <ComTab coms={projComs}/>}
        {tab === 'fin' && <FinTab fin={fin} p={p}/>}
        {tab === 'validaciones' && <ValidacionesTab project={p}/>}
        {tab === 'revisiones' && <RevisionesTab project={p}/>}
        {tab === 'cierre' && <CierreAdminTab project={p}/>}
        {tab === 'comentarios' && <ComentariosTab project={p}/>}
        {tab === 'actividad' && <ActividadTab project={p}/>}
        {tab === 'hse' && <HSETab project={p}/>}
        {tab === 'fotos' && <FotosTab project={p}/>}
      </div>
    </>
  );
}

function OverviewTab({ p, projSnaps, projHitos, fin }) {
  const lastSnaps = projSnaps.slice(-12);
  const meta = window.SERVMAC_EXTRAS?.proyectos_meta?.[p.id];
  const bugs = window.SERVMAC_EXTRAS?.bugs?.[p.id] || [];
  // Active visits from calendar derivation
  const allVisitas = (window.deriveVisitas ? window.deriveVisitas(window.SERVMAC_DATA) : []).filter(v => v.proyecto === p.id);
  const today = new Date(window.SERVMAC_DATA.today + 'T12:00:00Z');
  const visitasFuturas = allVisitas.filter(v => new Date(v.fecha) >= today);
  return (
    <div className="stack-md">
      {meta && (
        <div className="overview-progress">
          <div className="row between" style={{ marginBottom: 10 }}>
            <div>
              <div className="muted" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Avance del proyecto</div>
              <div className="row" style={{ gap: 16, marginTop: 6, alignItems: 'baseline' }}>
                <div><span style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em' }}>{meta.real_pct}%</span><span className="muted" style={{ fontSize: 13, marginLeft: 6 }}>real</span></div>
                <div><span style={{ fontSize: 18, fontWeight: 600, color: 'var(--muted)' }}>{meta.planned_pct}%</span><span className="muted" style={{ fontSize: 12, marginLeft: 4 }}>esperado</span></div>
                <div className={'pill ' + (meta.dias_desfase === 0 ? 'pill-green' : meta.dias_desfase < 7 ? 'pill-orange' : 'pill-red')}>
                  {meta.dias_desfase === 0 ? '✓ En tiempo' : '⚠ ' + meta.dias_desfase + ' días de desfase'}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="muted" style={{ fontSize: 11 }}>Avance diario esperado</div>
              <div className="mono" style={{ fontSize: 16, fontWeight: 700 }}>{(100 / Math.max(meta.plazo_dias, 1)).toFixed(2)}%/día</div>
              <div className="muted" style={{ fontSize: 11 }}>plazo {meta.plazo_dias} días · restan {meta.dias_restantes}</div>
            </div>
          </div>
          <div className="prog-bar">
            <div className="prog-real" style={{ width: meta.real_pct + '%' }}/>
            <div className="prog-marker" style={{ left: meta.planned_pct + '%' }} title={'Esperado ' + meta.planned_pct + '%'}>
              <div className="prog-marker-line"/>
              <div className="prog-marker-label">esperado {meta.planned_pct}%</div>
            </div>
          </div>
        </div>
      )}

      {(visitasFuturas.length > 0 || bugs.length > 0) && (
        <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
          {visitasFuturas.length > 0 && (
            <div className="alert-pill alert-blue">
              <Icon name="calendar" size={14}/>
              <span><strong>{visitasFuturas.length} visita{visitasFuturas.length > 1 ? 's' : ''} programada{visitasFuturas.length > 1 ? 's' : ''}</strong> · próxima {fmtDate(visitasFuturas[0].fecha)}</span>
            </div>
          )}
          {bugs.length > 0 && (
            <div className={'alert-pill ' + (bugs.some(b => b.severidad === 'alta') ? 'alert-red' : 'alert-orange')}>
              <Icon name="alert" size={14}/>
              <span><strong>{bugs.length} bloqueo{bugs.length > 1 ? 's' : ''} activo{bugs.length > 1 ? 's' : ''}</strong> · impacto total {bugs.reduce((s,b)=>s+b.impacto_dias,0)} días</span>
            </div>
          )}
        </div>
      )}

      <div className="detail-grid">
        <div className="card">
          <div className="sec-title">Asignación</div>
          <div className="kvp">
            <div className="k">SERVMAC</div>
            <div className="v"><span className="row" style={{ gap: 6 }}><Avatar name={p.persona_servmac} size={20}/> {p.persona_servmac}</span></div>
            <div className="k">Cliente</div>
            <div className="v"><span className="row" style={{ gap: 6 }}><Avatar name={p.persona_cliente} size={20}/> {p.persona_cliente}</span></div>
            <div className="k">Proveedor</div>
            <div className="v">{p.proveedor}</div>
            <div className="k">Asignado el</div>
            <div className="v mono">{fmtDate(p.fecha_asignacion)}</div>
          </div>
        </div>
        <div className="card">
          <div className="sec-title">Fechas y contrato</div>
          <div className="kvp">
            <div className="k">Inicio programado</div>
            <div className="v mono">{fmtDate(p.fecha_inicio_prog)}</div>
            <div className="k">Término programado</div>
            <div className="v mono">{fmtDate(p.fecha_termino_prog)}</div>
            <div className="k">Fecha meta</div>
            <div className="v mono">{fmtDate(p.fecha_meta)}</div>
            {meta && <><div className="k">Contrato</div><div className="v mono">{meta.contrato}</div></>}
            {meta && <><div className="k">OC / Anexo</div><div className="v mono">{meta.orden_compra} · {meta.anexo}</div></>}
            {meta && <><div className="k">Código UDA</div><div className="v mono">{meta.codigo_uda}</div></>}
          </div>
        </div>
      </div>

      {meta && (
        <div className="card">
          <div className="card-head">
            <h3><span className="row" style={{ gap: 8 }}><Icon name="pin" size={14}/> Ubicación</span></h3>
            <div className="row" style={{ gap: 6 }}>
              <button className="btn btn-sm btn-ghost" onClick={() => { navigator.clipboard?.writeText(meta.direccion); window.SERVMAC_TOAST?.('Dirección copiada'); }}><Icon name="copy" size={13}/> Copiar</button>
              <a className="btn btn-sm" href={meta.maps_url} target="_blank" rel="noopener noreferrer"><Icon name="link" size={13}/> Abrir en Maps</a>
            </div>
          </div>
          <div className="addr-card">
            <div className="addr-pin"><Icon name="pin" size={18}/></div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{meta.direccion}</div>
              <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>{meta.estado} · CP {meta.cp} · {p.region}</div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-head">
          <h3>Resumen de hitos</h3>
        </div>
        <div style={{ display:'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
          {projHitos.map(h => {
            const color = h.estatus === 'cumplido' ? '#15803D' : h.estatus === 'atrasado' ? '#B91C1C' : '#94A3B8';
            const bg = h.estatus === 'cumplido' ? 'var(--green-100)' : h.estatus === 'atrasado' ? 'var(--red-100)' : 'var(--bg)';
            return (
              <div key={h.id} style={{ padding: 12, borderRadius: 10, background: bg, border: '1px solid var(--line)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {h.estatus === 'cumplido' ? '✓' : h.estatus === 'atrasado' ? '⚠' : '○'} {h.estatus}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>{h.tipo}</div>
                <div className="cell-id" style={{ marginTop: 4 }}>{fmtDate(h.fecha_real || h.fecha_programada)}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Últimas 12 semanas</h3>
        </div>
        <MiniTimeline snaps={lastSnaps}/>
      </div>

      {fin && (
        <div className="card">
          <div className="card-head">
            <h3>Avance financiero</h3>
            <span className="sub">· {fin.estatus_financiero}</span>
          </div>
          <FinanceBars fin={fin}/>
        </div>
      )}
    </div>
  );
}

function MiniTimeline({ snaps }) {
  const statusColor = {
    '05. Gestion por iniciar Obra': '#6D28D9',
    '06. En obra': '#2563EB',
    '07. Cierre Administrativo': '#F26B1F',
    '08. Mesa de cierres': '#C58200',
    '10. Finiquitado': '#15803D',
  };
  return (
    <div className="snapline">
      {snaps.map((s, i) => (
        <div key={i} className="snapcell">
          <span className="num">{s.semana.split(' ')[0].replace('S','')}</span>
          <div style={{ fontSize: 9 }}>{s.semana.split(' ').slice(1).join(' ')}</div>
          <div className="strip" style={{ background: statusColor[s.estatus] || '#94A3B8' }} />
          <div style={{ marginTop: 4, fontSize: 9, color: 'var(--muted)' }}>{statusMap[s.estatus]?.short2 || ''}</div>
        </div>
      ))}
    </div>
  );
}

function TimelineTab({ p, projSnaps, weeks }) {
  const statusColor = {
    '05. Gestion por iniciar Obra': '#6D28D9',
    '06. En obra': '#2563EB',
    '07. Cierre Administrativo': '#F26B1F',
    '08. Mesa de cierres': '#C58200',
    '10. Finiquitado': '#15803D',
  };
  return (
    <div className="stack-md">
      <div className="card">
        <div className="card-head"><h3>Evolución semanal del estatus</h3></div>
        <MiniTimeline snaps={projSnaps}/>
        <div className="muted" style={{ fontSize: 12, marginTop: 14 }}>
          {projSnaps.length} snapshots registrados · {p.cambios_de_fase} cambios de fase · actualmente {p.semanas_en_fase} sem en {statusMap[p.estatus]?.short}
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Bitácora semanal</h3></div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Semana</th>
              <th>Estatus</th>
              <th>Sub-estatus</th>
              <th>Documentación</th>
              <th>Entregable</th>
              <th>Fecha meta</th>
              <th>Comentarios</th>
            </tr>
          </thead>
          <tbody>
            {projSnaps.slice().reverse().map((s, i) => (
              <tr key={i} style={{ cursor: 'default' }}>
                <td className="mono">{s.semana}</td>
                <td><StatusBadge value={s.estatus}/></td>
                <td>{s.sub_estatus}</td>
                <td>{s.documentacion}</td>
                <td><DeliveryDot value={s.entregable}/></td>
                <td className="mono">{fmtDate(s.fecha_meta)}</td>
                <td className="muted" style={{ fontSize: 12, maxWidth: 220 }}>{s.comentarios || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HitosTab({ hitos }) {
  const projectId = hitos[0]?.id_proyecto;
  return (
    <div className="card">
      <div className="card-head">
        <h3>Hitos del proyecto</h3>
        {projectId && <button className="btn btn-sm btn-accent" onClick={()=>window.SERVMAC_OPEN_MODAL('hito',{projectId})}><Icon name="plus" size={13}/> Agregar hito</button>}
      </div>
      {hitos.map(h => {
        const color = h.estatus === 'cumplido' ? 'var(--green-600)' : h.estatus === 'atrasado' ? 'var(--red-600)' : 'var(--muted)';
        const icon = h.estatus === 'cumplido' ? '✓' : h.estatus === 'atrasado' ? '!' : '○';
        return (
          <div key={h.id} className="hito-row">
            <div className="row" style={{ gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg)', display: 'grid', placeItems: 'center', color, fontWeight: 700, border: '1.5px solid currentColor' }}>{icon}</div>
              <div className="cell-strong">{h.tipo}</div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: 11 }}>Programada</div>
              <div className="mono" style={{ fontSize: 13 }}>{fmtDate(h.fecha_programada)}</div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: 11 }}>Real</div>
              <div className="mono" style={{ fontSize: 13 }}>{fmtDate(h.fecha_real)}</div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: 11 }}>Responsable</div>
              <div className="row" style={{ gap: 6, fontSize: 12.5 }}><Avatar name={h.responsable} size={20}/>{h.responsable}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <button className="btn btn-sm btn-ghost" onClick={()=>window.SERVMAC_OPEN_MODAL('hito',{projectId:h.id_proyecto,hitoId:h.id})}><Icon name="edit" size={13}/></button>
              <button className="btn btn-sm btn-ghost"><Icon name="link" size={14}/> Drive</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ComTab({ coms }) {
  const tipoStyle = {
    'correo cliente':  { bg: 'var(--blue-50)',   color: 'var(--blue-700)' },
    'correo SERVMAC':  { bg: 'var(--orange-50)', color: 'var(--orange-700)' },
    'WhatsApp':        { bg: 'var(--green-100)', color: 'var(--green-600)' },
    'junta':           { bg: 'var(--violet-100)', color: 'var(--violet-600)' },
  };
  return (
    <div className="card" style={{ padding: 0 }}>
      <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--line)' }}>
        <h3 style={{ margin: 0, fontSize: 14 }}>Comunicaciones · {coms.length}</h3>
      </div>
      {coms.map(c => {
        const t = tipoStyle[c.tipo] || {};
        return (
          <div key={c.id} className="com-row">
            <div className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtDate(c.fecha)}</div>
            <div className="tag" style={{ background: t.bg, color: t.color, borderColor: 'transparent' }}>{c.tipo}</div>
            <div>
              <div className="cell-strong">{c.resumen}</div>
              <div className="cell-sub">{c.origen} → {c.destino}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <button className="btn btn-sm btn-ghost"><Icon name="link" size={14}/> Abrir</button>
            </div>
          </div>
        );
      })}
      {coms.length === 0 && <div className="empty">Sin comunicaciones registradas</div>}
    </div>
  );
}

function FinanceBars({ fin }) {
  const items = [
    { lbl: 'Presupuestado', val: fin.presupuestado, color: '#94A3B8' },
    { lbl: 'Conciliado',   val: fin.conciliado,    color: '#2563EB' },
    { lbl: 'Cobrado cliente', val: fin.cobrado_cliente, color: '#F26B1F' },
    { lbl: 'Pagado proveedor', val: fin.pagado_proveedor, color: '#15803D' },
  ];
  const max = Math.max(...items.map(i => i.val), 1);
  return (
    <div className="stack-sm">
      {items.map(i => (
        <div key={i.lbl} style={{ display:'grid', gridTemplateColumns:'160px 1fr 120px', gap: 12, alignItems: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{i.lbl}</div>
          <div style={{ background: 'var(--bg)', borderRadius: 4, height: 16, overflow: 'hidden' }}>
            <div style={{ background: i.color, height: '100%', width: (i.val/max*100)+'%' }} />
          </div>
          <div className="mono num">{fmtMoneyFull(i.val)}</div>
        </div>
      ))}
    </div>
  );
}

function FinTab({ fin, p }) {
  const ext = window.SERVMAC_EXTRAS?.finanzas?.[p.id];
  if (!ext) return <div className="empty">Sin datos financieros</div>;
  const open = (kind, ctx) => window.SERVMAC_OPEN_MODAL(kind, { projectId: p.id, ...ctx });

  const pctCobrado = ext.totales.pct_cobrado;
  const pctEnRev = Math.round(ext.totales.en_revision / ext.totales.contratado * 100);
  const fianzaDaysLeft = ext.fianza.requiere && ext.fianza.fecha_vencimiento
    ? Math.round((new Date(ext.fianza.fecha_vencimiento) - new Date()) / 86400000) : null;

  return (
    <div className="stack-md">
      {/* Hero financial summary */}
      <div className="fin-hero">
        <div className="fin-hero-main">
          <div className="muted" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Importe contratado</div>
          <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.03em', marginTop: 4 }}>{fmtMoneyFull(ext.importe_contratado)}</div>
          <div className="row" style={{ gap: 6, marginTop: 6, alignItems:'center' }}>
            <span className={'pill pill-' + (ext.totales.por_cobrar <= 0 ? 'green' : pctCobrado > 70 ? 'orange' : 'blue')}>
              {pctCobrado}% cobrado
            </span>
            <span className="muted" style={{ fontSize: 12 }}>{fmtMoney(ext.totales.cobrado)} de {fmtMoney(ext.totales.contratado)}</span>
          </div>
          <div className="fin-progress">
            <div className="fin-progress-cobrado" style={{ width: pctCobrado + '%' }} title={'Cobrado ' + pctCobrado + '%'}/>
            <div className="fin-progress-rev" style={{ width: pctEnRev + '%' }} title={'En revisión ' + pctEnRev + '%'}/>
          </div>
          <div className="row" style={{ gap: 16, marginTop: 10, fontSize: 11 }}>
            <span className="row" style={{ gap: 6 }}><span className="dot dot-green"/> Cobrado <strong className="mono">{fmtMoney(ext.totales.cobrado)}</strong></span>
            <span className="row" style={{ gap: 6 }}><span className="dot dot-orange"/> En revisión <strong className="mono">{fmtMoney(ext.totales.en_revision)}</strong></span>
            <span className="row" style={{ gap: 6 }}><span className="dot dot-gray"/> Por cobrar <strong className="mono">{fmtMoney(ext.totales.por_cobrar)}</strong></span>
          </div>
        </div>
        <div className="fin-hero-stats">
          <div className="fin-mini">
            <div className="muted" style={{ fontSize: 10, fontWeight: 600, textTransform:'uppercase', letterSpacing:'0.08em' }}>Anticipo</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{ext.anticipo.requiere ? fmtMoney(ext.anticipo.monto) : '—'}</div>
            <div className="muted" style={{ fontSize: 11 }}>{ext.anticipo.estatus}</div>
          </div>
          <div className="fin-mini">
            <div className="muted" style={{ fontSize: 10, fontWeight: 600, textTransform:'uppercase', letterSpacing:'0.08em' }}>Fianza</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{ext.fianza.requiere ? ext.fianza.porcentaje + '%' : '—'}</div>
            <div className="muted" style={{ fontSize: 11 }}>{ext.fianza.requiere ? ext.fianza.estatus : 'no requiere'}</div>
          </div>
          <div className="fin-mini">
            <div className="muted" style={{ fontSize: 10, fontWeight: 600, textTransform:'uppercase', letterSpacing:'0.08em' }}>Retención</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{fmtMoney(ext.retencion.monto)}</div>
            <div className="muted" style={{ fontSize: 11 }}>{ext.retencion.porcentaje}% · {ext.retencion.liberada ? 'liberada' : 'retenida'}</div>
          </div>
          <div className="fin-mini">
            <div className="muted" style={{ fontSize: 10, fontWeight: 600, textTransform:'uppercase', letterSpacing:'0.08em' }}>Movimientos</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{ext.pagos.length}</div>
            <div className="muted" style={{ fontSize: 11 }}>{ext.pagos.filter(x=>x.estatus==='cobrado').length} cobrados</div>
          </div>
        </div>
      </div>

      {/* Fianza y Anticipo cards */}
      <div className="detail-grid">
        <div className={'card fin-block ' + (ext.fianza.requiere ? '' : 'fin-block-muted')}>
          <div className="card-head">
            <h3><span className="row" style={{ gap: 8 }}><span className="fin-chip fin-chip-violet"><Icon name="shield" size={13}/></span> Fianza</span></h3>
            <button className="btn btn-sm btn-ghost" onClick={() => open('fianza')}><Icon name="edit" size={13}/> Editar</button>
          </div>
          {ext.fianza.requiere ? (
            <div className="kvp kvp-fin">
              <div className="k">Porcentaje</div>
              <div className="v"><span className="pill pill-violet">{ext.fianza.porcentaje}%</span></div>
              <div className="k">Monto afianzado</div>
              <div className="v mono">{fmtMoney(ext.fianza.monto_afianzado)}</div>
              <div className="k">Costo de la fianza</div>
              <div className="v mono">{fmtMoney(ext.fianza.costo)}</div>
              <div className="k">Afianzadora</div>
              <div className="v">{ext.fianza.afianzadora}</div>
              <div className="k">Póliza</div>
              <div className="v mono">{ext.fianza.poliza}</div>
              <div className="k">Vigencia</div>
              <div className="v">
                <span className="mono">{fmtDate(ext.fianza.fecha_emision)} → {fmtDate(ext.fianza.fecha_vencimiento)}</span>
                {fianzaDaysLeft != null && (
                  <span className={'pill ' + (fianzaDaysLeft < 30 ? 'pill-red' : fianzaDaysLeft < 90 ? 'pill-orange' : 'pill-green')} style={{ marginLeft: 8 }}>
                    {fianzaDaysLeft > 0 ? fianzaDaysLeft + ' días' : 'vencida'}
                  </span>
                )}
              </div>
              <div className="k">Estatus</div>
              <div className="v"><span className={'pill pill-' + (ext.fianza.estatus === 'vigente' ? 'green' : ext.fianza.estatus === 'por renovar' ? 'orange' : 'red')}>{ext.fianza.estatus}</span></div>
            </div>
          ) : (
            <div className="fin-empty">
              <Icon name="shield" size={28}/>
              <div><strong>Este proyecto no requiere fianza</strong></div>
              <button className="btn btn-sm" onClick={()=>open('fianza')}>Configurar fianza</button>
            </div>
          )}
        </div>

        <div className={'card fin-block ' + (ext.anticipo.requiere ? '' : 'fin-block-muted')}>
          <div className="card-head">
            <h3><span className="row" style={{ gap: 8 }}><span className="fin-chip fin-chip-orange"><Icon name="money" size={13}/></span> Anticipo</span></h3>
            <button className="btn btn-sm btn-ghost" onClick={() => open('anticipo')}><Icon name="edit" size={13}/> Editar</button>
          </div>
          {ext.anticipo.requiere ? (
            <>
              <div className="kvp kvp-fin">
                <div className="k">Porcentaje</div>
                <div className="v"><span className="pill pill-orange">{ext.anticipo.porcentaje}%</span></div>
                <div className="k">Monto</div>
                <div className="v mono">{fmtMoney(ext.anticipo.monto)}</div>
                <div className="k">Prefactura</div>
                <div className="v">
                  {ext.anticipo.prefactura_solicitada
                    ? <span className="row" style={{ gap: 8 }}><span className="pill pill-blue">✓ solicitada</span><span className="mono muted" style={{ fontSize: 12 }}>{ext.anticipo.prefactura_folio}</span></span>
                    : <span className="pill pill-gray">○ pendiente solicitar</span>}
                </div>
                {ext.anticipo.fecha_solicitud && (<>
                  <div className="k">Fecha solicitud</div>
                  <div className="v mono">{fmtDate(ext.anticipo.fecha_solicitud)}</div>
                </>)}
                <div className="k">Pago</div>
                <div className="v">
                  {ext.anticipo.pagado
                    ? <span className="row" style={{ gap: 8 }}><span className="pill pill-green">✓ pagado</span><span className="mono muted" style={{ fontSize: 12 }}>{fmtDate(ext.anticipo.fecha_pago)}</span></span>
                    : <span className="pill pill-orange">⌛ esperando pago</span>}
                </div>
              </div>
              {ext.anticipo.comentario && <div className="muted" style={{ fontSize: 12, marginTop: 10, fontStyle: 'italic' }}>"{ext.anticipo.comentario}"</div>}
            </>
          ) : (
            <div className="fin-empty">
              <Icon name="money" size={28}/>
              <div><strong>Este proyecto no contempla anticipo</strong></div>
              <button className="btn btn-sm" onClick={()=>open('anticipo')}>Configurar anticipo</button>
            </div>
          )}
        </div>
      </div>

      {/* Registro de pagos */}
      <div className="card">
        <div className="card-head">
          <h3>Registro de pagos · {ext.pagos.length} movimientos</h3>
          <button className="btn btn-sm btn-accent" onClick={() => open('pago')}><Icon name="plus" size={13}/> Registrar pago</button>
        </div>
        {ext.pagos.length === 0 ? (
          <div className="fin-empty">
            <Icon name="money" size={28}/>
            <div><strong>Aún no hay pagos registrados</strong></div>
            <div className="muted" style={{ fontSize: 12 }}>Registra anticipos, estimaciones y finiquitos conforme avance el proyecto</div>
          </div>
        ) : (
          <div className="pay-list">
            {ext.pagos.map(pg => {
              const est = pg.estatus;
              const pillCls = est === 'cobrado' ? 'pill-green'
                            : est === 'en revisión' ? 'pill-orange'
                            : est === 'pendiente cobro' ? 'pill-blue' : 'pill-gray';
              const tipoCls = pg.tipo.startsWith('Anticipo') ? 'pay-type-anticipo'
                            : pg.tipo.startsWith('Liber') ? 'pay-type-retencion'
                            : 'pay-type-estimacion';
              return (
                <div key={pg.id} className="pay-row">
                  <div className={'pay-marker ' + tipoCls}>{pg.tipo.startsWith('Anticipo') ? 'A' : pg.tipo.startsWith('Liber') ? 'R' : 'E'}</div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="row" style={{ gap: 8, alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 13.5 }}>{pg.tipo}</span>
                      <span className={'pill ' + pillCls}>{pg.estatus}</span>
                    </div>
                    <div className="muted" style={{ fontSize: 11.5 }}>
                      <span className="mono">{fmtDate(pg.fecha)}</span> · {pg.metodo} · ref <span className="mono">{pg.referencia}</span> · prefactura <span className="mono">{pg.prefactura}</span>
                    </div>
                    {pg.comentario && <div className="muted" style={{ fontSize: 11, marginTop: 2, fontStyle: 'italic' }}>{pg.comentario}</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="mono" style={{ fontSize: 16, fontWeight: 700 }}>{fmtMoney(pg.monto)}</div>
                  </div>
                  <button className="btn btn-sm btn-ghost" onClick={() => open('pago', { pagoId: pg.id })}><Icon name="edit" size={13}/></button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { ProjectDetail });
