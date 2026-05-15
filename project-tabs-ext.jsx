// New project tabs: Validaciones, Revisiones, Cierre Administrativo
// Also CatalogosPage and DeleteConfirm modal

// ========================== VALIDACIONES TAB ==========================
function ValidacionesTab({ project }) {
  const E = window.SERVMAC_EXTRAS;
  const items = E.validaciones[project.id] || [];
  const meta = E.proyectos_meta[project.id];

  const validar = (v) => {
    v.validado_por = 'Yaresi Hernández';
    v.fecha_validacion = window.SERVMAC_DATA.today;
    v.evidencia = (v.evidencia || 0) + 1;
    window.SERVMAC_RERENDER();
    window.SERVMAC_TOAST('Avance validado · ' + v.tarea);
  };
  const ajustar = (v, delta) => {
    v.real_pct = Math.max(0, Math.min(100, v.real_pct + delta));
    v.estatus = v.real_pct >= v.programado_pct ? 'en tiempo' : v.real_pct >= v.programado_pct - 10 ? 'leve atraso' : 'atrasado';
    window.SERVMAC_RERENDER();
  };

  if (items.length === 0) {
    return (
      <div className="card">
        <div className="fin-empty">
          <Icon name="check" size={32}/>
          <div><strong>El validador de avances se activa cuando el proyecto entra a obra</strong></div>
          <div className="muted" style={{ fontSize: 12 }}>Aquí podrás registrar el avance real por tarea y comparar contra lo programado</div>
        </div>
      </div>
    );
  }

  const avgReal = Math.round(items.reduce((s,v) => s + v.real_pct * v.peso/100, 0));
  const avgProg = Math.round(items.reduce((s,v) => s + v.programado_pct * v.peso/100, 0));

  return (
    <div className="stack-md">
      <div className="card validador-hero">
        <div className="row between" style={{ marginBottom: 12 }}>
          <div>
            <div className="muted" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Avance ponderado de tareas</div>
            <div className="row" style={{ gap: 18, marginTop: 6, alignItems: 'baseline' }}>
              <div><span style={{ fontSize: 30, fontWeight: 800 }}>{avgReal}%</span><span className="muted" style={{ marginLeft: 6, fontSize: 12 }}>real</span></div>
              <div><span style={{ fontSize: 18, fontWeight: 600, color: 'var(--muted)' }}>{avgProg}%</span><span className="muted" style={{ marginLeft: 4, fontSize: 11 }}>esperado</span></div>
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>{items.filter(v => v.validado_por).length}/{items.length} tareas validadas</div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>{items.reduce((s,v) => s+(v.evidencia||0), 0)} evidencias adjuntas</div>
          </div>
        </div>
      </div>

      <div className="stack-sm">
        {items.map(v => {
          const dotCls = v.estatus === 'en tiempo' ? 'pill-green' : v.estatus === 'leve atraso' ? 'pill-orange' : 'pill-red';
          return (
            <div key={v.id} className="val-row">
              <div className="val-row-head">
                <div style={{ flex: 1 }}>
                  <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{v.tarea}</span>
                    <span className={'pill ' + dotCls}>{v.estatus}</span>
                    <span className="muted" style={{ fontSize: 11 }}>peso {v.peso}%</span>
                  </div>
                  <div className="val-bars">
                    <div className="val-bar"><div className="val-bar-fill val-bar-prog" style={{ width: v.programado_pct + '%' }}/></div>
                    <div className="val-bar"><div className="val-bar-fill val-bar-real" style={{ width: v.real_pct + '%' }}/></div>
                  </div>
                  <div className="row" style={{ gap: 14, fontSize: 11, marginTop: 4 }}>
                    <span><span className="dot dot-gray"/> Programado <strong className="mono">{v.programado_pct}%</strong></span>
                    <span><span className="dot dot-orange"/> Real <strong className="mono">{v.real_pct}%</strong></span>
                    {v.validado_por && <span className="muted">✓ Validado por {v.validado_por} · {fmtDate(v.fecha_validacion)}</span>}
                    {v.evidencia > 0 && <span className="muted">📎 {v.evidencia} evidencia{v.evidencia > 1 ? 's' : ''}</span>}
                  </div>
                </div>
                <div className="val-actions">
                  <button className="btn btn-sm btn-ghost" onClick={() => ajustar(v, -5)} title="−5%">−</button>
                  <button className="btn btn-sm btn-ghost" onClick={() => ajustar(v, 5)} title="+5%">+</button>
                  <button className="btn btn-sm btn-accent" onClick={() => validar(v)}><Icon name="check" size={13}/> Validar</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ========================== REVISIONES TAB ==========================
function RevisionesTab({ project }) {
  const E = window.SERVMAC_EXTRAS;
  const revs = E.revisiones[project.id] || [];
  const bugs = E.bugs[project.id] || [];

  const open = (kind, ctx) => window.SERVMAC_OPEN_MODAL(kind, { projectId: project.id, ...ctx });

  return (
    <div className="stack-md">
      <div className="row" style={{ gap: 12 }}>
        <KPI label="Revisiones realizadas" value={revs.length}/>
        <KPI label="Próxima revisión" value={revs.length ? '+7 días' : '—'} deltaDir="flat" delta="programar"/>
        <KPI label="Bugs / bloqueos abiertos" value={bugs.length} featured={bugs.length > 0 ? 'featured-red' : ''}/>
        <KPI label="Impacto en días" value={bugs.reduce((s,b)=>s+b.impacto_dias,0)} delta="acumulado" deltaDir="flat"/>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Bugs y bloqueos que retrasan el proyecto</h3>
          <button className="btn btn-sm btn-accent" onClick={() => open('bug')}><Icon name="plus" size={13}/> Reportar bloqueo</button>
        </div>
        {bugs.length === 0 ? (
          <div className="fin-empty">
            <Icon name="check" size={28}/>
            <div><strong>Sin bloqueos activos</strong></div>
            <div className="muted" style={{ fontSize: 12 }}>El proyecto avanza sin retrasos reportados</div>
          </div>
        ) : (
          <div className="stack-sm">
            {bugs.map(b => {
              const sevCls = b.severidad === 'alta' ? 'pill-red' : b.severidad === 'media' ? 'pill-orange' : 'pill-blue';
              return (
                <div key={b.id} className="bug-row">
                  <div className={'bug-sev bug-sev-' + b.severidad}>!</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{b.titulo}</span>
                      <span className={'pill ' + sevCls}>{b.severidad}</span>
                      <span className="pill pill-gray">{b.categoria}</span>
                    </div>
                    <div className="muted" style={{ fontSize: 12, marginTop: 3 }}>{b.descripcion}</div>
                    <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
                      Responsable: <strong style={{ color: 'var(--text)' }}>{b.responsable}</strong> · Detectado {fmtDate(b.fecha_detectado)} · Impacto: <strong style={{ color: 'var(--red-600)' }}>{b.impacto_dias} días</strong>
                    </div>
                  </div>
                  <button className="btn btn-sm btn-ghost" onClick={() => {
                    b.estatus = 'cerrado';
                    const i = bugs.indexOf(b); if (i >= 0) bugs.splice(i, 1);
                    window.SERVMAC_RERENDER(); window.SERVMAC_TOAST('Bloqueo cerrado');
                  }}><Icon name="check" size={13}/> Resolver</button>
                  <button className="btn btn-sm btn-ghost icon-only" onClick={() => {
                    window.SERVMAC_OPEN_MODAL('confirm-delete', { onConfirm: () => {
                      const i = bugs.indexOf(b); if (i >= 0) bugs.splice(i, 1);
                      window.SERVMAC_RERENDER(); window.SERVMAC_TOAST('Bloqueo eliminado');
                    }, label: b.titulo });
                  }}><Icon name="trash" size={13}/></button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Juntas de revisión con el equipo</h3>
          <button className="btn btn-sm btn-accent" onClick={() => open('revision')}><Icon name="plus" size={13}/> Nueva revisión</button>
        </div>
        {revs.length === 0 ? (
          <div className="fin-empty">
            <Icon name="users" size={28}/>
            <div><strong>Sin juntas registradas aún</strong></div>
            <button className="btn btn-sm btn-accent" onClick={() => open('revision')}>Programar primera revisión</button>
          </div>
        ) : (
          <div className="stack-sm">
            {revs.map(r => {
              const resultCls = r.resultado === 'en tiempo' ? 'pill-green' : r.resultado === 'crítico' ? 'pill-red' : 'pill-orange';
              const diff = r.avance_real - r.avance_estimado;
              return (
                <div key={r.id} className="rev-row">
                  <div className="rev-num">R{r.numero}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="row" style={{ gap: 8, alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>Revisión #{r.numero}</span>
                      <span className="mono muted" style={{ fontSize: 12 }}>{fmtDate(r.fecha)}</span>
                      <span className={'pill ' + resultCls}>{r.resultado}</span>
                    </div>
                    <div className="row" style={{ gap: 16, fontSize: 12, marginBottom: 6 }}>
                      <span>Estimado <strong>{r.avance_estimado}%</strong></span>
                      <span>Real <strong>{r.avance_real}%</strong></span>
                      <span className={diff < 0 ? 'pill pill-red' : 'pill pill-green'} style={{ fontSize: 10 }}>{diff > 0 ? '+' : ''}{diff}%</span>
                    </div>
                    <div style={{ fontSize: 12.5 }}>{r.notas}</div>
                    <div className="muted" style={{ fontSize: 11, marginTop: 4 }}><em>Acuerdos:</em> {r.acuerdos}</div>
                    <div className="row" style={{ gap: 4, marginTop: 6 }}>
                      {r.participantes.map((p,i) => <span key={i} className="row" style={{ gap: 4, fontSize: 11 }}><Avatar name={p} size={18}/><span className="muted">{p}</span></span>)}
                    </div>
                  </div>
                  <button className="btn btn-sm btn-ghost icon-only" onClick={() => {
                    window.SERVMAC_OPEN_MODAL('confirm-delete', { onConfirm: () => {
                      const i = revs.indexOf(r); if (i >= 0) revs.splice(i, 1);
                      window.SERVMAC_RERENDER(); window.SERVMAC_TOAST('Revisión eliminada');
                    }, label: 'Revisión #' + r.numero });
                  }}><Icon name="trash" size={13}/></button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ========================== CIERRE ADMINISTRATIVO TAB ==========================
function CierreAdminTab({ project }) {
  const E = window.SERVMAC_EXTRAS;
  const m = E.proyectos_meta[project.id];
  if (!m) return <div className="empty">Sin datos de cierre</div>;

  const diff = m.importe_cierre_aceptado != null ? m.importe_cierre_enviado - m.importe_cierre_aceptado : null;

  return (
    <div className="stack-md">
      <div className="row" style={{ gap: 12 }}>
        <KPI label="Importe cierre enviado" value={fmtMoney(m.importe_cierre_enviado)}/>
        <KPI label="Importe aceptado" value={m.importe_cierre_aceptado ? fmtMoney(m.importe_cierre_aceptado) : '—'} delta={m.importe_cierre_aceptado ? 'cliente' : 'pendiente'} deltaDir="flat"/>
        <KPI label="Diferencia" value={diff != null ? fmtMoney(diff) : '—'} featured={diff && diff > 0 ? 'featured-red' : ''} delta={diff != null ? (diff > 0 ? 'a favor cliente' : 'a favor SERVMAC') : ''} deltaDir="flat"/>
        <KPI label="Días en cierre" value={m.dias_acumulados_cierre} delta="acumulados" deltaDir="flat" featured={m.dias_acumulados_cierre > 30 ? 'featured-orange' : ''}/>
      </div>

      <div className="detail-grid">
        <div className="card">
          <div className="card-head">
            <h3>Estatus operativo y cierre</h3>
            <button className="btn btn-sm btn-ghost" onClick={() => window.SERVMAC_OPEN_MODAL('edit-cierre',{projectId: project.id})}><Icon name="edit" size={13}/> Editar</button>
          </div>
          <div className="kvp kvp-fin">
            <div className="k">Estatus operativo</div>
            <div className="v"><span className="pill pill-blue">{m.estatus_operativo}</span></div>
            <div className="k">Estatus cierre</div>
            <div className="v"><span className={'pill ' + (m.estatus_cierre === 'aceptado total' ? 'pill-green' : m.estatus_cierre === 'aceptado parcial' ? 'pill-orange' : 'pill-blue')}>{m.estatus_cierre}</span></div>
            <div className="k">Tipo de bloqueo</div>
            <div className="v">{m.tipo_bloqueo === 'Sin bloqueo' ? <span className="pill pill-green">{m.tipo_bloqueo}</span> : <span className="pill pill-orange">{m.tipo_bloqueo}</span>}</div>
            <div className="k">Aplica penalización</div>
            <div className="v">{m.aplica_penalizacion ? <span className="pill pill-red">Sí</span> : <span className="pill pill-gray">No</span>}</div>
            <div className="k">Aplica FIN 47</div>
            <div className="v">{m.aplica_fin47 ? <span className="pill pill-orange">Sí</span> : <span className="pill pill-gray">No</span>}</div>
            <div className="k">Estatus certificación</div>
            <div className="v"><span className={'pill ' + (m.estatus_certificacion === 'emitida' ? 'pill-green' : 'pill-orange')}>{m.estatus_certificacion}</span></div>
            <div className="k">Formato cierre</div>
            <div className="v">{m.formato_cierre}</div>
            <div className="k">Número factura</div>
            <div className="v mono">{m.num_factura || '—'}</div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Fechas clave</h3>
          </div>
          <div className="kvp kvp-fin">
            <div className="k">Recepción contrato</div>
            <div className="v mono">{fmtDate(m.fecha_recepcion_contrato)}</div>
            <div className="k">Firma interna</div>
            <div className="v mono">{fmtDate(m.fecha_firma_interna)} <span className={'pill ' + (m.estatus_firma === 'firmado' ? 'pill-green' : 'pill-orange')} style={{ marginLeft: 6 }}>{m.estatus_firma}</span></div>
            <div className="k">Envío certificación</div>
            <div className="v mono">{fmtDate(m.fecha_envio_certificacion)}</div>
            <div className="k">Acta de inicio</div>
            <div className="v mono">{m.fecha_acta_inicio ? fmtDate(m.fecha_acta_inicio) : '—'}</div>
            <div className="k">Acta de cierre</div>
            <div className="v mono">{m.fecha_acta_cierre ? fmtDate(m.fecha_acta_cierre) : '—'}</div>
            <div className="k">Envío cierre admin.</div>
            <div className="v mono">{m.fecha_envio_cierre ? fmtDate(m.fecha_envio_cierre) : '—'}</div>
            <div className="k">Acta pendiente terceros</div>
            <div className="v mono">{m.fecha_acta_pendiente_terceros ? fmtDate(m.fecha_acta_pendiente_terceros) : '—'}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Importes y conciliación</h3>
        </div>
        <div className="cierre-grid">
          <div className="cierre-mini">
            <div className="muted" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Importe acción</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{fmtMoney(m.importe_accion)}</div>
          </div>
          <div className="cierre-mini">
            <div className="muted" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Importe certificación</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{fmtMoney(m.importe_certificacion)}</div>
          </div>
          <div className="cierre-mini">
            <div className="muted" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Límite penalización</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{fmtMoney(m.importe_limite_penalizacion)}</div>
          </div>
          <div className="cierre-mini">
            <div className="muted" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Importe CFE</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{m.importe_cfe ? fmtMoney(m.importe_cfe) : '—'}</div>
          </div>
        </div>
        {m.observaciones && (
          <div className="muted" style={{ fontSize: 13, marginTop: 16, fontStyle: 'italic', padding: 12, background: 'var(--bg-warm)', borderRadius: 8 }}>"{m.observaciones}"</div>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Carpeta de cierre en Drive</h3>
          <div className="row" style={{ gap: 8 }}>
            <a className="btn btn-sm" href={m.enlace_cierre_drive || '#'} target="_blank" rel="noreferrer"><Icon name="link" size={13}/> Abrir en Drive</a>
            <button className="btn btn-sm btn-ghost" onClick={() => {
              window.SERVMAC_OPEN_MODAL('drive-link', {
                subtitle: 'Carpeta de cierre administrativo',
                current: m.enlace_cierre_drive || '',
                onSubmit: (v) => { m.enlace_cierre_drive = v; window.SERVMAC_RERENDER(); }
              });
            }}><Icon name="edit" size={13}/> Editar link</button>
          </div>
        </div>
        {(() => {
          if (!m.checklist_cierre) {
            const tpl = (window.SERVMAC_EXTRAS.catalogos.cierre_check_template || []);
            m.checklist_cierre = tpl.map(t => ({ k: t.k, l: t.l, c: false, com: '', fecha: null, pct: 0 }));
          }
          const list = m.checklist_cierre;
          const total = list.length || 1;
          const cargados = list.filter(x => x.c).length;
          const pctTotal = Math.round(list.reduce((s,x) => s + (x.c ? 100 : (x.pct||0)), 0) / total);
          return (
            <>
              <div className="row" style={{ gap: 14, marginBottom: 12, padding: '10px 12px', background:'var(--bg-soft,#f8f9fc)', borderRadius:8 }}>
                <div>
                  <div className="muted" style={{ fontSize: 11, fontWeight: 600, textTransform:'uppercase', letterSpacing:'0.06em' }}>Avance del checklist</div>
                  <div style={{ fontSize: 22, fontWeight: 800, marginTop: 2 }}>{pctTotal}%<span className="muted" style={{ fontSize: 12, fontWeight: 500, marginLeft: 6 }}>· {cargados}/{total} cargados</span></div>
                </div>
                <div style={{ flex:1, height: 10, background:'var(--line)', borderRadius: 999, overflow:'hidden' }}>
                  <div style={{ width: pctTotal+'%', height:'100%', background:'linear-gradient(90deg, var(--orange-500,#F26B1F), var(--blue-700,#1E40AF))' }}/>
                </div>
                <button className="btn btn-sm btn-accent" onClick={() => {
                  window.SERVMAC_PROMPT({
                    title: 'Nuevo item del checklist',
                    label: 'Etiqueta del documento o entregable',
                    placeholder: 'Ej. Memoria técnica de cierre',
                    cta: 'Agregar',
                    icon: 'plus',
                    toast: 'Item agregado al checklist',
                    onSubmit: (label) => {
                      if (!label) return;
                      list.push({ k: label.toLowerCase().replace(/[^a-z0-9]+/g,'_'), l: label, c:false, com:'', fecha:null, pct:0 });
                      window.SERVMAC_RERENDER();
                    }
                  });
                }}><Icon name="plus" size={13}/> Agregar</button>
              </div>
              <div className="stack-sm">
                {list.map((it, i) => (
                  <div key={i} className={'cierre-check-row ' + (it.c ? 'checked' : '')} style={{ alignItems:'flex-start' }}>
                    <div className="cierre-check-box" style={{ marginTop: 2 }} onClick={() => {
                      it.c = !it.c;
                      if (it.c) { it.pct = 100; it.fecha = it.fecha || window.SERVMAC_DATA.today; }
                      window.SERVMAC_RERENDER();
                    }}>
                      {it.c && <Icon name="check" size={12}/>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="row" style={{ gap: 8, alignItems:'center' }}>
                        <div className="cierre-check-label" style={{ flex: 1 }}>{it.l}</div>
                        <span className="muted mono" style={{ fontSize: 11, whiteSpace:'nowrap' }}>{it.fecha ? fmtDate(it.fecha) : 'sin fecha'}</span>
                        <span className={'pill ' + (it.c ? 'pill-green' : (it.pct >= 50 ? 'pill-orange' : 'pill-gray'))} style={{ minWidth: 50, textAlign:'center', fontSize: 11 }}>
                          {it.c ? '100%' : (it.pct||0) + '%'}
                        </span>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap: 8, marginTop: 6 }}>
                        <div style={{ flex:1, height: 4, background:'var(--line)', borderRadius:999, overflow:'hidden' }}>
                          <div style={{ width: (it.c?100:(it.pct||0))+'%', height:'100%', background: it.c ? 'var(--green-600,#15803D)' : 'var(--orange-500,#F26B1F)' }}/>
                        </div>
                        <span className="muted" style={{ fontSize:11, minWidth: 80 }}>{it.c ? 'completo' : 'falta ' + (100 - (it.pct||0)) + '%'}</span>
                      </div>
                      {it.com && <div className="muted" style={{ fontSize: 11, fontStyle: 'italic', marginTop: 4 }}>"{it.com}"</div>}
                    </div>
                    <div className="row" style={{ gap: 4 }}>
                      <button className="btn btn-sm btn-ghost icon-only" title="Ajustar % cargado" onClick={() => {
                        window.SERVMAC_PROMPT({
                          title: 'Porcentaje cargado',
                          subtitle: it.l,
                          label: 'Porcentaje (0-100)',
                          type: 'number', min: 0, max: 100,
                          defaultValue: String(it.pct || 0),
                          icon: 'check',
                          toast: 'Porcentaje actualizado',
                          onSubmit: (v) => {
                            const n = Math.max(0, Math.min(100, parseInt(v) || 0));
                            it.pct = n;
                            if (n === 100) { it.c = true; it.fecha = it.fecha || window.SERVMAC_DATA.today; }
                            window.SERVMAC_RERENDER();
                          }
                        });
                      }}><Icon name="check" size={13}/></button>
                      <button className="btn btn-sm btn-ghost icon-only" title="Fecha de carga" onClick={() => {
                        window.SERVMAC_PROMPT({
                          title: 'Fecha de carga',
                          subtitle: it.l,
                          label: 'Fecha',
                          type: 'date',
                          defaultValue: it.fecha || window.SERVMAC_DATA.today,
                          icon: 'calendar',
                          toast: 'Fecha actualizada',
                          onSubmit: (v) => { it.fecha = v || null; window.SERVMAC_RERENDER(); }
                        });
                      }}><Icon name="calendar" size={13}/></button>
                      <button className="btn btn-sm btn-ghost icon-only" title="Comentario" onClick={() => {
                        window.SERVMAC_PROMPT({
                          title: 'Comentario u observación',
                          subtitle: it.l,
                          label: 'Comentario',
                          type: 'textarea',
                          placeholder: 'Detalle, observación o nota interna…',
                          defaultValue: it.com || '',
                          icon: 'mail',
                          toast: 'Comentario guardado',
                          onSubmit: (v) => { it.com = v; window.SERVMAC_RERENDER(); }
                        });
                      }}><Icon name="mail" size={13}/></button>
                      <button className="btn btn-sm btn-ghost icon-only" title="Eliminar" onClick={() => {
                        if (confirm('¿Eliminar "' + it.l + '" del checklist?')) {
                          list.splice(i, 1); window.SERVMAC_RERENDER(); window.SERVMAC_TOAST('Item eliminado');
                        }
                      }}><Icon name="trash" size={13}/></button>
                    </div>
                  </div>
                ))}
                {!list.length && <div className="muted" style={{ fontSize: 13, padding: 16, textAlign:'center' }}>Sin items en el checklist. Configura la plantilla desde Catálogos.</div>}
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}

// ========================== CATÁLOGOS PAGE ==========================
function CatalogosPage() {
  const E = window.SERVMAC_EXTRAS;
  const [tab, setTab] = React.useState('personas_servmac');
  const tabs = [
    { k: 'personas_servmac', l: 'Personas SERVMAC', i: 'users', kind: 'persona-servmac' },
    { k: 'personas_cliente', l: 'Personas Cliente', i: 'users', kind: 'persona-cliente' },
    { k: 'proveedores', l: 'Proveedores', i: 'truck', kind: 'proveedor-cat' },
    { k: 'tipos_proyecto', l: 'Tipos de proyecto', i: 'folder', kind: 'lista-simple' },
    { k: 'asignaciones', l: 'Asignaciones', i: 'flag', kind: 'lista-simple' },
    { k: 'regiones', l: 'Regiones', i: 'pin', kind: 'lista-simple' },
    { k: 'tipologias', l: 'Tipologías', i: 'box', kind: 'lista-simple' },
    { k: 'tipos_preciario', l: 'Tipos de preciario', i: 'money', kind: 'lista-simple' },
    { k: 'afianzadoras', l: 'Afianzadoras', i: 'shield', kind: 'lista-simple' },
    { k: 'tipos_bloqueo', l: 'Tipos de bloqueo', i: 'alert', kind: 'lista-simple' },
    { k: 'cierre_check_template', l: 'Checklist de cierre', i: 'check', kind: 'cierre-check' },
  ];
  const current = tabs.find(t => t.k === tab);
  const data = tab === 'proveedores' ? E.proveedores : E[`catalogos`] ? E.catalogos[tab] : [];

  const removeItem = (idx) => {
    window.SERVMAC_OPEN_MODAL('confirm-delete', { onConfirm: () => {
      data.splice(idx, 1); window.SERVMAC_RERENDER();
      window.SERVMAC_TOAST('Elemento eliminado');
    }, label: typeof data[idx] === 'string' ? data[idx] : (data[idx].nombre || 'elemento') });
  };

  return (
    <div className="catalogos-page">
      <div className="catalogos-sidebar">
        {tabs.map(t => (
          <button key={t.k} className={'cat-tab ' + (tab === t.k ? 'active' : '')} onClick={() => setTab(t.k)}>
            <Icon name={t.i} size={14}/>
            <span style={{ flex: 1, textAlign: 'left' }}>{t.l}</span>
            <span className="cat-count">{(tab === 'proveedores' ? E.proveedores : (E.catalogos?.[t.k] || [])).length}</span>
          </button>
        ))}
      </div>

      <div className="catalogos-content">
        <div className="row between" style={{ marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20 }}>{current.l}</h2>
            <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>{data.length} elementos · edita las opciones que aparecen en los menús de toda la app</div>
          </div>
          <button className="btn btn-accent" onClick={() => window.SERVMAC_OPEN_MODAL('catalogo-item', { kind: current.kind, list: tab })}><Icon name="plus" size={14}/> Agregar</button>
        </div>

        <div className="card">
          {data.length === 0 ? (
            <div className="fin-empty"><Icon name="folder" size={28}/><div><strong>Sin elementos en este catálogo</strong></div></div>
          ) : current.kind === 'lista-simple' ? (
            <div className="cat-grid">
              {data.map((s, i) => (
                <div key={i} className="cat-card-simple">
                  <span>{s}</span>
                  <button className="btn btn-sm btn-ghost icon-only" onClick={() => removeItem(i)}><Icon name="trash" size={13}/></button>
                </div>
              ))}
            </div>
          ) : current.kind === 'cierre-check' ? (
            <div className="stack-sm">
              {data.map((it, i) => (
                <div key={i} className="row" style={{ gap: 10, padding:'10px 12px', background:'var(--bg-soft,#f8f9fc)', border:'1px solid var(--line)', borderRadius:8 }}>
                  <Icon name="check" size={14}/>
                  <strong style={{ flex:1 }}>{it.l || it}</strong>
                  <span className="muted mono" style={{ fontSize:11 }}>{it.k || '—'}</span>
                  <button className="btn btn-sm btn-ghost icon-only" onClick={() => removeItem(i)}><Icon name="trash" size={13}/></button>
                </div>
              ))}
              <div className="muted" style={{ fontSize:12, marginTop:4 }}>Estos elementos aparecen como plantilla en el checklist de cierre administrativo de cada proyecto.</div>
            </div>
          ) : current.kind === 'proveedor-cat' ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(360px, 1fr))', gap: 14 }}>
              {data.map((item, i) => (
                <div key={i} style={{ padding:14, border:'1px solid var(--line)', borderRadius:10, background:'#fff', display:'flex', flexDirection:'column', gap:10 }}>
                  <div className="row" style={{ gap:10, alignItems:'flex-start' }}>
                    <Avatar name={item.nombre} size={36}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:14, lineHeight:1.2 }}>{item.nombre}</div>
                      <div className="muted" style={{ fontSize:12, marginTop:2 }}>{item.especialidad} · {item.region}</div>
                    </div>
                    <button className="btn btn-sm btn-ghost icon-only" onClick={() => removeItem(i)}><Icon name="trash" size={13}/></button>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'90px 1fr', rowGap:4, columnGap:8, fontSize:12 }}>
                    <div className="muted">RFC</div><div className="mono">{item.rfc || '—'}</div>
                    <div className="muted">ID empresa</div><div className="mono">{item.id_empresa || '—'}</div>
                    <div className="muted">NSS</div><div className="mono">{item.nss || '—'}</div>
                    <div className="muted">CURP</div><div className="mono">{item.curp || '—'}</div>
                    <div className="muted">INE</div><div className="mono">{item.ine || '—'}</div>
                  </div>
                  <div style={{ borderTop:'1px dashed var(--line)', paddingTop:10 }}>
                    <div className="muted" style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Archivos adjuntos</div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                      {['RFC','CSF','INE','NSS','CURP','Estado cuenta'].map(doc => {
                        const has = (item.docs || {})[doc];
                        return (
                          <button key={doc} className="btn btn-sm" style={{ justifyContent:'flex-start', fontSize:11, padding:'6px 8px' }} onClick={() => {
                            window.SERVMAC_OPEN_MODAL('doc-adjunto', {
                              docType: doc,
                              proveedor: item.nombre,
                              current: has || '',
                              onSubmit: (f) => {
                                item.docs = item.docs || {}; item.docs[doc] = f || '';
                                window.SERVMAC_RERENDER();
                              }
                            });
                          }}>
                            <Icon name={has ? 'check' : 'plus'} size={11}/>
                            <span style={{ flex:1, textAlign:'left' }}>{doc}</span>
                            {has && <span className="muted" style={{ fontSize:9, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:80 }}>{has}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Nombre</th>
                  {current.kind === 'persona-servmac' && <><th>Rol</th><th>Email</th><th>Teléfono</th></>}
                  {current.kind === 'persona-cliente' && <><th>Empresa</th><th>Rol</th><th>Email</th></>}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, i) => (
                  <tr key={i}>
                    <td><span className="row" style={{ gap: 8 }}><Avatar name={item.nombre} size={24}/><strong>{item.nombre}</strong></span></td>
                    {current.kind === 'persona-servmac' && <><td>{item.rol}</td><td className="mono" style={{ fontSize: 12 }}>{item.email}</td><td className="mono" style={{ fontSize: 12 }}>{item.telefono}</td></>}
                    {current.kind === 'persona-cliente' && <><td>{item.empresa}</td><td>{item.rol}</td><td className="mono" style={{ fontSize: 12 }}>{item.email}</td></>}
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-sm btn-ghost icon-only" onClick={() => removeItem(i)}><Icon name="trash" size={13}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ========================== ALERTAS SEMANALES PAGE ==========================
function AlertasPage({ data, openProject }) {
  const E = window.SERVMAC_EXTRAS;
  const atorados = data.proyectos.filter(p => p.activo && p.semanas_en_fase >= 4);
  const fueraTiempo = data.proyectos.filter(p => p.activo && p.entregable === 'Fuera de tiempo');
  const hitosAtrasados = data.hitos.filter(h => h.estatus === 'atrasado');
  const bugsAlta = [];
  Object.entries(E.bugs).forEach(([id, list]) => list.forEach(b => { if (b.severidad === 'alta') bugsAlta.push({ ...b, projectId: id }); }));
  const facturasVencidas = E.facturas.filter(f => f.estatus_pago === 'vencida');

  const Section = ({ title, count, color, children }) => (
    <div className="card">
      <div className="card-head">
        <h3 className="row" style={{ gap: 8 }}><span className={'dot dot-'+color}/> {title}<span className="muted" style={{ fontSize: 12, fontWeight: 500 }}>· {count}</span></h3>
      </div>
      {children}
    </div>
  );

  return (
    <div className="stack-md">
      <div className="row" style={{ gap: 12 }}>
        <KPI label="Proyectos atorados ≥4 sem" value={atorados.length} featured={atorados.length ? 'featured-red' : ''}/>
        <KPI label="Fuera de tiempo" value={fueraTiempo.length} featured={fueraTiempo.length ? 'featured-orange' : ''}/>
        <KPI label="Hitos atrasados" value={hitosAtrasados.length}/>
        <KPI label="Bloqueos alta severidad" value={bugsAlta.length}/>
        <KPI label="Facturas vencidas" value={facturasVencidas.length}/>
      </div>

      <Section title="Proyectos sin movimiento ≥4 semanas" count={atorados.length} color="red">
        <table className="tbl">
          <thead><tr><th>Proyecto</th><th>Estatus</th><th>Sem. en fase</th><th>Responsable</th><th>Importe</th><th></th></tr></thead>
          <tbody>
            {atorados.slice(0, 20).map(p => (
              <tr key={p.id} onClick={() => openProject(p.id)} style={{ cursor: 'pointer' }}>
                <td><strong>{p.sucursal}</strong><div className="muted" style={{ fontSize: 11 }}>CR {p.cr}</div></td>
                <td><StatusBadge value={p.estatus}/></td>
                <td><span className="pill pill-red">{p.semanas_en_fase} sem</span></td>
                <td>{p.persona_servmac}</td>
                <td className="mono">{fmtMoney(p.importe_contratado)}</td>
                <td><Icon name="chevron" size={14}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Bloqueos de alta severidad" count={bugsAlta.length} color="red">
        <div className="stack-sm">
          {bugsAlta.map(b => {
            const p = data.proyectos.find(x => x.id === b.projectId);
            return (
              <div key={b.id} className="bug-row" onClick={() => openProject(b.projectId)} style={{ cursor: 'pointer' }}>
                <div className="bug-sev bug-sev-alta">!</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{b.titulo}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{p?.sucursal} · Impacto {b.impacto_dias} días · {b.responsable}</div>
                </div>
              </div>
            );
          })}
          {!bugsAlta.length && <div className="muted" style={{ fontSize: 13, padding: 12 }}>Sin bloqueos críticos esta semana ✓</div>}
        </div>
      </Section>

      <Section title="Facturas vencidas" count={facturasVencidas.length} color="orange">
        <table className="tbl">
          <thead><tr><th>Folio</th><th>Proyecto</th><th>Fecha</th><th>Concepto</th><th>Total</th></tr></thead>
          <tbody>
            {facturasVencidas.slice(0, 15).map(f => {
              const p = data.proyectos.find(x => x.id === f.id_proyecto);
              return (
                <tr key={f.id} onClick={() => openProject(f.id_proyecto)} style={{ cursor: 'pointer' }}>
                  <td className="mono">{f.folio}</td>
                  <td>{p?.sucursal}</td>
                  <td className="mono">{fmtDate(f.fecha)}</td>
                  <td>{f.concepto}</td>
                  <td className="mono"><strong>{fmtMoney(f.total)}</strong></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Section>
    </div>
  );
}

Object.assign(window, { ValidacionesTab, RevisionesTab, CierreAdminTab, CatalogosPage, AlertasPage });
