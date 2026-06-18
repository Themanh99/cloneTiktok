import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const ACCESS_TOKEN_KEY = 'ACCESS_TOKEN';
const REFRESH_TOKEN_KEY = 'REFRESH_TOKEN';

const httpRequest = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

const refreshClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

const attachLanguage = (config: InternalAxiosRequestConfig) => {
  config.headers.set('X-Language', localStorage.getItem('app-language') || 'vi');
  return config;
};

refreshClient.interceptors.request.use(attachLanguage);

// Attach access token to every request
httpRequest.interceptors.request.use((config) => {
  attachLanguage(config);
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Auto-refresh token on 401
let refreshPromise: Promise<string> | null = null;

httpRequest.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (AxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (
      error.response?.status !== 401 ||
      !refreshToken ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/refresh')
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    refreshPromise ??= refreshClient
      .post('/auth/refresh', { refreshToken })
      .then(({ data }) => {
        localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
        return data.accessToken as string;
      })
      .finally(() => {
        refreshPromise = null;
      });

    const accessToken = await refreshPromise;
    originalRequest.headers = {
      ...originalRequest.headers,
      Authorization: `Bearer ${accessToken}`,
    };
    return httpRequest.request(originalRequest);
  },
);

// ===== Typed request helpers =====

export const get = async <T = unknown>(
  path: string,
  options: AxiosRequestConfig = {},
) => {
  const response = await httpRequest.get<T>(path, options);
  return response.data;
};

export const post = async <T = unknown>(
  path: string,
  data?: unknown,
  options: AxiosRequestConfig = {},
) => {
  const response = await httpRequest.post<T>(path, data, options);
  return response.data;
};

export const del = async <T = unknown>(
  path: string,
  options: AxiosRequestConfig = {},
) => {
  const response = await httpRequest.delete<T>(path, options);
  return response.data;
};

export const patch = async <T = unknown>(
  path: string,
  data?: unknown,
  options: AxiosRequestConfig = {},
) => {
  const response = await httpRequest.patch<T>(path, data, options);
  return response.data;
};

// ===== Token helpers =====

export const saveTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);
export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);

export default httpRequest;
