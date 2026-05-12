import { apiBaseUrl } from './backend';
import { readToken } from './mongoApi';

const POSTS_CHANGED_EVENT = 'clustr:posts-changed';
const LOCAL_POSTS_KEY = 'clustr:local-posts';

const buildUrl = (path = '') => `${apiBaseUrl}${path}`;

function readLocalPosts() {
  if (typeof window === 'undefined') return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(LOCAL_POSTS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalPosts(posts) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(posts));
}

function createLocalPost(payload) {
  const post = {
    id: `local_post_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ...payload,
    createdAt: Number(payload.createdAt) || Date.now(),
  };
  writeLocalPosts([post, ...readLocalPosts()]);
  return post;
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

export async function fetchPosts() {
  const localPosts = readLocalPosts();

  try {
    const remotePosts = await request('/api/posts');
    const remoteIds = new Set(remotePosts.map((post) => post.id));
    return [
      ...localPosts.filter((post) => !remoteIds.has(post.id)),
      ...remotePosts,
    ].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch (error) {
    if (localPosts.length > 0) {
      return localPosts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
    throw error;
  }
}

export async function createPost(payload) {
  try {
    return await request('/api/posts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.warn('Post API unavailable; saving post locally.', error);
    return createLocalPost(payload);
  }
}

export async function uploadPostMedia(file) {
  const formData = new FormData();
  formData.append('media', file);
  const token = readToken();

  const response = await fetch(buildUrl('/api/uploads/post-media'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    let message = 'Media upload failed';
    try {
      const data = await response.json();
      message = data?.message || message;
    } catch {
      message = response.statusText || message;
    }
    throw new Error(message);
  }

  return response.json();
}

export async function updatePost(postId, updates) {
  try {
    return await request(`/api/posts/${postId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  } catch (error) {
    const localPosts = readLocalPosts();
    const postIndex = localPosts.findIndex((post) => post.id === postId);
    if (postIndex === -1) throw error;

    const updatedPost = { ...localPosts[postIndex], ...updates, id: postId };
    localPosts[postIndex] = updatedPost;
    writeLocalPosts(localPosts);
    return updatedPost;
  }
}

export async function deletePost(postId) {
  try {
    return await request(`/api/posts/${postId}`, {
      method: 'DELETE',
    });
  } catch (error) {
    const localPosts = readLocalPosts();
    const nextPosts = localPosts.filter((post) => post.id !== postId);
    if (nextPosts.length === localPosts.length) throw error;

    writeLocalPosts(nextPosts);
    return null;
  }
}

export function notifyPostsChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(POSTS_CHANGED_EVENT));
  }
}

export function subscribeToPostsChanged(callback) {
  if (typeof window === 'undefined') return () => {};

  window.addEventListener(POSTS_CHANGED_EVENT, callback);
  return () => window.removeEventListener(POSTS_CHANGED_EVENT, callback);
}
