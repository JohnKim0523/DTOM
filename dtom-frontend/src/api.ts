export const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API = `${BACKEND_URL}/api`;

export function imageUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${BACKEND_URL}${path}`;
}

function getToken(): string | null {
  return localStorage.getItem('token');
}

export function setToken(token: string) {
  localStorage.setItem('token', token);
}

export function clearToken() {
  localStorage.removeItem('token');
}

const inflightRequests = new Map<string, Promise<any>>();

async function request(path: string, options: RequestInit = {}) {
  const method = options.method || 'GET';
  const key = method !== 'GET' ? `${method}:${path}:${options.body || ''}` : '';

  if (key && inflightRequests.has(key)) {
    return inflightRequests.get(key);
  }

  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const promise = fetch(`${API}${path}`, { ...options, headers })
    .then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || res.statusText);
      }
      return res.json();
    })
    .finally(() => {
      if (key) inflightRequests.delete(key);
    });

  if (key) inflightRequests.set(key, promise);
  return promise;
}

// Auth
export const auth = {
  register: (data: { username: string; email: string; password: string }) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request('/auth/me'),
  changePassword: (oldPassword: string, newPassword: string) =>
    request('/auth/password', { method: 'PATCH', body: JSON.stringify({ oldPassword, newPassword }) }),
};

// Events
export const events = {
  list: (page = 1) => request(`/events?page=${page}`),
  myCreated: () => request('/events/my/created'),
  myJoined: () => request('/events/my/joined'),
  get: (id: string) => request(`/events/${id}`),
  create: (data: any) =>
    request('/events', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request(`/events/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) => request(`/events/${id}`, { method: 'DELETE' }),
  uploadImage: async (id: string, file: File) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API}/events/${id}/image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || res.statusText);
    }
    return res.json();
  },
};

// Members
export const members = {
  list: (eventId: string) => request(`/events/${eventId}/members`),
  join: (eventId: string) =>
    request(`/events/${eventId}/members`, { method: 'POST' }),
  leave: (eventId: string) =>
    request(`/events/${eventId}/members`, { method: 'DELETE' }),
  promote: (eventId: string, userId: string) =>
    request(`/events/${eventId}/members/${userId}/promote`, { method: 'PATCH' }),
  demote: (eventId: string, userId: string) =>
    request(`/events/${eventId}/members/${userId}/demote`, { method: 'PATCH' }),
  kick: (eventId: string, userId: string) =>
    request(`/events/${eventId}/members/${userId}/kick`, { method: 'DELETE' }),
  invite: (eventId: string, userId: string) =>
    request(`/events/${eventId}/members/${userId}/invite`, { method: 'POST' }),
  acceptInvite: (eventId: string) =>
    request(`/events/${eventId}/members/accept-invite`, { method: 'PATCH' }),
  declineInvite: (eventId: string) =>
    request(`/events/${eventId}/members/decline-invite`, { method: 'DELETE' }),
};

// Invites
export const invites = {
  list: () => request('/invites'),
};

// Users
export const usersApi = {
  get: (id: string) => request(`/users/${id}`),
  search: (q: string) => request(`/users/search?q=${encodeURIComponent(q)}`),
  activity: (id: string) => request(`/users/${id}/activity`),
};

export const users = {
  updateMe: (data: { displayName?: string; bio?: string }) =>
    request('/users/me', { method: 'PATCH', body: JSON.stringify(data) }),
  deleteMe: () => request('/users/me', { method: 'DELETE' }),
  uploadAvatar: async (file: File) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('avatar', file);
    const res = await fetch(`${API}/users/me/avatar`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || res.statusText);
    }
    return res.json();
  },
};

// Friends
export const friends = {
  send: (userId: string) => request(`/friends/${userId}`, { method: 'POST' }),
  accept: (id: string) => request(`/friends/${id}/accept`, { method: 'PATCH' }),
  remove: (id: string) => request(`/friends/${id}`, { method: 'DELETE' }),
  list: () => request('/friends'),
  requests: () => request('/friends/requests'),
  status: (userId: string) => request(`/friends/status/${userId}`),
};

// Follows
export const follows = {
  follow: (userId: string) => request(`/follows/${userId}`, { method: 'POST' }),
  unfollow: (userId: string) => request(`/follows/${userId}`, { method: 'DELETE' }),
  followers: (userId: string) => request(`/follows/${userId}/followers`),
  following: (userId: string) => request(`/follows/${userId}/following`),
  counts: (userId: string) => request(`/follows/${userId}/counts`),
  status: (userId: string) => request(`/follows/${userId}/status`),
};

// Search
export const search = async (q: string) => {
  const [userResults, eventResults] = await Promise.all([
    usersApi.search(q),
    request(`/events/search?q=${encodeURIComponent(q)}`),
  ]);
  return { users: userResults, events: eventResults };
};

// Messages
export const messages = {
  send: (receiverId: string, content: string) =>
    request(`/messages/${receiverId}`, { method: 'POST', body: JSON.stringify({ content }) }),
  conversations: () => request('/messages'),
  conversation: (userId: string, before?: string) =>
    request(`/messages/${userId}${before ? `?before=${encodeURIComponent(before)}` : ''}`),
  markRead: (userId: string) =>
    request(`/messages/${userId}/read`, { method: 'PATCH' }),
  unreadCount: () => request('/messages/unread-count'),
};

// Notifications
export const notifications = {
  list: () => request('/notifications'),
  unreadCount: () => request('/notifications/unread-count'),
  markRead: (id: string) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => request('/notifications/read-all', { method: 'PATCH' }),
};

// Fundraising
export const fundraising = {
  contribute: (eventId: string, amount: number) =>
    request(`/events/${eventId}/fundraising/contribute`, { method: 'POST', body: JSON.stringify({ amount }) }),
  contributions: (eventId: string) =>
    request(`/events/${eventId}/fundraising/contributions`),
};

// Admin (uses separate adminToken, not the user token)
function getAdminToken(): string | null {
  return localStorage.getItem('adminToken');
}

export function setAdminToken(token: string) {
  localStorage.setItem('adminToken', token);
}

export function clearAdminToken() {
  localStorage.removeItem('adminToken');
}

async function adminRequest(path: string, options: RequestInit = {}) {
  const method = options.method || 'GET';
  const key = method !== 'GET' ? `admin:${method}:${path}:${options.body || ''}` : '';

  if (key && inflightRequests.has(key)) {
    return inflightRequests.get(key);
  }

  const token = getAdminToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const promise = fetch(`${API}${path}`, { ...options, headers })
    .then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || res.statusText);
      }
      return res.json();
    })
    .finally(() => {
      if (key) inflightRequests.delete(key);
    });

  if (key) inflightRequests.set(key, promise);
  return promise;
}

export const admin = {
  login: (data: { username: string; password: string }) =>
    request('/admin/login', { method: 'POST', body: JSON.stringify(data) }),
  stats: () => adminRequest('/admin/stats'),
  listUsers: (page = 1) => adminRequest(`/admin/users?page=${page}`),
  updateUser: (id: string, data: any) =>
    adminRequest(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteUser: (id: string) => adminRequest(`/admin/users/${id}`, { method: 'DELETE' }),
  listEvents: (page = 1) => adminRequest(`/admin/events?page=${page}`),
  updateEvent: (id: string, data: any) =>
    adminRequest(`/admin/events/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteEvent: (id: string) => adminRequest(`/admin/events/${id}`, { method: 'DELETE' }),
  listMessages: (page = 1) => adminRequest(`/admin/messages?page=${page}`),
  listComments: (page = 1) => adminRequest(`/admin/comments?page=${page}`),
  deleteComment: (id: string) => adminRequest(`/admin/comments/${id}`, { method: 'DELETE' }),
};

// Comments
export const comments = {
  list: (eventId: string) => request(`/events/${eventId}/comments`),
  create: (eventId: string, content: string) =>
    request(`/events/${eventId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  remove: (commentId: string) =>
    request(`/comments/${commentId}`, { method: 'DELETE' }),
};
