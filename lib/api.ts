/**
 * API client for communicating with FastAPI backend
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user_data?: {
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    is_active: boolean;
  };
  session_token?: string;
}

export interface SignupResponse {
  success: boolean;
  message: string;
  user_id?: number;
}

export interface UserInfo {
  authenticated: boolean;
  user?: {
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    is_active: boolean;
  };
  type?: 'admin' | 'client';
}

/**
 * Make API request with credentials
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `Request failed: ${response.statusText}`);
    }

    return response.json();
  } catch (error: any) {
    // Handle network errors
    if (error.message.includes('fetch')) {
      throw new Error(`Cannot connect to backend. Please ensure the API server is running on ${API_BASE}`);
    }
    throw error;
  }
}

/**
 * Client signup
 */
export async function clientSignup(data: SignupRequest): Promise<SignupResponse> {
  return apiRequest<SignupResponse>('/auth/client/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Client login
 */
export async function clientLogin(data: LoginRequest): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/client/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Admin login
 */
export async function adminLogin(data: LoginRequest): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Client logout
 */
export async function clientLogout(): Promise<void> {
  await apiRequest('/auth/client/logout', { method: 'POST' });
}

/**
 * Admin logout
 */
export async function adminLogout(): Promise<void> {
  await apiRequest('/auth/admin/logout', { method: 'POST' });
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<UserInfo | null> {
  try {
    return await apiRequest<UserInfo>('/auth/me');
  } catch {
    return null;
  }
}

/**
 * Search trademarks
 */
export async function searchTrademarks(
  file: File,
  topK: number = 10,
  threshold: number = 0.5
): Promise<any> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(
      `${API_BASE}/search?top_k=${topK}&threshold=${threshold}`,
      {
        method: 'POST',
        credentials: 'include',
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || 'Search failed');
    }

    return response.json();
  } catch (error: any) {
    if (error.message.includes('fetch')) {
      throw new Error(`Cannot connect to backend. Please ensure the API server is running on ${API_BASE}`);
    }
    throw error;
  }
}

/**
 * Process PDF
 */
export async function processPdf(
  file: File,
  saveImages: boolean = true,
  autoIndex: boolean = true
): Promise<any> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(
      `${API_BASE}/process-pdf-and-index?save_images=${saveImages}&auto_index=${autoIndex}`,
      {
        method: 'POST',
        credentials: 'include',
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || 'PDF processing failed');
    }

    return response.json();
  } catch (error: any) {
    if (error.message.includes('fetch')) {
      throw new Error(`Cannot connect to backend. Please ensure the API server is running on ${API_BASE}`);
    }
    throw error;
  }
}

/**
 * Get trademark details
 */
export async function getTrademarkDetails(trademarkId: string): Promise<any> {
  return apiRequest(`/trademark/${encodeURIComponent(trademarkId)}`);
}

