import {useState, useCallback} from 'react';
import {MMKV} from 'react-native-mmkv';
import {sendOTP, verifyOTP} from '../api/auth';
import {getMe} from '../api/user';
import {useAuthStore} from '../store/authStore';
import type {SendOTPResponse} from '../api/auth';

const storage = new MMKV({id: 'realprice-auth'});

interface UseAuthReturn {
  isLoading: boolean;
  error: string | null;
  otpRequestId: string | null;
  otpExpiresIn: number;
  sendOTPCode: (phone: string) => Promise<SendOTPResponse>;
  verifyOTPCode: (phone: string, otp: string) => Promise<void>;
  resendOTP: (phone: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export function useAuth(): UseAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpRequestId, setOtpRequestId] = useState<string | null>(null);
  const [otpExpiresIn, setOtpExpiresIn] = useState(0);

  const {login, logout: storeLogout, setLoading} = useAuthStore();

  const sendOTPCode = useCallback(async (phone: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await sendOTP(phone);
      setOtpRequestId(result.requestId);
      setOtpExpiresIn(result.expiresIn);
      return result;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Không thể gửi mã OTP.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyOTPCode = useCallback(
    async (phone: string, otp: string) => {
      if (!otpRequestId) {
        setError('Phiên OTP hết hạn. Vui lòng gửi lại mã.');
        return;
      }

      setIsLoading(true);
      setLoading(true);
      setError(null);

      try {
        const tokens = await verifyOTP(phone, otp, otpRequestId);

        // Store tokens
        storage.set('access_token', tokens.accessToken);
        storage.set('refresh_token', tokens.refreshToken);

        // Fetch user profile
        const user = await getMe();

        login(user, tokens);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Xác thực OTP thất bại.';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
        setLoading(false);
      }
    },
    [otpRequestId, login, setLoading],
  );

  const resendOTP = useCallback(
    async (phone: string) => {
      setError(null);
      await sendOTPCode(phone);
    },
    [sendOTPCode],
  );

  const signOut = useCallback(async () => {
    try {
      await import('../api/auth').then(api => api.logout());
    } catch {
      // Ignore logout API errors — we always clear local state
    } finally {
      storage.delete('access_token');
      storage.delete('refresh_token');
      storeLogout();
    }
  }, [storeLogout]);

  const clearError = useCallback(() => setError(null), []);

  return {
    isLoading,
    error,
    otpRequestId,
    otpExpiresIn,
    sendOTPCode,
    verifyOTPCode,
    resendOTP,
    signOut,
    clearError,
  };
}
