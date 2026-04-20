import apiClient from './client';
import type {ApiResponse, AuthTokens} from '../types';

export interface SendOTPResponse {
  requestId: string;
  expiresIn: number; // seconds
}

export async function sendOTP(phone: string): Promise<SendOTPResponse> {
  const response = await apiClient.post<ApiResponse<SendOTPResponse>>(
    '/auth/otp/send',
    {phone},
  );
  return response.data.data;
}

export async function verifyOTP(
  phone: string,
  otp: string,
  requestId: string,
): Promise<AuthTokens> {
  const response = await apiClient.post<ApiResponse<AuthTokens>>(
    '/auth/otp/verify',
    {phone, otp, requestId},
  );
  return response.data.data;
}

export async function refreshToken(
  refreshTokenValue: string,
): Promise<AuthTokens> {
  const response = await apiClient.post<ApiResponse<AuthTokens>>(
    '/auth/refresh',
    {refreshToken: refreshTokenValue},
  );
  return response.data.data;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}
