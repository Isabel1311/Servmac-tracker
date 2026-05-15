// Extended data: proveedores, materiales, bitácora, plan, inbox, notifications.
// All derived deterministically from SERVMAC_DATA so it stays in sync.

(function () {
  const D = window.SERVMAC_DATA;
  if (!D) return;

  function h(s){let x=2166136261>>>0;for(let i=0;i<s.length;i++){x^=s.charCodeAt(i);x=Math.imul(x,16777619)>>>0;}return x;}
  const pick = (arr, seed) => arr[seed % arr.length];
  const fmtISO = (d) => d.toISOString().slice(0,10);
  const today = D.today;
  const todayD = new Date(today + 'T12:00:00Z');

  // ===== Proveedores =====
  const provBase = [
    { id:'P-001', nombre:'Construplus Norte',     rfc:'CNN201503AB7', nss:'12345678901', curp:'CONS800101HNLNNS01', ine:'CNNRTE80010125H001', id_empresa:'EMP-1001', especialidad:'Obra civil',       region:'Noreste',  rating:4.6, telefono:'81 8341 2200', email:'contacto@construplusnorte.mx', direccion:'Av. Eugenio Garza Sada 4000, Monterrey, NL' },
    { id:'P-002', nombre:'Instalaciones MEP S.A.', rfc:'IME180712F22', especialidad:'Eléctrico / MEP',  region:'Centro',   rating:4.4, telefono:'55 5523 9012', email:'cuentas@mepinstalaciones.com', direccion:'Insurgentes Sur 1235, CDMX' },
    { id:'P-003', nombre:'Acabados del Bajío',     rfc:'ACB190308XX1', especialidad:'Acabados',         region:'Centro',   rating:4.7, telefono:'472 477 1801', email:'ventas@acabadosbajio.mx', direccion:'Blvd. Aeropuerto 145, León, Gto.' },
    { id:'P-004', nombre:'Climas y Refrigeración Peninsular', rfc:'CRP170902KP9', especialidad:'HVAC', region:'Sureste', rating:4.2, telefono:'999 925 4400', email:'servicio@climaspeninsular.com', direccion:'Calle 60 #312, Mérida, Yuc.' },
    { id:'P-005', nombre:'Vidrio y Cancelería Pacífico', rfc:'VCP160418GG3', especialidad:'Vidrio y aluminio', region:'Occidente', rating:4.5, telefono:'33 3640 7720', email:'cotiza@vidriopacifico.mx', direccion:'Av. Mariano Otero 2300, Guadalajara' },
    { id:'P-006', nombre:'Aceros y Estructuras del Noreste', rfc:'AEN180515BB5', especialidad:'Estructuras', region:'Noreste', rating:4.1, telefono:'81 8120 8800', email:'estructuras@aenmx.com', direccion:'Carr. Saltillo-Monterrey km 8, Apodaca, NL' },
    { id:'P-007', nombre:'Pisos Técnicos Industriales', rfc:'PTI190201DD8', especialidad:'Pisos epóxicos', region:'Noreste', rating:4.3, telefono:'81 1234 5678', email:'contacto@pisostecnicos.mx', direccion:'Av. Ruiz Cortines 2500, Guadalupe, NL' },
    { id:'P-008', nombre:'Seguridad Electrónica Total', rfc:'SET170810HH2', especialidad:'CCTV / Acceso', region:'Centro', rating:4.6, telefono:'55 4321 9876', email:'proyectos@setmx.com', direccion:'Vasco de Quiroga 3000, CDMX' },
  ];
  const equiposPorEspecialidad = {
    'Obra civil': [['Albañilería A',5],['Albañilería B',4],['Demolición',3]],
    'Eléctrico / MEP': [['Cuadrilla MEP 1',4],['Cuadrilla MEP 2',3]],
    'Acabados': [['Pintura',3],['Pisos cerámicos',4],['Carpintería',3]],
    'HVAC': [['Instalación HVAC',4],['Servicio HVAC',2]],
    'Vidrio y aluminio': [['Cancelería',4]],
    'Estructuras': [['Estructura A',6],['Soldadura',3]],
    'Pisos epóxicos': [['Aplicación piso',4]],
    'CCTV / Acceso': [['Instalación CCTV',3]],
  };

  const proveedores = provBase.map(p => ({
    ...p,
    equipos: (equiposPorEspecialidad[p.especialidad] || []).map(([n, ppl], i) => ({
      id: p.id + '-E' + (i+1), nombre: n, integrantes: ppl,
      lider: pick(['Jorge L.','Roberto S.','Sofía M.','Luis G.','Andrea P.','Miguel A.'], h(p.id+n)),
    })),
  }));

  // Assign 1–3 proveedores per project deterministically
  const proyecto_proveedores = []; // {id, id_proyecto, id_proveedor, scope, importe, importe_pagado, equipo_id, inicio, fin, estatus}
  const facturas = []; // {id, id_proyecto, id_proveedor, folio, fecha, concepto, tipo (material/servicio/subcontrato), subtotal, iva, total, estatus_pago (pagada/pendiente/vencida/programada), fecha_pago, forma_pago}
  const materiales = []; // {id, id_proyecto, descripcion, unidad, cantidad, costo_unit, total, proveedor, fecha, factura_id, estatus}
  const bitacora_obra = []; // {id, id_proyecto, fecha, autor, avance_pct, clima, personal, descripcion, fotos[], incidencias, siguiente}
  const plan_actividades = []; // {id, id_proyecto, nombre, fase, planned_start, planned_end, real_start, real_end, peso, avance, critica, dependencia}

  D.proyectos.forEach((p, idx) => {
    const seed = h(p.id);
    const nProv = 1 + (seed % 3);
    const used = new Set();
    let pickedProvs = [];
    for (let i = 0; i < nProv; i++) {
      let s = (seed + i * 977) % proveedores.length;
      while (used.has(s)) s = (s + 1) % proveedores.length;
      used.add(s);
      pickedProvs.push(proveedores[s]);
    }
    const importeBase = p.importe_contratado || 1000000;
    const subPct = [0.55, 0.30, 0.15];
    pickedProvs.forEach((pv, i) => {
      const sc = importeBase * (subPct[i] || 0.1);
      const subId = `${p.id}|${pv.id}`;
      const sd = h(subId);
      const equipo = pv.equipos[sd % pv.equipos.length];
      const pagado = p.estatus === '10. Finiquitado' ? sc
                   : p.estatus === '08. Mesa de cierres' ? sc * 0.95
                   : p.estatus === '07. Cierre Administrativo' ? sc * 0.75
                   : p.estatus === '06. En obra' ? sc * 0.45
                   : sc * 0.10;
      proyecto_proveedores.push({
        id: subId, id_proyecto: p.id, id_proveedor: pv.id, scope: pv.especialidad,
        importe: Math.round(sc), importe_pagado: Math.round(pagado),
        equipo_id: equipo?.id, equipo_nombre: equipo?.nombre,
        inicio: p.fecha_inicio_prog, fin: p.fecha_termino_prog,
        estatus: pagado >= sc * 0.95 ? 'cerrado' : pagado >= sc * 0.4 ? 'en curso' : 'iniciando',
      });

      // 2–6 facturas per provider per project
      const nFact = 2 + (sd % 5);
      const startDate = new Date(p.fecha_inicio_prog + 'T12:00:00Z');
      const endDate = new Date(p.fecha_termino_prog + 'T12:00:00Z');
      for (let f = 0; f < nFact; f++) {
        const fseed = h(subId + 'f' + f);
        const day = new Date(startDate);
        day.setUTCDate(startDate.getUTCDate() + Math.round((endDate - startDate) / 86400000 * f / nFact));
        const subtotal = Math.round((sc / nFact) * (0.7 + (fseed % 60) / 100));
        const iva = Math.round(subtotal * 0.16);
        const tipoFact = pick(['material','servicio','subcontrato','material'], fseed);
        const concepto = tipoFact === 'material' ? pick(['Cemento gris CPC 30R','Acero corrugado #4','Tablaroca 1/2"','Cable THW 12 AWG','Pintura vinílica blanca','Loseta cerámica 60x60','Tubería PVC 4"','Luminarias LED panel'], fseed)
                       : tipoFact === 'servicio' ? pick(['Renta de andamios','Flete materiales','Renta retroexcavadora','Limpieza fin de obra','Estudio de suelos'], fseed)
                       : pick(['Mano de obra albañilería','Mano de obra eléctrica','Mano de obra acabados','Instalación HVAC','Estructura metálica'], fseed);
        const today2 = new Date(today + 'T12:00:00Z');
        const isOverdue = day < today2 && (fseed % 7) === 0;
        const estatusFact = day < today2
          ? (isOverdue ? 'vencida' : (fseed % 3 === 0 ? 'pendiente' : 'pagada'))
          : 'programada';
        facturas.push({
          id: subId + '-F' + (f+1), id_proyecto: p.id, id_proveedor: pv.id,
          folio: 'A-' + (10000 + (fseed % 89999)),
          fecha: fmtISO(day), concepto, tipo: tipoFact,
          subtotal, iva, total: subtotal + iva,
          estatus_pago: estatusFact,
          fecha_pago: estatusFact === 'pagada' ? fmtISO(new Date(day.getTime() + 8*86400000)) : null,
          forma_pago: pick(['Transferencia SPEI','Cheque','TDC empresarial','Transferencia SPEI','Transferencia SPEI'], fseed),
        });
        if (tipoFact === 'material') {
          materiales.push({
            id: subId + '-M' + (f+1), id_proyecto: p.id,
            descripcion: concepto,
            unidad: pick(['ton','m','m²','m³','pza','rollo','sacos'], fseed),
            cantidad: 5 + (fseed % 150),
            costo_unit: 100 + (fseed % 800),
            total: subtotal,
            proveedor: pv.nombre, factura_id: subId + '-F' + (f+1),
            estatus: pick(['entregado','entregado','entregado','en almacén','programado','parcial'], fseed),
            fecha: fmtISO(day),
          });
        }
      }
    });

    // Bitácora — daily entries for active projects (last 14 working days)
    if (p.activo && (p.estatus === '06. En obra' || p.estatus === '07. Cierre Administrativo' || p.estatus === '05. Gestion por iniciar Obra')) {
      const days = (p.estatus === '06. En obra') ? 12 : 6;
      const personas = [p.persona_servmac];
      const climas = ['Soleado','Parcialmente nublado','Nublado','Soleado','Lluvia ligera','Soleado'];
      const incidenciasPool = ['Sin incidencias','Retraso de material de cancelería','Falta de personal en cuadrilla MEP','Lluvia detuvo trabajos por 2 horas','Visita de supervisión BBVA','Ajuste a plano por sitio','Sin incidencias','Sin incidencias'];
      const trabajos = {
        '05. Gestion por iniciar Obra': ['Levantamiento en sitio','Toma de medidas y fotos','Cotización con proveedores','Validación de plano arquitectónico','Reunión con sucursal','Tramitología municipal'],
        '06. En obra': ['Avance de albañilería en muros divisorios','Instalación de canalizaciones eléctricas','Colocación de loseta en piso área cajeros','Montaje de cancelería de aluminio','Aplicación de pintura primera mano','Conexionado de luminarias LED','Instalación de equipo HVAC','Pruebas y mediciones eléctricas','Detallado de acabados','Limpieza intermedia','Instalación de mobiliario fijo'],
        '07. Cierre Administrativo': ['Integración de carpeta de cierre','Recopilación de actas y soportes','Validación de planos as-built','Revisión final con cliente','Levantamiento de pendientes menores'],
      };
      const trabPool = trabajos[p.estatus];
      for (let d = days; d >= 1; d--) {
        const dt = new Date(todayD);
        dt.setUTCDate(todayD.getUTCDate() - d);
        if (dt.getUTCDay() === 0) continue; // skip sunday
        const sseed = h(p.id + 'b' + d);
        const trabajo = pick(trabPool, sseed);
        const incidencia = pick(incidenciasPool, sseed);
        const avancePct = p.estatus === '05. Gestion por iniciar Obra' ? Math.min(98, 5 + (12 - d) * 4 + (sseed % 5))
                       : p.estatus === '06. En obra' ? Math.min(95, 20 + (12 - d) * 6 + (sseed % 6))
                       : Math.min(99, 70 + (12 - d) * 3 + (sseed % 4));
        bitacora_obra.push({
          id: p.id + '-B' + d,
          id_proyecto: p.id,
          fecha: fmtISO(dt),
          autor: pick(personas.concat(['Residente obra','Supervisor SERVMAC']), sseed),
          avance_pct: avancePct,
          clima: pick(climas, sseed),
          personal: 4 + (sseed % 12),
          descripcion: trabajo + (sseed % 3 === 0 ? '. Avance conforme a programa.' : sseed % 3 === 1 ? '. Coordinación con cuadrillas de subcontrato.' : '. Se documenta en fotos adjuntas.'),
          incidencias: incidencia,
          siguiente: pick(['Continuar acabados','Iniciar instalaciones','Pruebas y entrega','Limpieza final','Coordinación con HVAC','Revisión con cliente'], sseed),
          fotos_count: 2 + (sseed % 8),
        });
      }
    }

    // Plan vs real — activities per phase
    const fases = [
      { nombre: 'Levantamiento y diseño',  fase: 'Gestión', peso: 8 },
      { nombre: 'Cotización y aprobación', fase: 'Gestión', peso: 7 },
      { nombre: 'Trámites municipales',    fase: 'Gestión', peso: 5 },
      { nombre: 'Demolición / preparación',fase: 'En obra', peso: 10, critica: true },
      { nombre: 'Albañilería',             fase: 'En obra', peso: 15, critica: true },
      { nombre: 'Instalaciones MEP',       fase: 'En obra', peso: 18, critica: true },
      { nombre: 'Acabados',                fase: 'En obra', peso: 16 },
      { nombre: 'Cancelería y vidrio',     fase: 'En obra', peso: 8 },
      { nombre: 'Mobiliario y equipo',     fase: 'En obra', peso: 5 },
      { nombre: 'Pruebas y entrega',       fase: 'En obra', peso: 4, critica: true },
      { nombre: 'Carpeta cierre',          fase: 'Cierre',  peso: 3 },
      { nombre: 'Trámite de pago',         fase: 'Cierre',  peso: 1 },
    ];
    const totDays = (new Date(p.fecha_termino_prog) - new Date(p.fecha_asignacion)) / 86400000;
    let acc = 0;
    const totalPeso = fases.reduce((s,f)=>s+f.peso,0);
    fases.forEach((f, fi) => {
      const startD = new Date(p.fecha_asignacion + 'T12:00:00Z');
      const startOffset = totDays * (acc / totalPeso);
      const endOffset = totDays * ((acc + f.peso) / totalPeso);
      acc += f.peso;
      const ps = new Date(startD); ps.setUTCDate(startD.getUTCDate() + Math.round(startOffset));
      const pe = new Date(startD); pe.setUTCDate(startD.getUTCDate() + Math.round(endOffset));
      // Real dates with drift
      const drift = ((h(p.id + 'a' + fi) % 14) - 4); // -4..+10
      const rs = new Date(ps); rs.setUTCDate(ps.getUTCDate() + Math.max(0, drift));
      const re = new Date(pe); re.setUTCDate(pe.getUTCDate() + drift);
      const elapsed = (todayD - rs) / 86400000;
      const dur = Math.max(1, (re - rs) / 86400000);
      let avance = Math.round(Math.min(100, Math.max(0, elapsed / dur * 100)));
      // Cap by project phase
      const phaseIdx = parseInt(p.estatus.slice(0,2)) || 5;
      if (phaseIdx <= 5 && f.fase === 'En obra') avance = Math.min(avance, 5);
      if (phaseIdx === 6 && f.fase === 'Cierre') avance = Math.min(avance, 10);
      if (phaseIdx >= 7 && f.fase === 'En obra') avance = Math.max(avance, 85);
      if (phaseIdx >= 10) avance = 100;
      plan_actividades.push({
        id: p.id + '-A' + fi, id_proyecto: p.id, nombre: f.nombre, fase: f.fase, peso: f.peso,
        critica: !!f.critica,
        planned_start: fmtISO(ps), planned_end: fmtISO(pe),
        real_start: fmtISO(rs), real_end: fmtISO(re),
        avance,
      });
    });
  });

  // ===== Inbox add-on (Gmail classifier outputs) =====
  const inboxBase = D.comunicaciones.slice(0, 80).map((c, i) => {
    const p = D.proyectos.find(p => p.id === c.id_proyecto);
    const seed = h(c.id);
    const intencion = pick(['cita_solicitada','documento_entregar','firma_solicitada','consulta_estatus','aprobacion_requerida','reporte_avance','aviso_pago','cita_solicitada','firma_solicitada'], seed);
    const accion = {
      cita_solicitada: 'Crear cita en Agenda',
      documento_entregar: 'Generar tarea de entrega',
      firma_solicitada: 'Programar firma',
      consulta_estatus: 'Enviar resumen automático',
      aprobacion_requerida: 'Notificar a responsable',
      reporte_avance: 'Adjuntar a bitácora',
      aviso_pago: 'Enviar a Finanzas',
    }[intencion];
    return {
      id: 'IN-' + c.id, id_comunicacion: c.id, id_proyecto: c.id_proyecto,
      proyecto_sucursal: p?.sucursal, proyecto_cr: p?.cr,
      remitente: c.origen, asunto: c.resumen.length > 70 ? c.resumen.slice(0,68)+'…' : c.resumen,
      preview: c.resumen,
      fecha: c.fecha, tipo: c.tipo,
      intencion, accion,
      confianza: 0.55 + ((seed % 45) / 100),
      estatus: pick(['nuevo','nuevo','sugerido','sugerido','procesado','ignorado'], seed),
      adjuntos: (seed % 4 === 0) ? 1 + (seed % 3) : 0,
    };
  }).sort((a, b) => b.fecha.localeCompare(a.fecha));

  // ===== Notificaciones (sintetizadas)
  const notifs = [];
  // Atrasados
  D.proyectos.filter(p => p.activo && p.entregable === 'Fuera de tiempo').slice(0, 8).forEach(p => {
    notifs.push({ id:'N-atr-'+p.id, tipo:'alerta', icono:'warn', titulo:'Proyecto fuera de tiempo', detalle:`${p.sucursal} · CR ${p.cr}`, proyecto:p.id, fecha:today, leido:false });
  });
  // Próximas visitas (next 3 días)
  D.hitos.filter(hh => hh.estatus !== 'cumplido').slice(0,6).forEach(hh => {
    const d = new Date(hh.fecha_programada + 'T12:00:00Z');
    const diff = (d - todayD) / 86400000;
    if (diff >= 0 && diff <= 3) {
      const p = D.proyectos.find(pp => pp.id === hh.id_proyecto);
      notifs.push({ id:'N-hit-'+hh.id, tipo:'recordatorio', icono:'clock', titulo: hh.tipo + ' programado', detalle:`${p?.sucursal} · ${hh.fecha_programada}`, proyecto:hh.id_proyecto, fecha:today, leido:false });
    }
  });
  // Propuestas del add-on
  inboxBase.filter(x => x.estatus === 'sugerido').slice(0, 6).forEach(x => {
    notifs.push({ id:'N-in-'+x.id, tipo:'addon', icono:'mail', titulo:'Add-on detectó: ' + x.intencion.replace('_',' '), detalle:`${x.proyecto_sucursal} · ${x.remitente}`, proyecto:x.id_proyecto, fecha:x.fecha, leido:false });
  });
  // Facturas vencidas
  facturas.filter(f => f.estatus_pago === 'vencida').slice(0, 5).forEach(f => {
    const p = D.proyectos.find(pp => pp.id === f.id_proyecto);
    notifs.push({ id:'N-fac-'+f.id, tipo:'alerta', icono:'warn', titulo:'Factura vencida ' + f.folio, detalle:`${p?.sucursal} · $${(f.total/1000).toFixed(0)}k`, proyecto:f.id_proyecto, fecha:f.fecha, leido:false });
  });
  notifs.sort((a,b) => b.fecha.localeCompare(a.fecha));

  // ===== Sucursales geo (approximate lat/lng by region)
  const regionGeo = {
    'Noreste':   { lat:25.67, lng:-100.31 }, // Monterrey
    'Noroeste':  { lat:32.50, lng:-117.04 }, // Tijuana
    'Centro':    { lat:19.43, lng:-99.13 },  // CDMX
    'Occidente': { lat:20.67, lng:-103.34 }, // Guadalajara
    'Sureste':   { lat:20.97, lng:-89.62 },  // Mérida
    'Sur':       { lat:16.85, lng:-99.90 },  // Acapulco
    'Norte':     { lat:28.63, lng:-106.07 }, // Chihuahua
    'Bajío':     { lat:21.12, lng:-101.68 }, // León
  };
  const sucursales = {};
  D.proyectos.forEach(p => {
    if (!p.sucursal) return;
    if (!sucursales[p.sucursal]) {
      const base = regionGeo[p.region] || { lat:23.5, lng:-102 };
      const seed = h(p.sucursal);
      sucursales[p.sucursal] = {
        nombre: p.sucursal, region: p.region,
        lat: base.lat + ((seed % 200) - 100) / 100,
        lng: base.lng + (((seed >>> 4) % 200) - 100) / 100,
        proyectos: [],
      };
    }
    sucursales[p.sucursal].proyectos.push(p.id);
  });

  // ===== Finanzas extra: fianza, anticipos, registro de pagos =====
  const finanzas = {};
  D.proyectos.forEach((p, idx) => {
    const seed = h(p.id);
    const fin = D.financiero.find(f => f.id_proyecto === p.id) || {};
    const importe = p.importe_contratado || fin.presupuestado || 500000;
    const requiereFianza = (seed % 10) >= 3; // 70%
    const pctFianza = pick([5, 7, 10, 10, 12], seed >>> 3);
    const costoFianza = Math.round(importe * pctFianza / 100 * 0.012);
    const fechaAsig = new Date(p.fecha_asignacion + 'T12:00:00Z');
    const fechaEmFianza = new Date(fechaAsig.getTime() + (3 + (seed % 10)) * 86400000);
    const fechaVencFianza = new Date(fechaEmFianza.getTime() + 365 * 86400000);

    const requiereAnticipo = (seed % 10) >= 4; // 60%
    const pctAnticipo = pick([20, 25, 30, 30, 40, 50], seed >>> 5);
    const montoAnticipo = Math.round(importe * pctAnticipo / 100);
    const prefacturaSolicitada = requiereAnticipo && ((seed >>> 7) % 4) !== 0;
    const fechaPrefactura = prefacturaSolicitada ? new Date(fechaAsig.getTime() + (7 + (seed % 14)) * 86400000) : null;
    const anticipoPagado = prefacturaSolicitada && ((seed >>> 9) % 3) !== 0;
    const fechaAnticipoPago = anticipoPagado ? new Date(fechaPrefactura.getTime() + (5 + (seed % 20)) * 86400000) : null;

    // Registro de pagos (estimaciones, anticipo, finiquito, retención)
    const pagos = [];
    if (anticipoPagado) {
      pagos.push({
        id: `PG-${p.id}-01`,
        fecha: fmtISO(fechaAnticipoPago),
        tipo: 'Anticipo',
        monto: montoAnticipo,
        referencia: `ANT-${(seed % 99999).toString().padStart(5,'0')}`,
        prefactura: `PF-${(seed % 99999).toString().padStart(5,'0')}`,
        estatus: 'cobrado',
        metodo: pick(['Transferencia SPEI','Transferencia interbancaria'], seed),
        comentario: `Pago de anticipo ${pctAnticipo}% sobre importe contratado`,
      });
    }

    // Estimaciones según avance del proyecto
    const numEstim = p.estatus === '10. Finiquitado' ? 3 + (seed % 2)
                   : p.estatus === '08. Mesa de cierres' ? 3
                   : p.estatus === '07. Cierre Administrativo' ? 2 + (seed % 2)
                   : p.estatus === '06. En obra' ? 1 + (seed % 2)
                   : 0;
    const baseRestante = importe - (anticipoPagado ? montoAnticipo : 0);
    const retencionPct = 5;
    const retencionMonto = Math.round(importe * retencionPct / 100);
    const subtotalEstim = baseRestante - (p.estatus === '10. Finiquitado' ? 0 : retencionMonto);

    for (let i = 0; i < numEstim; i++) {
      const fechaEst = new Date(fechaAsig.getTime() + (30 + i * 35 + (seed % 10)) * 86400000);
      const estEstatus = (i === numEstim - 1 && p.estatus !== '10. Finiquitado')
        ? pick(['en revisión','pendiente cobro','pendiente cobro'], seed + i)
        : 'cobrado';
      pagos.push({
        id: `PG-${p.id}-${(i+2).toString().padStart(2,'0')}`,
        fecha: fmtISO(fechaEst),
        tipo: `Estimación ${i+1}`,
        monto: Math.round(subtotalEstim / Math.max(numEstim,1)),
        referencia: `EST-${((seed+i) % 99999).toString().padStart(5,'0')}`,
        prefactura: `PF-${((seed+i*7) % 99999).toString().padStart(5,'0')}`,
        estatus: estEstatus,
        metodo: 'Transferencia SPEI',
        comentario: `Avance correspondiente a estimación ${i+1}`,
      });
    }
    if (p.estatus === '10. Finiquitado') {
      const fechaFiniq = new Date(fechaAsig.getTime() + (30 + numEstim * 35 + 20) * 86400000);
      pagos.push({
        id: `PG-${p.id}-${(numEstim+2).toString().padStart(2,'0')}`,
        fecha: fmtISO(fechaFiniq),
        tipo: 'Liberación de retención',
        monto: retencionMonto,
        referencia: `RET-${(seed % 99999).toString().padStart(5,'0')}`,
        prefactura: `PF-${((seed+99) % 99999).toString().padStart(5,'0')}`,
        estatus: 'cobrado',
        metodo: 'Transferencia SPEI',
        comentario: `Liberación de retención ${retencionPct}% tras finiquito`,
      });
    }

    const totalCobrado = pagos.filter(x => x.estatus === 'cobrado').reduce((s,x)=>s+x.monto,0);
    const totalEnRevision = pagos.filter(x => x.estatus === 'en revisión').reduce((s,x)=>s+x.monto,0);
    const totalPorCobrar = importe - totalCobrado - totalEnRevision;

    finanzas[p.id] = {
      importe_contratado: importe,
      fianza: {
        requiere: requiereFianza,
        porcentaje: pctFianza,
        monto_afianzado: Math.round(importe * pctFianza / 100),
        costo: costoFianza,
        fecha_emision: requiereFianza ? fmtISO(fechaEmFianza) : null,
        fecha_vencimiento: requiereFianza ? fmtISO(fechaVencFianza) : null,
        poliza: requiereFianza ? `${1200000 + (seed % 800000)}` : null,
        afianzadora: requiereFianza ? pick(['Aserta','Sofimex','Fianzas Atlas','ACE Fianzas'], seed >>> 11) : null,
        estatus: requiereFianza ? pick(['vigente','vigente','vigente','por renovar'], seed >>> 13) : null,
        link: requiereFianza ? '#drive-fianza-' + p.id : null,
      },
      anticipo: {
        requiere: requiereAnticipo,
        porcentaje: pctAnticipo,
        monto: montoAnticipo,
        prefactura_solicitada: prefacturaSolicitada,
        prefactura_folio: prefacturaSolicitada ? `PF-ANT-${(seed % 99999).toString().padStart(5,'0')}` : null,
        fecha_solicitud: prefacturaSolicitada ? fmtISO(fechaPrefactura) : null,
        fecha_pago: anticipoPagado ? fmtISO(fechaAnticipoPago) : null,
        pagado: anticipoPagado,
        estatus: !requiereAnticipo ? 'no aplica'
               : !prefacturaSolicitada ? 'pendiente solicitar'
               : !anticipoPagado ? 'esperando pago'
               : 'pagado',
        comentario: prefacturaSolicitada ? 'Prefactura cargada en plataforma del cliente' : '',
      },
      retencion: {
        porcentaje: retencionPct,
        monto: retencionMonto,
        liberada: p.estatus === '10. Finiquitado',
      },
      pagos: pagos.sort((a,b) => a.fecha.localeCompare(b.fecha)),
      totales: {
        contratado: importe,
        cobrado: totalCobrado,
        en_revision: totalEnRevision,
        por_cobrar: totalPorCobrar,
        pct_cobrado: Math.round(totalCobrado / importe * 100),
      },
    };
  });


  // ===== Catálogos editables =====
  const catalogos = {
    personas_servmac: [
      { id: 'PS-1', nombre: 'Yaresi Hernández', rol: 'Coordinadora obra', email: 'yaresi@servmac.mx', telefono: '81 1234 5678', activo: true },
      { id: 'PS-2', nombre: 'Vania Reyes', rol: 'Coordinadora obra', email: 'vania@servmac.mx', telefono: '81 1234 5679', activo: true },
      { id: 'PS-3', nombre: 'Carolina Ruiz', rol: 'Cierre administrativo', email: 'carolina@servmac.mx', telefono: '81 1234 5680', activo: true },
      { id: 'PS-4', nombre: 'Daniel Cárdenas', rol: 'Supervisor', email: 'daniel@servmac.mx', telefono: '81 1234 5681', activo: true },
      { id: 'PS-5', nombre: 'Sergio Martínez', rol: 'Supervisor', email: 'sergio@servmac.mx', telefono: '81 1234 5682', activo: true },
    ],
    personas_cliente: [
      { id: 'PC-1', nombre: 'Mauricio López', empresa: 'BBVA', rol: 'Detonador central', email: 'm.lopez@cliente.mx', activo: true },
      { id: 'PC-2', nombre: 'Sofía García', empresa: 'BBVA', rol: 'Supervisor', email: 's.garcia@cliente.mx', activo: true },
      { id: 'PC-3', nombre: 'Roberto Méndez', empresa: 'BBVA', rol: 'Compras', email: 'r.mendez@cliente.mx', activo: true },
    ],
    tipos_proyecto: ['Obra Menor','Obra Mayor','Mantenimiento','Imagen','Remodelación','Desmantelamiento','Adecuación'],
    asignaciones: ['UDA','Adjudicación','Directa','Catálogo'],
    regiones: ['Noreste','Norte','Occidente','Centro','Sureste','CDMX','Bajío'],
    tipologias: ['Sucursal urbana','Sucursal premium','CETI','Oficina corporativa','Cajero','Bodega'],
    tipos_preciario: ['Catálogo general','Catálogo especial','Precios unitarios','Precio alzado'],
    afianzadoras: ['Aserta','Sofimex','Fianzas Atlas','ACE Fianzas','Berkley'],
    tipos_bloqueo: ['Sin bloqueo','Pendiente firma cliente','Pendiente acta','Pendiente factura','Pendiente conciliación','Observación interna','Bloqueo financiero'],
    cierre_check_template: [
      { k:'acta_inicio',     l:'Acta de inicio firmada' },
      { k:'acta_cierre',     l:'Acta de cierre firmada' },
      { k:'certificacion',   l:'Certificación emitida' },
      { k:'planos_asbuilt',  l:'Planos as-built' },
      { k:'bitacora_obra',   l:'Bitácora de obra completa' },
      { k:'fotos_finales',   l:'Fotos finales del entregable' },
      { k:'memoria_calculo', l:'Memoria de cálculo / cantidades' },
      { k:'finiquito',       l:'Finiquito firmado' },
      { k:'fianza_liberada', l:'Fianza liberada' },
      { k:'factura',         l:'Factura emitida y aceptada' },
    ],
  };

  // ===== Project meta enriquecida =====
  const proyectos_meta = {};
  D.proyectos.forEach((p, idx) => {
    const seed = h(p.id);
    const asig = new Date(p.fecha_asignacion + 'T12:00:00Z');
    const init = p.fecha_inicio_prog ? new Date(p.fecha_inicio_prog + 'T12:00:00Z') : new Date(asig.getTime() + 14*86400000);
    const fin  = p.fecha_termino_prog ? new Date(p.fecha_termino_prog + 'T12:00:00Z') : new Date(init.getTime() + 60*86400000);
    const plazo = Math.round((fin - init) / 86400000);
    const today = new Date(D.today + 'T12:00:00Z');
    const elapsed = Math.max(0, Math.round((today - init) / 86400000));
    const planned_pct = init <= today ? Math.min(100, Math.round(elapsed / Math.max(plazo,1) * 100)) : 0;
    // real avance from snapshots / estatus
    const realByEstatus = {
      '05. Gestion por iniciar Obra': 5,
      '06. En obra': 35 + (seed % 50),
      '07. Cierre Administrativo': 80 + (seed % 15),
      '08. Mesa de cierres': 92 + (seed % 6),
      '10. Finiquitado': 100,
    };
    const real_pct = realByEstatus[p.estatus] || 10;
    const desfase_pct = planned_pct - real_pct;
    const dias_desfase = Math.max(0, today > fin ? Math.round((today - fin)/86400000) : Math.round(desfase_pct * plazo / 100));

    const estados = ['Nuevo León','Coahuila','Tamaulipas','Jalisco','Querétaro','CDMX','Estado de México','Yucatán','Puebla'];
    const calles = ['Av. Constitución','Av. Eugenio Garza Sada','Calz. del Valle','Av. Vasconcelos','Blvd. Díaz Ordaz','Av. Universidad','Av. Lázaro Cárdenas'];

    proyectos_meta[p.id] = {
      // identificación
      anio_asignacion: 2026,
      codigo_uda: 'UDA-' + (10000 + (seed % 90000)),
      codigo_compras: 'CMP-' + (20000 + (seed % 80000)),
      contrato: 'CTR-2026-' + ((seed % 999) + 1).toString().padStart(3,'0'),
      orden_compra: 'OC-' + (50000 + (seed % 50000)),
      anexo: 'AX-' + ((seed % 99) + 1).toString().padStart(2,'0'),
      anexo_obra: 'AO-' + ((seed % 99) + 1).toString().padStart(2,'0'),
      tipologia: ['Sucursal urbana','Sucursal premium','CETI','Oficina corporativa'][seed % 4],
      tipo_preciario: ['Catálogo general','Catálogo especial','Precios unitarios'][seed % 3],
      // dirección
      direccion: calles[seed % calles.length] + ' #' + (1000 + (seed % 9000)) + ', Col. Centro, ' + p.sucursal.split(' ')[0],
      estado: estados[seed % estados.length],
      cp: '6' + (4000 + (seed % 5999)),
      maps_url: 'https://maps.google.com/?q=' + encodeURIComponent(p.sucursal),
      // importes
      importe_accion: Math.round((p.importe_contratado || 500000) * 0.92),
      importe_certificacion: Math.round((p.importe_contratado || 500000) * 0.08),
      importe_limite_penalizacion: Math.round((p.importe_contratado || 500000) * 0.05),
      // plazos
      dias_ejecucion: plazo,
      plazo_dias: plazo,
      dias_reales_ejecucion: p.estatus === '10. Finiquitado' ? plazo + ((seed % 20) - 5) : elapsed,
      dias_restantes: Math.max(0, plazo - elapsed),
      dias_desfase,
      planned_pct,
      real_pct,
      // contrato / firma
      fecha_inicio_vigencia: p.fecha_inicio_prog,
      fecha_recepcion_contrato: fmtISO(new Date(asig.getTime() + (3 + (seed % 14))*86400000)),
      dias_diferencia_recepcion: 3 + (seed % 14),
      alerta_recepcion: (seed % 5) === 0 ? 'fuera de tiempo' : 'en tiempo',
      fecha_firma_interna: fmtISO(new Date(asig.getTime() + (7 + (seed % 14))*86400000)),
      estatus_firma: pick(['firmado','firmado','firmado','pendiente'], seed),
      tiempo_respuesta_firma_dias: 2 + (seed % 10),
      enlace_contrato: '#contrato/' + p.id,
      enlace_contrato_firmado: '#contrato-firmado/' + p.id,
      // equipo
      persona_detonadora: ['Mauricio López','Sofía García','Roberto Méndez'][seed % 3],
      supervisor: ['Daniel Cárdenas','Sergio Martínez'][seed % 2],
      // certificación
      fecha_envio_certificacion: fmtISO(new Date(init.getTime() + (5 + (seed % 10))*86400000)),
      fecha_correo_programacion_inicio: fmtISO(new Date(init.getTime() + (1 + (seed % 5))*86400000)),
      estatus_certificacion: pick(['emitida','en proceso','pendiente','observada'], seed >>> 3),
      // actas
      fecha_acta_inicio: ['06. En obra','07. Cierre Administrativo','08. Mesa de cierres','10. Finiquitado'].includes(p.estatus) ? fmtISO(init) : null,
      fecha_acta_cierre: ['07. Cierre Administrativo','08. Mesa de cierres','10. Finiquitado'].includes(p.estatus) ? fmtISO(new Date(init.getTime() + plazo*86400000)) : null,
      fecha_acta_pendiente_terceros: (seed % 3 === 0) ? fmtISO(new Date(fin.getTime() + 7*86400000)) : null,
      // penalizaciones
      aplica_penalizacion: dias_desfase > 0 && (seed % 4) === 0,
      aplica_fin47: (seed % 6) === 0,
      // estatus operativo / cierre
      estatus_operativo: p.sub_estatus || 'En proceso',
      estatus_cierre: pick(['no inicia','en revisión','aceptado parcial','aceptado total'], seed >>> 5),
      // bloqueo
      tipo_bloqueo: dias_desfase > 7 ? pick(['Pendiente firma cliente','Pendiente acta','Pendiente conciliación'], seed) : 'Sin bloqueo',
      observaciones: '',
      // financieros de cierre
      importe_cierre_enviado: Math.round((p.importe_contratado || 500000) * (0.95 + ((seed % 10)/100))),
      importe_cierre_aceptado: ['08. Mesa de cierres','10. Finiquitado'].includes(p.estatus) ? Math.round((p.importe_contratado || 500000) * (0.92 + ((seed % 10)/100))) : null,
      importe_cfe: ((seed % 5) === 0) ? Math.round(((seed % 10000) + 5000)) : 0,
      formato_cierre: pick(['Formato A','Formato B','Formato C'], seed),
      total_pagado: 0, // será calculado
      por_pagar: 0,
      por_devolver: 0,
      num_factura: ['07. Cierre Administrativo','08. Mesa de cierres','10. Finiquitado'].includes(p.estatus) ? ('F-' + (100000 + (seed % 900000))) : null,
      // cierre admin
      dias_acumulados_cierre: ['07. Cierre Administrativo','08. Mesa de cierres'].includes(p.estatus) ? 5 + (seed % 60) : 0,
      fecha_envio_cierre: ['07. Cierre Administrativo','08. Mesa de cierres','10. Finiquitado'].includes(p.estatus) ? fmtISO(new Date(fin.getTime() + (3 + (seed % 14))*86400000)) : null,
    };
  });

  // ===== Revisiones (juntas de equipo) =====
  const revisiones = {};
  D.proyectos.forEach(p => {
    const seed = h(p.id);
    const list = [];
    const numRev = ['07. Cierre Administrativo','08. Mesa de cierres'].includes(p.estatus) ? 2 + (seed % 4) : (seed % 3);
    for (let i = 0; i < numRev; i++) {
      const fecha = new Date(new Date(p.fecha_asignacion + 'T12:00:00Z').getTime() + (30 + i*14 + (seed % 7))*86400000);
      list.push({
        id: 'R-' + p.id + '-' + (i+1),
        numero: i + 1,
        fecha: fmtISO(fecha),
        avance_estimado: 25 + i*20,
        avance_real: 20 + i*18 + (seed % 10),
        participantes: ['Yaresi Hernández','Daniel Cárdenas','Carolina Ruiz'].slice(0, 2 + (seed % 2)),
        resultado: pick(['en tiempo','con observaciones','crítico','en tiempo','en tiempo'], seed + i),
        notas: pick([
          'Avance conforme a programa. Sin observaciones.',
          'Retraso en suministro de pintura. Plan B activado.',
          'Pendiente firma cliente del acta intermedia.',
          'Cliente solicita ampliación de alcance pequeño.',
          'Sin acceso al inmueble por evento del cliente.',
        ], seed + i*7),
        acuerdos: 'Confirmar próxima visita y enviar fotografías de avance.',
      });
    }
    revisiones[p.id] = list;
  });

  // ===== Bugs / bloqueos =====
  const bugs = {};
  D.proyectos.forEach(p => {
    const seed = h(p.id);
    const list = [];
    const meta = proyectos_meta[p.id];
    if (meta.dias_desfase > 5) {
      list.push({
        id: 'B-' + p.id + '-1',
        titulo: 'Retraso operativo de ' + meta.dias_desfase + ' días',
        severidad: meta.dias_desfase > 15 ? 'alta' : 'media',
        categoria: 'operativo',
        responsable: p.persona_servmac,
        fecha_detectado: D.today,
        estatus: 'abierto',
        impacto_dias: meta.dias_desfase,
        descripcion: 'Avance real debajo del esperado por programa.',
      });
    }
    if ((seed % 4) === 0) {
      list.push({
        id: 'B-' + p.id + '-2',
        titulo: 'Pendiente firma del cliente',
        severidad: 'media',
        categoria: 'administrativo',
        responsable: 'Carolina Ruiz',
        fecha_detectado: D.today,
        estatus: 'abierto',
        impacto_dias: 5,
        descripcion: 'Acta intermedia enviada hace 5 días sin respuesta.',
      });
    }
    if (meta.tipo_bloqueo !== 'Sin bloqueo' && (seed % 3) === 0) {
      list.push({
        id: 'B-' + p.id + '-3',
        titulo: meta.tipo_bloqueo,
        severidad: 'baja',
        categoria: 'bloqueo',
        responsable: p.persona_servmac,
        fecha_detectado: D.today,
        estatus: 'abierto',
        impacto_dias: 3,
        descripcion: 'Bloqueo activo identificado en la última revisión.',
      });
    }
    bugs[p.id] = list;
  });

  // ===== Validaciones de avance (checklist diario) =====
  const validaciones = {};
  D.proyectos.forEach(p => {
    const seed = h(p.id);
    const list = [];
    if (['06. En obra','07. Cierre Administrativo'].includes(p.estatus)) {
      const tareas = [
        'Demolición y limpieza',
        'Instalaciones eléctricas',
        'Instalaciones hidrosanitarias',
        'Acabados pisos y plafones',
        'Pintura general',
        'Mobiliario y carpintería',
        'Imagen exterior y rótulos',
        'Pruebas y entrega'
      ];
      tareas.forEach((t, i) => {
        const programado = 12 + i*5;
        const real = programado - (i === tareas.length - 1 ? 0 : (seed + i) % 5);
        list.push({
          id: 'V-' + p.id + '-' + (i+1),
          tarea: t,
          peso: Math.round(100/tareas.length),
          programado_pct: Math.min(100, programado * 1.5),
          real_pct: Math.min(100, real * 1.5),
          estatus: real >= programado ? 'en tiempo' : real >= programado - 2 ? 'leve atraso' : 'atrasado',
          validado_por: i < 3 ? p.persona_servmac : null,
          fecha_validacion: i < 3 ? D.today : null,
          evidencia: i < 3 ? 1 + (seed % 3) : 0,
        });
      });
    }
    validaciones[p.id] = list;
  });

  window.SERVMAC_EXTRAS = {
    proveedores, proyecto_proveedores, facturas, materiales,
    bitacora_obra, plan_actividades, inbox: inboxBase, notificaciones: notifs,
    sucursales: Object.values(sucursales),
    finanzas, catalogos, proyectos_meta, revisiones, bugs, validaciones,
  };
})();
