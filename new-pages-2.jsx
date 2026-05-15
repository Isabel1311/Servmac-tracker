// Kanban, Templates correo/WhatsApp, Comentarios/Actividad/HSE en project drawer

// ============= KANBAN PAGE =============
function KanbanPage({ data, openProject }) {
  const cols = STATUS_ORDER.map(est => ({
    estatus: est,
    label: statusMap[est]?.short || est,
    color: { '05. Gestion por iniciar Obra':'#7C3AED','06. En obra':'#2563EB','07. Cierre Administrativo':'#F26B1F','08. Mesa de cierres':'#C58200','10. Finiquitado':'#15803D' }[est] || '#94a3b8',
    items: data.proyectos.filter(p => p.estatus === est),
  }));

  const move = (p, dir) => {
    const i = STATUS_ORDER.indexOf(p.estatus);
    const ni = Math.max(0, Math.min(STATUS_ORDER.length - 1, i + dir));
    p.estatus = STATUS_ORDER[ni];
    if (p.estatus === '10. Finiquitado') p.activo = false;
    else p.activo = true;
    window.SERVMAC_RERENDER();
    window.SERVMAC_TOAST('Movido a ' + statusMap[p.estatus]?.short);
  };

  return (
    <div className="stack-md">
      <div className="card" style={{ padding: 14 }}>
        <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
          <span className="cell-strong" style={{ fontSize: 14 }}>Tablero Kanban</span>
          <span className="muted" style={{ fontSize: 12 }}>· arrastra con los botones ‹ › para cambiar de fase</span>
          <span style={{ marginLeft:'auto' }} className="muted" style={{ fontSize: 12 }}>{data.proyectos.length} proyectos · {data.proyectos.filter(p => p.activo).length} activos</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols.length}, 1fr)`, gap: 12, alignItems: 'flex-start' }}>
        {cols.map((c, ci) => (
          <div key={c.estatus} className="card" style={{ padding: 12, background: 'var(--bg-soft, #f8f9fc)' }}>
            <div className="row" style={{ marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid ' + c.color }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color }}/>
              <strong style={{ marginLeft: 8, fontSize: 12.5 }}>{c.label}</strong>
              <span className="pill pill-gray" style={{ marginLeft: 'auto' }}>{c.items.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 620, overflowY: 'auto' }}>
              {c.items.map(p => (
                <div key={p.id} style={{ background: '#fff', borderRadius: 8, padding: 10, border: '1px solid var(--line)', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                  <div onClick={() => openProject(p.id)} style={{ cursor: 'pointer' }}>
                    <div className="cell-strong" style={{ fontSize: 12.5, marginBottom: 4 }}>{p.sucursal}</div>
                    <div className="cell-id" style={{ marginBottom: 6 }}>CR {p.cr} · {p.proyecto}</div>
                    <div className="row" style={{ gap: 4, marginBottom: 6 }}>
                      <TipoTag tipo={p.tipo}/>
                      <DeliveryDot value={p.entregable}/>
                    </div>
                    <div className="row" style={{ gap: 6, fontSize: 11, color: 'var(--muted)' }}>
                      <Avatar name={p.persona_servmac} size={18}/>
                      <span style={{ flex: 1 }}>{p.persona_servmac}</span>
                      <span className="mono">{fmtMoney(p.importe_contratado)}</span>
                    </div>
                  </div>
                  <div className="row" style={{ gap: 4, marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--line)' }}>
                    <button className="btn btn-sm btn-ghost icon-only" disabled={ci === 0} onClick={() => move(p, -1)} title="Retroceder">‹</button>
                    <span style={{ flex: 1 }}/>
                    <button className="btn btn-sm btn-ghost icon-only" disabled={ci === cols.length - 1} onClick={() => move(p, 1)} title="Avanzar">›</button>
                  </div>
                </div>
              ))}
              {c.items.length === 0 && <div className="muted" style={{ fontSize: 12, textAlign: 'center', padding: 12 }}>—</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============= TEMPLATES MENSAJES PAGE =============
function TemplatesPage({ data, openProject }) {
  const E = window.SERVMAC_EXTRAS;
  const [sel, setSel] = React.useState(E.templates_mensajes[0].id);
  const [projId, setProjId] = React.useState(data.proyectos.find(p => p.activo)?.id || '');
  const t = E.templates_mensajes.find(x => x.id === sel);
  const p = data.proyectos.find(x => x.id === projId);
  const meta = E.proyectos_meta?.[projId];

  const render = (str) => {
    const dict = {
      sucursal: p?.sucursal || '{{sucursal}}',
      cr: p?.cr || '{{cr}}',
      proyecto: p?.proyecto || '{{proyecto}}',
      contacto_cliente: p?.persona_cliente || '{{contacto_cliente}}',
      usuario: E.usuario_activo?.nombre || '{{usuario}}',
      fecha_inicio: p?.fecha_inicio_prog || '{{fecha_inicio}}',
      fecha_visita: data.today,
      hora_visita: '10:00',
      avance_real: meta?.real_pct || 0,
      avance_esperado: meta?.planned_pct || 0,
      proximos_hitos: 'Acta inicio, Certificación',
      dias_en_cierre: meta?.dias_acumulados_cierre || 0,
      folio_factura: 'F-12345',
      monto: '$120,000',
      motivo_atraso: 'demora en suministro de material',
      nueva_fecha: data.today,
    };
    return str.replace(/\{\{(\w+)\}\}/g, (_, k) => dict[k] ?? `{{${k}}}`);
  };

  const send = (canal) => {
    const body = render(t.cuerpo);
    if (canal === 'whatsapp') {
      window.open('https://wa.me/?text=' + encodeURIComponent(body), '_blank');
    } else if (canal === 'correo') {
      const sub = encodeURIComponent(render(t.asunto));
      window.open(`mailto:?subject=${sub}&body=${encodeURIComponent(body)}`, '_blank');
    } else if (canal === 'copiar') {
      navigator.clipboard?.writeText(body);
      window.SERVMAC_TOAST('Mensaje copiado');
    }
  };

  return (
    <div className="stack-md">
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)' }}>
            <h3 style={{ margin: 0, fontSize: 14 }}>Plantillas</h3>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{E.templates_mensajes.length} disponibles</div>
          </div>
          {E.templates_mensajes.map(tm => (
            <div key={tm.id} onClick={() => setSel(tm.id)} style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)', cursor: 'pointer', background: sel === tm.id ? 'var(--blue-50)' : '#fff', borderLeft: sel === tm.id ? '3px solid var(--orange-500)' : '3px solid transparent' }}>
              <div className="row" style={{ gap: 6, marginBottom: 2 }}>
                <span className="pill pill-blue" style={{ fontSize: 9, textTransform: 'uppercase' }}>{tm.canal}</span>
              </div>
              <div className="cell-strong" style={{ fontSize: 13 }}>{tm.nombre}</div>
              <div className="cell-id" style={{ marginTop: 2, fontSize: 11 }}>{tm.cuerpo.slice(0, 60)}...</div>
            </div>
          ))}
          <div style={{ padding: 12 }}>
            <button className="btn btn-sm btn-accent" style={{ width: '100%' }}><Icon name="plus" size={13}/> Nueva plantilla</button>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>{t.nombre}</h3>
            <span className="pill pill-blue" style={{ marginLeft: 8 }}>{t.canal}</span>
          </div>
          <Field label="Proyecto para reemplazar variables">
            <Sel value={projId} onChange={setProjId} options={data.proyectos.filter(p => p.activo).map(p => ({ value: p.id, label: p.sucursal + ' · CR ' + p.cr }))}/>
          </Field>
          {t.asunto && (
            <div style={{ marginTop: 14 }}>
              <div className="muted" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Asunto</div>
              <div style={{ padding: 10, background: 'var(--bg-soft, #f8f9fc)', borderRadius: 6, fontSize: 13 }}>{render(t.asunto)}</div>
            </div>
          )}
          <div style={{ marginTop: 14 }}>
            <div className="muted" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Cuerpo</div>
            <pre style={{ padding: 14, background: 'var(--bg-soft, #f8f9fc)', borderRadius: 8, fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0, maxHeight: 320, overflowY: 'auto' }}>{render(t.cuerpo)}</pre>
          </div>
          <div className="row" style={{ marginTop: 14, gap: 8 }}>
            <button className="btn btn-ghost" onClick={() => send('copiar')}><Icon name="copy" size={13}/> Copiar</button>
            <button className="btn btn-ghost" onClick={() => send('correo')}><Icon name="mail" size={13}/> Email</button>
            <button className="btn" style={{ background: '#25D366', color: '#fff', borderColor: '#25D366' }} onClick={() => send('whatsapp')}>WhatsApp</button>
            <span style={{ flex: 1 }}/>
            <button className="btn btn-accent" onClick={() => openProject(projId)}><Icon name="chevron" size={13}/> Ir al proyecto</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============= COMENTARIOS TAB =============
function ComentariosTab({ project }) {
  const E = window.SERVMAC_EXTRAS;
  const list = E.comentarios_proyecto[project.id] || (E.comentarios_proyecto[project.id] = []);
  const [texto, setTexto] = React.useState('');

  const enviar = () => {
    if (!texto.trim()) return;
    list.unshift({
      id: 'COM-' + Date.now(),
      autor: E.usuario_activo.nombre,
      fecha: window.SERVMAC_DATA.today,
      hora: new Date().toTimeString().slice(0,5),
      texto, fijado: false,
    });
    setTexto('');
    window.SERVMAC_RERENDER();
    window.SERVMAC_TOAST('Comentario publicado');
  };

  const fijados = list.filter(c => c.fijado);
  const normales = list.filter(c => !c.fijado);

  return (
    <div className="stack-md">
      <div className="card">
        <div className="row" style={{ gap: 10 }}>
          <Avatar name={E.usuario_activo.nombre} size={36}/>
          <div style={{ flex: 1 }}>
            <textarea className="inp inp-area" value={texto} onChange={e=>setTexto(e.target.value)} placeholder="Escribe un comentario… usa @ para mencionar" rows={2}/>
            <div className="row" style={{ marginTop: 8, gap: 6 }}>
              <span className="muted" style={{ fontSize: 11 }}>Tip: usa @Yaresi para notificar</span>
              <button className="btn btn-accent" style={{ marginLeft: 'auto' }} onClick={enviar} disabled={!texto.trim()}><Icon name="check" size={13}/> Publicar</button>
            </div>
          </div>
        </div>
      </div>

      {fijados.length > 0 && (
        <div>
          <div className="muted" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>📌 Fijados</div>
          {fijados.map(c => <CommentRow key={c.id} c={c} list={list}/>)}
        </div>
      )}
      <div className="stack-sm">
        {normales.map(c => <CommentRow key={c.id} c={c} list={list}/>)}
        {list.length === 0 && <div className="muted" style={{ padding: 20, textAlign: 'center', fontSize: 13 }}>Sin comentarios aún. Sé el primero en escribir.</div>}
      </div>
    </div>
  );
}

function CommentRow({ c, list }) {
  const text = c.texto.split(/(@\w+)/g).map((part, i) =>
    part.startsWith('@')
      ? <strong key={i} style={{ color: 'var(--blue-700)', background: 'var(--blue-50)', padding: '0 4px', borderRadius: 3 }}>{part}</strong>
      : <React.Fragment key={i}>{part}</React.Fragment>
  );
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr auto', gap: 10, padding: '10px 12px', background: c.fijado ? '#fffbeb' : 'var(--bg-soft, #f8f9fc)', borderRadius: 10, border: c.fijado ? '1px solid #fde68a' : '1px solid transparent' }}>
      <Avatar name={c.autor} size={32}/>
      <div>
        <div className="row" style={{ gap: 6, marginBottom: 3 }}>
          <strong style={{ fontSize: 13 }}>{c.autor}</strong>
          <span className="muted mono" style={{ fontSize: 11 }}>{c.fecha} {c.hora}</span>
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.5 }}>{text}</div>
      </div>
      <div className="row" style={{ gap: 2 }}>
        <button className="btn btn-sm btn-ghost icon-only" title={c.fijado ? 'Desfijar' : 'Fijar'} onClick={() => { c.fijado = !c.fijado; window.SERVMAC_RERENDER(); }}>📌</button>
        <button className="btn btn-sm btn-ghost icon-only" title="Eliminar" onClick={() => {
          const i = list.indexOf(c); if (i >= 0) list.splice(i, 1); window.SERVMAC_RERENDER();
        }}><Icon name="trash" size={12}/></button>
      </div>
    </div>
  );
}

// ============= ACTIVIDAD TAB =============
function ActividadTab({ project }) {
  const E = window.SERVMAC_EXTRAS;
  const list = E.actividad_proyecto[project.id] || [];
  const tipoColor = { creacion:'#15803D', asignacion:'#2563EB', hito:'#F26B1F', financiero:'#15803D', visita:'#7C3AED', archivo:'#0EA5E9', bloqueo:'#DC2626', comentario:'#94a3b8' };

  return (
    <div className="card">
      <div className="card-head">
        <h3>Bitácora de actividad</h3>
        <span className="sub">· {list.length} eventos · auditoría completa</span>
      </div>
      <div style={{ position: 'relative', paddingLeft: 24 }}>
        <div style={{ position: 'absolute', left: 9, top: 0, bottom: 0, width: 2, background: 'var(--line)' }}/>
        {list.map(e => (
          <div key={e.id} style={{ position: 'relative', paddingBottom: 18 }}>
            <div style={{ position: 'absolute', left: -22, top: 2, width: 20, height: 20, borderRadius: '50%', background: tipoColor[e.tipo] || '#94a3b8', display: 'grid', placeItems: 'center', color: '#fff' }}>
              <Icon name={e.icon} size={11}/>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{e.texto}</span>
              <span className="muted mono" style={{ fontSize: 11, marginLeft: 'auto' }}>{fmtDate(e.fecha)}</span>
            </div>
            <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>por {e.autor}</div>
          </div>
        ))}
        {list.length === 0 && <div className="muted" style={{ padding: 20, fontSize: 13 }}>Sin actividad registrada</div>}
      </div>
    </div>
  );
}

// ============= HSE / INCIDENTES TAB =============
function HSETab({ project }) {
  const E = window.SERVMAC_EXTRAS;
  const list = E.incidentes[project.id] || (E.incidentes[project.id] = []);

  const addIncidente = () => window.SERVMAC_OPEN_MODAL('incidente', { projectId: project.id });
  const delIncidente = (inc) => window.SERVMAC_OPEN_MODAL('confirm-delete', {
    label: inc.tipo, onConfirm: () => { const i = list.indexOf(inc); if (i >= 0) list.splice(i, 1); window.SERVMAC_RERENDER(); window.SERVMAC_TOAST('Incidente eliminado'); }
  });

  const abiertos = list.filter(x => x.estatus !== 'cerrado').length;
  const totalAfectados = list.reduce((s,x) => s + (x.afectados || 0), 0);
  const horasPerdidas = list.reduce((s,x) => s + (x.horas_perdidas || 0), 0);

  return (
    <div className="stack-md">
      <div className="row" style={{ gap: 12 }}>
        <KPI label="Incidentes totales" value={list.length} delta="acumulado del proyecto" deltaDir="flat"/>
        <KPI label="Abiertos" value={abiertos} featured={abiertos > 0 ? 'featured-orange' : ''}/>
        <KPI label="Personas afectadas" value={totalAfectados} delta={totalAfectados === 0 ? 'sin afectados ✓' : ''} deltaDir={totalAfectados > 0 ? 'down' : 'flat'}/>
        <KPI label="Horas perdidas" value={horasPerdidas}/>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Reporte HSE · Seguridad e Higiene</h3>
          <button className="btn btn-sm btn-accent" onClick={addIncidente}><Icon name="plus" size={13}/> Reportar incidente</button>
        </div>
        <div className="stack-sm">
          {list.length === 0 && (
            <div className="fin-empty"><Icon name="check" size={28}/><div><strong>Sin incidentes registrados</strong></div><div className="muted" style={{ fontSize: 12 }}>Reporta cualquier condición o acto inseguro para mantener trazabilidad HSE</div></div>
          )}
          {list.map(inc => {
            const sevCls = inc.severidad === 'alta' ? 'pill-red' : inc.severidad === 'media' ? 'pill-orange' : 'pill-blue';
            const estCls = inc.estatus === 'cerrado' ? 'pill-green' : inc.estatus === 'en seguimiento' ? 'pill-orange' : 'pill-red';
            return (
              <div key={inc.id} className="bug-row">
                <div className={'bug-sev bug-sev-' + inc.severidad}>!</div>
                <div style={{ flex: 1 }}>
                  <div className="row" style={{ gap: 6, marginBottom: 4, alignItems: 'center' }}>
                    <strong style={{ fontSize: 13 }}>{inc.tipo}</strong>
                    <span className={'pill ' + sevCls}>{inc.severidad}</span>
                    <span className={'pill ' + estCls}>{inc.estatus}</span>
                    <span className="muted mono" style={{ fontSize: 11, marginLeft: 'auto' }}>{fmtDate(inc.fecha)}</span>
                  </div>
                  <div style={{ fontSize: 12.5 }}>{inc.descripcion}</div>
                  <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
                    <em>Acción:</em> {inc.accion_correctiva} · Responsable: <strong>{inc.responsable}</strong>
                    {inc.afectados > 0 && <span style={{ color: 'var(--red-600)', marginLeft: 8 }}>· {inc.afectados} afectado{inc.afectados > 1 ? 's' : ''}</span>}
                    {inc.horas_perdidas > 0 && <span style={{ marginLeft: 8 }}>· {inc.horas_perdidas}h perdidas</span>}
                  </div>
                </div>
                <button className="btn btn-sm btn-ghost icon-only" onClick={() => delIncidente(inc)}><Icon name="trash" size={13}/></button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { KanbanPage, TemplatesPage, ComentariosTab, ActividadTab, HSETab });
