import { apiBaseUrl } from './backend';

const CURRENT_USER_KEY = 'clustr:current-user';
const TOKEN_KEY = 'clustr:token';
const USERS_CHANGED_EVENT = 'clustr:users-changed';
const CONVERSATIONS_CHANGED_EVENT = 'clustr:conversations-changed';

const buildUrl = (path = '') => `${apiBaseUrl}${path}`;

export function readCurrentUser() {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(window.localStorage.getItem(CURRENT_USER_KEY) || 'null');
  } catch {
    return null;
  }
}

export function writeCurrentUser(user) {
  if (typeof window === 'undefined') return;
  if (!user) {
    window.localStorage.removeItem(CURRENT_USER_KEY);
    return;
  }
  window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

export function readToken() {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(TOKEN_KEY) || '';
}

export function writeToken(token = '') {
  if (typeof window === 'undefined') return;
  if (!token) {
    window.localStorage.removeItem(TOKEN_KEY);
    return;
  }
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function logoutUser() {
  writeCurrentUser(null);
  writeToken('');
  fetch(buildUrl('/api/auth/logout'), {
    method: 'POST',
    credentials: 'include',
  }).catch(() => {});
}

async function request(path, options = {}) {
  const token = readToken();
  const response = await fetch(buildUrl(path), {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let message = 'Request failed';
    try {
      const data = await response.json();
      message = data?.message || message;
    } catch {
      message = response.statusText || message;
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
}

export async function loginUser(email, password) {
  const data = await request('/api/users/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  writeCurrentUser(data.user);
  writeToken(data.token || '');
  notifyUsersChanged();
  return data.user;
}

export async function signupUser(name, email, password) {
  const data = await request('/api/users/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
  writeCurrentUser(data.user);
  writeToken(data.token || '');
  notifyUsersChanged();
  return data.user;
}

export async function fetchUsers() {
  return request('/api/users');
}

export async function updateUser(uid, updates) {
  const updated = await request(`/api/users/${uid}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  const current = readCurrentUser();
  if (current?.uid === updated.uid) {
    writeCurrentUser({ ...current, ...updated });
  }
  notifyUsersChanged();
  return updated;
}

export async function toggleFollow(uid, targetUid) {
  const data = await request(`/api/users/${uid}/follow/${targetUid}`, { method: 'POST' });
  const current = readCurrentUser();
  const updatedCurrent = data.users?.find((item) => item.uid === current?.uid);
  if (updatedCurrent) writeCurrentUser({ ...current, ...updatedCurrent });
  notifyUsersChanged();
  return data.users || [];
}

export async function toggleSavedPost(uid, postId) {
  const updated = await request(`/api/users/${uid}/saved-posts/${postId}`, { method: 'POST' });
  const current = readCurrentUser();
  if (current?.uid === updated.uid) writeCurrentUser({ ...current, ...updated });
  notifyUsersChanged();
  return updated;
}

export async function fetchConversations(uid) {
  return request(`/api/conversations/${uid}`);
}

export async function saveConversation(thread) {
  return request(`/api/conversations/${thread.id}`, {
    method: 'PUT',
    body: JSON.stringify(thread),
  });
}

export async function deleteConversation(id) {
  return request(`/api/conversations/${id}`, {
    method: 'DELETE',
  });
}

export function notifyUsersChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(USERS_CHANGED_EVENT));
  }
}

export function subscribeToUsersChanged(callback) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(USERS_CHANGED_EVENT, callback);
  return () => window.removeEventListener(USERS_CHANGED_EVENT, callback);
}

export function notifyConversationsChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CONVERSATIONS_CHANGED_EVENT));
  }
}

export function subscribeToConversationsChanged(callback) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(CONVERSATIONS_CHANGED_EVENT, callback);
  return () => window.removeEventListener(CONVERSATIONS_CHANGED_EVENT, callback);
}
