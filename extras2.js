// Extension data: comentarios, activity log, HSE, plantillas, recordatorios, sugerencias

(function() {
  const D = window.SERVMAC_DATA;
  const E = window.SERVMAC_EXTRAS;
  if (!D || !E) return;

  function h(s){let x=2166136261>>>0;for(let i=0;i<s.length;i++){x^=s.charCodeAt(i);x=Math.imul(x,16777619)>>>0;}return x;}
  const pick = (arr, seed) => arr[seed % arr.length];
  const fmtISO = (d) => d.toISOString().slice(0,10);

  // Active user (logged in persona)
  E.usuario_activo = { id: 'PS-1', nombre: 'Yaresi Hernández', rol: 'Coordinadora obra', email: 'yaresi@servmac.mx' };

  // ===== Comentarios por proyecto =====
  E.comentarios_proyecto = {};
  D.proyectos.forEach(p => {
    const seed = h(p.id);
    const n = 1 + (seed % 4);
    const list = [];
    const mensajes = [
      'Cliente solicita visita técnica el próximo lunes',
      '@Daniel — favor de validar el plano modificado antes del jueves',
      'Avance conforme a programa, sin observaciones críticas',
      '@Carolina ¿Ya enviaste el folio de prefactura?',
      'Foto del avance subida a la carpeta de Drive',
      'Reagendar reunión por viaje del cliente',
      'Ojo: ajuste de alcance solicitado por sucursal',
    ];
    const autores = ['Yaresi Hernández','Daniel Cárdenas','Carolina Ruiz','Sergio Martínez'];
    for (let i = 0; i < n; i++) {
      const ds = new Date(); ds.setDate(ds.getDate() - (seed + i*5) % 18);
      list.push({
        id: 'COM-' + p.id + '-' + i,
        autor: pick(autores, seed + i),
        fecha: fmtISO(ds),
        hora: `${10 + (seed+i) % 8}:${['00','15','30','45'][(seed+i)%4]}`,
        texto: pick(mensajes, seed + i),
        fijado: i === 0 && (seed % 3 === 0),
      });
    }
    list.sort((a,b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora));
    E.comentarios_proyecto[p.id] = list;
  });

  // ===== Activity log por proyecto =====
  E.actividad_proyecto = {};
  D.proyectos.forEach(p => {
    const seed = h(p.id);
    const events = [
      { tipo: 'creacion',    icon: 'plus',  texto: 'Proyecto creado', autor: 'Carolina Ruiz' },
      { tipo: 'asignacion',  icon: 'users', texto: 'Asignado a ' + p.persona_servmac, autor: 'Carolina Ruiz' },
      { tipo: 'hito',        icon: 'flag',  texto: 'Hito "Acta inicio" registrado', autor: p.persona_servmac },
      { tipo: 'financiero',  icon: 'money', texto: 'Importe contratado actualizado', autor: 'Carolina Ruiz' },
      { tipo: 'visita',      icon: 'calendar', texto: 'Visita programada', autor: p.persona_servmac },
      { tipo: 'archivo',     icon: 'folder', texto: 'Documento cargado a Drive', autor: p.persona_servmac },
      { tipo: 'bloqueo',     icon: 'alert', texto: 'Bloqueo reportado · severidad media', autor: 'Daniel Cárdenas' },
      { tipo: 'comentario',  icon: 'mail',  texto: 'Nuevo comentario en hilo', autor: p.persona_servmac },
    ];
    const list = [];
    events.forEach((e, i) => {
      const d = new Date(); d.setDate(d.getDate() - (seed + i*3) % 60);
      list.push({ id: 'ACT-' + p.id + '-' + i, ...e, fecha: fmtISO(d) });
    });
    list.sort((a,b) => b.fecha.localeCompare(a.fecha));
    E.actividad_proyecto[p.id] = list;
  });

  // ===== HSE / Incidentes =====
  E.incidentes = {};
  D.proyectos.forEach(p => {
    const seed = h(p.id);
    if ((seed % 5) !== 0) return; // sólo algunos proyectos
    const list = [];
    const tipos = ['Casi-accidente','Condición insegura','Accidente leve','Acto inseguro','Incidente ambiental'];
    const desc = [
      'Trabajador sin arnés a 2.5m de altura',
      'Material apilado obstruyendo salida',
      'Pequeño corte en mano al manipular lámina',
      'Falta de señalización en zona de obra',
      'Derrame menor de pintura, contenido y limpiado',
    ];
    const n = 1 + (seed % 3);
    for (let i = 0; i < n; i++) {
      const ds = new Date(); ds.setDate(ds.getDate() - (seed + i*7) % 45);
      list.push({
        id: 'HSE-' + p.id + '-' + i,
        fecha: fmtISO(ds),
        tipo: pick(tipos, seed + i),
        severidad: pick(['baja','baja','media','alta'], seed + i*3),
        descripcion: pick(desc, seed + i),
        accion_correctiva: 'Reforzar capacitación de seguridad. Inspección de EPP semanal.',
        responsable: p.persona_servmac,
        estatus: pick(['cerrado','en seguimiento','abierto'], seed + i),
        afectados: i % 2,
        horas_perdidas: (seed + i) % 4,
      });
    }
    E.incidentes[p.id] = list;
  });

  // ===== Plantillas de proyecto =====
  E.plantillas = [
    {
      id: 'TPL-1', nombre: 'Desmantelamiento sucursal estándar', icono: '🏚️',
      descripcion: 'Cierre definitivo: desinstalación, recuperación de equipo y entrega de inmueble',
      duracion_dias: 30, fases: 3, tareas: 8, hitos: 4,
      veces_usada: 12, color: '#7C3AED',
    },
    {
      id: 'TPL-2', nombre: 'Imagen exterior · cambio de rótulos', icono: '🪧',
      descripcion: 'Renovación de imagen institucional en fachada (rótulos, vinil, iluminación)',
      duracion_dias: 14, fases: 2, tareas: 6, hitos: 3,
      veces_usada: 28, color: '#F26B1F',
    },
    {
      id: 'TPL-3', nombre: 'Adecuación interior sucursal', icono: '🛠️',
      descripcion: 'Acabados, pisos, plafones y mobiliario en sucursal operativa',
      duracion_dias: 45, fases: 4, tareas: 14, hitos: 5,
      veces_usada: 19, color: '#1E40AF',
    },
    {
      id: 'TPL-4', nombre: 'Cambio de piso', icono: '🧱',
      descripcion: 'Demolición y colocación de piso nuevo en área operativa o pública',
      duracion_dias: 12, fases: 2, tareas: 5, hitos: 3,
      veces_usada: 34, color: '#0EA5E9',
    },
    {
      id: 'TPL-5', nombre: 'RT cajeros automáticos', icono: '🏧',
      descripcion: 'Renovación tecnológica de cajeros: anclaje, energía, comunicaciones, jacket',
      duracion_dias: 21, fases: 3, tareas: 9, hitos: 4,
      veces_usada: 41, color: '#15803D',
    },
    {
      id: 'TPL-6', nombre: 'Crecimiento espacio', icono: '📐',
      descripcion: 'Ampliación de área operativa con obra civil y MEP',
      duracion_dias: 60, fases: 5, tareas: 18, hitos: 6,
      veces_usada: 7, color: '#C04A0A',
    },
  ];

  // ===== Recordatorios (configuración del usuario) =====
  E.recordatorios_config = {
    visitas_dia_antes: true,
    hitos_3_dias_antes: true,
    facturas_vencer_5_dias: true,
    fianza_renovacion_30_dias: true,
    bitacora_no_actualizada_3_dias: false,
    bloqueos_sin_movimiento_7_dias: true,
    canales: ['app','email'], // 'app' | 'email' | 'whatsapp'
    hora_resumen_diario: '08:00',
  };

  // ===== Tema / paleta =====
  E.tema = {
    primario: '#1E40AF',   // azul
    acento:   '#F26B1F',   // naranja
    modo:     'claro',
    densidad: 'normal',    // compacto | normal | confortable
  };

  // ===== Templates de mensajes =====
  E.templates_mensajes = [
    { id: 'TM-1', nombre: 'Solicitar firma de acta inicio', canal: 'correo', asunto: 'Firma de Acta de Inicio · {{sucursal}}',
      cuerpo: 'Estimado {{contacto_cliente}},\n\nEnvío para su firma el Acta de Inicio del proyecto {{proyecto}} ({{cr}}) en la sucursal {{sucursal}}. Fecha programada de inicio: {{fecha_inicio}}.\n\nQuedo atento a su confirmación.\n\nSaludos,\n{{usuario}}' },
    { id: 'TM-2', nombre: 'Reporte semanal de avance', canal: 'correo', asunto: 'Avance semanal · {{sucursal}}',
      cuerpo: 'Buen día,\n\nReporto el avance semanal del proyecto {{proyecto}} ({{cr}}):\n\n• Avance real: {{avance_real}}%\n• Avance esperado: {{avance_esperado}}%\n• Próximos hitos: {{proximos_hitos}}\n\nSin observaciones adicionales esta semana.\n\nSaludos,\n{{usuario}}' },
    { id: 'TM-3', nombre: 'Confirmación de visita', canal: 'whatsapp', asunto: '',
      cuerpo: '👷 Buen día {{contacto_cliente}}, confirmo la visita técnica al proyecto *{{sucursal}}* (CR {{cr}}) para el *{{fecha_visita}}* a las *{{hora_visita}}*. Por favor confirma asistencia. Saludos, {{usuario}}.' },
    { id: 'TM-4', nombre: 'Recordatorio de carpeta de cierre', canal: 'correo', asunto: 'Recordatorio · Carpeta de cierre {{sucursal}}',
      cuerpo: 'Estimado {{contacto_cliente}},\n\nLe recuerdo que el proyecto {{proyecto}} ({{cr}}) está pendiente de entrega de carpeta de cierre administrativo. Llevamos {{dias_en_cierre}} días en esta etapa.\n\nQuedo atento.\n\n{{usuario}}' },
    { id: 'TM-5', nombre: 'Aviso de factura por vencer', canal: 'correo', asunto: 'Factura por vencer · {{folio_factura}}',
      cuerpo: 'Hola,\n\nLa factura {{folio_factura}} del proyecto {{sucursal}} ({{cr}}) está por vencer su plazo de pago. Importe: {{monto}}.\n\nFavor de gestionar.\n\n{{usuario}}' },
    { id: 'TM-6', nombre: 'Solicitud de prórroga', canal: 'correo', asunto: 'Solicitud de prórroga · {{sucursal}}',
      cuerpo: 'Estimado {{contacto_cliente}},\n\nDebido a {{motivo_atraso}}, solicito atentamente prórroga para el proyecto {{proyecto}} ({{cr}}). Nueva fecha propuesta: {{nueva_fecha}}.\n\nAdjunto soporte y plan de recuperación.\n\nSaludos,\n{{usuario}}' },
  ];

  // ===== Fotos clasificadas (mock IA) =====
  E.fotos_clasificadas = {};
  D.proyectos.forEach(p => {
    if (!['06. En obra','07. Cierre Administrativo','08. Mesa de cierres','10. Finiquitado'].includes(p.estatus)) return;
    const seed = h(p.id);
    const etapas = ['Cimentación','Estructura','Albañilería','Instalaciones MEP','Acabados','Mobiliario','Imagen exterior','Limpieza final'];
    const n = 4 + (seed % 8);
    const list = [];
    for (let i = 0; i < n; i++) {
      const ds = new Date(); ds.setDate(ds.getDate() - (seed + i*4) % 30);
      list.push({
        id: 'PIC-' + p.id + '-' + i,
        fecha: fmtISO(ds),
        etapa_detectada: pick(etapas, seed + i),
        confianza: 0.62 + ((seed + i) % 38) / 100,
        avance_estimado: 5 + ((seed + i) * 11) % 90,
        observaciones_ia: pick([
          'Buen avance, sin observaciones',
          'Detectada falta de EPP en operario',
          'Material apilado fuera de zona',
          'Instalación correcta, terminación pendiente',
          'Acabados en buena condición',
        ], seed + i),
        tamano_kb: 240 + ((seed + i) * 37) % 1800,
      });
    }
    E.fotos_clasificadas[p.id] = list.sort((a,b) => b.fecha.localeCompare(a.fecha));
  });

  // ===== Sugerencias proactivas =====
  E.sugerencias = [];
  D.proyectos.filter(p => p.activo).forEach(p => {
    const meta = E.proyectos_meta[p.id];
    if (!meta) return;
    const seed = h(p.id);
    if (meta.dias_desfase > 10) {
      E.sugerencias.push({
        id: 'SUG-' + p.id + '-1',
        proyecto: p.id, sucursal: p.sucursal,
        tipo: 'riesgo',
        titulo: 'Riesgo alto de incumplimiento',
        detalle: `${p.sucursal} lleva ${meta.dias_desfase} días de desfase. Proyectos similares con este perfil terminaron con penalización del 8% en promedio.`,
        accion: 'Programar revisión urgente',
        accion_kind: 'revision',
        prioridad: 'alta',
      });
    }
    if (meta.dias_acumulados_cierre > 30) {
      E.sugerencias.push({
        id: 'SUG-' + p.id + '-2',
        proyecto: p.id, sucursal: p.sucursal,
        tipo: 'cierre',
        titulo: 'Cierre administrativo prolongado',
        detalle: `${meta.dias_acumulados_cierre} días en cierre administrativo. Considera escalar con cliente o reasignar a especialista en cierres.`,
        accion: 'Generar informe ejecutivo',
        accion_kind: 'informe',
        prioridad: 'media',
      });
    }
    if (meta.aplica_penalizacion && (seed % 2 === 0)) {
      E.sugerencias.push({
        id: 'SUG-' + p.id + '-3',
        proyecto: p.id, sucursal: p.sucursal,
        tipo: 'financiero',
        titulo: 'Posible penalización aplicable',
        detalle: 'El proyecto cumple criterios para FIN 47. Revisa límite de penalización antes de firmar finiquito.',
        accion: 'Revisar cierre',
        accion_kind: 'cierre',
        prioridad: 'media',
      });
    }
  });
  E.sugerencias.sort((a,b) => ({ alta:0, media:1, baja:2 })[a.prioridad] - ({ alta:0, media:1, baja:2 })[b.prioridad]);

})();
