export const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API = `${BACKEND_URL}/api`;

function getToken(): string | null {
  return localStorage.getItem('token');
}

export function setToken(token: string) {
  localStorage.setItem('token', token);
}

export function clearToken() {
  localStorage.removeItem('token');
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || res.statusText);
  }
  return res.json();
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
