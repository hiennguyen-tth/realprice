import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import {MMKV} from 'react-native-mmkv';

const storage = new MMKV({id: 'realprice-auth'});

const BASE_URL = __DEV__ ? 'http://10.0.2.2:3000/api' : 'https://api.realprice.vn/v1';

// ─── Token helpers ────────────────────────────────────────────────────────────

export function getAccessToken(): string | undefined {
  return storage.getString('access_token') ?? undefined;
}

export function getRefreshToken(): string | undefined {
  return storage.getString('refresh_token') ?? undefined;
}

export function setTokens(accessToken: string, refreshToken: string): void {
  storage.set('access_token', accessToken);
  storage.set('refresh_token', refreshToken);
}

export function clearTokens(): void {
  storage.delete('access_token');
  storage.delete('refresh_token');
}

// ─── Axios instance ───────────────────────────────────────────────────────────

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-App-Version': '1.0.0',
    'X-Platform': 'mobile',
  },
});

// ─── Request interceptor: attach JWT ─────────────────────────────────────────

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error),
);

// ─── Refresh token logic ──────────────────────────────────────────────────────

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null): void {
  failedQueue.forEach(promise => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
}

// ─── Response interceptor: handle 401, refresh ───────────────────────────────

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async error => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({resolve, reject});
        })
          .then(token => {
            if (originalRequest.headers) {
              (originalRequest.headers as Record<string, string>).Authorization =
                `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearTokens();
        processQueue(new Error('No refresh token'), null);
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        const response = await axios.post<{
          data: {accessToken: string; refreshToken: string};
        }>(`${BASE_URL}/auth/refresh`, {refreshToken});

        const {accessToken, refreshToken: newRefreshToken} =
          response.data.data;
        setTokens(accessToken, newRefreshToken);

        if (originalRequest.headers) {
          (originalRequest.headers as Record<string, string>).Authorization =
            `Bearer ${accessToken}`;
        }

        processQueue(null, accessToken);
        isRefreshing = false;
        return apiClient(originalRequest);
      } catch (refreshError) {
        clearTokens();
        processQueue(refreshError, null);
        isRefreshing = false;
        return Promise.reject(refreshError);
      }
    }

    // Normalize error message
    const message =
      error.response?.data?.message ??
      error.message ??
      'Đã xảy ra lỗi. Vui lòng thử lại.';

    return Promise.reject(new Error(message));
  },
);

export default apiClient;
