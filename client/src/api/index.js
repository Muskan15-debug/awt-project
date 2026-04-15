import api from './axios.js';

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  changePassword: (data) => api.patch('/auth/password', data),
};

export const usersAPI = {
  search: (params) => api.get('/users', { params }),
  getProfile: (id) => api.get(`/users/${id}`),
  getMe: () => api.get('/users/me'),
  updateMe: (data) => api.put('/users/me', data),
};

export const shortlistAPI = {
  toggle: (data) => api.post('/shortlists', data),
  getAll: () => api.get('/shortlists'),
};

export const projectsAPI = {
  getAll: (params) => api.get('/projects', { params }),
  getOne: (id) => api.get(`/projects/${id}`),
  assignPM: (id, data) => api.patch(`/projects/${id}/assign-pm`, data),
  updateStatus: (id, data) => api.patch(`/projects/${id}/status`, data),
};

export const invitesAPI = {
  send: (data) => api.post('/invites', data),
  getAll: () => api.get('/invites'),
  respond: (id, status) => api.patch(`/invites/${id}/respond`, { status }),
  assignPM: (id, pmId) => api.patch(`/invites/${id}/assign-pm`, { pmId }),
  getMessages: (id) => api.get(`/invites/${id}/messages`),
  sendMessage: (id, content) => api.post(`/invites/${id}/messages`, { content }),
};

export const milestonesAPI = {
  create: (projectId, data) => api.post(`/milestones/project/${projectId}`, data),
  getByProject: (projectId) => api.get(`/milestones/project/${projectId}`),
  updateStatus: (id, data) => api.patch(`/milestones/${id}/status`, data),
};

export const tasksAPI = {
  create: (data) => api.post('/tasks', data),
  getByProject: (projectId) => api.get(`/tasks/project/${projectId}`),
  getMy: () => api.get('/tasks/my'),
  updateStatus: (id, data) => api.patch(`/tasks/${id}/status`, data),
  submit: (id, data) => api.patch(`/tasks/${id}/submit`, data),
  approve: (id, data) => api.patch(`/tasks/${id}/approve`, data),
  reassign: (id, data) => api.patch(`/tasks/${id}/reassign`, data),
};

export const paymentsAPI = {
  getEarnings: () => api.get('/payments/earnings'),
  getByProject: (projectId) => api.get(`/payments/project/${projectId}`),
};

export const reviewsAPI = {
  create: (data) => api.post('/reviews', data),
  getForUser: (userId) => api.get(`/reviews/user/${userId}`),
};

export const disputesAPI = {
  create: (data) => api.post('/disputes', data),
  getAll: () => api.get('/disputes'),
  getOne: (id) => api.get(`/disputes/${id}`),
  resolve: (id, data) => api.patch(`/disputes/${id}/resolve`, data),
};

export const agenciesAPI = {
  create: (data) => api.post('/agencies', data),
  getOne: (id) => api.get(`/agencies/${id}`),
  update: (id, data) => api.put(`/agencies/${id}`, data),
  addMember: (id, data) => api.post(`/agencies/${id}/members`, data),
  updateMember: (id, uid, data) => api.patch(`/agencies/${id}/members/${uid}`, data),
};

export const agencyRequestsAPI = {
  create: (data) => api.post('/agency-requests', data),
  getMy: () => api.get('/agency-requests/my'),
  respond: (id, data) => api.patch(`/agency-requests/${id}/respond`, data),
};

export const adminAPI = {
  getAnalytics: () => api.get('/admin/analytics'),
  getActivityLog: (params) => api.get('/admin/activity-log', { params }),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (id, data) => api.patch(`/admin/users/${id}`, data),
  getPendingAgencies: () => api.get('/admin/agencies/pending'),
  updateAgency: (id, data) => api.patch(`/admin/agencies/${id}`, data),
  getDisputes: () => api.get('/admin/disputes'),
  resolveDispute: (id, data) => api.patch(`/admin/disputes/${id}/resolve`, data),
  getProjects: (params) => api.get('/admin/projects', { params }),
};
