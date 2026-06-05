import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { trajetsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass, faArrowsLeftRight, faCalendarDays,
  faBus, faUser, faStar, faRoadBarrier,
  faLock, faCheck, faArrowRight, faClock,
  faLocationDot, faTriangleExclamation, faEye,
  faCircleXmark, faCheckCircle, faTag, faRoute, faUsers,
  faShieldHalved, faSortAmountDown,
} from '@fortawesome/free-solid-svg-icons';
import './Search.css';

const POPULAR_ROUTES = [
  { depart: 'Lomé', arrivee: 'Kpalimé' },
  { depart: 'Lomé', arrivee: 'Kara' },
  { depart: 'Lomé', arrivee: 'Sokodé' },
  { depart: 'Lomé', arrivee: 'Atakpamé' },
  { depart: 'Lomé', arrivee: 'Dapaong' },
];

const SORT_OPTIONS = [
  { value: 'heure',  label: 'Heure de départ' },
  { value: 'prix',   label: 'Prix croissant' },
  { value: 'places', label: 'Places disponibles' },
];

export default function Search() {
  const [searchParams]  = useSearchParams();
  const navigate        = useNavigate();
  const { isLoggedIn }  = useAuth();

  const [results, setResults]           = useState([]);
  const [allHoraires, setAllHoraires]   = useState([]);
  const [loading, setLoading]           = useState(false);
  const [searched, setSearched]         = useState(false);
  const [loginAlert, setLoginAlert]     = useState(false);
  const [detailModal, setDetailModal]   = useState(null);

  const [sortBy, setSortBy]             = useState('heure');
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const [form, setForm] = useState({
    depart:  searchParams.get('depart')  || '',
    arrivee: searchParams.get('arrivee') || '',
    date:    searchParams.get('date')    || '',
  });

  const loadAll = useCallback(() => {
    trajetsAPI.search({}).then(r => setAllHoraires(r.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    loadAll();
    if (form.depart && form.arrivee) doSearch(form.depart, form.arrivee, form.date);
  }, []);

  const doSearch = async (dep, arr, date) => {
    if (!dep || !arr) return;
    setLoading(true); setSearched(true);
    try {
      const res = await trajetsAPI.search({ depart: dep, arrivee: arr, date });
      setResults(res.data.data || []);
    } catch { setResults([]); }
    finally { setLoading(false); }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    doSearch(form.depart, form.arrivee, form.date);
  };

  const handlePopularRoute = (route) => {
    const newForm = { ...route, date: '' };
    setForm(newForm);
    doSearch(route.depart, route.arrivee, '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleVoirHoraires = (trajet) => {
    const newForm = { depart: trajet.ville_depart, arrivee: trajet.ville_arrivee, date: '' };
    setForm(newForm);
    doSearch(trajet.ville_depart, trajet.ville_arrivee, '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReserver = (horaire) => {
    if (!isLoggedIn) {
      setLoginAlert(true);
      setTimeout(() => setLoginAlert(false), 5000);
      return;
    }
    navigate(`/booking/${horaire.id_horaire}`);
  };

  const today = new Date().toISOString().split('T')[0];
  const rawList = searched ? results : allHoraires;

  const displayList = useMemo(() => {
    let list = [...rawList];
    if (onlyAvailable) list = list.filter(r => (r.places_disponibles ?? 0) > 0);
    if (sortBy === 'heure') {
      list.sort((a, b) => new Date(a.date_depart) - new Date(b.date_depart));
    } else if (sortBy === 'prix') {
      list.sort((a, b) => parseInt(a.prix) - parseInt(b.prix));
    } else if (sortBy === 'places') {
      list.sort((a, b) => (b.places_disponibles ?? 0) - (a.places_disponibles ?? 0));
    }
    return list;
  }, [rawList, sortBy, onlyAvailable]);

  const formatDate = (dt) => new Date(dt).toLocaleString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="search-page">

      {/* ── Header ── */}
      <div className="search-header">
        <div className="container">
          <div className="search-header-top">
            <div className="search-header-text">
              <h1>Trouvez votre prochain trajet</h1>
              <p>Réservez votre billet de bus en quelques secondes, partout au Togo</p>
            </div>
            {allHoraires.length > 0 && (
              <div className="search-live-badge">
                <span className="live-dot" />
                {allHoraires.length} départ{allHoraires.length > 1 ? 's' : ''} disponible{allHoraires.length > 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* Barre de recherche */}
          <form className="search-bar" onSubmit={handleSearch}>
            <div className="sb-field">
              <label>Départ</label>
              <div className="sb-input-wrapper">
                <FontAwesomeIcon icon={faLocationDot} className="sb-input-icon" />
                <input
                  type="text"
                  className="form-input sb-input"
                  placeholder="Ex: Lomé"
                  value={form.depart}
                  onChange={e => setForm({ ...form, depart: e.target.value })}
                />
              </div>
            </div>

            <button
              type="button"
              className="sb-swap"
              title="Inverser départ et arrivée"
              onClick={() => setForm({ ...form, depart: form.arrivee, arrivee: form.depart })}
            >
              <FontAwesomeIcon icon={faArrowsLeftRight} />
            </button>

            <div className="sb-field">
              <label>Arrivée</label>
              <div className="sb-input-wrapper">
                <FontAwesomeIcon icon={faLocationDot} className="sb-input-icon sb-input-icon--accent" />
                <input
                  type="text"
                  className="form-input sb-input"
                  placeholder="Ex: Kara"
                  value={form.arrivee}
                  onChange={e => setForm({ ...form, arrivee: e.target.value })}
                />
              </div>
            </div>

            <div className="sb-field">
              <label>Date</label>
              <div className="sb-input-wrapper">
                <FontAwesomeIcon icon={faCalendarDays} className="sb-input-icon" />
                <input
                  type="date"
                  className="form-input sb-input"
                  min={today}
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-accent sb-submit">
              <FontAwesomeIcon icon={faMagnifyingGlass} />
              <span>Rechercher</span>
            </button>
          </form>

          {/* Chips trajets populaires */}
          <div className="popular-routes">
            <span className="popular-routes-label">Populaires :</span>
            {POPULAR_ROUTES.map((route, i) => (
              <button
                key={i}
                type="button"
                className="route-chip"
                onClick={() => handlePopularRoute(route)}
              >
                <FontAwesomeIcon icon={faRoute} />
                {route.depart} → {route.arrivee}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="container search-body">

        {/* Alerte connexion */}
        {loginAlert && (
          <div className="login-alert">
            <div className="login-alert-icon">
              <FontAwesomeIcon icon={faShieldHalved} />
            </div>
            <div className="login-alert-content">
              <strong>Connexion requise</strong>
              <p>Vous devez être connecté pour réserver un trajet.</p>
            </div>
            <div className="login-alert-actions">
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/login')}>Se connecter</button>
              <button className="btn btn-outline btn-sm" onClick={() => navigate('/register')}>S'inscrire</button>
            </div>
            <button className="login-alert-close" onClick={() => setLoginAlert(false)}>
              <FontAwesomeIcon icon={faCircleXmark} />
            </button>
          </div>
        )}

        {/* Skeleton loading */}
        {loading && (
          <div className="skeleton-list">
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton-card">
                <div className="skeleton-card-main">
                  <div className="skeleton-route">
                    <div className="skeleton-block sk-time" />
                    <div className="skeleton-line" />
                    <div className="skeleton-block sk-time" />
                  </div>
                  <div className="skeleton-meta">
                    {[1, 2, 3, 4].map(j => (
                      <div key={j} className="skeleton-meta-item">
                        <div className="skeleton-block sk-label" />
                        <div className="skeleton-block sk-val" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="skeleton-card-aside">
                  <div className="skeleton-block sk-price" />
                  <div className="skeleton-block sk-btn" />
                  <div className="skeleton-block sk-badge" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && searched && results.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FontAwesomeIcon icon={faTriangleExclamation} />
            </div>
            <h3>Aucun départ trouvé</h3>
            <p>
              Aucun horaire prévu pour{' '}
              <strong>{form.depart} → {form.arrivee}</strong>
              {form.date && (
                <>{' '}le{' '}
                  <strong>
                    {new Date(form.date + 'T00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </strong>
                </>
              )}.
              <br />Essayez sans date ou vérifiez l'orthographe des villes.
            </p>
            <div className="empty-state-actions">
              {form.date && (
                <button className="btn btn-primary" onClick={() => {
                  const f = { ...form, date: '' };
                  setForm(f);
                  doSearch(f.depart, f.arrivee, '');
                }}>
                  <FontAwesomeIcon icon={faCalendarDays} /> Chercher sans date
                </button>
              )}
              <button className="btn btn-outline" onClick={() => {
                setSearched(false);
                setForm({ depart: '', arrivee: '', date: '' });
              }}>
                Voir tous les trajets
              </button>
            </div>
          </div>
        )}

        {/* Résultats */}
        {!loading && displayList.length > 0 && (
          <>
            {/* En-tête résultats + contrôles tri/filtre */}
            <div className="results-header">
              <div>
                <h2>
                  {searched
                    ? `${results.length} départ${results.length > 1 ? 's' : ''} trouvé${results.length > 1 ? 's' : ''}`
                    : `${allHoraires.length} départ${allHoraires.length > 1 ? 's' : ''} disponible${allHoraires.length > 1 ? 's' : ''}`
                  }
                </h2>
                <p>
                  {searched
                    ? `${form.depart} → ${form.arrivee}${form.date ? ' · ' + new Date(form.date + 'T00:00').toLocaleDateString('fr-FR') : ''}`
                    : 'Tous les prochains départs'
                  }
                </p>
              </div>
              <div className="results-controls">
                <div className="sort-bar">
                  <FontAwesomeIcon icon={faSortAmountDown} className="sort-icon" />
                  <select
                    className="sort-select"
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                  >
                    {SORT_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <label className="filter-toggle">
                  <input
                    type="checkbox"
                    checked={onlyAvailable}
                    onChange={e => setOnlyAvailable(e.target.checked)}
                  />
                  <span className="filter-toggle-track">
                    <span className="filter-toggle-thumb" />
                  </span>
                  <span className="filter-toggle-label">Disponibles seulement</span>
                </label>
                {searched && (
                  <button className="btn btn-ghost btn-sm clear-btn" onClick={() => setSearched(false)}>
                    <FontAwesomeIcon icon={faCircleXmark} /> Effacer
                  </button>
                )}
              </div>
            </div>

            <div className="results-list">
              {displayList.map((r) => {
                const hasHoraire = !!r.id_horaire;
                const dispo = r.places_disponibles ?? 0;
                const capacite = r.capacite ?? 1;
                const dispoRatio = Math.min(dispo / capacite, 1);

                return (
                  <div key={r.id_horaire || r.id_trajet} className="trip-card">
                    <div className="trip-card-main">

                      {/* Badge Direct */}
                      <div className="trip-card-badges">
                        <span className="badge-direct">
                          <FontAwesomeIcon icon={faRoute} /> Direct
                        </span>
                      </div>

                      {/* Route */}
                      <div className="trip-route">
                        <div className="trip-city">
                          <span className="trip-time">
                            {r.date_depart
                              ? new Date(r.date_depart).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                              : '-'}
                          </span>
                          <span className="trip-name">
                            <FontAwesomeIcon icon={faLocationDot} className="trip-loc-icon trip-loc-icon--primary" />
                            {r.ville_depart}
                          </span>
                        </div>

                        <div className="trip-line">
                          <div className="trip-line-visual">
                            <span className="trip-dot trip-dot--start" />
                            <div className="trip-line-bar" />
                            <FontAwesomeIcon icon={faBus} className="trip-bus-icon" />
                            <div className="trip-line-bar" />
                            <span className="trip-dot trip-dot--end" />
                          </div>
                          <span className="trip-distance">{r.distance_km} km</span>
                        </div>

                        <div className="trip-city trip-city--right">
                          <span className="trip-time trip-time--muted">-</span>
                          <span className="trip-name">
                            <FontAwesomeIcon icon={faLocationDot} className="trip-loc-icon trip-loc-icon--accent" />
                            {r.ville_arrivee}
                          </span>
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="trip-meta">
                        {r.date_depart && (
                          <div className="trip-info-item">
                            <span className="trip-info-label">
                              <FontAwesomeIcon icon={faCalendarDays} fixedWidth /> Départ
                            </span>
                            <span className="trip-info-val">{formatDate(r.date_depart)}</span>
                          </div>
                        )}
                        {r.numero_bus && (
                          <div className="trip-info-item">
                            <span className="trip-info-label">
                              <FontAwesomeIcon icon={faBus} fixedWidth /> Bus
                            </span>
                            <span className="trip-info-val" style={{ fontFamily: 'monospace' }}>{r.numero_bus}</span>
                          </div>
                        )}
                        {r.chauffeur && (
                          <div className="trip-info-item">
                            <span className="trip-info-label">
                              <FontAwesomeIcon icon={faUser} fixedWidth /> Chauffeur
                            </span>
                            <span className="trip-info-val">{r.chauffeur}</span>
                          </div>
                        )}
                        {hasHoraire && (
                          <div className="trip-info-item">
                            <span className="trip-info-label">
                              <FontAwesomeIcon icon={faUsers} fixedWidth /> Places
                            </span>
                            <span className={`trip-info-val ${dispo < 5 ? 'text-danger' : 'text-success'}`}>
                              {dispo} / {capacite}
                            </span>
                          </div>
                        )}
                        {!hasHoraire && r.prochain_depart && (
                          <div className="trip-info-item">
                            <span className="trip-info-label">Prochain départ</span>
                            <span className="trip-info-val">
                              {new Date(r.prochain_depart).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                              {' à '}
                              {new Date(r.prochain_depart).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        )}
                        {!hasHoraire && r.nb_horaires && (
                          <div className="trip-info-item">
                            <span className="trip-info-label">Horaires dispo</span>
                            <span className="trip-info-val text-success">
                              {r.nb_horaires} départ{r.nb_horaires > 1 ? 's' : ''} prévu{r.nb_horaires > 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Barre de places */}
                      {hasHoraire && (
                        <div className="places-bar-wrapper">
                          <div className="places-bar">
                            <div
                              className={`places-bar-fill ${
                                dispoRatio > 0.5 ? 'places-bar-fill--good'
                                : dispoRatio > 0.15 ? 'places-bar-fill--warn'
                                : 'places-bar-fill--bad'
                              }`}
                              style={{ width: `${dispoRatio * 100}%` }}
                            />
                          </div>
                          <span className="places-bar-label">
                            {dispo > 0
                              ? `${dispo} place${dispo > 1 ? 's' : ''} libre${dispo > 1 ? 's' : ''}`
                              : 'Complet'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Aside */}
                    <div className="trip-card-aside">
                      <div className="trip-price-group">
                        <div className="trip-price">{parseInt(r.prix).toLocaleString('fr-FR')}</div>
                        <div className="trip-price-currency">FCFA</div>
                      </div>
                      <div className="trip-price-label">par personne</div>

                      {hasHoraire && (
                        <span className={`badge ${dispo > 5 ? 'badge-success' : dispo > 0 ? 'badge-warning' : 'badge-danger'}`}>
                          {dispo > 5 ? 'Disponible' : dispo > 0 ? 'Presque complet' : 'Complet'}
                        </span>
                      )}

                      {hasHoraire ? (
                        dispo > 0 ? (
                          <button className="btn btn-primary btn-full" onClick={() => handleReserver(r)}>
                            <FontAwesomeIcon icon={isLoggedIn ? faCheck : faLock} /> Réserver
                          </button>
                        ) : (
                          <button className="btn btn-ghost btn-full" disabled>
                            <FontAwesomeIcon icon={faRoadBarrier} /> Complet
                          </button>
                        )
                      ) : (
                        <button className="btn btn-outline btn-full" onClick={() => handleVoirHoraires(r)}>
                          <FontAwesomeIcon icon={faClock} /> Voir les horaires
                        </button>
                      )}

                      {hasHoraire && (
                        <button className="btn-detail-link" onClick={() => setDetailModal(r)}>
                          <FontAwesomeIcon icon={faEye} /> Détails du trajet
                        </button>
                      )}

                      {!isLoggedIn && hasHoraire && dispo > 0 && (
                        <p className="aside-login-hint">
                          <FontAwesomeIcon icon={faLock} /> Connexion requise
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Modal détail ── */}
      {detailModal && (
        <div className="modal-overlay" onClick={() => setDetailModal(null)}>
          <div className="modal modal-detail" onClick={e => e.stopPropagation()}>

            {/* Header coloré */}
            <div className="modal-detail-header">
              <div className="modal-route-display">
                <div className="modal-city">
                  <div className="modal-city-time">
                    {new Date(detailModal.date_depart).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="modal-city-name">{detailModal.ville_depart}</div>
                </div>
                <div className="modal-route-arrow">
                  <FontAwesomeIcon icon={faBus} className="modal-bus-icon" />
                  <FontAwesomeIcon icon={faArrowRight} className="modal-arrow-icon" />
                </div>
                <div className="modal-city modal-city--right">
                  <div className="modal-city-time modal-city-time--muted">-</div>
                  <div className="modal-city-name">{detailModal.ville_arrivee}</div>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setDetailModal(null)}>
                <FontAwesomeIcon icon={faCircleXmark} />
              </button>
            </div>

            <div className="modal-body">
              {/* Barre de places */}
              {detailModal.places_disponibles !== undefined && (
                <div className="modal-places-section">
                  <div className="modal-places-header">
                    <FontAwesomeIcon icon={faUsers} />
                    <span>Disponibilité des places</span>
                    <strong className={detailModal.places_disponibles < 5 ? 'text-danger' : 'text-success'}>
                      {detailModal.places_disponibles} / {detailModal.capacite}
                    </strong>
                  </div>
                  <div className="places-bar modal-places-bar">
                    <div
                      className={`places-bar-fill ${
                        (detailModal.places_disponibles / detailModal.capacite) > 0.5
                          ? 'places-bar-fill--good'
                          : (detailModal.places_disponibles / detailModal.capacite) > 0.15
                          ? 'places-bar-fill--warn'
                          : 'places-bar-fill--bad'
                      }`}
                      style={{ width: `${Math.min(detailModal.places_disponibles / detailModal.capacite, 1) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Détails */}
              {[
                { icon: faCalendarDays, label: 'Date de départ',     value: new Date(detailModal.date_depart).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) },
                { icon: faClock,        label: 'Heure de départ',    value: new Date(detailModal.date_depart).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) },
                { icon: faRoute,        label: 'Distance',           value: `${detailModal.distance_km} km` },
                { icon: faBus,          label: 'Numéro de bus',      value: detailModal.numero_bus },
                { icon: faUsers,        label: 'Capacité totale',    value: `${detailModal.capacite} places` },
                { icon: faStar,         label: 'Places disponibles', value: `${detailModal.places_disponibles} places libres` },
                { icon: faUser,         label: 'Chauffeur',          value: detailModal.chauffeur || 'Non renseigné' },
                { icon: faTag,          label: 'Prix du billet',     value: `${parseInt(detailModal.prix).toLocaleString('fr-FR')} FCFA` },
              ].map((item, i) => (
                <div key={i} className="modal-detail-row">
                  <span className="modal-detail-label">
                    <FontAwesomeIcon icon={item.icon} fixedWidth /> {item.label}
                  </span>
                  <strong className="modal-detail-value">{item.value}</strong>
                </div>
              ))}
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDetailModal(null)}>Fermer</button>
              {detailModal.places_disponibles > 0 ? (
                <button
                  className="btn btn-accent"
                  onClick={() => { setDetailModal(null); handleReserver(detailModal); }}
                >
                  <FontAwesomeIcon icon={isLoggedIn ? faCheckCircle : faLock} />
                  {isLoggedIn ? 'Réserver ce trajet' : 'Connexion pour réserver'}
                </button>
              ) : (
                <button className="btn btn-ghost" disabled>
                  <FontAwesomeIcon icon={faRoadBarrier} /> Trajet complet
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
