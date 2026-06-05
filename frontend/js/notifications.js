// Système de notifications en temps réel MiabeTrans
class NotificationManager {
    constructor() {
        this.notifications = [];
        this.unreadCount = 0;
        this.soundEnabled = true;
        this.pollingInterval = null;
        this.init();
    }

    init() {
        this.loadNotifications();
        this.setupEventListeners();
        this.startPolling();
        this.updateBadge();
    }

    setupEventListeners() {
        // Événements de visibilité de page
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkNewNotifications();
            }
        });

        // Écouteur pour les clics sur les notifications
        document.addEventListener('click', (e) => {
            if (e.target.closest('.notification-item')) {
                this.handleNotificationClick(e);
            }
        });
    }

    async loadNotifications() {
        try {
            const response = await api.getNotifications();
            if (response.success) {
                this.notifications = response.data.notifications;
                this.unreadCount = response.data.unread_count;
                this.renderNotifications();
                this.updateBadge();
            }
        } catch (error) {
            console.error('Erreur chargement notifications:', error);
        }
    }

    async checkNewNotifications() {
        try {
            const response = await api.getNotifications({ mark_read: false });
            if (response.success) {
                const newUnreadCount = response.data.unread_count;
                
                if (newUnreadCount > this.unreadCount) {
                    this.showNewNotificationAlert(newUnreadCount - this.unreadCount);
                }
                
                this.unreadCount = newUnreadCount;
                this.updateBadge();
            }
        } catch (error) {
            console.error('Erreur vérification notifications:', error);
        }
    }

    startPolling() {
        // Vérifier les nouvelles notifications toutes les 30 secondes
        this.pollingInterval = setInterval(() => {
            if (!document.hidden) {
                this.checkNewNotifications();
            }
        }, 30000);
    }

    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    renderNotifications() {
        const container = document.getElementById('notificationsContainer');
        const dropdown = document.getElementById('notificationsDropdown');
        
        if (container) {
            container.innerHTML = this.generateNotificationsHTML();
        }
        
        if (dropdown) {
            dropdown.innerHTML = this.generateDropdownHTML();
        }
    }

    generateNotificationsHTML() {
        if (this.notifications.length === 0) {
            return `
                <div class="empty-notifications">
                    <div class="empty-icon">🔔</div>
                    <h3>Aucune notification</h3>
                    <p>Vous serez notifié des nouvelles activités</p>
                </div>
            `;
        }

        return this.notifications.map(notification => `
            <div class="notification-item ${notification.lu ? 'read' : 'unread'}" 
                 data-id="${notification.id}">
                <div class="notification-icon">
                    ${this.getNotificationIcon(notification.type)}
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notification.titre}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${this.formatTime(notification.date_envoi)}</div>
                </div>
                <div class="notification-actions">
                    ${!notification.lu ? `
                        <button class="btn-mark-read" onclick="notificationManager.markAsRead(${notification.id})">
                            ✓
                        </button>
                    ` : ''}
                    <button class="btn-delete" onclick="notificationManager.deleteNotification(${notification.id})">
                        ×
                    </button>
                </div>
            </div>
        `).join('');
    }

    generateDropdownHTML() {
        const recentNotifications = this.notifications.slice(0, 5);
        
        if (recentNotifications.length === 0) {
            return `
                <div class="notification-dropdown-item">
                    <div class="notification-empty">Aucune notification</div>
                </div>
            `;
        }

        return recentNotifications.map(notification => `
            <div class="notification-dropdown-item ${notification.lu ? 'read' : 'unread'}" 
                 data-id="${notification.id}">
                <div class="dropdown-notification-icon">
                    ${this.getNotificationIcon(notification.type)}
                </div>
                <div class="dropdown-notification-content">
                    <div class="dropdown-notification-title">${notification.titre}</div>
                    <div class="dropdown-notification-preview">${this.limitText(notification.message, 50)}</div>
                    <div class="dropdown-notification-time">${this.formatTime(notification.date_envoi)}</div>
                </div>
            </div>
        `).join('') + `
            <div class="notification-dropdown-footer">
                <a href="../Utilisateurs/notifications.html" class="view-all-link">
                    Voir toutes les notifications
                </a>
            </div>
        `;
    }

    getNotificationIcon(type) {
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };
        return icons[type] || '📢';
    }

    formatTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'À l\'instant';
        if (diffMins < 60) return `Il y a ${diffMins} min`;
        if (diffHours < 24) return `Il y a ${diffHours} h`;
        if (diffDays < 7) return `Il y a ${diffDays} j`;
        
        return date.toLocaleDateString('fr-FR');
    }

    limitText(text, limit) {
        return text.length > limit ? text.substring(0, limit) + '...' : text;
    }

    updateBadge() {
        const badges = document.querySelectorAll('.notification-badge');
        
        badges.forEach(badge => {
            if (this.unreadCount > 0) {
                badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        });
    }

    async markAsRead(notificationId) {
        try {
            await api.markNotificationAsRead(notificationId);
            
            // Mettre à jour localement
            const notification = this.notifications.find(n => n.id == notificationId);
            if (notification && !notification.lu) {
                notification.lu = 1;
                this.unreadCount = Math.max(0, this.unreadCount - 1);
                this.renderNotifications();
                this.updateBadge();
            }
        } catch (error) {
            console.error('Erreur marquage notification:', error);
            this.showError('Erreur lors du marquage de la notification');
        }
    }

    async markAllAsRead() {
        try {
            await api.markAllNotificationsAsRead();
            
            // Mettre à jour localement
            this.notifications.forEach(notification => {
                notification.lu = 1;
            });
            this.unreadCount = 0;
            this.renderNotifications();
            this.updateBadge();
            
            this.showSuccess('Toutes les notifications marquées comme lues');
        } catch (error) {
            console.error('Erreur marquage notifications:', error);
            this.showError('Erreur lors du marquage des notifications');
        }
    }

    async deleteNotification(notificationId) {
        try {
            await api.deleteNotification(notificationId);
            
            // Supprimer localement
            this.notifications = this.notifications.filter(n => n.id != notificationId);
            this.renderNotifications();
            
            this.showSuccess('Notification supprimée');
        } catch (error) {
            console.error('Erreur suppression notification:', error);
            this.showError('Erreur lors de la suppression de la notification');
        }
    }

    handleNotificationClick(event) {
        const notificationItem = event.target.closest('.notification-item');
        if (!notificationItem) return;

        const notificationId = notificationItem.dataset.id;
        const notification = this.notifications.find(n => n.id == notificationId);
        
        if (notification && notification.lien) {
            window.location.href = notification.lien;
        }
        
        // Marquer comme lu si ce n'est pas déjà fait
        if (notification && !notification.lu) {
            this.markAsRead(notificationId);
        }
    }

    showNewNotificationAlert(count) {
        if (this.soundEnabled) {
            this.playNotificationSound();
        }

        // Notification toast
        this.showToast(`Vous avez ${count} nouvelle(s) notification(s)`, 'info');
        
        // Notification navigateur (si autorisée)
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('MiabeTrans', {
                body: `Vous avez ${count} nouvelle(s) notification(s)`,
                icon: '/assets/icons/icon-192x192.png'
            });
        }
    }

    playNotificationSound() {
        // Créer un son de notification simple
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    }

    async requestNotificationPermission() {
        if (!('Notification' in window)) {
            console.log('Notifications navigateur non supportées');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return false;
    }

    // Méthodes d'affichage
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-message">${message}</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Styles du toast
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getToastColor(type)};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            animation: slideInRight 0.3s ease;
            max-width: 400px;
        `;

        document.body.appendChild(toast);

        // Supprimer automatiquement après 5 secondes
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }

    getToastColor(type) {
        const colors = {
            info: '#3b82f6',
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444'
        };
        return colors[type] || colors.info;
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    // Destruction propre
    destroy() {
        this.stopPolling();
    }
}

// Initialisation globale
const notificationManager = new NotificationManager();

// CSS pour les notifications
const notificationStyles = `
.notification-badge {
    position: absolute;
    top: -8px;
    right: -8px;
    background: #ef4444;
    color: white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    display: none;
    align-items: center;
    justify-content: center;
}

.notification-item {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.notification-item:hover {
    background: #f9fafb;
}

.notification-item.unread {
    background: #f0f9ff;
    border-left: 3px solid #3b82f6;
}

.notification-icon {
    font-size: 1.25rem;
    flex-shrink: 0;
    margin-top: 0.25rem;
}

.notification-content {
    flex: 1;
}

.notification-title {
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.25rem;
}

.notification-message {
    color: #6b7280;
    font-size: 0.875rem;
    line-height: 1.4;
}

.notification-time {
    color: #9ca3af;
    font-size: 0.75rem;
    margin-top: 0.25rem;
}

.notification-actions {
    display: flex;
    gap: 0.5rem;
    opacity: 0;
    transition: opacity 0.2s ease;
}

.notification-item:hover .notification-actions {
    opacity: 1;
}

.btn-mark-read, .btn-delete {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    font-size: 1rem;
}

.btn-mark-read:hover {
    background: #10b981;
    color: white;
}

.btn-delete:hover {
    background: #ef4444;
    color: white;
}

/* Dropdown notifications */
.notification-dropdown-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #f3f4f6;
    cursor: pointer;
}

.notification-dropdown-item:hover {
    background: #f9fafb;
}

.notification-dropdown-item.unread {
    background: #f0f9ff;
}

.dropdown-notification-icon {
    font-size: 1rem;
    flex-shrink: 0;
    margin-top: 0.125rem;
}

.dropdown-notification-content {
    flex: 1;
    min-width: 0;
}

.dropdown-notification-title {
    font-weight: 600;
    color: #1f2937;
    font-size: 0.875rem;
    margin-bottom: 0.125rem;
}

.dropdown-notification-preview {
    color: #6b7280;
    font-size: 0.75rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.dropdown-notification-time {
    color: #9ca3af;
    font-size: 0.625rem;
    margin-top: 0.125rem;
}

.notification-dropdown-footer {
    padding: 0.75rem 1rem;
    border-top: 1px solid #f3f4f6;
    text-align: center;
}

.view-all-link {
    color: #3b82f6;
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 500;
}

.view-all-link:hover {
    text-decoration: underline;
}

.empty-notifications {
    text-align: center;
    padding: 3rem 2rem;
    color: #6b7280;
}

.empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    opacity: 0.5;
}

@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}
`;

// Injecter les styles
const notificationStyleSheet = document.createElement('style');
notificationStyleSheet.textContent = notificationStyles;
document.head.appendChild(notificationStyleSheet);