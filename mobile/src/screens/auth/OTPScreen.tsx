import React, {useState, useRef, useEffect, useCallback} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import {useAuth} from '../../hooks/useAuth';
import type {AuthStackParamList} from '../../navigation/types';
import type {AuthStackScreenProps} from '../../navigation/types';

type Props = AuthStackScreenProps<'OTP'>;

const OTP_LENGTH = 6;

export default function OTPScreen({route}: Props): React.JSX.Element {
  const {phone, expiresIn} = route.params;
  const navigation = useNavigation<StackNavigationProp<AuthStackParamList>>();
  const {verifyOTPCode, resendOTP, isLoading, error, clearError} = useAuth();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [countdown, setCountdown] = useState(expiresIn);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>(
    Array(OTP_LENGTH).fill(null),
  );

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const formatCountdown = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = useCallback(
    (index: number, value: string) => {
      clearError();
      const cleaned = value.replace(/\D/g, '');

      if (cleaned.length > 1) {
        // Handle paste
        const digits = cleaned.slice(0, OTP_LENGTH).split('');
        const newOtp = [...otp];
        digits.forEach((d, i) => {
          if (index + i < OTP_LENGTH) {
            newOtp[index + i] = d;
          }
        });
        setOtp(newOtp);
        const nextIdx = Math.min(index + digits.length, OTP_LENGTH - 1);
        inputRefs.current[nextIdx]?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = cleaned;
        setOtp(newOtp);
        if (cleaned && index < OTP_LENGTH - 1) {
          inputRefs.current[index + 1]?.focus();
        }
      }
    },
    [otp, clearError],
  );

  const handleKeyPress = useCallback(
    (index: number, key: string) => {
      if (key === 'Backspace' && !otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    },
    [otp],
  );

  const otpCode = otp.join('');
  const isComplete = otpCode.length === OTP_LENGTH;

  const handleVerify = async () => {
    if (!isComplete) return;
    clearError();
    try {
      await verifyOTPCode(phone, otpCode);
      // Navigation handled by auth store state change in RootNavigator
    } catch {
      // Reset OTP fields on failure
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setOtp(Array(OTP_LENGTH).fill(''));
    setCountdown(120);
    setCanResend(false);
    await resendOTP(phone);
    inputRefs.current[0]?.focus();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.container}>
          {/* Back */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>← Quay lại</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerEmoji}>💬</Text>
            <Text style={styles.title}>Nhập mã OTP</Text>
            <Text style={styles.subtitle}>
              Mã xác thực gồm 6 số đã được gửi đến{'\n'}
              <Text style={styles.phoneHighlight}>{phone}</Text>
            </Text>
          </View>

          {/* OTP inputs */}
          <View style={styles.otpRow}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={ref => {
                  inputRefs.current[index] = ref;
                }}
                style={[
                  styles.otpCell,
                  digit && styles.otpCellFilled,
                  error && styles.otpCellError,
                ]}
                value={digit}
                onChangeText={val => handleOtpChange(index, val)}
                onKeyPress={({nativeEvent}) =>
                  handleKeyPress(index, nativeEvent.key)
                }
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
                autoFocus={index === 0}
                selectTextOnFocus
              />
            ))}
          </View>

          {/* Error */}
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Countdown / Resend */}
          <View style={styles.resendRow}>
            {canResend ? (
              <TouchableOpacity onPress={handleResend}>
                <Text style={styles.resendText}>Gửi lại mã OTP</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.countdownText}>
                Gửi lại sau{' '}
                <Text style={styles.countdownValue}>
                  {formatCountdown(countdown)}
                </Text>
              </Text>
            )}
          </View>

          {/* Verify button */}
          <TouchableOpacity
            style={[
              styles.verifyBtn,
              (!isComplete || isLoading) && styles.verifyBtnDisabled,
            ]}
            onPress={handleVerify}
            disabled={!isComplete || isLoading}>
            <Text style={styles.verifyBtnText}>
              {isLoading ? 'Đang xác thực...' : 'Xác nhận →'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.note}>
            Không nhận được mã? Kiểm tra tin nhắn spam hoặc thử lại.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 24,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  backBtnText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  headerEmoji: {
    fontSize: 52,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  phoneHighlight: {
    fontWeight: '700',
    color: '#F97316',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  otpCell: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    backgroundColor: '#F9FAFB',
    textAlign: 'center',
  },
  otpCellFilled: {
    borderColor: '#F97316',
    backgroundColor: '#FFF7ED',
  },
  otpCellError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
  },
  resendRow: {
    alignItems: 'center',
    marginBottom: 24,
  },
  countdownText: {
    fontSize: 14,
    color: '#6B7280',
  },
  countdownValue: {
    fontWeight: '700',
    color: '#F97316',
  },
  resendText: {
    fontSize: 14,
    color: '#F97316',
    fontWeight: '700',
  },
  verifyBtn: {
    backgroundColor: '#F97316',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#F97316',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  verifyBtnDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
    elevation: 0,
  },
  verifyBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  note: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
});
