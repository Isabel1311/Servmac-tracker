// Plantillas, Fotos clasificadas, Resumen ejecutivo, Compartir, Settings, Sugerencias

// ============= PLANTILLAS PAGE =============
function PlantillasPage({ data, openProject }) {
  const E = window.SERVMAC_EXTRAS;
  const tpls = E.plantillas;
  const [selected, setSelected] = React.useState(null);

  const usar = (tpl) => window.SERVMAC_OPEN_MODAL('usar-plantilla', { plantillaId: tpl.id });

  return (
    <div className="stack-md">
      <div className="card" style={{ background: 'linear-gradient(135deg, var(--blue-900), var(--blue-700))', color: '#fff', border: 'none' }}>
        <div className="row" style={{ gap: 16 }}>
          <div style={{ fontSize: 32 }}>📋</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#FFB87A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Plantillas de proyecto</div>
            <h2 style={{ margin: '4px 0', color: '#fff' }}>Acelera la creación de proyectos similares</h2>
            <div style={{ fontSize: 13, color: '#b1c1dd' }}>Cada plantilla incluye fases, tareas, hitos y proveedores típicos. Clona, ajusta y listo.</div>
          </div>
          <button className="btn btn-accent">+ Nueva plantilla</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {tpls.map(t => (
          <div key={t.id} style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid var(--line)', borderTop: '4px solid ' + t.color, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="row" style={{ gap: 10 }}>
              <div style={{ fontSize: 32, background: t.color + '22', width: 52, height: 52, borderRadius: 12, display: 'grid', placeItems: 'center' }}>{t.icono}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{t.nombre}</div>
                <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{t.veces_usada} veces usada</div>
              </div>
            </div>
            <div className="muted" style={{ fontSize: 12.5, lineHeight: 1.5 }}>{t.descripcion}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, padding: '10px 0', borderTop: '1px dashed var(--line)', borderBottom: '1px dashed var(--line)' }}>
              <div style={{ textAlign: 'center' }}><div className="mono" style={{ fontSize: 16, fontWeight: 700 }}>{t.duracion_dias}</div><div className="muted" style={{ fontSize: 10 }}>días</div></div>
              <div style={{ textAlign: 'center' }}><div className="mono" style={{ fontSize: 16, fontWeight: 700 }}>{t.fases}</div><div className="muted" style={{ fontSize: 10 }}>fases</div></div>
              <div style={{ textAlign: 'center' }}><div className="mono" style={{ fontSize: 16, fontWeight: 700 }}>{t.tareas}</div><div className="muted" style={{ fontSize: 10 }}>tareas</div></div>
              <div style={{ textAlign: 'center' }}><div className="mono" style={{ fontSize: 16, fontWeight: 700 }}>{t.hitos}</div><div className="muted" style={{ fontSize: 10 }}>hitos</div></div>
            </div>
            <div className="row" style={{ gap: 6 }}>
              <button className="btn btn-sm btn-ghost" style={{ flex: 1 }} onClick={() => setSelected(t)}>Ver detalle</button>
              <button className="btn btn-sm btn-accent" style={{ flex: 1 }} onClick={() => usar(t)}><Icon name="plus" size={12}/> Usar plantilla</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============= FOTOS CLASIFICADAS TAB =============
function FotosTab({ project }) {
  const E = window.SERVMAC_EXTRAS;
  const list = E.fotos_clasificadas[project.id] || [];

  const grouped = {};
  list.forEach(f => { (grouped[f.etapa_detectada] = grouped[f.etapa_detectada] || []).push(f); });

  return (
    <div className="stack-md">
      <div className="card" style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', color: '#fff', border: 'none' }}>
        <div className="row" style={{ gap: 14 }}>
          <div style={{ background: 'rgba(242,107,31,0.2)', padding: 10, borderRadius: 10, fontSize: 24 }}>🤖</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#FFB87A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Auto-clasificación de fotos</div>
            <h3 style={{ margin: '4px 0', color: '#fff' }}>{list.length} fotos analizadas por IA</h3>
            <div style={{ fontSize: 12, color: '#b1c1dd' }}>Cada foto se clasifica por etapa de obra, se estima avance y se detectan condiciones inseguras.</div>
          </div>
          <button className="btn btn-accent"><Icon name="upload" size={14}/> Subir fotos</button>
        </div>
      </div>

      {Object.entries(grouped).map(([etapa, fotos]) => (
        <div key={etapa} className="card">
          <div className="card-head">
            <h3>{etapa}</h3>
            <span className="muted" style={{ fontSize: 12 }}>· {fotos.length} fotos · IA: {Math.round(fotos.reduce((s,f) => s + f.confianza, 0) / fotos.length * 100)}% confianza promedio</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {fotos.map(f => (
              <div key={f.id} style={{ background: 'var(--bg-soft, #f8f9fc)', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--line)' }}>
                <div style={{ height: 140, background: `linear-gradient(135deg, hsl(${(parseInt(f.id.slice(-2), 36) * 17) % 360}, 40%, 50%), hsl(${(parseInt(f.id.slice(-2), 36) * 17 + 60) % 360}, 50%, 35%))`, display: 'grid', placeItems: 'center', color: '#fff', fontSize: 12, fontWeight: 700, position: 'relative' }}>
                  📷
                  <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: 99, fontSize: 10 }}>{Math.round(f.confianza * 100)}%</div>
                </div>
                <div style={{ padding: 10 }}>
                  <div className="row" style={{ marginBottom: 4 }}>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{fmtDate(f.fecha)}</span>
                    <span className="pill pill-blue" style={{ marginLeft: 'auto', fontSize: 10 }}>{f.avance_estimado}% avance</span>
                  </div>
                  <div style={{ fontSize: 12, lineHeight: 1.4 }}>{f.observaciones_ia}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {list.length === 0 && <div className="card"><div className="fin-empty"><Icon name="upload" size={32}/><div><strong>Sin fotos aún</strong></div><div className="muted">Sube fotos del proyecto para clasificación automática</div></div></div>}
    </div>
  );
}

// ============= RESUMEN EJECUTIVO PAGE =============
function ResumenEjecutivoPage({ data, openProject }) {
  const E = window.SERVMAC_EXTRAS;
  const activos = data.proyectos.filter(p => p.activo);
  const importeTotal = activos.reduce((s,p) => s + p.importe_contratado, 0);

  const atorados = activos.filter(p => p.semanas_en_fase >= 4);
  const fueraTiempo = activos.filter(p => p.entregable === 'Fuera de tiempo');
  const enRiesgo = activos.filter(p => E.proyectos_meta?.[p.id]?.dias_desfase > 10);

  const facturasVencidas = (E.facturas || []).filter(f => f.estatus_pago === 'vencida');
  const montoVencido = facturasVencidas.reduce((s,f) => s + f.total, 0);
  const visitasSemana = (window.deriveVisitas ? window.deriveVisitas(data) : []).filter(v => {
    const d = new Date(v.fecha + 'T12:00:00Z');
    const today = new Date(data.today + 'T12:00:00Z');
    return (d - today) / 86400000 <= 7 && (d - today) >= 0;
  }).length;

  return (
    <div className="stack-md">
      <div className="card" style={{ background: 'linear-gradient(135deg, var(--orange-600), var(--orange-500))', color: '#fff', border: 'none' }}>
        <div className="row" style={{ gap: 16, alignItems: 'center' }}>
          <div style={{ fontSize: 36 }}>📊</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Resumen ejecutivo de la semana</div>
            <h2 style={{ margin: '4px 0', color: '#fff', fontSize: 26 }}>{fmtDateLong(data.today)}</h2>
            <div style={{ fontSize: 13, color: '#fff', opacity: 0.9 }}>Generado automáticamente · disponible cada lunes a las 8:00 AM</div>
          </div>
          <button className="btn" style={{ background: '#fff', color: 'var(--orange-700)', borderColor: '#fff' }}><Icon name="download" size={14}/> Descargar PDF</button>
        </div>
      </div>

      <div className="kpi-grid">
        <KPI featured="featured" label="Cartera total activa" value={fmtMoney(importeTotal)} delta={`${activos.length} proyectos`} deltaDir="flat"/>
        <KPI featured={atorados.length ? 'featured-orange' : ''} label="Atorados (≥4 sem)" value={atorados.length} delta={fmtMoney(atorados.reduce((s,p)=>s+p.importe_contratado,0))} deltaDir="down"/>
        <KPI featured={enRiesgo.length ? 'featured-red' : ''} label="En riesgo alto" value={enRiesgo.length} delta=">10 días desfase" deltaDir={enRiesgo.length ? 'down' : 'flat'}/>
        <KPI label="Visitas próximos 7d" value={visitasSemana}/>
      </div>

      <div className="card">
        <div className="card-head"><h3>📝 Lo más importante de esta semana</h3></div>
        <div className="stack-sm">
          <p><strong>1.</strong> {atorados.length > 0 ? <span><strong style={{ color:'var(--red-600)' }}>{atorados.length} proyectos</strong> llevan ≥4 semanas sin movimiento — concentran <strong>{fmtMoney(atorados.reduce((s,p)=>s+p.importe_contratado,0))}</strong> de importe.</span> : <span style={{ color: 'var(--green-600)' }}>Sin proyectos atorados esta semana ✓</span>}</p>
          <p><strong>2.</strong> {facturasVencidas.length > 0 ? <span><strong style={{ color:'var(--orange-700)' }}>{facturasVencidas.length} facturas vencidas</strong> por <strong>{fmtMoney(montoVencido)}</strong>. Priorizar gestión de cobro.</span> : <span style={{ color: 'var(--green-600)' }}>Todas las facturas al corriente ✓</span>}</p>
          <p><strong>3.</strong> {fueraTiempo.length > 0 ? <span><strong>{fueraTiempo.length}</strong> proyectos están marcados como "Fuera de tiempo". Evaluar plan de recuperación.</span> : <span>Todos los proyectos en tiempo</span>}</p>
          <p><strong>4.</strong> Visitas y citas programadas para los próximos 7 días: <strong>{visitasSemana}</strong>.</p>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>🎯 Acciones recomendadas para Dirección</h3></div>
        <div className="stack-sm">
          {atorados.slice(0, 3).map(p => (
            <div key={p.id} className="row" style={{ gap: 10, padding: '10px 12px', background: 'var(--bg-soft, #f8f9fc)', borderRadius: 8 }}>
              <span className="pill pill-red">prioritario</span>
              <span style={{ flex: 1 }}>Convocar revisión urgente de <strong>{p.sucursal}</strong> · {p.semanas_en_fase} sem en {statusMap[p.estatus]?.short}</span>
              <button className="btn btn-sm btn-ghost" onClick={() => openProject(p.id)}>Abrir →</button>
            </div>
          ))}
          {facturasVencidas.slice(0, 2).map(f => {
            const p = data.proyectos.find(x => x.id === f.id_proyecto);
            return (
              <div key={f.id} className="row" style={{ gap: 10, padding: '10px 12px', background: 'var(--bg-soft, #f8f9fc)', borderRadius: 8 }}>
                <span className="pill pill-orange">cobranza</span>
                <span style={{ flex: 1 }}>Gestionar cobro de <strong>{f.folio}</strong> ({fmtMoney(f.total)}) · {p?.sucursal}</span>
                <button className="btn btn-sm btn-ghost" onClick={() => openProject(f.id_proyecto)}>Abrir →</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============= SUGERENCIAS CARD (para Dashboard) =============
function SugerenciasCard({ openProject, navigate }) {
  const E = window.SERVMAC_EXTRAS;
  const sugs = E.sugerencias.slice(0, 5);
  if (sugs.length === 0) return null;

  return (
    <div className="card" style={{ background: 'linear-gradient(135deg, #fef9c3, #fff)', borderTop: '4px solid var(--orange-500)' }}>
      <div className="card-head">
        <h3 className="row" style={{ gap: 8 }}><span style={{ fontSize: 18 }}>✨</span> Sugerencias de Claude</h3>
        <span className="muted" style={{ fontSize: 11 }}>· {E.sugerencias.length} insights detectados</span>
      </div>
      <div className="stack-sm">
        {sugs.map(s => {
          const pillCls = s.prioridad === 'alta' ? 'pill-red' : s.prioridad === 'media' ? 'pill-orange' : 'pill-blue';
          return (
            <div key={s.id} style={{ padding: '12px 14px', background: '#fff', borderRadius: 10, border: '1px solid var(--line)' }}>
              <div className="row" style={{ gap: 8, marginBottom: 4 }}>
                <span className={'pill ' + pillCls}>{s.prioridad}</span>
                <strong style={{ fontSize: 13 }}>{s.titulo}</strong>
                <span className="muted" style={{ fontSize: 11, marginLeft: 'auto' }}>{s.sucursal}</span>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 8 }}>{s.detalle}</div>
              <div className="row" style={{ gap: 6 }}>
                <button className="btn btn-sm btn-accent" onClick={() => openProject(s.proyecto)}>{s.accion} →</button>
                <button className="btn btn-sm btn-ghost">Descartar</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============= COMPARTIR PÚBLICO MODAL =============
function CompartirPublicoModal({ data, ctx, close }) {
  const p = data.proyectos.find(x => x.id === ctx.projectId);
  const [opts, setOpts] = React.useState({ avance: true, hitos: true, fotos: false, financiero: false, contactos: true });
  const U = (k) => (v) => setOpts(s => ({ ...s, [k]: v }));
  const url = `https://servmac.app/p/${p?.id}?t=${Math.random().toString(36).slice(2,10)}`;

  const Cb = ({ k, label, desc }) => (
    <label className={'inf-cb ' + (opts[k] ? 'on' : '')} onClick={() => U(k)(!opts[k])}>
      <div className="inf-cb-box">{opts[k] && <Icon name="check" size={11}/>}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{label}</div>
        <div className="muted" style={{ fontSize: 11 }}>{desc}</div>
      </div>
    </label>
  );

  return (
    <Modal title="Compartir vista pública" subtitle={p?.sucursal + ' · CR ' + p?.cr} icon="link" accent="blue" size="md" onClose={close}
      footer={<>
        <button className="btn" onClick={close}>Cerrar</button>
        <button className="btn btn-ghost" onClick={() => { navigator.clipboard?.writeText(url); window.SERVMAC_TOAST('Link copiado'); }}><Icon name="copy" size={13}/> Copiar link</button>
        <button className="btn btn-accent" onClick={() => { window.SERVMAC_TOAST('Link público generado'); close(); }}>Generar link</button>
      </>}>
      <div className="form-section-head" style={{ marginTop: 0 }}>¿Qué incluir en la vista pública?</div>
      <div className="stack-sm">
        <Cb k="avance" label="Avance del proyecto" desc="Barra de progreso y fechas"/>
        <Cb k="hitos" label="Hitos" desc="Cumplidos y próximos"/>
        <Cb k="fotos" label="Galería de fotos" desc="Últimas fotos del avance"/>
        <Cb k="financiero" label="Información financiera" desc="⚠ Cuidado: contiene importes"/>
        <Cb k="contactos" label="Contactos del equipo" desc="Personas asignadas"/>
      </div>
      <div className="form-section-head">Link público</div>
      <div style={{ padding: 12, background: 'var(--bg-soft, #f8f9fc)', borderRadius: 8, fontFamily: 'IBM Plex Mono', fontSize: 12, wordBreak: 'break-all' }}>{url}</div>
      <div className="muted" style={{ fontSize: 11, marginTop: 8 }}>El link expira en 30 días · vista de sólo lectura · sin requerir login</div>
    </Modal>
  );
}

// ============= INCIDENTE HSE MODAL =============
function IncidenteModal({ ctx, close }) {
  const [f, setF] = React.useState({
    tipo: 'Casi-accidente', severidad: 'baja', descripcion: '', accion_correctiva: '',
    responsable: '', afectados: 0, horas_perdidas: 0, estatus: 'abierto',
    fecha: window.SERVMAC_DATA.today,
  });
  const U = (k) => (v) => setF(s => ({ ...s, [k]: v }));
  const save = () => {
    if (!f.descripcion) return window.SERVMAC_TOAST('Falta descripción', { kind: 'error' });
    const E = window.SERVMAC_EXTRAS;
    if (!E.incidentes[ctx.projectId]) E.incidentes[ctx.projectId] = [];
    E.incidentes[ctx.projectId].unshift({ ...f, id: 'HSE-' + Date.now() });
    close(); window.SERVMAC_RERENDER(); window.SERVMAC_TOAST('Incidente HSE registrado');
  };
  return (
    <Modal title="Reportar incidente HSE" subtitle="Seguridad e Higiene" icon="alert" accent="red" size="md" onClose={close}
      footer={<><button className="btn" onClick={close}>Cancelar</button><button className="btn btn-accent" onClick={save}><Icon name="check" size={14}/> Reportar</button></>}>
      <FormGrid cols={2}>
        <Field label="Fecha" required><Inp type="date" value={f.fecha} onChange={e=>U('fecha')(e.target.value)}/></Field>
        <Field label="Tipo">
          <Sel value={f.tipo} onChange={U('tipo')} options={['Casi-accidente','Condición insegura','Acto inseguro','Accidente leve','Accidente grave','Incidente ambiental']}/>
        </Field>
        <Field label="Severidad" span={2}>
          <Chips value={f.severidad} onChange={U('severidad')} options={[{value:'baja',label:'Baja'},{value:'media',label:'Media'},{value:'alta',label:'Alta'}]}/>
        </Field>
        <Field label="Descripción" required span={2}><Txt rows="3" value={f.descripcion} onChange={e=>U('descripcion')(e.target.value)} placeholder="¿Qué pasó? ¿Dónde? ¿Cuándo?"/></Field>
        <Field label="Acción correctiva" span={2}><Txt rows="2" value={f.accion_correctiva} onChange={e=>U('accion_correctiva')(e.target.value)} placeholder="Plan para evitar recurrencia"/></Field>
        <Field label="Responsable"><Inp value={f.responsable} onChange={e=>U('responsable')(e.target.value)}/></Field>
        <Field label="Estatus">
          <Sel value={f.estatus} onChange={U('estatus')} options={['abierto','en seguimiento','cerrado']}/>
        </Field>
        <Field label="Personas afectadas"><Inp type="number" min="0" value={f.afectados} onChange={e=>U('afectados')(Number(e.target.value))}/></Field>
        <Field label="Horas perdidas"><Inp type="number" min="0" value={f.horas_perdidas} onChange={e=>U('horas_perdidas')(Number(e.target.value))}/></Field>
      </FormGrid>
    </Modal>
  );
}

// ============= USAR PLANTILLA MODAL =============
function UsarPlantillaModal({ ctx, close }) {
  const E = window.SERVMAC_EXTRAS;
  const tpl = E.plantillas.find(x => x.id === ctx.plantillaId);
  const [f, setF] = React.useState({
    sucursal: '', cr: '', region: 'Noreste', importe: 0,
    fecha_inicio: window.SERVMAC_DATA.today, responsable: '',
  });
  const U = (k) => (v) => setF(s => ({ ...s, [k]: v }));
  if (!tpl) return null;
  const save = () => {
    if (!f.sucursal) return window.SERVMAC_TOAST('Falta sucursal', { kind: 'error' });
    const fin = new Date(f.fecha_inicio + 'T12:00:00Z');
    fin.setDate(fin.getDate() + tpl.duracion_dias);
    const id = `${Date.now()}-${tpl.id}`;
    window.SERVMAC_DATA.proyectos.unshift({
      id, cr: f.cr, tipo: 'Obra Menor', asignacion: 'UDA', sucursal: f.sucursal,
      proyecto: tpl.nombre, descripcion: tpl.descripcion, region: f.region,
      importe_contratado: f.importe || 0,
      persona_servmac: f.responsable, persona_cliente: '',
      fecha_asignacion: window.SERVMAC_DATA.today,
      fecha_inicio_prog: f.fecha_inicio,
      fecha_termino_prog: fin.toISOString().slice(0,10),
      activo: true, estatus: '05. Gestion por iniciar Obra', sub_estatus: 'Asignado',
      semanas_en_pipeline: 0, semanas_en_fase: 0, cambios_de_fase: 0, entregable: 'pendiente',
      fecha_meta: fin.toISOString().slice(0,10),
    });
    tpl.veces_usada = (tpl.veces_usada || 0) + 1;
    close(); window.SERVMAC_RERENDER(); window.SERVMAC_TOAST(`Proyecto creado desde "${tpl.nombre}"`);
  };
  return (
    <Modal title={'Usar plantilla: ' + tpl.nombre} subtitle={tpl.descripcion} icon="plus" accent="blue" size="md" onClose={close}
      footer={<><button className="btn" onClick={close}>Cancelar</button><button className="btn btn-accent" onClick={save}><Icon name="check" size={14}/> Crear proyecto</button></>}>
      <div style={{ padding: 12, background: tpl.color + '15', borderLeft: '3px solid ' + tpl.color, borderRadius: 6, marginBottom: 14 }}>
        <div className="row" style={{ gap: 16, fontSize: 12 }}>
          <span>📅 <strong>{tpl.duracion_dias}</strong> días</span>
          <span>📊 <strong>{tpl.fases}</strong> fases</span>
          <span>✓ <strong>{tpl.tareas}</strong> tareas</span>
          <span>🏁 <strong>{tpl.hitos}</strong> hitos</span>
        </div>
      </div>
      <FormGrid cols={2}>
        <Field label="Sucursal" required span={2}><Inp value={f.sucursal} onChange={e=>U('sucursal')(e.target.value)} placeholder="Ej. Monterrey Centro"/></Field>
        <Field label="CR"><Inp value={f.cr} onChange={e=>U('cr')(e.target.value)}/></Field>
        <Field label="Región"><Sel value={f.region} onChange={U('region')} options={['Noreste','Norte','Occidente','Centro','Sureste','CDMX','Bajío']}/></Field>
        <Field label="Importe contratado"><Currency value={f.importe} onChange={U('importe')}/></Field>
        <Field label="Fecha inicio"><Inp type="date" value={f.fecha_inicio} onChange={e=>U('fecha_inicio')(e.target.value)}/></Field>
        <Field label="Responsable" span={2}>
          <Sel value={f.responsable} onChange={U('responsable')} options={['', ...E.catalogos.personas_servmac.map(p => p.nombre)].map(x => ({ value: x, label: x || '— Seleccionar —' }))}/>
        </Field>
      </FormGrid>
    </Modal>
  );
}

// ============= SETTINGS (Recordatorios + Tema) PAGE =============
function SettingsPage() {
  const E = window.SERVMAC_EXTRAS;
  const [, refresh] = React.useReducer(x => x+1, 0);
  const r = E.recordatorios_config;
  const tema = E.tema;

  const applyTheme = () => {
    const root = document.documentElement;
    root.style.setProperty('--blue-600', tema.primario);
    root.style.setProperty('--blue-700', tema.primario);
    root.style.setProperty('--orange-500', tema.acento);
    root.style.setProperty('--orange-600', tema.acento);
    document.body.classList.toggle('dark', tema.modo === 'oscuro');
    document.body.dataset.densidad = tema.densidad;
    window.SERVMAC_TOAST('Tema aplicado');
  };

  const Toggle = ({ value, onChange }) => (
    <button type="button" className={'toggle ' + (value ? 'on' : '')} onClick={() => { onChange(!value); refresh(); }}>
      <span className="toggle-knob"/>
    </button>
  );

  const Color = ({ value, onChange, options }) => (
    <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
      {options.map(c => (
        <button key={c} type="button" onClick={() => { onChange(c); refresh(); }}
                style={{ width: 36, height: 36, borderRadius: 8, border: value === c ? '3px solid var(--text)' : '1px solid var(--line)', background: c, cursor: 'pointer' }}/>
      ))}
    </div>
  );

  return (
    <div className="stack-md">
      <div className="card">
        <div className="card-head"><h3>🎨 Tema y apariencia</h3></div>
        <div className="form-section-head" style={{ marginTop: 0 }}>Color primario</div>
        <Color value={tema.primario} onChange={v => tema.primario = v} options={['#1E40AF','#0F766E','#7C3AED','#DC2626','#0F172A','#15803D']}/>
        <div className="form-section-head">Color de acento</div>
        <Color value={tema.acento} onChange={v => tema.acento = v} options={['#F26B1F','#EC4899','#F59E0B','#10B981','#3B82F6','#A855F7']}/>
        <div className="form-section-head">Densidad de la interfaz</div>
        <Chips value={tema.densidad} onChange={v => { tema.densidad = v; refresh(); }} options={['compacto','normal','confortable']}/>
        <div className="row" style={{ marginTop: 16, gap: 8 }}>
          <button className="btn btn-accent" onClick={applyTheme}><Icon name="check" size={13}/> Aplicar tema</button>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>🔔 Recordatorios automáticos</h3></div>
        <div className="stack-sm">
          {[
            ['visitas_dia_antes', 'Visitas — 1 día antes'],
            ['hitos_3_dias_antes', 'Hitos próximos — 3 días antes'],
            ['facturas_vencer_5_dias', 'Facturas por vencer — 5 días antes'],
            ['fianza_renovacion_30_dias', 'Renovación de fianza — 30 días antes'],
            ['bitacora_no_actualizada_3_dias', 'Bitácora sin actualizar — 3 días'],
            ['bloqueos_sin_movimiento_7_dias', 'Bloqueos sin movimiento — 7 días'],
          ].map(([k, l]) => (
            <div key={k} className="row" style={{ padding: '10px 12px', background: 'var(--bg-soft, #f8f9fc)', borderRadius: 8 }}>
              <span style={{ flex: 1, fontSize: 13 }}>{l}</span>
              <Toggle value={r[k]} onChange={v => r[k] = v}/>
            </div>
          ))}
        </div>
        <div className="form-section-head">Canales de notificación</div>
        <div className="row" style={{ gap: 6 }}>
          {['app','email','whatsapp'].map(c => (
            <button key={c} className={'chip-pick ' + (r.canales.includes(c) ? 'active' : '')} onClick={() => {
              const i = r.canales.indexOf(c);
              if (i >= 0) r.canales.splice(i, 1); else r.canales.push(c);
              refresh();
            }}>{c}</button>
          ))}
        </div>
        <div className="form-section-head">Hora del resumen diario</div>
        <Inp type="time" value={r.hora_resumen_diario} onChange={e => { r.hora_resumen_diario = e.target.value; refresh(); }} style={{ maxWidth: 200 }}/>
      </div>
    </div>
  );
}

Object.assign(window, { PlantillasPage, FotosTab, ResumenEjecutivoPage, SugerenciasCard, CompartirPublicoModal, IncidenteModal, UsarPlantillaModal, SettingsPage });

// Register modals
if (window.MODAL_REGISTRY) {
  Object.assign(window.MODAL_REGISTRY, {
    'compartir-publico': CompartirPublicoModal,
    'incidente':         IncidenteModal,
    'usar-plantilla':    UsarPlantillaModal,
  });
}
