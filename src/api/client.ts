// Thin fetch wrapper around the backend's /admin/* API. It injects the bearer
// token, parses JSON, and turns non-2xx into thrown ApiError so callers can
// `try/catch`. On 401 it clears the token and redirects to /login — an expired
// or revoked admin session should never leave the operator on a half-broken page.

import { getToken, clearToken } from '../auth';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  // When true, a 401 does NOT redirect — used by the login call itself, where a
  // 401 is just "wrong password" and should surface as a normal error.
  skipAuthRedirect?: boolean;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  if (res.status === 401 && !opts.skipAuthRedirect) {
    clearToken();
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw new ApiError(401, '登录已过期，请重新登录');
  }

  // Parse the body once; the backend always returns JSON (incl. {"error": ...}).
  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const msg =
      data && typeof data === 'object' && 'error' in data
        ? String((data as { error: unknown }).error)
        : `请求失败 (${res.status})`;
    throw new ApiError(res.status, msg);
  }

  return data as T;
}

// --- Types mirroring the backend JSON shapes ---

export interface AdminUser {
  id: string;
  username: string;
  nickname: string;
  is_admin: boolean;
}

export interface LoginResponse {
  token: string;
  user: AdminUser;
}

export interface Stats {
  total_users: number;
  total_posts: number;
  deleted_posts: number;
  banned_users: number;
  new_users_today: number;
  new_posts_today: number;
}

export interface Post {
  id: string;
  user_id: string;
  title: string;
  body: string;
  species: string;
  status: string;
  author_nickname: string;
  author_avatar: string;
  heat_score: number;
  created_at: string;
}

// ModerationReview is the machine verdict attached to a queued post.
export interface ModerationReview {
  id: string;
  post_id: string;
  verdict: string; // pass | reject | flag
  score: number;
  labels: string; // JSON string: per-sub-call detail
  trace_id: string;
  review_state: string; // needs_human
  created_at: string;
}

// ModerationQueueItem pairs a pending post with the machine review that flagged it.
export interface ModerationQueueItem {
  post: Post;
  review: ModerationReview;
}

export interface QueuePage {
  items: ModerationQueueItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface User {
  id: string;
  phone: string;
  username: string;
  nickname: string;
  email: string;
  visit_count: number;
  is_admin: boolean;
  is_banned: boolean;
  created_at: string;
}

export interface Page<T> {
  total: number;
  limit: number;
  offset: number;
  // The backend keys the array by entity name; callers pick the right field.
  posts?: T[];
  users?: T[];
}

// --- API methods ---

export const api = {
  login(username: string, password: string) {
    return request<LoginResponse>('/admin/login', {
      method: 'POST',
      body: { username, password },
      skipAuthRedirect: true,
    });
  },

  stats() {
    return request<Stats>('/admin/stats');
  },

  listPosts(limit: number, offset: number) {
    return request<Page<Post>>(`/admin/posts?limit=${limit}&offset=${offset}`);
  },

  takedownPost(id: string) {
    return request<unknown>(`/admin/posts/${id}/takedown`, { method: 'POST' });
  },

  restorePost(id: string) {
    return request<unknown>(`/admin/posts/${id}/restore`, { method: 'POST' });
  },

  moderationQueue(limit: number, offset: number) {
    return request<QueuePage>(
      `/admin/moderation/queue?limit=${limit}&offset=${offset}`,
    );
  },

  approvePost(id: string) {
    return request<unknown>(`/admin/posts/${id}/approve`, { method: 'POST' });
  },

  rejectPost(id: string) {
    return request<unknown>(`/admin/posts/${id}/reject`, { method: 'POST' });
  },

  listUsers(limit: number, offset: number) {
    return request<Page<User>>(`/admin/users?limit=${limit}&offset=${offset}`);
  },

  banUser(id: string) {
    return request<unknown>(`/admin/users/${id}/ban`, { method: 'POST' });
  },

  unbanUser(id: string) {
    return request<unknown>(`/admin/users/${id}/unban`, { method: 'POST' });
  },
};
