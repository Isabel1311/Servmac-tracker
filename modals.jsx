// Modal & Toast system + all edit/add modals
// Triggered by window.SERVMAC_OPEN_MODAL(kind, ctx)
// Saves mutate in-memory data, fire toast, force rerender via window.SERVMAC_RERENDER

(function () {
  const listeners = [];
  window.SERVMAC_SUBSCRIBE_MODAL = (fn) => { listeners.push(fn); return () => { const i = listeners.indexOf(fn); if (i>=0) listeners.splice(i,1); }; };
  window.SERVMAC_OPEN_MODAL = (kind, ctx) => listeners.forEach(fn => fn({ kind, ctx }));

  const toastQueue = [];
  const toastSubs = [];
  window.SERVMAC_TOAST_SUBSCRIBE = (fn) => { toastSubs.push(fn); return () => { const i = toastSubs.indexOf(fn); if (i>=0) toastSubs.splice(i,1); }; };
  window.SERVMAC_TOAST = (msg, opts = {}) => {
    const t = { id: Date.now() + Math.random(), msg, kind: opts.kind || 'success', icon: opts.icon };
    toastQueue.push(t);
    toastSubs.forEach(fn => fn([...toastQueue]));
    setTimeout(() => {
      const i = toastQueue.findIndex(x => x.id === t.id);
      if (i >= 0) toastQueue.splice(i, 1);
      toastSubs.forEach(fn => fn([...toastQueue]));
    }, 3600);
  };
})();

// ============== ToastHost ==============
function ToastHost() {
  const [toasts, setToasts] = React.useState([]);
  React.useEffect(() => window.SERVMAC_TOAST_SUBSCRIBE(setToasts), []);
  return (
    <div className="toast-host">
      {toasts.map(t => (
        <div key={t.id} className={'toast toast-' + t.kind}>
          <div className={'toast-icon toast-icon-' + t.kind}>
            <Icon name={t.icon || (t.kind === 'success' ? 'check' : t.kind === 'error' ? 'alert' : 'info')} size={16}/>
          </div>
          <div className="toast-msg">{t.msg}</div>
        </div>
      ))}
    </div>
  );
}

// ============== ModalHost ==============
function ModalHost({ data }) {
  const [active, setActive] = React.useState(null);
  React.useEffect(() => window.SERVMAC_SUBSCRIBE_MODAL(({ kind, ctx }) => setActive({ kind, ctx })), []);
  const close = () => setActive(null);
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!active) return null;
  const { kind, ctx } = active;
  const M = (window.MODAL_REGISTRY || MODAL_REGISTRY)[kind];
  if (!M) return null;

  return (
    <>
      <div className="modal-overlay open" onClick={close}/>
      <div className="modal-shell">
        <M data={data} ctx={ctx || {}} close={close}/>
      </div>
    </>
  );
}

// ============== Modal shell ==============
function Modal({ title, subtitle, icon, accent = 'orange', size = 'md', onClose, children, footer, hero }) {
  return (
    <div className={'modal modal-' + size}>
      <div className={'modal-head modal-accent-' + accent}>
        <div className="row" style={{ gap: 14, alignItems: 'center' }}>
          {icon && <div className={'modal-icon modal-icon-' + accent}><Icon name={icon} size={20}/></div>}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="modal-title">{title}</div>
            {subtitle && <div className="modal-subtitle">{subtitle}</div>}
          </div>
          <button className="modal-close" onClick={onClose}><Icon name="close" size={18}/></button>
        </div>
        {hero && <div className="modal-hero">{hero}</div>}
      </div>
      <div className="modal-body">{children}</div>
      {footer && <div className="modal-footer">{footer}</div>}
    </div>
  );
}

// ============== Form primitives ==============
function Field({ label, hint, required, span = 1, error, children }) {
  return (
    <label className="field" style={{ gridColumn: 'span ' + span }}>
      <div className="field-label">
        {label}
        {required && <span className="field-req">*</span>}
      </div>
      {children}
      {(hint || error) && <div className={'field-hint ' + (error ? 'err' : '')}>{error || hint}</div>}
    </label>
  );
}
const Inp = (p) => <input {...p} className={'inp ' + (p.className || '')}/>;
const Sel = ({ options, value, onChange, ...rest }) => (
  <select className="inp" value={value} onChange={e => onChange(e.target.value)} {...rest}>
    {options.map(o => typeof o === 'string'
      ? <option key={o} value={o}>{o}</option>
      : <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);
const Txt = (p) => <textarea {...p} className={'inp inp-area ' + (p.className || '')}/>;

function Currency({ value, onChange, placeholder }) {
  return (
    <div className="inp-with-prefix">
      <span className="inp-prefix">$</span>
      <input className="inp" type="number" inputMode="numeric" value={value ?? ''} onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))} placeholder={placeholder || '0'}/>
      <span className="inp-suffix">MXN</span>
    </div>
  );
}
function Toggle({ value, onChange, label }) {
  return (
    <button type="button" className={'toggle ' + (value ? 'on' : '')} onClick={() => onChange(!value)} aria-pressed={value}>
      <span className="toggle-knob"/>
      {label && <span className="toggle-label">{label}</span>}
    </button>
  );
}
function Chips({ value, onChange, options }) {
  return (
    <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
      {options.map(o => {
        const val = typeof o === 'string' ? o : o.value;
        const lbl = typeof o === 'string' ? o : o.label;
        return (
          <button key={val} type="button" className={'chip-pick ' + (value === val ? 'active' : '')} onClick={() => onChange(val)}>{lbl}</button>
        );
      })}
    </div>
  );
}

function FormGrid({ cols = 2, children }) {
  return <div className="form-grid" style={{ gridTemplateColumns: 'repeat(' + cols + ', 1fr)' }}>{children}</div>;
}

// ============== Helper: save + toast + rerender ==============
const flushSave = (msg) => {
  window.SERVMAC_RERENDER && window.SERVMAC_RERENDER();
  window.SERVMAC_TOAST(msg);
};

// =================================================================
// ================= NEW PROJECT ==================================
// =================================================================
function NewProjectModal({ data, close }) {
  const [f, setF] = React.useState({
    sucursal: '', cr: '', tipo: 'Obra Menor', asignacion: 'UDA', region: 'Noreste',
    proyecto: '', descripcion: '', importe: '', persona_servmac: '', persona_cliente: '',
    fecha_inicio: '', fecha_termino: '',
  });
  const U = (k) => (v) => setF(s => ({ ...s, [k]: v }));
  const save = () => {
    if (!f.sucursal || !f.proyecto) return window.SERVMAC_TOAST('Faltan campos requeridos', { kind: 'error' });
    const id = `${Date.now()}-${f.tipo}-${f.cr}-${f.region}-2026`;
    data.proyectos.unshift({
      id, cr: f.cr, tipo: f.tipo, asignacion: f.asignacion, sucursal: f.sucursal,
      proyecto: f.proyecto, descripcion: f.descripcion, region: f.region,
      importe_contratado: Number(f.importe) || 0,
      persona_servmac: f.persona_servmac, persona_cliente: f.persona_cliente,
      fecha_asignacion: data.today, fecha_inicio_prog: f.fecha_inicio, fecha_termino_prog: f.fecha_termino,
      activo: true, estatus: '05. Gestion por iniciar Obra', sub_estatus: 'Asignado',
      semanas_en_pipeline: 0, semanas_en_fase: 0, cambios_de_fase: 0, entregable: 'pendiente',
      fecha_meta: f.fecha_termino,
    });
    close(); flushSave('Proyecto «' + f.sucursal + '» dado de alta');
  };
  return (
    <Modal title="Nuevo proyecto" subtitle="Datos maestros · Tabla Proyectos" icon="plus" accent="orange" size="lg" onClose={close}
      footer={<>
        <button className="btn" onClick={close}>Cancelar</button>
        <button className="btn btn-accent" onClick={save}><Icon name="check" size={14}/> Dar de alta</button>
      </>}>
      <div className="form-section-head">Identificación</div>
      <FormGrid cols={3}>
        <Field label="Sucursal" required span={2}><Inp value={f.sucursal} onChange={e=>U('sucursal')(e.target.value)} placeholder="Ej. Monterrey Centro"/></Field>
        <Field label="CR" required><Inp value={f.cr} onChange={e=>U('cr')(e.target.value)} placeholder="1234"/></Field>
        <Field label="Tipo"><Sel value={f.tipo} onChange={U('tipo')} options={['Obra Menor','Obra Mayor','Mantenimiento','Imagen','Remodelación','Desmantelamiento']}/></Field>
        <Field label="Asignación"><Sel value={f.asignacion} onChange={U('asignacion')} options={['UDA','Adjudicación','Directa']}/></Field>
        <Field label="Región"><Sel value={f.region} onChange={U('region')} options={['Noreste','Norte','Occidente','Centro','Sureste','CDMX']}/></Field>
      </FormGrid>

      <div className="form-section-head">Descripción</div>
      <FormGrid cols={1}>
        <Field label="Proyecto" required><Inp value={f.proyecto} onChange={e=>U('proyecto')(e.target.value)} placeholder="Ej. Adecuaciones 2026"/></Field>
        <Field label="Descripción"><Txt rows="2" value={f.descripcion} onChange={e=>U('descripcion')(e.target.value)} placeholder="Alcance breve del proyecto"/></Field>
      </FormGrid>

      <div className="form-section-head">Asignación de equipo</div>
      <FormGrid cols={2}>
        <Field label="Responsable SERVMAC"><Sel value={f.persona_servmac} onChange={U('persona_servmac')} options={['','Yaresi','Vania','Carolina','Daniel','Sergio'].map(x=>({value:x,label:x||'— Seleccionar —'}))}/></Field>
        <Field label="Responsable cliente"><Inp value={f.persona_cliente} onChange={e=>U('persona_cliente')(e.target.value)} placeholder="Mauricio, Sofía..."/></Field>
      </FormGrid>

      <div className="form-section-head">Fechas y monto</div>
      <FormGrid cols={3}>
        <Field label="Inicio programado"><Inp type="date" value={f.fecha_inicio} onChange={e=>U('fecha_inicio')(e.target.value)}/></Field>
        <Field label="Término programado"><Inp type="date" value={f.fecha_termino} onChange={e=>U('fecha_termino')(e.target.value)}/></Field>
        <Field label="Importe contratado"><Currency value={f.importe ? Number(f.importe) : null} onChange={v=>U('importe')(v)}/></Field>
      </FormGrid>
    </Modal>
  );
}

// =================================================================
// ================= EDIT PROJECT =================================
// =================================================================
function EditProjectModal({ data, ctx, close }) {
  const p = data.proyectos.find(x => x.id === ctx.projectId);
  const meta = window.SERVMAC_EXTRAS.proyectos_meta[ctx.projectId];
  const [f, setF] = React.useState({ ...p });
  const [m, setM] = React.useState({ ...(meta || {}) });
  const [section, setSection] = React.useState('maestros');
  const U = (k) => (v) => setF(s => ({ ...s, [k]: v }));
  const UM = (k) => (v) => setM(s => ({ ...s, [k]: v }));
  const save = () => {
    Object.assign(p, f);
    if (meta) Object.assign(meta, m);
    close(); flushSave('Proyecto actualizado');
  };
  if (!p) return null;
  const sections = [
    { k: 'maestros',  l: 'Maestros',     i: 'folder' },
    { k: 'codigos',   l: 'Códigos',      i: 'box' },
    { k: 'direccion', l: 'Dirección',    i: 'pin' },
    { k: 'fechas',    l: 'Fechas',       i: 'calendar' },
    { k: 'importes',  l: 'Importes',     i: 'money' },
    { k: 'equipo',    l: 'Equipo',       i: 'users' },
  ];
  return (
    <Modal title="Editar proyecto" subtitle={p.sucursal + ' · CR ' + p.cr} icon="edit" accent="blue" size="lg" onClose={close}
      footer={<>
        <button className="btn" onClick={close}>Cancelar</button>
        <button className="btn btn-accent" onClick={save}><Icon name="check" size={14}/> Guardar cambios</button>
      </>}>
      <div className="modal-section-tabs">
        {sections.map(s => (
          <button key={s.k} className={'modal-section-tab ' + (section === s.k ? 'active' : '')} onClick={() => setSection(s.k)}>
            <Icon name={s.i} size={13}/><span>{s.l}</span>
          </button>
        ))}
      </div>

      {section === 'maestros' && (
        <FormGrid cols={3}>
          <Field label="Sucursal" span={2}><Inp value={f.sucursal} onChange={e=>U('sucursal')(e.target.value)}/></Field>
          <Field label="CR"><Inp value={f.cr} onChange={e=>U('cr')(e.target.value)}/></Field>
          <Field label="Tipo"><Sel value={f.tipo} onChange={U('tipo')} options={window.SERVMAC_EXTRAS.catalogos.tipos_proyecto}/></Field>
          <Field label="Asignación"><Sel value={f.asignacion} onChange={U('asignacion')} options={window.SERVMAC_EXTRAS.catalogos.asignaciones}/></Field>
          <Field label="Región"><Sel value={f.region} onChange={U('region')} options={window.SERVMAC_EXTRAS.catalogos.regiones}/></Field>
          <Field label="Tipología"><Sel value={m.tipologia || ''} onChange={UM('tipologia')} options={window.SERVMAC_EXTRAS.catalogos.tipologias}/></Field>
          <Field label="Tipo preciario"><Sel value={m.tipo_preciario || ''} onChange={UM('tipo_preciario')} options={window.SERVMAC_EXTRAS.catalogos.tipos_preciario}/></Field>
          <Field label="Año asignación"><Inp type="number" value={m.anio_asignacion || ''} onChange={e=>UM('anio_asignacion')(Number(e.target.value))}/></Field>
          <Field label="Proyecto" span={3}><Inp value={f.proyecto} onChange={e=>U('proyecto')(e.target.value)}/></Field>
          <Field label="Descripción" span={3}><Txt rows="2" value={f.descripcion} onChange={e=>U('descripcion')(e.target.value)}/></Field>
        </FormGrid>
      )}

      {section === 'codigos' && (
        <FormGrid cols={2}>
          <Field label="Código UDA"><Inp value={m.codigo_uda || ''} onChange={e=>UM('codigo_uda')(e.target.value)}/></Field>
          <Field label="Código compras"><Inp value={m.codigo_compras || ''} onChange={e=>UM('codigo_compras')(e.target.value)}/></Field>
          <Field label="Contrato"><Inp value={m.contrato || ''} onChange={e=>UM('contrato')(e.target.value)}/></Field>
          <Field label="Orden de compra"><Inp value={m.orden_compra || ''} onChange={e=>UM('orden_compra')(e.target.value)}/></Field>
          <Field label="Anexo"><Inp value={m.anexo || ''} onChange={e=>UM('anexo')(e.target.value)}/></Field>
          <Field label="Anexo de obra"><Inp value={m.anexo_obra || ''} onChange={e=>UM('anexo_obra')(e.target.value)}/></Field>
          <Field label="Enlace contrato" span={2}><Inp value={m.enlace_contrato || ''} onChange={e=>UM('enlace_contrato')(e.target.value)} placeholder="https://drive.google.com/..."/></Field>
          <Field label="Enlace contrato firmado" span={2}><Inp value={m.enlace_contrato_firmado || ''} onChange={e=>UM('enlace_contrato_firmado')(e.target.value)}/></Field>
        </FormGrid>
      )}

      {section === 'direccion' && (
        <FormGrid cols={3}>
          <Field label="Dirección" span={3}><Inp value={m.direccion || ''} onChange={e=>UM('direccion')(e.target.value)}/></Field>
          <Field label="Estado" span={2}><Inp value={m.estado || ''} onChange={e=>UM('estado')(e.target.value)}/></Field>
          <Field label="Código postal"><Inp value={m.cp || ''} onChange={e=>UM('cp')(e.target.value)}/></Field>
          <Field label="URL Google Maps" span={3}><Inp value={m.maps_url || ''} onChange={e=>UM('maps_url')(e.target.value)}/></Field>
        </FormGrid>
      )}

      {section === 'fechas' && (
        <FormGrid cols={3}>
          <Field label="Asignación"><Inp type="date" value={f.fecha_asignacion} onChange={e=>U('fecha_asignacion')(e.target.value)}/></Field>
          <Field label="Inicio programado"><Inp type="date" value={f.fecha_inicio_prog} onChange={e=>U('fecha_inicio_prog')(e.target.value)}/></Field>
          <Field label="Término programado"><Inp type="date" value={f.fecha_termino_prog} onChange={e=>U('fecha_termino_prog')(e.target.value)}/></Field>
          <Field label="Fecha meta"><Inp type="date" value={f.fecha_meta || ''} onChange={e=>U('fecha_meta')(e.target.value)}/></Field>
          <Field label="Plazo (días)"><Inp type="number" value={m.plazo_dias || ''} onChange={e=>UM('plazo_dias')(Number(e.target.value))}/></Field>
          <Field label="Días desfase"><Inp type="number" value={m.dias_desfase || 0} onChange={e=>UM('dias_desfase')(Number(e.target.value))}/></Field>
        </FormGrid>
      )}

      {section === 'importes' && (
        <FormGrid cols={2}>
          <Field label="Importe contratado"><Currency value={f.importe_contratado} onChange={U('importe_contratado')}/></Field>
          <Field label="Importe acción"><Currency value={m.importe_accion} onChange={UM('importe_accion')}/></Field>
          <Field label="Importe certificación"><Currency value={m.importe_certificacion} onChange={UM('importe_certificacion')}/></Field>
          <Field label="Límite penalización"><Currency value={m.importe_limite_penalizacion} onChange={UM('importe_limite_penalizacion')}/></Field>
        </FormGrid>
      )}

      {section === 'equipo' && (
        <FormGrid cols={2}>
          <Field label="Responsable SERVMAC">
            <Sel value={f.persona_servmac || ''} onChange={U('persona_servmac')} options={['', ...window.SERVMAC_EXTRAS.catalogos.personas_servmac.map(x=>x.nombre)].map(x=>({value:x, label:x||'— Seleccionar —'}))}/>
          </Field>
          <Field label="Responsable cliente">
            <Sel value={f.persona_cliente || ''} onChange={U('persona_cliente')} options={['', ...window.SERVMAC_EXTRAS.catalogos.personas_cliente.map(x=>x.nombre)].map(x=>({value:x, label:x||'— Seleccionar —'}))}/>
          </Field>
          <Field label="Persona detonadora"><Inp value={m.persona_detonadora || ''} onChange={e=>UM('persona_detonadora')(e.target.value)}/></Field>
          <Field label="Supervisor"><Inp value={m.supervisor || ''} onChange={e=>UM('supervisor')(e.target.value)}/></Field>
        </FormGrid>
      )}
    </Modal>
  );
}

// =================================================================
// ================= ADD/EDIT HITO ================================
// =================================================================
function HitoModal({ data, ctx, close }) {
  const existing = ctx.hitoId ? data.hitos.find(h => h.id === ctx.hitoId) : null;
  const [f, setF] = React.useState(existing ? { ...existing } : {
    id_proyecto: ctx.projectId, tipo: 'Acta inicio', fecha_programada: '', fecha_real: '',
    estatus: 'pendiente', responsable: '', link: '',
  });
  const U = (k) => (v) => setF(s => ({ ...s, [k]: v }));
  const save = () => {
    if (existing) Object.assign(existing, f);
    else { f.id = 'H-' + Date.now(); data.hitos.push(f); }
    close(); flushSave(existing ? 'Hito actualizado' : 'Hito agregado');
  };
  return (
    <Modal title={existing ? 'Editar hito' : 'Agregar hito'} subtitle={'Proyecto ' + (ctx.projectId || '').slice(0,30)} icon="flag" accent="orange" size="md" onClose={close}
      footer={<>
        <button className="btn" onClick={close}>Cancelar</button>
        <button className="btn btn-accent" onClick={save}><Icon name="check" size={14}/> Guardar</button>
      </>}>
      <FormGrid cols={2}>
        <Field label="Tipo" span={2}>
          <Chips value={f.tipo} onChange={U('tipo')} options={['Acta inicio','Acta final','Certificación','Puesta operación','Carpeta cierre','Pago']}/>
        </Field>
        <Field label="Fecha programada" required><Inp type="date" value={f.fecha_programada || ''} onChange={e=>U('fecha_programada')(e.target.value)}/></Field>
        <Field label="Fecha real"><Inp type="date" value={f.fecha_real || ''} onChange={e=>U('fecha_real')(e.target.value)}/></Field>
        <Field label="Estatus">
          <Chips value={f.estatus} onChange={U('estatus')} options={[
            { value: 'pendiente', label: '○ Pendiente' },
            { value: 'cumplido',  label: '✓ Cumplido' },
            { value: 'atrasado',  label: '⚠ Atrasado' },
          ]}/>
        </Field>
        <Field label="Responsable"><Inp value={f.responsable} onChange={e=>U('responsable')(e.target.value)}/></Field>
        <Field label="Link Drive / soporte" span={2}><Inp value={f.link || ''} onChange={e=>U('link')(e.target.value)} placeholder="https://drive.google.com/..."/></Field>
      </FormGrid>
    </Modal>
  );
}

// =================================================================
// ================= ADD BITÁCORA =================================
// =================================================================
function BitacoraModal({ data, ctx, close }) {
  const [f, setF] = React.useState({
    id_proyecto: ctx.projectId, fecha: data.today, autor: '',
    clima: 'soleado', personal: 4, avance_pct: 0,
    actividades: '', observaciones: '', incidencias: '',
    fotos: 0,
  });
  const U = (k) => (v) => setF(s => ({ ...s, [k]: v }));
  const save = () => {
    if (!window.SERVMAC_EXTRAS.bitacora_obra) window.SERVMAC_EXTRAS.bitacora_obra = [];
    window.SERVMAC_EXTRAS.bitacora_obra.unshift({ ...f, id: 'BIT-' + Date.now() });
    close(); flushSave('Entrada de bitácora agregada');
  };
  return (
    <Modal title="Registrar bitácora de obra" subtitle="Reporte diario" icon="clipboard" accent="orange" size="lg" onClose={close}
      footer={<>
        <button className="btn" onClick={close}>Cancelar</button>
        <button className="btn btn-accent" onClick={save}><Icon name="check" size={14}/> Guardar entrada</button>
      </>}>
      <FormGrid cols={4}>
        <Field label="Fecha"><Inp type="date" value={f.fecha} onChange={e=>U('fecha')(e.target.value)}/></Field>
        <Field label="Autor"><Inp value={f.autor} onChange={e=>U('autor')(e.target.value)} placeholder="Residente"/></Field>
        <Field label="Clima">
          <Sel value={f.clima} onChange={U('clima')} options={['soleado','nublado','lluvia ligera','lluvia fuerte','frío']}/>
        </Field>
        <Field label="Personal en obra"><Inp type="number" min="0" value={f.personal} onChange={e=>U('personal')(Number(e.target.value))}/></Field>
        <Field label="% Avance reportado" span={4}>
          <div className="row" style={{ gap: 12, alignItems: 'center' }}>
            <input type="range" min="0" max="100" value={f.avance_pct} onChange={e=>U('avance_pct')(Number(e.target.value))} style={{ flex: 1 }}/>
            <div className="mono" style={{ fontSize: 18, fontWeight: 700, width: 56, textAlign: 'right' }}>{f.avance_pct}%</div>
          </div>
        </Field>
      </FormGrid>

      <div className="form-section-head">Detalle</div>
      <FormGrid cols={1}>
        <Field label="Actividades realizadas"><Txt rows="3" value={f.actividades} onChange={e=>U('actividades')(e.target.value)}/></Field>
        <Field label="Observaciones"><Txt rows="2" value={f.observaciones} onChange={e=>U('observaciones')(e.target.value)}/></Field>
        <Field label="Incidencias / pendientes"><Txt rows="2" value={f.incidencias} onChange={e=>U('incidencias')(e.target.value)}/></Field>
      </FormGrid>

      <div className="dropzone">
        <Icon name="upload" size={20}/>
        <div><strong>Adjuntar fotos del día</strong><div className="muted" style={{ fontSize: 12 }}>Arrastra o haz clic — JPG, PNG hasta 10MB</div></div>
      </div>
    </Modal>
  );
}

// =================================================================
// ================= ADD VISITA ===================================
// =================================================================
function VisitaModal({ data, ctx, close }) {
  const [f, setF] = React.useState({
    id_proyecto: ctx.projectId, fecha: data.today, hora: '09:00', duracion: 90,
    tipo: 'supervisión', participantes: '', objetivo: '', recordatorio: true,
  });
  const U = (k) => (v) => setF(s => ({ ...s, [k]: v }));
  const save = () => {
    flushSave('Visita agendada · enviada al calendario');
    close();
  };
  return (
    <Modal title="Agendar visita" subtitle="Calendario operativo" icon="calendar" accent="blue" size="md" onClose={close}
      footer={<>
        <button className="btn" onClick={close}>Cancelar</button>
        <button className="btn btn-accent" onClick={save}><Icon name="check" size={14}/> Agendar</button>
      </>}>
      <FormGrid cols={3}>
        <Field label="Fecha" required><Inp type="date" value={f.fecha} onChange={e=>U('fecha')(e.target.value)}/></Field>
        <Field label="Hora"><Inp type="time" value={f.hora} onChange={e=>U('hora')(e.target.value)}/></Field>
        <Field label="Duración (min)"><Inp type="number" min="15" step="15" value={f.duracion} onChange={e=>U('duracion')(Number(e.target.value))}/></Field>
        <Field label="Tipo" span={3}>
          <Chips value={f.tipo} onChange={U('tipo')} options={['supervisión','levantamiento','firma','entrega','junta cliente','recorrido']}/>
        </Field>
        <Field label="Participantes" span={3}><Inp value={f.participantes} onChange={e=>U('participantes')(e.target.value)} placeholder="Yaresi, Mauricio (cliente), residente"/></Field>
        <Field label="Objetivo" span={3}><Txt rows="2" value={f.objetivo} onChange={e=>U('objetivo')(e.target.value)}/></Field>
      </FormGrid>
      <div className="row between" style={{ marginTop: 12, padding: '10px 14px', background: 'var(--bg-soft)', borderRadius: 10, border: '1px solid var(--line)' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>Crear recordatorio</div>
          <div className="muted" style={{ fontSize: 12 }}>Notificar 1 día antes a participantes</div>
        </div>
        <Toggle value={f.recordatorio} onChange={U('recordatorio')}/>
      </div>
    </Modal>
  );
}

// =================================================================
// ================= ADD PAGO =====================================
// =================================================================
function PagoModal({ data, ctx, close }) {
  const fin = window.SERVMAC_EXTRAS.finanzas[ctx.projectId];
  const existing = ctx.pagoId ? fin.pagos.find(p => p.id === ctx.pagoId) : null;
  const [f, setF] = React.useState(existing ? { ...existing } : {
    fecha: data.today, tipo: 'Estimación 1', monto: 0, referencia: '', prefactura: '',
    estatus: 'pendiente cobro', metodo: 'Transferencia SPEI', comentario: '',
  });
  const U = (k) => (v) => setF(s => ({ ...s, [k]: v }));
  const save = () => {
    if (existing) Object.assign(existing, f);
    else fin.pagos.push({ ...f, id: 'PG-' + Date.now() });
    // recalc totales
    const cobrado = fin.pagos.filter(x => x.estatus === 'cobrado').reduce((s,x)=>s+x.monto,0);
    fin.totales.cobrado = cobrado;
    fin.totales.por_cobrar = fin.totales.contratado - cobrado;
    fin.totales.pct_cobrado = Math.round(cobrado / fin.totales.contratado * 100);
    close(); flushSave(existing ? 'Pago actualizado' : 'Pago registrado');
  };
  return (
    <Modal title={existing ? 'Editar pago' : 'Registrar pago'} subtitle="Movimiento financiero" icon="money" accent="green" size="md" onClose={close}
      footer={<>
        <button className="btn" onClick={close}>Cancelar</button>
        <button className="btn btn-accent" onClick={save}><Icon name="check" size={14}/> Guardar</button>
      </>}>
      <FormGrid cols={2}>
        <Field label="Tipo" span={2}>
          <Chips value={f.tipo} onChange={U('tipo')} options={['Anticipo','Estimación 1','Estimación 2','Estimación 3','Finiquito','Liberación de retención']}/>
        </Field>
        <Field label="Fecha"><Inp type="date" value={f.fecha} onChange={e=>U('fecha')(e.target.value)}/></Field>
        <Field label="Monto"><Currency value={f.monto} onChange={U('monto')}/></Field>
        <Field label="Referencia"><Inp value={f.referencia} onChange={e=>U('referencia')(e.target.value)} placeholder="EST-00123"/></Field>
        <Field label="Folio prefactura"><Inp value={f.prefactura} onChange={e=>U('prefactura')(e.target.value)} placeholder="PF-00123"/></Field>
        <Field label="Estatus" span={2}>
          <Chips value={f.estatus} onChange={U('estatus')} options={[
            { value:'pendiente solicitar', label:'○ Por solicitar' },
            { value:'pendiente cobro',     label:'◐ Pendiente cobro' },
            { value:'en revisión',         label:'⌛ En revisión' },
            { value:'cobrado',             label:'✓ Cobrado' },
          ]}/>
        </Field>
        <Field label="Método de pago" span={2}>
          <Sel value={f.metodo} onChange={U('metodo')} options={['Transferencia SPEI','Transferencia interbancaria','Cheque','Efectivo']}/>
        </Field>
        <Field label="Comentario" span={2}><Txt rows="2" value={f.comentario} onChange={e=>U('comentario')(e.target.value)}/></Field>
      </FormGrid>
    </Modal>
  );
}

// =================================================================
// ================= EDIT FIANZA ==================================
// =================================================================
function FianzaModal({ data, ctx, close }) {
  const fin = window.SERVMAC_EXTRAS.finanzas[ctx.projectId];
  const [f, setF] = React.useState({ ...fin.fianza });
  const U = (k) => (v) => setF(s => ({ ...s, [k]: v }));
  React.useEffect(() => {
    if (f.requiere && fin.importe_contratado) {
      const monto = Math.round(fin.importe_contratado * (f.porcentaje || 0) / 100);
      const costo = Math.round(monto * 0.012);
      setF(s => ({ ...s, monto_afianzado: monto, costo }));
    }
  }, [f.porcentaje, f.requiere]);
  const save = () => {
    Object.assign(fin.fianza, f);
    close(); flushSave('Fianza actualizada');
  };
  return (
    <Modal title="Fianza del proyecto" subtitle={'Importe contratado ' + fmtMoney(fin.importe_contratado)} icon="shield" accent="violet" size="md" onClose={close}
      footer={<>
        <button className="btn" onClick={close}>Cancelar</button>
        <button className="btn btn-accent" onClick={save}><Icon name="check" size={14}/> Guardar fianza</button>
      </>}
      hero={
        <div className="modal-hero-toggle">
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>¿Este proyecto requiere fianza?</div>
            <div className="muted" style={{ fontSize: 12 }}>Activa para configurar póliza, afianzadora y vigencia</div>
          </div>
          <Toggle value={f.requiere} onChange={U('requiere')}/>
        </div>
      }>
      {f.requiere ? (
        <>
          <FormGrid cols={3}>
            <Field label="% afianzado">
              <Chips value={f.porcentaje} onChange={U('porcentaje')} options={[{value:5,label:'5%'},{value:7,label:'7%'},{value:10,label:'10%'},{value:12,label:'12%'},{value:15,label:'15%'}]}/>
            </Field>
            <Field label="Monto afianzado"><Currency value={f.monto_afianzado} onChange={U('monto_afianzado')}/></Field>
            <Field label="Costo de la fianza"><Currency value={f.costo} onChange={U('costo')}/></Field>
            <Field label="Afianzadora">
              <Sel value={f.afianzadora || ''} onChange={U('afianzadora')} options={['','Aserta','Sofimex','Fianzas Atlas','ACE Fianzas','Berkley'].map(x=>({value:x,label:x||'— Seleccionar —'}))}/>
            </Field>
            <Field label="Póliza"><Inp value={f.poliza || ''} onChange={e=>U('poliza')(e.target.value)} placeholder="1234567"/></Field>
            <Field label="Estatus">
              <Chips value={f.estatus} onChange={U('estatus')} options={[
                {value:'vigente',label:'✓ Vigente'},
                {value:'por renovar',label:'⌛ Por renovar'},
                {value:'vencida',label:'⚠ Vencida'},
              ]}/>
            </Field>
            <Field label="Fecha de emisión"><Inp type="date" value={f.fecha_emision || ''} onChange={e=>U('fecha_emision')(e.target.value)}/></Field>
            <Field label="Fecha de vencimiento" span={2}><Inp type="date" value={f.fecha_vencimiento || ''} onChange={e=>U('fecha_vencimiento')(e.target.value)}/></Field>
            <Field label="Link soporte (Drive)" span={3}><Inp value={f.link || ''} onChange={e=>U('link')(e.target.value)} placeholder="https://drive.google.com/..."/></Field>
          </FormGrid>
        </>
      ) : (
        <div className="muted" style={{ padding: '20px 4px', fontSize: 13 }}>Este proyecto no requiere fianza.</div>
      )}
    </Modal>
  );
}

// =================================================================
// ================= EDIT ANTICIPO ================================
// =================================================================
function AnticipoModal({ data, ctx, close }) {
  const fin = window.SERVMAC_EXTRAS.finanzas[ctx.projectId];
  const [f, setF] = React.useState({ ...fin.anticipo });
  const U = (k) => (v) => setF(s => ({ ...s, [k]: v }));
  React.useEffect(() => {
    if (f.requiere && fin.importe_contratado) {
      setF(s => ({ ...s, monto: Math.round(fin.importe_contratado * (f.porcentaje || 0) / 100) }));
    }
  }, [f.porcentaje, f.requiere]);
  const save = () => {
    Object.assign(fin.anticipo, f);
    close(); flushSave('Anticipo actualizado');
  };
  return (
    <Modal title="Anticipo del proyecto" subtitle={'Importe contratado ' + fmtMoney(fin.importe_contratado)} icon="money" accent="orange" size="md" onClose={close}
      footer={<>
        <button className="btn" onClick={close}>Cancelar</button>
        <button className="btn btn-accent" onClick={save}><Icon name="check" size={14}/> Guardar anticipo</button>
      </>}
      hero={
        <div className="modal-hero-toggle">
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>¿Este proyecto contempla anticipo?</div>
            <div className="muted" style={{ fontSize: 12 }}>Define %, monto, prefactura y registro de pago</div>
          </div>
          <Toggle value={f.requiere} onChange={U('requiere')}/>
        </div>
      }>
      {f.requiere ? (
        <>
          <FormGrid cols={2}>
            <Field label="% de anticipo">
              <Chips value={f.porcentaje} onChange={U('porcentaje')} options={[{value:10,label:'10%'},{value:20,label:'20%'},{value:25,label:'25%'},{value:30,label:'30%'},{value:40,label:'40%'},{value:50,label:'50%'}]}/>
            </Field>
            <Field label="Monto del anticipo"><Currency value={f.monto} onChange={U('monto')}/></Field>
          </FormGrid>

          <div className="form-section-head">Prefactura</div>
          <div className="row between" style={{ padding: '10px 14px', background: 'var(--bg-soft)', borderRadius: 10, border: '1px solid var(--line)', marginBottom: 12 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>¿Se solicitó prefactura?</div>
              <div className="muted" style={{ fontSize: 12 }}>Si está activada, registra folio y fecha</div>
            </div>
            <Toggle value={f.prefactura_solicitada} onChange={U('prefactura_solicitada')}/>
          </div>
          {f.prefactura_solicitada && (
            <FormGrid cols={2}>
              <Field label="Folio prefactura"><Inp value={f.prefactura_folio || ''} onChange={e=>U('prefactura_folio')(e.target.value)} placeholder="PF-ANT-00123"/></Field>
              <Field label="Fecha de solicitud"><Inp type="date" value={f.fecha_solicitud || ''} onChange={e=>U('fecha_solicitud')(e.target.value)}/></Field>
            </FormGrid>
          )}

          <div className="form-section-head">Pago</div>
          <div className="row between" style={{ padding: '10px 14px', background: 'var(--bg-soft)', borderRadius: 10, border: '1px solid var(--line)', marginBottom: 12 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>¿Anticipo ya pagado?</div>
            </div>
            <Toggle value={f.pagado} onChange={U('pagado')}/>
          </div>
          {f.pagado && (
            <FormGrid cols={1}>
              <Field label="Fecha de pago"><Inp type="date" value={f.fecha_pago || ''} onChange={e=>U('fecha_pago')(e.target.value)}/></Field>
            </FormGrid>
          )}

          <FormGrid cols={1}>
            <Field label="Comentario"><Txt rows="2" value={f.comentario || ''} onChange={e=>U('comentario')(e.target.value)}/></Field>
          </FormGrid>
        </>
      ) : (
        <div className="muted" style={{ padding: '20px 4px', fontSize: 13 }}>Este proyecto no contempla anticipo.</div>
      )}
    </Modal>
  );
}

// =================================================================
// ================= ADD PROVEEDOR ================================
// =================================================================
function ProveedorModal({ data, ctx, close }) {
  const E = window.SERVMAC_EXTRAS;
  const [f, setF] = React.useState({
    proveedor_id: '', equipo: 'Cuadrilla A', personas: 4,
    rol: 'subcontratista principal', costo: 0, fecha_inicio: data.today, fecha_termino: '',
  });
  const U = (k) => (v) => setF(s => ({ ...s, [k]: v }));
  const save = () => {
    if (!f.proveedor_id) return window.SERVMAC_TOAST('Selecciona un proveedor', { kind: 'error' });
    if (!E.proyecto_proveedores) E.proyecto_proveedores = [];
    E.proyecto_proveedores.push({ id: 'PP-' + Date.now(), id_proyecto: ctx.projectId, ...f });
    close(); flushSave('Proveedor asignado al proyecto');
  };
  return (
    <Modal title="Asignar proveedor" subtitle="Subcontratista al proyecto" icon="truck" accent="blue" size="md" onClose={close}
      footer={<>
        <button className="btn" onClick={close}>Cancelar</button>
        <button className="btn btn-accent" onClick={save}><Icon name="check" size={14}/> Asignar</button>
      </>}>
      <FormGrid cols={2}>
        <Field label="Proveedor" span={2}>
          <Sel value={f.proveedor_id} onChange={U('proveedor_id')} options={[{value:'',label:'— Seleccionar proveedor —'},...E.proveedores.map(p=>({value:p.id,label:p.nombre+' · '+p.especialidad}))]}/>
        </Field>
        <Field label="Equipo / Cuadrilla"><Inp value={f.equipo} onChange={e=>U('equipo')(e.target.value)}/></Field>
        <Field label="Personas"><Inp type="number" min="1" value={f.personas} onChange={e=>U('personas')(Number(e.target.value))}/></Field>
        <Field label="Rol"><Sel value={f.rol} onChange={U('rol')} options={['subcontratista principal','especialista','soporte','proveedor de materiales']}/></Field>
        <Field label="Costo contratado"><Currency value={f.costo} onChange={U('costo')}/></Field>
        <Field label="Fecha de inicio"><Inp type="date" value={f.fecha_inicio} onChange={e=>U('fecha_inicio')(e.target.value)}/></Field>
        <Field label="Fecha de término"><Inp type="date" value={f.fecha_termino} onChange={e=>U('fecha_termino')(e.target.value)}/></Field>
      </FormGrid>
    </Modal>
  );
}

// =================================================================
// ================= ADD MATERIAL / FACTURA =======================
// =================================================================
function MaterialModal({ data, ctx, close }) {
  const E = window.SERVMAC_EXTRAS;
  const [f, setF] = React.useState({
    concepto: '', proveedor: '', cantidad: 1, unidad: 'pza', precio_unit: 0,
    fecha: data.today, folio: '', tipo: 'Material', estatus: 'recibido',
  });
  const U = (k) => (v) => setF(s => ({ ...s, [k]: v }));
  const total = (f.cantidad || 0) * (f.precio_unit || 0);
  const save = () => {
    if (!E.materiales) E.materiales = [];
    E.materiales.push({ id: 'M-' + Date.now(), id_proyecto: ctx.projectId, ...f, total });
    close(); flushSave('Material registrado · ' + fmtMoney(total));
  };
  return (
    <Modal title="Registrar material / factura" subtitle="Costo del proyecto" icon="box" accent="orange" size="md" onClose={close}
      footer={<>
        <button className="btn" onClick={close}>Cancelar</button>
        <button className="btn btn-accent" onClick={save}><Icon name="check" size={14}/> Guardar</button>
      </>}>
      <FormGrid cols={4}>
        <Field label="Tipo" span={2}>
          <Chips value={f.tipo} onChange={U('tipo')} options={['Material','Renta equipo','Servicio','Mano de obra']}/>
        </Field>
        <Field label="Estatus" span={2}>
          <Chips value={f.estatus} onChange={U('estatus')} options={['cotizado','solicitado','recibido','pagado']}/>
        </Field>
        <Field label="Concepto" span={4}><Inp value={f.concepto} onChange={e=>U('concepto')(e.target.value)} placeholder="Pintura vinílica acabado mate, 19L"/></Field>
        <Field label="Proveedor" span={2}><Inp value={f.proveedor} onChange={e=>U('proveedor')(e.target.value)}/></Field>
        <Field label="Folio factura"><Inp value={f.folio} onChange={e=>U('folio')(e.target.value)} placeholder="A-12345"/></Field>
        <Field label="Fecha"><Inp type="date" value={f.fecha} onChange={e=>U('fecha')(e.target.value)}/></Field>
        <Field label="Cantidad"><Inp type="number" min="0" step="0.01" value={f.cantidad} onChange={e=>U('cantidad')(Number(e.target.value))}/></Field>
        <Field label="Unidad"><Sel value={f.unidad} onChange={U('unidad')} options={['pza','m2','m3','ml','kg','lt','jornada','servicio']}/></Field>
        <Field label="Precio unitario"><Currency value={f.precio_unit} onChange={U('precio_unit')}/></Field>
        <Field label="Total">
          <div className="inp inp-disabled mono" style={{ fontWeight: 700, color: 'var(--orange-700)' }}>{fmtMoney(total)}</div>
        </Field>
      </FormGrid>
    </Modal>
  );
}

// =================================================================
// ================= MODAL REGISTRY ===============================
// =================================================================
// =================================================================
// ================= CONFIRM DELETE ===============================
// =================================================================
function ConfirmDeleteModal({ ctx, close }) {
  const confirm = () => { ctx.onConfirm && ctx.onConfirm(); close(); };
  return (
    <Modal title="¿Eliminar elemento?" subtitle={ctx.label ? '"' + ctx.label + '"' : 'Esta acción no se puede deshacer'} icon="trash" accent="red" size="sm" onClose={close}
      footer={<>
        <button className="btn" onClick={close}>Cancelar</button>
        <button className="btn btn-danger" onClick={confirm}><Icon name="trash" size={14}/> Eliminar</button>
      </>}>
      <p style={{ fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>
        Se eliminará permanentemente. Si forma parte de KPIs o reportes ya generados, estos no se modificarán retroactivamente.
      </p>
    </Modal>
  );
}

// =================================================================
// ================= BUG / BLOQUEO ================================
// =================================================================
function BugModal({ ctx, close }) {
  const [f, setF] = React.useState({
    titulo: '', severidad: 'media', categoria: 'operativo', responsable: '',
    descripcion: '', impacto_dias: 0,
  });
  const U = (k) => (v) => setF(s => ({ ...s, [k]: v }));
  const save = () => {
    if (!f.titulo) return window.SERVMAC_TOAST('Falta título', { kind: 'error' });
    const E = window.SERVMAC_EXTRAS;
    if (!E.bugs[ctx.projectId]) E.bugs[ctx.projectId] = [];
    E.bugs[ctx.projectId].push({ ...f, id: 'B-' + Date.now(), fecha_detectado: window.SERVMAC_DATA.today, estatus: 'abierto' });
    close(); flushSave('Bloqueo registrado');
  };
  return (
    <Modal title="Reportar bloqueo o bug" subtitle="Algo está retrasando este proyecto" icon="alert" accent="red" size="md" onClose={close}
      footer={<>
        <button className="btn" onClick={close}>Cancelar</button>
        <button className="btn btn-accent" onClick={save}><Icon name="check" size={14}/> Reportar</button>
      </>}>
      <FormGrid cols={2}>
        <Field label="Título" required span={2}><Inp value={f.titulo} onChange={e=>U('titulo')(e.target.value)} placeholder="Falta material en obra"/></Field>
        <Field label="Severidad">
          <Chips value={f.severidad} onChange={U('severidad')} options={[{value:'baja',label:'Baja'},{value:'media',label:'Media'},{value:'alta',label:'Alta'}]}/>
        </Field>
        <Field label="Categoría">
          <Chips value={f.categoria} onChange={U('categoria')} options={['operativo','administrativo','bloqueo','financiero']}/>
        </Field>
        <Field label="Responsable"><Inp value={f.responsable} onChange={e=>U('responsable')(e.target.value)}/></Field>
        <Field label="Días de impacto"><Inp type="number" min="0" value={f.impacto_dias} onChange={e=>U('impacto_dias')(Number(e.target.value))}/></Field>
        <Field label="Descripción" span={2}><Txt rows="3" value={f.descripcion} onChange={e=>U('descripcion')(e.target.value)} placeholder="¿Qué pasó y qué bloquea?"/></Field>
      </FormGrid>
    </Modal>
  );
}

// =================================================================
// ================= REVISIÓN DE EQUIPO ===========================
// =================================================================
function RevisionModal({ data, ctx, close }) {
  const E = window.SERVMAC_EXTRAS;
  const revs = E.revisiones[ctx.projectId] || (E.revisiones[ctx.projectId] = []);
  const [f, setF] = React.useState({
    fecha: data.today, avance_estimado: 50, avance_real: 50,
    resultado: 'en tiempo', notas: '', acuerdos: '',
    participantes: 'Yaresi Hernández, Daniel Cárdenas',
  });
  const U = (k) => (v) => setF(s => ({ ...s, [k]: v }));
  const save = () => {
    revs.push({
      id: 'R-' + Date.now(),
      numero: revs.length + 1,
      fecha: f.fecha,
      avance_estimado: Number(f.avance_estimado),
      avance_real: Number(f.avance_real),
      resultado: f.resultado,
      notas: f.notas,
      acuerdos: f.acuerdos,
      participantes: f.participantes.split(',').map(s => s.trim()).filter(Boolean),
    });
    close(); flushSave('Revisión registrada');
  };
  return (
    <Modal title="Registrar revisión de equipo" subtitle="Junta de seguimiento" icon="users" accent="blue" size="md" onClose={close}
      footer={<>
        <button className="btn" onClick={close}>Cancelar</button>
        <button className="btn btn-accent" onClick={save}><Icon name="check" size={14}/> Guardar revisión</button>
      </>}>
      <FormGrid cols={2}>
        <Field label="Fecha"><Inp type="date" value={f.fecha} onChange={e=>U('fecha')(e.target.value)}/></Field>
        <Field label="Resultado">
          <Chips value={f.resultado} onChange={U('resultado')} options={[{value:'en tiempo',label:'✓ En tiempo'},{value:'con observaciones',label:'⌛ Observaciones'},{value:'crítico',label:'⚠ Crítico'}]}/>
        </Field>
        <Field label="Avance estimado (%)"><Inp type="number" min="0" max="100" value={f.avance_estimado} onChange={e=>U('avance_estimado')(e.target.value)}/></Field>
        <Field label="Avance real (%)"><Inp type="number" min="0" max="100" value={f.avance_real} onChange={e=>U('avance_real')(e.target.value)}/></Field>
        <Field label="Participantes" span={2}><Inp value={f.participantes} onChange={e=>U('participantes')(e.target.value)} placeholder="Yaresi, Daniel, ..."/></Field>
        <Field label="Notas" span={2}><Txt rows="3" value={f.notas} onChange={e=>U('notas')(e.target.value)}/></Field>
        <Field label="Acuerdos" span={2}><Txt rows="2" value={f.acuerdos} onChange={e=>U('acuerdos')(e.target.value)} placeholder="Próximos pasos y compromisos"/></Field>
      </FormGrid>
    </Modal>
  );
}

// =================================================================
// ================= EDIT CIERRE ADMIN ============================
// =================================================================
function EditCierreModal({ ctx, close }) {
  const m = window.SERVMAC_EXTRAS.proyectos_meta[ctx.projectId];
  const [f, setF] = React.useState({ ...m });
  const U = (k) => (v) => setF(s => ({ ...s, [k]: v }));
  const save = () => { Object.assign(m, f); close(); flushSave('Cierre administrativo actualizado'); };
  if (!m) return null;
  return (
    <Modal title="Editar cierre administrativo" subtitle="Importes, fechas, estatus y bloqueos" icon="flag" accent="blue" size="lg" onClose={close}
      footer={<>
        <button className="btn" onClick={close}>Cancelar</button>
        <button className="btn btn-accent" onClick={save}><Icon name="check" size={14}/> Guardar</button>
      </>}>
      <div className="form-section-head">Estatus y bloqueos</div>
      <FormGrid cols={3}>
        <Field label="Estatus operativo"><Inp value={f.estatus_operativo} onChange={e=>U('estatus_operativo')(e.target.value)}/></Field>
        <Field label="Estatus cierre">
          <Sel value={f.estatus_cierre} onChange={U('estatus_cierre')} options={['no inicia','en revisión','aceptado parcial','aceptado total']}/>
        </Field>
        <Field label="Tipo de bloqueo">
          <Sel value={f.tipo_bloqueo} onChange={U('tipo_bloqueo')} options={['Sin bloqueo','Pendiente firma cliente','Pendiente acta','Pendiente factura','Pendiente conciliación','Observación interna']}/>
        </Field>
        <Field label="Aplica penalización"><Chips value={f.aplica_penalizacion ? 'si' : 'no'} onChange={v=>U('aplica_penalizacion')(v==='si')} options={[{value:'no',label:'No'},{value:'si',label:'Sí'}]}/></Field>
        <Field label="Aplica FIN 47"><Chips value={f.aplica_fin47 ? 'si' : 'no'} onChange={v=>U('aplica_fin47')(v==='si')} options={[{value:'no',label:'No'},{value:'si',label:'Sí'}]}/></Field>
        <Field label="Estatus certificación">
          <Sel value={f.estatus_certificacion} onChange={U('estatus_certificacion')} options={['pendiente','en proceso','emitida','observada']}/>
        </Field>
      </FormGrid>

      <div className="form-section-head">Fechas</div>
      <FormGrid cols={3}>
        <Field label="Recepción contrato"><Inp type="date" value={f.fecha_recepcion_contrato || ''} onChange={e=>U('fecha_recepcion_contrato')(e.target.value)}/></Field>
        <Field label="Firma interna"><Inp type="date" value={f.fecha_firma_interna || ''} onChange={e=>U('fecha_firma_interna')(e.target.value)}/></Field>
        <Field label="Envío certificación"><Inp type="date" value={f.fecha_envio_certificacion || ''} onChange={e=>U('fecha_envio_certificacion')(e.target.value)}/></Field>
        <Field label="Acta de inicio"><Inp type="date" value={f.fecha_acta_inicio || ''} onChange={e=>U('fecha_acta_inicio')(e.target.value)}/></Field>
        <Field label="Acta de cierre"><Inp type="date" value={f.fecha_acta_cierre || ''} onChange={e=>U('fecha_acta_cierre')(e.target.value)}/></Field>
        <Field label="Envío cierre"><Inp type="date" value={f.fecha_envio_cierre || ''} onChange={e=>U('fecha_envio_cierre')(e.target.value)}/></Field>
      </FormGrid>

      <div className="form-section-head">Importes</div>
      <FormGrid cols={3}>
        <Field label="Importe cierre enviado"><Currency value={f.importe_cierre_enviado} onChange={U('importe_cierre_enviado')}/></Field>
        <Field label="Importe cierre aceptado"><Currency value={f.importe_cierre_aceptado} onChange={U('importe_cierre_aceptado')}/></Field>
        <Field label="Importe CFE"><Currency value={f.importe_cfe} onChange={U('importe_cfe')}/></Field>
        <Field label="Número factura"><Inp value={f.num_factura || ''} onChange={e=>U('num_factura')(e.target.value)}/></Field>
        <Field label="Formato cierre" span={2}>
          <Sel value={f.formato_cierre} onChange={U('formato_cierre')} options={['Formato A','Formato B','Formato C']}/>
        </Field>
        <Field label="Observaciones" span={3}><Txt rows="2" value={f.observaciones || ''} onChange={e=>U('observaciones')(e.target.value)}/></Field>
      </FormGrid>
    </Modal>
  );
}

// =================================================================
// ================= CATÁLOGO ITEM ================================
// =================================================================
function CatalogoItemModal({ ctx, close }) {
  const list = window.SERVMAC_EXTRAS.catalogos?.[ctx.list] || (ctx.list === 'proveedores' ? window.SERVMAC_EXTRAS.proveedores : null);
  const E = window.SERVMAC_EXTRAS;
  const initial = ctx.kind === 'lista-simple' ? '' :
                  ctx.kind === 'cierre-check' ? { k:'', l:'' } :
                  ctx.kind === 'persona-servmac' ? { nombre: '', rol: '', email: '', telefono: '', activo: true } :
                  ctx.kind === 'persona-cliente' ? { nombre: '', empresa: 'BBVA', rol: '', email: '', activo: true } :
                  { nombre: '', especialidad: '', region: 'Noreste', rfc: '', nss: '', curp: '', ine: '', id_empresa: '', docs: {} };
  const [f, setF] = React.useState(initial);
  const U = (k) => (v) => setF(s => ({ ...s, [k]: v }));
  const save = () => {
    if (ctx.kind === 'lista-simple') {
      if (!f) return window.SERVMAC_TOAST('Falta valor', { kind:'error' });
      E.catalogos[ctx.list].push(f);
    } else if (ctx.kind === 'cierre-check') {
      if (!f.l) return window.SERVMAC_TOAST('Falta etiqueta', { kind:'error' });
      const slug = f.k || f.l.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
      E.catalogos.cierre_check_template.push({ k: slug, l: f.l });
    } else if (ctx.kind === 'proveedor-cat') {
      if (!f.nombre) return window.SERVMAC_TOAST('Falta nombre', { kind:'error' });
      E.proveedores.push({ id: 'P-' + Date.now(), ...f, rating: 4.0, equipos: [], telefono: '', email: '', direccion: '' });
    } else {
      if (!f.nombre) return window.SERVMAC_TOAST('Falta nombre', { kind:'error' });
      E.catalogos[ctx.list].push({ id: 'X-' + Date.now(), ...f });
    }
    close(); flushSave('Elemento agregado al catálogo');
  };
  const titles = {
    'persona-servmac': 'Agregar persona SERVMAC',
    'persona-cliente': 'Agregar persona cliente',
    'proveedor-cat':   'Agregar proveedor',
    'cierre-check':    'Agregar item al checklist de cierre',
    'lista-simple':    'Agregar a ' + ctx.list,
  };
  return (
    <Modal title={titles[ctx.kind]} icon="plus" accent="blue" size="md" onClose={close}
      footer={<>
        <button className="btn" onClick={close}>Cancelar</button>
        <button className="btn btn-accent" onClick={save}><Icon name="check" size={14}/> Agregar</button>
      </>}>
      {ctx.kind === 'lista-simple' ? (
        <FormGrid cols={1}><Field label="Valor" required><Inp value={f} onChange={e=>setF(e.target.value)} autoFocus/></Field></FormGrid>
      ) : ctx.kind === 'cierre-check' ? (
        <FormGrid cols={2}>
          <Field label="Etiqueta visible" required span={2}><Inp value={f.l} onChange={e=>U('l')(e.target.value)} placeholder="Acta de cierre firmada" autoFocus/></Field>
          <Field label="Clave (opcional, slug)" span={2}><Inp value={f.k} onChange={e=>U('k')(e.target.value)} placeholder="acta_cierre"/></Field>
        </FormGrid>
      ) : ctx.kind === 'persona-servmac' ? (
        <FormGrid cols={2}>
          <Field label="Nombre" required span={2}><Inp value={f.nombre} onChange={e=>U('nombre')(e.target.value)}/></Field>
          <Field label="Rol"><Inp value={f.rol} onChange={e=>U('rol')(e.target.value)} placeholder="Coordinadora, Supervisor..."/></Field>
          <Field label="Teléfono"><Inp value={f.telefono} onChange={e=>U('telefono')(e.target.value)}/></Field>
          <Field label="Email" span={2}><Inp value={f.email} onChange={e=>U('email')(e.target.value)}/></Field>
        </FormGrid>
      ) : ctx.kind === 'persona-cliente' ? (
        <FormGrid cols={2}>
          <Field label="Nombre" required span={2}><Inp value={f.nombre} onChange={e=>U('nombre')(e.target.value)}/></Field>
          <Field label="Empresa"><Inp value={f.empresa} onChange={e=>U('empresa')(e.target.value)}/></Field>
          <Field label="Rol"><Inp value={f.rol} onChange={e=>U('rol')(e.target.value)}/></Field>
          <Field label="Email" span={2}><Inp value={f.email} onChange={e=>U('email')(e.target.value)}/></Field>
        </FormGrid>
      ) : (
        <FormGrid cols={2}>
          <Field label="Nombre / Razón social" required span={2}><Inp value={f.nombre} onChange={e=>U('nombre')(e.target.value)}/></Field>
          <Field label="Especialidad"><Inp value={f.especialidad} onChange={e=>U('especialidad')(e.target.value)} placeholder="Obra civil, MEP..."/></Field>
          <Field label="Región"><Sel value={f.region} onChange={U('region')} options={['Noreste','Norte','Occidente','Centro','Sureste','CDMX','Bajío']}/></Field>
          <Field label="RFC"><Inp value={f.rfc} onChange={e=>U('rfc')(e.target.value)} placeholder="XAXX010101000"/></Field>
          <Field label="ID empresa"><Inp value={f.id_empresa} onChange={e=>U('id_empresa')(e.target.value)} placeholder="EMP-0000"/></Field>
          <Field label="NSS"><Inp value={f.nss} onChange={e=>U('nss')(e.target.value)} placeholder="11 dígitos"/></Field>
          <Field label="CURP"><Inp value={f.curp} onChange={e=>U('curp')(e.target.value)} placeholder="18 caracteres"/></Field>
          <Field label="INE / Identificación" span={2}><Inp value={f.ine} onChange={e=>U('ine')(e.target.value)} placeholder="Clave de elector"/></Field>
        </FormGrid>
      )}
    </Modal>
  );
}

const MODAL_REGISTRY = {
  'new-project':      NewProjectModal,
  'edit-project':     EditProjectModal,
  'hito':             HitoModal,
  'bitacora':         BitacoraModal,
  'visita':           VisitaModal,
  'pago':             PagoModal,
  'fianza':           FianzaModal,
  'anticipo':         AnticipoModal,
  'proveedor':        ProveedorModal,
  'material':         MaterialModal,
  'confirm-delete':   ConfirmDeleteModal,
  'bug':              BugModal,
  'revision':         RevisionModal,
  'edit-cierre':      EditCierreModal,
  'catalogo-item':    CatalogoItemModal,
};

window.MODAL_REGISTRY = MODAL_REGISTRY;

Object.assign(window, { ToastHost, ModalHost });
