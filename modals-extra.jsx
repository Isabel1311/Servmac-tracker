// Additional modals: PromptModal · ActividadModal · FacturaModal · InformeModal · DriveLinkModal · DocAdjuntoModal
// All register into MODAL_REGISTRY via window.SERVMAC_REGISTER_MODAL

// Generic prompt-as-modal — replaces native prompt() everywhere
function PromptModal({ ctx, close }) {
  const [v, setV] = React.useState(ctx.defaultValue ?? '');
  const submit = () => {
    if (ctx.onSubmit) ctx.onSubmit(v);
    close();
    if (ctx.toast !== false) window.SERVMAC_TOAST(ctx.toast || (ctx.title + ' actualizado'));
  };
  return (
    <Modal title={ctx.title || 'Ingresar valor'} subtitle={ctx.subtitle} icon={ctx.icon || 'edit'} accent={ctx.accent || 'blue'} size="sm" onClose={close}
      footer={<>
        <button className="btn" onClick={close}>Cancelar</button>
        <button className="btn btn-accent" onClick={submit}><Icon name="check" size={14}/> {ctx.cta || 'Guardar'}</button>
      </>}>
      <Field label={ctx.label || 'Valor'} required={ctx.required}>
        {ctx.type === 'textarea'
          ? <Txt rows="4" autoFocus value={v} onChange={e=>setV(e.target.value)} placeholder={ctx.placeholder}/>
          : ctx.type === 'date'
            ? <Inp type="date" autoFocus value={v} onChange={e=>setV(e.target.value)}/>
            : ctx.type === 'number'
              ? <Inp type="number" autoFocus value={v} min={ctx.min} max={ctx.max} onChange={e=>setV(e.target.value)}/>
              : <Inp autoFocus value={v} onChange={e=>setV(e.target.value)} placeholder={ctx.placeholder}/>}
      </Field>
      {ctx.hint && <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>{ctx.hint}</div>}
    </Modal>
  );
}

// Convenience helper
window.SERVMAC_PROMPT = (opts) => window.SERVMAC_OPEN_MODAL('prompt-modal', opts);

// Plan activity (add or edit)
function ActividadModal({ ctx, close }) {
  const E = window.SERVMAC_EXTRAS;
  const existing = ctx.activityId ? E.plan_actividades.find(a => a.id === ctx.activityId) : null;
  const [f, setF] = React.useState(existing ? { ...existing } : {
    nombre: '', fase: 'En obra', peso: 5, critica: false,
    planned_start: window.SERVMAC_DATA.today, planned_end: window.SERVMAC_DATA.today,
    real_start: window.SERVMAC_DATA.today, real_end: window.SERVMAC_DATA.today, avance: 0,
  });
  const U = (k) => (v) => setF(s => ({ ...s, [k]: v }));
  const save = () => {
    if (!f.nombre) return window.SERVMAC_TOAST('Falta nombre', { kind: 'error' });
    if (existing) Object.assign(existing, f);
    else E.plan_actividades.push({ ...f, id: 'A-' + Date.now(), id_proyecto: ctx.projectId });
    close(); flushSave(existing ? 'Actividad actualizada' : 'Actividad agregada');
  };
  return (
    <Modal title={existing ? 'Editar actividad' : 'Nueva actividad'} subtitle="Plan vs Real" icon="chart" accent="blue" size="md" onClose={close}
      footer={<>
        <button className="btn" onClick={close}>Cancelar</button>
        <button className="btn btn-accent" onClick={save}><Icon name="check" size={14}/> Guardar</button>
      </>}>
      <FormGrid cols={2}>
        <Field label="Nombre" required span={2}><Inp value={f.nombre} onChange={e=>U('nombre')(e.target.value)} placeholder="Albañilería"/></Field>
        <Field label="Fase">
          <Chips value={f.fase} onChange={U('fase')} options={['Gestión','En obra','Cierre']}/>
        </Field>
        <Field label="Peso (1-30)"><Inp type="number" min="1" max="30" value={f.peso} onChange={e=>U('peso')(Number(e.target.value))}/></Field>
        <Field label="Inicio planeado"><Inp type="date" value={f.planned_start} onChange={e=>U('planned_start')(e.target.value)}/></Field>
        <Field label="Fin planeado"><Inp type="date" value={f.planned_end} onChange={e=>U('planned_end')(e.target.value)}/></Field>
        <Field label="Inicio real"><Inp type="date" value={f.real_start} onChange={e=>U('real_start')(e.target.value)}/></Field>
        <Field label="Fin real"><Inp type="date" value={f.real_end} onChange={e=>U('real_end')(e.target.value)}/></Field>
        <Field label="% Avance" span={2}>
          <div className="row" style={{ gap: 12, alignItems: 'center' }}>
            <input type="range" min="0" max="100" value={f.avance} onChange={e=>U('avance')(Number(e.target.value))} style={{ flex: 1 }}/>
            <div className="mono" style={{ fontSize: 18, fontWeight: 700, width: 56, textAlign: 'right' }}>{f.avance}%</div>
          </div>
        </Field>
        <Field label="Ruta crítica" span={2}>
          <div className="row" style={{ gap: 8 }}>
            <Toggle value={f.critica} onChange={U('critica')}/>
            <span className="muted" style={{ fontSize: 12 }}>{f.critica ? 'Sí — su atraso afecta la fecha de término' : 'No — su atraso no compromete la entrega'}</span>
          </div>
        </Field>
      </FormGrid>
    </Modal>
  );
}

// Factura modal (add or edit)
function FacturaModal({ ctx, close }) {
  const E = window.SERVMAC_EXTRAS;
  const existing = ctx.facturaId ? E.facturas.find(f => f.id === ctx.facturaId) : null;
  const [f, setF] = React.useState(existing ? { ...existing } : {
    folio: '', fecha: window.SERVMAC_DATA.today, concepto: '', tipo: 'material',
    id_proveedor: '', subtotal: 0, iva: 0, total: 0,
    forma_pago: 'Transferencia SPEI', estatus_pago: 'pendiente',
  });
  const U = (k) => (v) => {
    setF(s => {
      const next = { ...s, [k]: v };
      if (k === 'subtotal') next.iva = Math.round(Number(v) * 0.16);
      if (k === 'subtotal' || k === 'iva') next.total = Number(next.subtotal || 0) + Number(next.iva || 0);
      return next;
    });
  };
  const save = () => {
    if (!f.folio || !f.concepto) return window.SERVMAC_TOAST('Faltan folio o concepto', { kind: 'error' });
    const payload = { ...f, subtotal: Number(f.subtotal), iva: Number(f.iva), total: Number(f.total) };
    if (existing) Object.assign(existing, payload);
    else E.facturas.push({ ...payload, id: 'F-' + Date.now(), id_proyecto: ctx.projectId });
    close(); flushSave(existing ? 'Factura actualizada' : 'Factura registrada');
  };
  return (
    <Modal title={existing ? 'Editar factura' : 'Nueva factura / CFDI'} subtitle="Soporte fiscal de pago" icon="money" accent="green" size="md" onClose={close}
      footer={<>
        <button className="btn" onClick={close}>Cancelar</button>
        <button className="btn btn-accent" onClick={save}><Icon name="check" size={14}/> Guardar</button>
      </>}>
      <FormGrid cols={2}>
        <Field label="Folio" required><Inp value={f.folio} onChange={e=>U('folio')(e.target.value)} placeholder="A-12345"/></Field>
        <Field label="Fecha"><Inp type="date" value={f.fecha} onChange={e=>U('fecha')(e.target.value)}/></Field>
        <Field label="Concepto" required span={2}><Inp value={f.concepto} onChange={e=>U('concepto')(e.target.value)}/></Field>
        <Field label="Tipo">
          <Sel value={f.tipo} onChange={U('tipo')} options={['material','servicio','subcontrato','mano de obra']}/>
        </Field>
        <Field label="Proveedor">
          <Sel value={f.id_proveedor} onChange={U('id_proveedor')} options={[{value:'',label:'— Seleccionar —'},...E.proveedores.map(p=>({value:p.id,label:p.nombre}))]}/>
        </Field>
        <Field label="Subtotal"><Currency value={f.subtotal} onChange={U('subtotal')}/></Field>
        <Field label="IVA"><Currency value={f.iva} onChange={U('iva')}/></Field>
        <Field label="Total" span={2}>
          <div className="inp inp-disabled mono" style={{ fontWeight: 700, color: 'var(--green-600)' }}>{fmtMoney(f.total)}</div>
        </Field>
        <Field label="Forma de pago">
          <Sel value={f.forma_pago} onChange={U('forma_pago')} options={['Transferencia SPEI','Cheque','TDC empresarial','Efectivo']}/>
        </Field>
        <Field label="Estatus de pago">
          <Chips value={f.estatus_pago} onChange={U('estatus_pago')} options={[
            { value: 'programada', label:'○ Programada' },
            { value: 'pendiente',  label:'◐ Pendiente' },
            { value: 'pagada',     label:'✓ Pagada' },
            { value: 'vencida',    label:'⚠ Vencida' },
          ]}/>
        </Field>
      </FormGrid>
    </Modal>
  );
}

// Drive link modal — replaces prompt for URL editing
function DriveLinkModal({ ctx, close }) {
  const [v, setV] = React.useState(ctx.current || '');
  const save = () => {
    ctx.onSubmit(v);
    close();
    window.SERVMAC_TOAST('Link actualizado');
  };
  return (
    <Modal title="Link a Drive" subtitle={ctx.subtitle || 'Carpeta o documento en Google Drive'} icon="link" accent="blue" size="sm" onClose={close}
      footer={<>
        <button className="btn" onClick={close}>Cancelar</button>
        <button className="btn btn-accent" onClick={save}><Icon name="check" size={14}/> Guardar link</button>
      </>}>
      <Field label="URL"><Inp autoFocus value={v} onChange={e=>setV(e.target.value)} placeholder="https://drive.google.com/..."/></Field>
      {ctx.current && (
        <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>
          <strong>Actual:</strong> <span className="mono">{ctx.current}</span>
        </div>
      )}
    </Modal>
  );
}

// Doc adjunto modal
function DocAdjuntoModal({ ctx, close }) {
  const [fileName, setFileName] = React.useState(ctx.current || '');
  const save = () => {
    ctx.onSubmit(fileName);
    close();
    window.SERVMAC_TOAST(ctx.docType + ' actualizado');
  };
  return (
    <Modal title={`Adjuntar ${ctx.docType}`} subtitle={ctx.proveedor} icon="folder" accent="orange" size="sm" onClose={close}
      footer={<>
        <button className="btn" onClick={close}>Cancelar</button>
        <button className="btn btn-accent" onClick={save}><Icon name="check" size={14}/> Guardar</button>
      </>}>
      <div className="dropzone" style={{ cursor: 'pointer' }}>
        <Icon name="upload" size={24}/>
        <div style={{ flex: 1 }}>
          <strong>Arrastra el archivo aquí</strong>
          <div className="muted" style={{ fontSize: 12 }}>PDF, JPG, PNG · hasta 10MB</div>
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <Field label="Nombre del archivo o link de referencia"><Inp value={fileName} onChange={e=>setFileName(e.target.value)} placeholder={ctx.docType + '_2026.pdf'}/></Field>
      </div>
    </Modal>
  );
}

// Informe / reporte del proyecto
function InformeModal({ data, ctx, close }) {
  const p = data.proyectos.find(x => x.id === ctx.projectId);
  const E = window.SERVMAC_EXTRAS;
  const meta = E.proyectos_meta[p.id] || {};
  const fin = E.finanzas[p.id] || {};
  const acts = E.plan_actividades.filter(a => a.id_proyecto === p.id);
  const bugs = E.bugs[p.id] || [];
  const revs = E.revisiones[p.id] || [];
  const bita = (E.bitacora_obra || []).filter(b => b.id_proyecto === p.id);
  const subs = E.proyecto_proveedores.filter(s => s.id_proyecto === p.id);

  const [opts, setOpts] = React.useState({
    avance: true, financiero: true, hitos: true, proveedores: true, bitacora: true,
    bloqueos: true, fotos: false, formato: 'ejecutivo',
  });
  const U = (k) => (v) => setOpts(s => ({ ...s, [k]: v }));

  const buildText = () => {
    const L = [];
    L.push(`INFORME DE PROYECTO`);
    L.push(`==================`);
    L.push(`Proyecto: ${p.sucursal}`);
    L.push(`CR: ${p.cr} · Contrato: ${meta.contrato || '—'}`);
    L.push(`Estatus: ${p.estatus} · ${p.entregable}`);
    L.push(`Generado: ${data.today}`);
    L.push('');
    if (opts.avance) {
      L.push(`AVANCE`);
      L.push(`Real: ${meta.real_pct || 0}% · Esperado: ${meta.planned_pct || 0}% · Desfase: ${meta.dias_desfase || 0} días`);
      L.push(`Plazo total: ${meta.plazo_dias || 0} días · Restan: ${meta.dias_restantes || 0}`);
      L.push('');
    }
    if (opts.financiero) {
      L.push(`FINANCIERO`);
      L.push(`Contratado: ${fmtMoneyFull(fin.totales?.contratado || 0)}`);
      L.push(`Cobrado: ${fmtMoneyFull(fin.totales?.cobrado || 0)} (${fin.totales?.pct_cobrado || 0}%)`);
      L.push(`Por cobrar: ${fmtMoneyFull(fin.totales?.por_cobrar || 0)}`);
      if (fin.fianza?.requiere) L.push(`Fianza: ${fin.fianza.porcentaje}% · ${fin.fianza.afianzadora} · ${fin.fianza.estatus}`);
      L.push('');
    }
    if (opts.proveedores && subs.length) {
      L.push(`PROVEEDORES`);
      subs.forEach(s => {
        const pv = E.proveedores.find(x => x.id === s.id_proveedor);
        L.push(`- ${pv?.nombre} · ${fmtMoneyFull(s.importe)} · ${s.estatus}`);
      });
      L.push('');
    }
    if (opts.hitos && acts.length) {
      L.push(`PLAN VS REAL (top 5 más atrasadas)`);
      acts.slice().sort((a,b) => (b.planned_end < data.today && a.planned_end < data.today ? a.avance - b.avance : 0)).slice(0,5).forEach(a => {
        L.push(`- ${a.nombre}: ${a.avance}% (planeado al ${a.planned_end})`);
      });
      L.push('');
    }
    if (opts.bloqueos && bugs.length) {
      L.push(`BLOQUEOS ACTIVOS`);
      bugs.forEach(b => L.push(`- [${b.severidad}] ${b.titulo} (${b.impacto_dias} días) · ${b.responsable}`));
      L.push('');
    }
    if (opts.bitacora && bita.length) {
      L.push(`ÚLTIMAS ENTRADAS DE BITÁCORA`);
      bita.slice(0,3).forEach(b => L.push(`- ${b.fecha}: ${b.descripcion} (avance ${b.avance_pct}%)`));
      L.push('');
    }
    L.push(`---`);
    L.push(`Responsable: ${p.persona_servmac}`);
    return L.join('\n');
  };

  const [preview, setPreview] = React.useState(false);
  const txt = buildText();

  const generar = (modo) => {
    if (modo === 'copiar') {
      navigator.clipboard?.writeText(txt);
      window.SERVMAC_TOAST('Informe copiado al portapapeles');
    } else if (modo === 'descargar') {
      const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `Informe_${p.cr}_${data.today}.txt`;
      document.body.appendChild(a); a.click(); a.remove();
      window.SERVMAC_TOAST('Informe descargado');
    } else if (modo === 'email') {
      const subject = encodeURIComponent(`Informe ${p.sucursal} · ${data.today}`);
      const body = encodeURIComponent(txt);
      window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    } else if (modo === 'whatsapp') {
      const body = encodeURIComponent(txt);
      window.open(`https://wa.me/?text=${body}`, '_blank');
    }
    close();
  };

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
    <Modal title="Generar informe del proyecto" subtitle={p.sucursal + ' · CR ' + p.cr} icon="download" accent="blue" size="lg" onClose={close}
      footer={<>
        <button className="btn" onClick={close}>Cerrar</button>
        <button className="btn btn-ghost" onClick={() => generar('copiar')}><Icon name="copy" size={14}/> Copiar</button>
        <button className="btn btn-ghost" onClick={() => generar('email')}><Icon name="mail" size={14}/> Email</button>
        <button className="btn btn-ghost" onClick={() => generar('whatsapp')}>WhatsApp</button>
        <button className="btn btn-accent" onClick={() => generar('descargar')}><Icon name="download" size={14}/> Descargar .txt</button>
      </>}>
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16 }}>
        <div>
          <div className="form-section-head" style={{ marginTop: 0 }}>Secciones a incluir</div>
          <div className="stack-sm">
            <Cb k="avance" label="Avance" desc="Real vs esperado · desfase en días"/>
            <Cb k="financiero" label="Financiero" desc="Contrato, cobrado, fianza, anticipo"/>
            <Cb k="proveedores" label="Proveedores" desc="Subcontratos asignados"/>
            <Cb k="hitos" label="Plan vs Real" desc="Actividades top con atraso"/>
            <Cb k="bloqueos" label="Bloqueos / bugs" desc="Issues abiertos con impacto"/>
            <Cb k="bitacora" label="Bitácora reciente" desc="Últimas 3 entradas de obra"/>
            <Cb k="fotos" label="Fotos adjuntas" desc="Anexar fotos del último corte"/>
          </div>
          <div className="form-section-head">Formato</div>
          <Chips value={opts.formato} onChange={U('formato')} options={['ejecutivo','técnico','financiero']}/>
        </div>
        <div>
          <div className="form-section-head" style={{ marginTop: 0 }}>Vista previa</div>
          <pre style={{ background: 'var(--bg-warm, #f8f9fc)', border: '1px solid var(--line)', borderRadius: 8, padding: 14, fontSize: 11.5, lineHeight: 1.55, whiteSpace: 'pre-wrap', maxHeight: 440, overflowY: 'auto', margin: 0, fontFamily: 'IBM Plex Mono, ui-monospace, monospace' }}>{txt}</pre>
        </div>
      </div>
    </Modal>
  );
}

// Fase del cronograma del proyecto
function FaseModal({ ctx, close }) {
  const E = window.SERVMAC_EXTRAS;
  const arr = E.cronograma_fases[ctx.projectId] || [];
  const existing = ctx.faseId ? arr.find(x => x.id === ctx.faseId) : null;
  const [f, setF] = React.useState(existing ? { ...existing } : {
    name: '', color: '#1E40AF',
    start: window.SERVMAC_DATA.today,
    end: window.SERVMAC_DATA.today,
  });
  const U = (k) => (v) => setF(s => ({ ...s, [k]: v }));
  const save = () => {
    if (!f.name) return window.SERVMAC_TOAST('Falta nombre', { kind: 'error' });
    if (existing) Object.assign(existing, f);
    else arr.push({ ...f, id: 'PH-' + Date.now(), tasks: [] });
    close(); flushSave(existing ? 'Fase actualizada' : 'Fase agregada');
  };
  const colors = ['#7C3AED','#1E40AF','#C04A0A','#15803D','#DC2626','#0EA5E9','#C58200','#9333EA'];
  return (
    <Modal title={existing ? 'Editar fase' : 'Nueva fase'} subtitle="Cronograma del proyecto" icon="flag" accent="blue" size="md" onClose={close}
      footer={<>
        <button className="btn" onClick={close}>Cancelar</button>
        <button className="btn btn-accent" onClick={save}><Icon name="check" size={14}/> Guardar</button>
      </>}>
      <FormGrid cols={2}>
        <Field label="Nombre de la fase" required span={2}><Inp value={f.name} onChange={e=>U('name')(e.target.value)} placeholder="Ej. Instalaciones MEP"/></Field>
        <Field label="Inicio"><Inp type="date" value={f.start} onChange={e=>U('start')(e.target.value)}/></Field>
        <Field label="Fin"><Inp type="date" value={f.end} onChange={e=>U('end')(e.target.value)}/></Field>
        <Field label="Color" span={2}>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            {colors.map(c => (
              <button key={c} type="button" onClick={() => U('color')(c)}
                      style={{ width: 32, height: 32, borderRadius: 8, border: f.color === c ? '3px solid var(--text)' : '1px solid var(--line)', background: c, cursor: 'pointer' }}/>
            ))}
          </div>
        </Field>
      </FormGrid>
    </Modal>
  );
}

// Tarea dentro de una fase
function TareaModal({ ctx, close }) {
  const E = window.SERVMAC_EXTRAS;
  const arr = E.cronograma_fases[ctx.projectId];
  const fase = arr?.find(p => p.id === ctx.faseId);
  if (!fase) return null;
  const existing = ctx.tareaId ? fase.tasks.find(t => t.id === ctx.tareaId) : null;
  const [f, setF] = React.useState(existing ? { ...existing, from_pct: Math.round(existing.from * 100), to_pct: Math.round(existing.to * 100) } : {
    name: '', from_pct: 0, to_pct: 100, hito_tipo: '', critica: false,
  });
  const U = (k) => (v) => setF(s => ({ ...s, [k]: v }));
  const save = () => {
    if (!f.name) return window.SERVMAC_TOAST('Falta nombre', { kind: 'error' });
    const from = Math.max(0, Math.min(1, f.from_pct / 100));
    const to = Math.max(from, Math.min(1, f.to_pct / 100));
    const payload = { name: f.name, from, to, critica: !!f.critica };
    if (f.hito_tipo) payload.hito_tipo = f.hito_tipo;
    if (existing) Object.assign(existing, payload);
    else fase.tasks.push({ ...payload, id: 'T-' + Date.now() });
    close(); flushSave(existing ? 'Tarea actualizada' : 'Tarea agregada');
  };
  return (
    <Modal title={existing ? 'Editar tarea' : 'Nueva tarea'} subtitle={'Fase: ' + fase.name} icon="check" accent="blue" size="md" onClose={close}
      footer={<>
        <button className="btn" onClick={close}>Cancelar</button>
        <button className="btn btn-accent" onClick={save}><Icon name="check" size={14}/> Guardar</button>
      </>}>
      <FormGrid cols={2}>
        <Field label="Nombre" required span={2}><Inp value={f.name} onChange={e=>U('name')(e.target.value)} placeholder="Ej. Cancelería"/></Field>
        <Field label={'Inicio dentro de la fase: ' + f.from_pct + '%'}>
          <input type="range" min="0" max="100" value={f.from_pct} onChange={e=>U('from_pct')(Number(e.target.value))} style={{ width:'100%' }}/>
        </Field>
        <Field label={'Fin dentro de la fase: ' + f.to_pct + '%'}>
          <input type="range" min="0" max="100" value={f.to_pct} onChange={e=>U('to_pct')(Number(e.target.value))} style={{ width:'100%' }}/>
        </Field>
        <Field label="Ligar a hito" hint="Asocia la tarea a un hito del proyecto" span={2}>
          <Sel value={f.hito_tipo || ''} onChange={U('hito_tipo')} options={[
            { value: '', label: '— Sin hito asociado —' },
            { value: 'Acta inicio', label: 'Acta inicio' },
            { value: 'Acta final', label: 'Acta final' },
            { value: 'Certificación', label: 'Certificación' },
            { value: 'Puesta operación', label: 'Puesta en operación' },
            { value: 'Carpeta cierre', label: 'Carpeta de cierre' },
            { value: 'Pago', label: 'Pago' },
          ]}/>
        </Field>
        <Field label="Ruta crítica" span={2}>
          <div className="row" style={{ gap: 8 }}>
            <Toggle value={!!f.critica} onChange={U('critica')}/>
            <span className="muted" style={{ fontSize: 12 }}>{f.critica ? 'Sí — su atraso afecta la entrega' : 'No'}</span>
          </div>
        </Field>
      </FormGrid>
    </Modal>
  );
}

// Register all
if (window.MODAL_REGISTRY) {
  Object.assign(window.MODAL_REGISTRY, {
    'prompt-modal':  PromptModal,
    'actividad':     ActividadModal,
    'factura':       FacturaModal,
    'drive-link':    DriveLinkModal,
    'doc-adjunto':   DocAdjuntoModal,
    'informe':       InformeModal,
    'fase':          FaseModal,
    'tarea':         TareaModal,
  });
}

Object.assign(window, { PromptModal, ActividadModal, FacturaModal, DriveLinkModal, DocAdjuntoModal, InformeModal, FaseModal, TareaModal });
