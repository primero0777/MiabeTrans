// src/services/api.js
import axios from 'axios';

const BASE_URL = 'http://localhost/miabetrans/backend/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Intercepteur : ajouter le token JWT automatiquement
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('miabetrans_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Intercepteur : gérer les erreurs globalement
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('miabetrans_token');
      localStorage.removeItem('miabetrans_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ===================== AUTH =====================
export const authAPI = {
  login:          (data) => api.post('/auth/login.php', data),
  register:       (data) => api.post('/auth/register.php', data),
  me:             ()     => api.get('/auth/me.php'),
  updateProfile:  (data) => api.put('/auth/update-profile.php', data),
  forgotPassword: (data) => api.post('/auth/forgot-password.php', data),
  resetPassword:  (data) => api.post('/auth/reset-password.php', data),
  sendOtp:        (data) => api.post('/auth/send-otp.php', data),
  verifyOtp:      (data) => api.post('/auth/verify-otp.php', data),
};

// ===================== HORAIRES =====================
export const horairesAPI = {
  getAll:  ()    => api.get('/horaires/index.php'),
  getById: (id)  => api.get(`/horaires/detail.php?id=${id}`),
};

// ===================== TRAJETS =====================
export const trajetsAPI = {
  getAll:  ()       => api.get('/trajets/index.php'),
  search:  (params) => api.get('/trajets/index.php', { params }),
  create:  (data)   => api.post('/trajets/crud.php', data),
  update:  (id, data) => api.put(`/trajets/crud.php?id=${id}`, data),
  delete:  (id)     => api.delete(`/trajets/crud.php?id=${id}`),
  getOne:  (id)     => api.get(`/trajets/crud.php?id=${id}`),
};

// ===================== RÉSERVATIONS =====================
export const reservationsAPI = {
  getAll:       ()         => api.get('/reservations/index.php'),
  create:       (data)     => api.post('/reservations/index.php', data),
  cancel:       (id)       => api.put(`/reservations/index.php?id=${id}`),
  updateStatut: (id, data) => api.put(`/reservations/index.php?id=${id}`, data),
  delete:       (id)       => api.delete(`/reservations/index.php?id=${id}`),
  getRecu:      (id)       => api.get(`/reservations/recu.php?id=${id}`),
  simuler:      (data)     => api.post('/reservations/simuler-paiement.php', data),
  payer:        (data)     => api.post('/reservations/payer.php', data),
};

// ===================== ADMIN =====================
export const adminAPI = {
  // Bus
  getBus:       ()       => api.get('/admin/index.php?resource=bus'),
  createBus:    (data)   => api.post('/admin/index.php?resource=bus', data),
  updateBus:    (id, d)  => api.put(`/admin/index.php?resource=bus&id=${id}`, d),
  deleteBus:    (id)     => api.delete(`/admin/index.php?resource=bus&id=${id}`),

  // Villes
  getVilles:    ()       => api.get('/admin/index.php?resource=villes'),
  getVille:     ()       => api.get('/admin/index.php?resource=villes'),
  createVille:  (data)   => api.post('/admin/index.php?resource=villes', data),
  updateVille:  (id, d)  => api.put(`/admin/index.php?resource=villes&id=${id}`, d),
  deleteVille:  (id)     => api.delete(`/admin/index.php?resource=villes&id=${id}`),

  // Utilisateurs
  getUsers:     ()       => api.get('/admin/index.php?resource=utilisateurs'),
  deleteUser:   (id)     => api.delete(`/admin/index.php?resource=utilisateurs&id=${id}`),

  // Chauffeurs
  getChauffeurs:  ()     => api.get('/admin/index.php?resource=chauffeurs'),
  createChauffeur:(data) => api.post('/admin/index.php?resource=chauffeurs', data),
  deleteChauffeur:(id)   => api.delete(`/admin/index.php?resource=chauffeurs&id=${id}`),

  // Stats
  getStats:     ()       => api.get('/admin/index.php?resource=stats'),

  // Notifications
  getNotifications: ()   => api.get('/admin/index.php?resource=notifications'),
  markRead:     (id)     => api.put(`/admin/index.php?resource=notifications&id=${id}`),

  // Annulation réservation avec raison
  annulerReservation: (data) => api.post('/admin/annuler-reservation.php', data),

  // Validation paiement
  validerPaiement: (data) => api.post('/admin/valider-paiement.php', data),

  // Modifier utilisateur (rôle, infos)
  updateUser: (id, data) => api.put(`/admin/update-user.php?id=${id}`, data),

  // Assignations horaires
  getAssignations:        ()       => api.get('/admin/assignation.php?resource=horaires'),
  getBusDisponibles:      (date)   => api.get(`/admin/assignation.php?resource=bus_disponibles${date?'&date_depart='+date:''}`),
  getChauffeursDisponibles:(date)  => api.get(`/admin/assignation.php?resource=chauffeurs_disponibles${date?'&date_depart='+date:''}`),
  createAssignation:      (data)   => api.post('/admin/assignation.php', data),
  updateAssignation:      (id,data)=> api.put(`/admin/assignation.php?id=${id}`, data),
  deleteAssignation:      (id)     => api.delete(`/admin/assignation.php?id=${id}`),

  // Rôles
  getRoles: () => api.get('/admin/index.php?resource=roles'),
};

export default api;
