// Intégration de cartes et géolocalisation pour MiabeTrans
class MapIntegration {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.map = null;
        this.markers = [];
        this.options = {
            zoom: 12,
            center: [6.1375, 1.2125], // Lomé par défaut
            style: 'standard',
            ...options
        };
        
        this.init();
    }

    init() {
        if (!this.container) {
            console.error('Container de carte non trouvé');
            return;
        }

        this.loadMapLibrary().then(() => {
            this.initializeMap();
            this.setupEventListeners();
        }).catch(error => {
            console.error('Erreur chargement carte:', error);
            this.showFallbackMap();
        });
    }

    async loadMapLibrary() {
        // Charger Leaflet.js (solution légère et gratuite)
        return new Promise((resolve, reject) => {
            if (window.L) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
            script.crossOrigin = '';
            
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
            link.crossOrigin = '';
            
            document.head.appendChild(link);
            
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Erreur chargement Leaflet'));
            document.head.appendChild(script);
        });
    }

    initializeMap() {
        // Initialiser la carte Leaflet
        this.map = L.map(this.container).setView(
            this.options.center, 
            this.options.zoom
        );

        // Ajouter une couche de tuiles (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this.map);

        // Style du container
        this.container.style.height = '400px';
        this.container.style.borderRadius = '8px';
        this.container.style.overflow = 'hidden';

        // Contrôles de zoom
        this.map.zoomControl.setPosition('topright');

        // Événement de chargement
        this.map.whenReady(() => {
            this.onMapReady();
        });
    }

    onMapReady() {
        console.log('Carte chargée avec succès');
        
        // Émettre un événement personnalisé
        const event = new CustomEvent('mapReady', { 
            detail: { map: this.map } 
        });
        this.container.dispatchEvent(event);
    }

    setupEventListeners() {
        // Clic sur la carte
        this.map.on('click', (e) => {
            this.onMapClick(e);
        });

        // Mouvement de la carte
        this.map.on('moveend', () => {
            this.onMapMove();
        });
    }

    onMapClick(e) {
        const { lat, lng } = e.latlng;
        console.log('Clic carte:', lat, lng);
        
        const event = new CustomEvent('mapClick', {
            detail: { lat, lng, originalEvent: e }
        });
        this.container.dispatchEvent(event);
    }

    onMapMove() {
        const center = this.map.getCenter();
        const bounds = this.map.getBounds();
        
        const event = new CustomEvent('mapMove', {
            detail: { center, bounds }
        });
        this.container.dispatchEvent(event);
    }

    // Gestion des marqueurs
    addMarker(lat, lng, options = {}) {
        const markerOptions = {
            title: options.title || 'Position',
            draggable: options.draggable || false,
            ...options
        };

        const marker = L.marker([lat, lng], markerOptions).addTo(this.map);

        // Popup
        if (options.popup) {
            marker.bindPopup(options.popup);
        }

        // Événements
        if (markerOptions.draggable) {
            marker.on('dragend', (e) => {
                const position = e.target.getLatLng();
                this.onMarkerDrag(marker, position);
            });
        }

        marker.on('click', () => {
            this.onMarkerClick(marker);
        });

        this.markers.push(marker);
        return marker;
    }

    removeMarker(marker) {
        this.map.removeLayer(marker);
        this.markers = this.markers.filter(m => m !== marker);
    }

    clearMarkers() {
        this.markers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.markers = [];
    }

    onMarkerDrag(marker, position) {
        const event = new CustomEvent('markerDrag', {
            detail: { marker, position }
        });
        this.container.dispatchEvent(event);
    }

    onMarkerClick(marker) {
        const event = new CustomEvent('markerClick', {
            detail: { marker }
        });
        this.container.dispatchEvent(event);
    }

    // Géolocalisation
    locateUser(options = {}) {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Géolocalisation non supportée'));
                return;
            }

            const geoOptions = {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000,
                ...options
            };

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    this.centerMap(latitude, longitude);
                    
                    // Ajouter un marqueur de position
                    const marker = this.addMarker(latitude, longitude, {
                        title: 'Ma position',
                        popup: '<b>Vous êtes ici</b>'
                    });

                    resolve({ latitude, longitude, marker });
                },
                (error) => {
                    reject(this.getGeolocationError(error));
                },
                geoOptions
            );
        });
    }

    getGeolocationError(error) {
        switch (error.code) {
            case error.PERMISSION_DENIED:
                return new Error('Géolocalisation refusée par l\'utilisateur');
            case error.POSITION_UNAVAILABLE:
                return new Error('Position indisponible');
            case error.TIMEOUT:
                return new Error('Délai de géolocalisation dépassé');
            default:
                return new Error('Erreur de géolocalisation inconnue');
        }
    }

    // Contrôles de la carte
    centerMap(lat, lng, zoom = null) {
        this.map.setView([lat, lng], zoom || this.map.getZoom());
    }

    setZoom(zoom) {
        this.map.setZoom(zoom);
    }

    fitBounds(bounds) {
        this.map.fitBounds(bounds);
    }

    // Itinéraires et directions
    showRoute(waypoints, options = {}) {
        // Simulation d'itinéraire - en production, utiliser un service comme OSRM
        const routeOptions = {
            color: '#3b82f6',
            weight: 6,
            opacity: 0.8,
            ...options
        };

        const latlngs = waypoints.map(wp => [wp.lat, wp.lng]);
        const polyline = L.polyline(latlngs, routeOptions).addTo(this.map);
        
        // Ajuster la vue pour montrer l'itinéraire complet
        this.map.fitBounds(polyline.getBounds());
        
        return polyline;
    }

    // Recherche d'adresses (géocodage)
    async geocodeAddress(address) {
        try {
            // Utiliser le géocodeur Nominatim (OpenStreetMap)
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
            );
            
            const results = await response.json();
            
            if (results.length > 0) {
                const result = results[0];
                return {
                    lat: parseFloat(result.lat),
                    lng: parseFloat(result.lon),
                    address: result.display_name,
                    importance: result.importance
                };
            }
            
            throw new Error('Adresse non trouvée');
        } catch (error) {
            console.error('Erreur géocodage:', error);
            throw error;
        }
    }

    // Carte de repli (si Leaflet échoue)
    showFallbackMap() {
        this.container.innerHTML = `
            <div class="fallback-map" style="
                height: 400px; 
                background: #f3f4f6; 
                border-radius: 8px; 
                display: flex; 
                align-items: center; 
                justify-content: center;
                color: #6b7280;
                flex-direction: column;
                gap: 1rem;
            ">
                <div style="font-size: 3rem;">🗺️</div>
                <div style="text-align: center;">
                    <h3 style="margin: 0 0 0.5rem 0;">Carte non disponible</h3>
                    <p style="margin: 0;">Fonctionnalité de carte temporairement indisponible</p>
                </div>
            </div>
        `;
    }

    // Destruction propre
    destroy() {
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        this.markers = [];
    }
}

// Gestionnaire global des cartes
const mapInstances = {};

function createMap(containerId, options = {}) {
    if (mapInstances[containerId]) {
        mapInstances[containerId].destroy();
    }
    
    mapInstances[containerId] = new MapIntegration(containerId, options);
    return mapInstances[containerId];
}

function getMap(containerId) {
    return mapInstances[containerId];
}