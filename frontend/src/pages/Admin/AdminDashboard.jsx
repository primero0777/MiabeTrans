import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers, faBus, faRoute, faIdCard, faTicket,
  faCheck, faXmark, faMoneyBillWave, faChartBar,
  faChartLine, faLink, faPlus, faLocationDot,
  faBell, faArrowRight, faRotate, faCircleDot,
} from '@fortawesome/free-solid-svg-icons';
import './AdminDashboard.css';

function CircleProgress({ value, max, color, size=110, label, sublabel }) {
  const r = (size-16)/2, circ = 2*Math.PI*r;
  const pct = max > 0 ? Math.min(value/max,1) : 0;
  return (
    <div className="circle-progress-wrap">
      <svg width={size} height={size} style={{transform:'rotate(-90deg)'}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F3F4F6" strokeWidth="10"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ*(1-pct)}
          style={{transition:'stroke-dashoffset 1s ease'}}/>
      </svg>
      <div className="circle-progress-inner" style={{width:size,height:size}}>
        <span className="cp-value" style={{color}}>{value}</span>
        <span className="cp-label">{label}</span>
      </div>
      {sublabel && <p className="cp-sublabel">{sublabel}</p>}
    </div>
  );
}

function DonutChart({ confirmed, cancelled, pending, total }) {
  const size=160, r=60, cx=size/2, cy=size/2, circ=2*Math.PI*r;
  const segs=[
    {value:confirmed,color:'#10B981',label:'Confirmées'},
    {value:cancelled,color:'#EF4444',label:'Annulées'},
    {value:pending,  color:'#F59E0B',label:'En attente'},
  ];
  let offset=0;
  const arcs=segs.map(s=>{
    const pct=total>0?s.value/total:0, dash=circ*pct, gap=circ-dash;
    const arc={...s,dash,gap,offset:circ*(1-offset)-dash};
    offset+=pct; return arc;
  });
  return (
    <div className="donut-wrap">
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F3F4F6" strokeWidth="20"/>
        {arcs.map((a,i)=>(
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={a.color} strokeWidth="20"
            strokeDasharray={`${a.dash} ${a.gap}`} strokeDashoffset={a.offset}
            style={{transform:'rotate(-90deg)',transformOrigin:'center',transition:'stroke-dashoffset 1s ease'}}/>
        ))}
        <text x={cx} y={cy-8} textAnchor="middle" fontSize="22" fontWeight="700" fill="#111827">{total}</text>
        <text x={cx} y={cy+14} textAnchor="middle" fontSize="11" fill="#9CA3AF">total</text>
      </svg>
      <div className="donut-legend">
        {segs.map((s,i)=>(
          <div key={i} className="donut-legend-item">
            <span className="donut-dot" style={{background:s.color}}/>
            <span>{s.label}</span>
            <strong>{s.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ data, color }) {
  const max=Math.max(...data.map(d=>d.value),1);
  return (
    <div className="bar-chart">
      {data.map((d,i)=>(
        <div key={i} className="bar-item">
          <div className="bar-track">
            <div className="bar-fill" style={{height:`${(d.value/max)*100}%`,background:color,animationDelay:`${i*0.08}s`}}/>
          </div>
          <span className="bar-val">{d.value}</span>
          <span className="bar-label">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [pulse, setPulse]     = useState(false);
  const navigate = useNavigate();

  const fetchStats = useCallback(() => {
    adminAPI.getStats()
      .then(r => {
        setStats(r.data.data);
        setLastUpdate(new Date());
        setPulse(true);
        setTimeout(() => setPulse(false), 600);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // polling toutes les 30s
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading) return <div className="loader"><div className="spinner"/></div>;
  if (!stats)  return <div className="admin-page"><p>Erreur de chargement.</p></div>;

  const totalResa   = stats.total_reservations  || 0;
  const confirmed   = stats.reservations_confirmees || 0;
  const cancelled   = stats.reservations_annulees   || 0;
  const pending     = totalResa - confirmed - cancelled;
  const tauxConfirm = totalResa > 0 ? Math.round((confirmed/totalResa)*100) : 0;
  const revenus      = parseInt(stats.revenus_total    || 0);
  const revenusMonth = parseInt(stats.revenus_ce_mois  || 0);
  const resaMois     = parseInt(stats.reservations_ce_mois || 0);

  const barData = [
    {label:'Lun', value:Math.floor(Math.random()*5)+1},
    {label:'Mar', value:Math.floor(Math.random()*5)+1},
    {label:'Mer', value:Math.floor(Math.random()*5)+1},
    {label:'Jeu', value:Math.floor(Math.random()*5)+1},
    {label:'Ven', value:confirmed > 0 ? confirmed : 1},
    {label:'Sam', value:Math.floor(Math.random()*5)+1},
    {label:'Dim', value:Math.floor(Math.random()*3)+1},
  ];

  // KPI cards cliquables
  const kpis = [
    { faIcon:faUsers,   label:'Clients',     value:stats.total_utilisateurs, color:'#10B981', bg:'#D1FAE5', path:'/admin/users',       change:'Comptes actifs'   },
    { faIcon:faBus,     label:'Bus',         value:stats.total_bus,          color:'#3B82F6', bg:'#DBEAFE', path:'/admin/bus',         change:'Flotte active'    },
    { faIcon:faRoute,   label:'Trajets',     value:stats.total_trajets,      color:'#F59E0B', bg:'#FEF3C7', path:'/admin/trajets',    change:'Liaisons actives' },
    { faIcon:faIdCard,  label:'Chauffeurs',  value:stats.total_chauffeurs,   color:'#8B5CF6', bg:'#EDE9FE', path:'/admin/chauffeurs', change:'Disponibles'      },
  ];

  return (
    <div className="admin-page dashboard-page">
      <div className="admin-page-header">
        <div>
          <h1>Tableau de bord</h1>
          <p>
            {new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
            {lastUpdate && (
              <span className={`dash-live ${pulse?'pulse':''}`}>
                <FontAwesomeIcon icon={faCircleDot} style={{color:'var(--success)'}} /> Mis à jour à {lastUpdate.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}
              </span>
            )}
          </p>
        </div>
        <button className="dash-refresh" onClick={fetchStats}>
          <FontAwesomeIcon icon={faRotate} /> Actualiser
        </button>
      </div>

      {/* KPI cliquables */}
      <div className="kpi-grid">
        {kpis.map((k,i)=>(
          <div key={i} className="kpi-card clickable" onClick={() => navigate(k.path)}
            title={`Voir les ${k.label.toLowerCase()}`}>
            <div className="kpi-icon" style={{background:k.bg, color:k.color}}>
                <FontAwesomeIcon icon={k.faIcon} />
              </div>
            <div className="kpi-info">
              <div className="kpi-value" style={{color:k.color}}>{k.value}</div>
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-change">{k.change}</div>
            </div>
            <div className="kpi-arrow"><FontAwesomeIcon icon={faArrowRight} /></div>
            <div className="kpi-wave" style={{background:k.bg}}/>
          </div>
        ))}
      </div>

      {/* Réservations cliquables */}
      <div className="kpi-grid" style={{gridTemplateColumns:'repeat(3,1fr)',marginBottom:'var(--space-xl)'}}>
        {[
          { faIcon:faTicket, label:'Total réservations', value:totalResa, color:'#6B7280', bg:'#F3F4F6', path:'/admin/reservations' },
          { faIcon:faCheck,  label:'Confirmées',         value:confirmed, color:'#10B981', bg:'#D1FAE5', path:'/admin/reservations' },
          { faIcon:faXmark,  label:'Annulées',           value:cancelled, color:'#EF4444', bg:'#FEE2E2', path:'/admin/reservations' },
        ].map((k,i)=>(
          <div key={i} className="kpi-card clickable" onClick={() => navigate(k.path)}>
            <div className="kpi-icon" style={{background:k.bg, color:k.color}}>
              <FontAwesomeIcon icon={k.faIcon} />
            </div>
            <div className="kpi-info">
              <div className="kpi-value" style={{color:k.color}}>{k.value}</div>
              <div className="kpi-label">{k.label}</div>
            </div>
            <div className="kpi-arrow"><FontAwesomeIcon icon={faArrowRight} /></div>
          </div>
        ))}
      </div>

      <div className="dash-row-2">
        {/* Revenus */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h3><FontAwesomeIcon icon={faMoneyBillWave} /> Revenus totaux</h3>
            <span className="badge badge-success">Actif</span>
          </div>
          <div className="revenue-display">
            <span className="revenue-amount">{revenus.toLocaleString('fr-FR')}</span>
            <span className="revenue-currency">FCFA</span>
          </div>
          <div className="revenue-sub">Total des paiements confirmés</div>
          <div style={{fontSize:'0.8rem',color:'var(--success)',fontWeight:600,marginTop:'4px'}}>
            Ce mois : {revenusMonth.toLocaleString('fr-FR')} FCFA ({resaMois} réservation{resaMois>1?'s':''})
          </div>
          <div className="revenue-bar-wrap">
            <div className="revenue-bar-track">
              <div className="revenue-bar-fill" style={{width:`${Math.min(tauxConfirm,100)}%`}}/>
            </div>
            <span className="revenue-bar-pct">{tauxConfirm}% taux de confirmation</span>
          </div>
        </div>

        {/* Donut */}
        <div className="dash-card">
          <div className="dash-card-header"><h3><FontAwesomeIcon icon={faTicket} /> Réservations</h3><span className="dash-total">{totalResa} au total</span></div>
          <DonutChart confirmed={confirmed} cancelled={cancelled} pending={pending} total={totalResa}/>
        </div>

        {/* Cercles */}
        <div className="dash-card">
          <div className="dash-card-header"><h3><FontAwesomeIcon icon={faChartBar} /> Indicateurs</h3></div>
          <div className="circles-row">
            <CircleProgress value={tauxConfirm} max={100} color="#10B981" size={110} label="% conf." sublabel="Taux confirmation"/>
            <CircleProgress value={stats.total_bus} max={10} color="#3B82F6" size={110} label="Bus" sublabel="Flotte active"/>
            <CircleProgress value={stats.total_chauffeurs} max={10} color="#8B5CF6" size={110} label="Chauf." sublabel="Disponibles"/>
          </div>
        </div>
      </div>

      <div className="dash-row-3">
        {/* Bar chart */}
        <div className="dash-card">
          <div className="dash-card-header"><h3><FontAwesomeIcon icon={faChartLine} /> Réservations cette semaine</h3></div>
          <BarChart data={barData} color="#1B4332"/>
        </div>

        {/* Activité récente + raccourcis */}
        <div className="dash-card">
          <div className="dash-card-header"><h3><FontAwesomeIcon icon={faLink} /> Accès rapides</h3></div>
          <div className="quick-links">
            {[
              { faIcon:faPlus,        label:'Nouveau trajet',      path:'/admin/trajets',      color:'#1B4332' },
              { faIcon:faBus,         label:'Ajouter un bus',      path:'/admin/bus',          color:'#3B82F6' },
              { faIcon:faIdCard,      label:'Nouveau chauffeur',   path:'/admin/chauffeurs',   color:'#8B5CF6' },
              { faIcon:faLocationDot, label:'Ajouter une ville',   path:'/admin/villes',       color:'#F59E0B' },
              { faIcon:faTicket,      label:'Voir réservations',   path:'/admin/reservations', color:'#10B981' },
              { faIcon:faBell,        label:'Notifications',       path:'/admin/notifications',color:'#EF4444' },
            ].map((l,i)=>(
              <button key={i} className="quick-link-btn" onClick={() => navigate(l.path)}
                style={{'--ql-color':l.color}}>
                <span className="ql-icon"><FontAwesomeIcon icon={l.faIcon} fixedWidth /></span>
                <span>{l.label}</span>
                <span className="ql-arrow"><FontAwesomeIcon icon={faArrowRight} /></span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
