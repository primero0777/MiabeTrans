// API MiabeTrans - ES6+
class MiabeTransAPI {
    constructor() {
        this.baseUrl = 'http://localhost/miabetrans/backend/api';
        this.token = localStorage.getItem('auth_token');
    }

    // Headers communs
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    // Gestion des réponses
    async handleResponse(response) {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Request failed');
        }

        return data;
    }

    // Gestion des erreurs
    handleError(error) {
        console.error('API Error:', error);
        
        if (error.message.includes('401')) {
            // Token expiré ou invalide
            this.handleUnauthorized();
        }
        
        throw error;
    }

    handleUnauthorized() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');
        window.location.href = '../Utilisateurs/connexion.html';
    }

    // Authentification
    async login(loginData) {
        try {
            const response = await fetch(`${this.baseUrl}/auth.php`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(loginData)
            });

            return await this.handleResponse(response);
        } catch (error) {
            return this.handleError(error);
        }
    }

    async register(userData) {
        try {
            const response = await fetch(`${this.baseUrl}/auth.php`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    action: 'register',
                    ...userData
                })
            });

            return await this.handleResponse(response);
        } catch (error) {
            return this.handleError(error);
        }
    }

    // Trajets
    async getTrajets(queryParams = '') {
        try {
            const response = await fetch(`${this.baseUrl}/trajets.php?${queryParams}`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            return await this.handleResponse(response);
        } catch (error) {
            return this.handleError(error);
        }
    }

    async getTrajet(trajetId) {
        try {
            const response = await fetch(`${this.baseUrl}/trajets.php?id=${trajetId}`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            return await this.handleResponse(response);
        } catch (error) {
            return this.handleError(error);
        }
    }

    // Réservations
    async createReservation(reservationData) {
        try {
            const response = await fetch(`${this.baseUrl}/reservations.php`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(reservationData)
            });

            return await this.handleResponse(response);
        } catch (error) {
            return this.handleError(error);
        }
    }

    async getReservations(queryParams = '') {
        try {
            const response = await fetch(`${this.baseUrl}/reservations.php?${queryParams}`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            return await this.handleResponse(response);
        } catch (error) {
            return this.handleError(error);
        }
    }

    async getUserReservations() {
        return this.getReservations();
    }

    async cancelReservation(reservationId) {
        try {
            const response = await fetch(`${this.baseUrl}/reservations.php`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    id: reservationId,
                    statut: 'annule'
                })
            });

            return await this.handleResponse(response);
        } catch (error) {
            return this.handleError(error);
        }
    }

    // Utilisateurs
    async getUserProfile() {
        try {
            const response = await fetch(`${this.baseUrl}/utilisateurs.php`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            return await this.handleResponse(response);
        } catch (error) {
            return this.handleError(error);
        }
    }

    async updateUserProfile(profileData) {
        try {
            const response = await fetch(`${this.baseUrl}/utilisateurs.php`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(profileData)
            });

            return await this.handleResponse(response);
        } catch (error) {
            return this.handleError(error);
        }
    }

    async changePassword(passwordData) {
        try {
            const response = await fetch(`${this.baseUrl}/utilisateurs.php`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(passwordData)
            });

            return await this.handleResponse(response);
        } catch (error) {
            return this.handleError(error);
        }
    }

    // Chauffeurs
    async getChauffeurs(queryParams = '') {
        try {
            const response = await fetch(`${this.baseUrl}/chauffeurs.php?${queryParams}`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            return await this.handleResponse(response);
        } catch (error) {
            return this.handleError(error);
        }
    }

    // Notifications
    async getNotifications(queryParams = '') {
        try {
            const response = await fetch(`${this.baseUrl}/notifications.php?${queryParams}`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            return await this.handleResponse(response);
        } catch (error) {
            return this.handleError(error);
        }
    }

    async markNotificationAsRead(notificationId) {
        try {
            const response = await fetch(`${this.baseUrl}/notifications.php`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    notification_id: notificationId
                })
            });

            return await this.handleResponse(response);
        } catch (error) {
            return this.handleError(error);
        }
    }

    // Méthodes utilitaires
    async getPopularRoutes() {
        try {
            // Simulation de données populaires
            return Promise.resolve({
                success: true,
                data: [
                    { id: 1, ville_depart: 'Lomé', ville_arrivee: 'Kpalimé', prix: 2500, duree: '2h30' },
                    { id: 2, ville_depart: 'Lomé', ville_arrivee: 'Sokodé', prix: 4500, duree: '5h00' },
                    { id: 3, ville_depart: 'Lomé', ville_arrivee: 'Kara', prix: 6000, duree: '7h00' },
                    { id: 4, ville_depart: 'Kpalimé', ville_arrivee: 'Lomé', prix: 2500, duree: '2h30' }
                ]
            });
        } catch (error) {
            return this.handleError(error);
        }
    }
}

// Export pour utilisation dans les autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MiabeTransAPI;
}