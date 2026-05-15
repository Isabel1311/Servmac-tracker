// UI atoms shared across views

const fmtMoney = (n) => {
  if (n == null || isNaN(n)) return '—';
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return '$' + (n / 1_000).toFixed(0) + 'k';
  return '$' + n;
};
const fmtMoneyFull = (n) => '$' + (n||0).toLocaleString('en-US');
const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso + 'T12:00:00Z');
  const m = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][d.getUTCMonth()];
  return `${d.getUTCDate()} ${m} ${String(d.getUTCFullYear()).slice(2)}`;
};
const fmtDateLong = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso + 'T12:00:00Z');
  const m = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'][d.getUTCMonth()];
  return `${d.getUTCDate()} de ${m} ${d.getUTCFullYear()}`;
};

const statusMap = {
  '05. Gestion por iniciar Obra': { short: 'Gestión', cls: 'bs-gestion', short2: 'Por iniciar' },
  '06. En obra':                  { short: 'En obra', cls: 'bs-obra',    short2: 'En obra' },
  '07. Cierre Administrativo':    { short: 'Cierre Admin.', cls: 'bs-cierre', short2: 'Cierre admin' },
  '08. Mesa de cierres':          { short: 'Mesa cierres', cls: 'bs-mesa', short2: 'Mesa' },
  '10. Finiquitado':              { short: 'Finiquitado', cls: 'bs-final', short2: 'Finiquitado' },
};
const STATUS_ORDER = ['05. Gestion por iniciar Obra','06. En obra','07. Cierre Administrativo','08. Mesa de cierres','10. Finiquitado'];

function StatusBadge({ value }) {
  const s = statusMap[value] || { short: value, cls: 'bs-gestion' };
  return <span className={"badge-status " + s.cls}><span className="dot"></span>{s.short}</span>;
}

function DeliveryDot({ value }) {
  const map = {
    'En tiempo': { cls: 'delivery-ok', sym: '●', txt: 'En tiempo' },
    'Entregado ET': { cls: 'delivery-ok', sym: '✓', txt: 'Entregado ET' },
    'Entregado FT': { cls: 'delivery-late', sym: '✓', txt: 'Entregado FT' },
    'Fuera de tiempo': { cls: 'delivery-late', sym: '!', txt: 'Fuera de tiempo' },
    'Emproblemada 3eros': { cls: 'delivery-prob', sym: '⚠', txt: 'Emproblemada' },
    'No aplica': { cls: 'delivery-na', sym: '–', txt: 'No aplica' },
  };
  const m = map[value] || { cls: 'delivery-na', sym: '–', txt: value };
  return <span className={m.cls} style={{ fontSize: 12, fontWeight: 600 }}>{m.sym} {m.txt}</span>;
}

function TipoTag({ tipo }) {
  const cls = tipo === 'Servicing' ? 'tag-tipo-servicing' : 'tag-tipo-obra';
  return <span className={'tag ' + cls}>{tipo}</span>;
}

// Avatar with deterministic color
function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const palette = [
    'linear-gradient(135deg,#1E40AF,#3B82F6)',
    'linear-gradient(135deg,#C04A0A,#F26B1F)',
    'linear-gradient(135deg,#6D28D9,#A855F7)',
    'linear-gradient(135deg,#15803D,#22C55E)',
    'linear-gradient(135deg,#B45309,#F59E0B)',
    'linear-gradient(135deg,#0E7490,#06B6D4)',
    'linear-gradient(135deg,#9D174D,#EC4899)',
  ];
  return palette[h % palette.length];
}
function initials(name) {
  if (!name) return '?';
  const parts = name.replace(/\./g,'').split(/\s+/);
  return parts.slice(0,2).map(p => p[0]).join('').toUpperCase();
}
function Avatar({ name, size = 24 }) {
  const fs = Math.max(9, size * 0.4);
  return (
    <span className="av-xs" title={name} style={{
      background: avatarColor(name || ''), width: size, height: size, fontSize: fs
    }}>{initials(name)}</span>
  );
}

function Sparkline({ values, color = '#F26B1F', width = 84, height = 32, fill = true }) {
  if (!values || values.length === 0) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const step = width / (values.length - 1 || 1);
  const pts = values.map((v, i) => [i * step, height - ((v - min) / range) * height]);
  const d = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const area = d + ` L${width},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} className="chart" style={{ display: 'block' }}>
      {fill && <path d={area} fill={color} opacity="0.15" />}
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {pts.slice(-1).map(([x,y],i) => <circle key={i} cx={x} cy={y} r="3" fill={color} />)}
    </svg>
  );
}

function KPI({ label, value, unit, delta, deltaDir, spark, sparkColor, featured }) {
  return (
    <div className={'kpi ' + (featured || '')}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}{unit && <span className="kpi-unit">{unit}</span>}</div>
      {delta && <div className={'kpi-delta ' + deltaDir}>{deltaDir === 'up' ? '↑' : deltaDir === 'down' ? '↓' : '·'} {delta}</div>}
      {spark && <div className="kpi-spark"><Sparkline values={spark} color={sparkColor || '#F26B1F'} width={92} height={32} /></div>}
    </div>
  );
}

function Icon({ name, size = 18 }) {
  const c = { width: size, height: size, strokeWidth: 1.7, fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    dashboard: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></>,
    folder:    <><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></>,
    flag:      <><path d="M4 22V4"/><path d="M4 4h12l-2 4 2 4H4"/></>,
    mail:      <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>,
    money:     <><circle cx="12" cy="12" r="9"/><path d="M9 14c0 1.5 1.5 2 3 2s3-.5 3-2-1.5-2-3-2-3-.5-3-2 1.5-2 3-2 3 .5 3 2"/><path d="M12 7v10"/></>,
    chart:     <><path d="M3 3v18h18"/><path d="m7 14 4-4 4 4 5-5"/></>,
    search:    <><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></>,
    plus:      <><path d="M12 5v14M5 12h14"/></>,
    filter:    <><path d="M3 5h18M6 12h12M10 19h4"/></>,
    download:  <><path d="M12 4v12m0 0-4-4m4 4 4-4"/><path d="M4 20h16"/></>,
    bell:      <><path d="M6 9a6 6 0 0 1 12 0v4l2 3H4l2-3z"/><path d="M10 19a2 2 0 0 0 4 0"/></>,
    close:     <><path d="M6 6 18 18M18 6 6 18"/></>,
    chevron:   <><path d="m9 6 6 6-6 6"/></>,
    link:      <><path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1.5 1.5"/><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1.5-1.5"/></>,
    clock:     <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    bell:      <><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></>,
    truck:     <><rect x="1" y="6" width="14" height="11" rx="1"/><path d="M15 9h4l3 4v4h-7z"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></>,
    map:       <><path d="m9 3-6 3v15l6-3 6 3 6-3V3l-6 3z"/><path d="M9 3v15M15 6v15"/></>,
    inbox:     <><path d="M3 13v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6"/><path d="M3 13l3-8h12l3 8"/><path d="M3 13h5l2 3h4l2-3h5"/></>,
    edit:      <><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/></>,
    download:  <><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></>,
    calendar:  <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></>,
    check:     <><path d="m5 12 5 5L20 7"/></>,
    warn:      <><path d="m12 3 10 17H2z"/><path d="M12 10v4M12 18h0"/></>,
    person:    <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    pin:       <><path d="M12 21s-7-7-7-12a7 7 0 0 1 14 0c0 5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></>,
    expand:    <><path d="M4 14v6h6M20 10V4h-6M14 4l6 6M10 20l-6-6"/></>,
    shrink:    <><path d="M9 3v6H3M21 9h-6V3M3 15h6v6M15 21v-6h6"/></>,
    copy:      <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
    users:     <><circle cx="9" cy="8" r="3.5"/><path d="M2 21a7 7 0 0 1 14 0"/><circle cx="17" cy="9" r="3"/><path d="M16 14a5 5 0 0 1 6 5"/></>,
    alert:     <><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h0"/></>,
    history:   <><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 8v5l3 2"/></>,
    box:       <><path d="M21 8L12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/></>,
    clipboard: <><rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4h6v3H9z"/></>,
    trash:     <><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></>,
    shield:    <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
    phone:     <><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></>,
    upload:    <><path d="M12 17V5"/><path d="m17 10-5-5-5 5"/><path d="M5 21h14"/></>,
  };
  return <svg viewBox="0 0 24 24" {...c}>{paths[name] || null}</svg>;
}

Object.assign(window, { fmtMoney, fmtMoneyFull, fmtDate, fmtDateLong, statusMap, STATUS_ORDER, StatusBadge, DeliveryDot, TipoTag, Avatar, Sparkline, KPI, Icon, avatarColor, initials });
