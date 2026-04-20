import React, {useState} from 'react';
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

const VIETNAM_PREFIX = '+84';

function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('0')) {
    return VIETNAM_PREFIX + digits.slice(1);
  }
  if (digits.startsWith('84')) {
    return '+' + digits;
  }
  return VIETNAM_PREFIX + digits;
}

function isValidVietnamPhone(phone: string): boolean {
  // Vietnamese mobile: 10 digits starting with 0, or +84 followed by 9 digits
  const normalized = normalizePhone(phone);
  return /^\+84[0-9]{9}$/.test(normalized);
}

export default function PhoneInputScreen(): React.JSX.Element {
  const navigation = useNavigation<StackNavigationProp<AuthStackParamList>>();
  const {sendOTPCode, isLoading, error, clearError} = useAuth();
  const [phone, setPhone] = useState('');

  const displayPhone = phone.startsWith(VIETNAM_PREFIX)
    ? phone
    : VIETNAM_PREFIX + ' ' + phone;

  const isValid = isValidVietnamPhone(phone);

  const handleSubmit = async () => {
    if (!isValid) return;
    clearError();
    const normalized = normalizePhone(phone);
    try {
      const result = await sendOTPCode(normalized);
      navigation.navigate('OTP', {
        phone: normalized,
        requestId: result.requestId,
        expiresIn: result.expiresIn,
      });
    } catch {
      // Error already set in hook
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.container}>
          {/* Logo / Branding */}
          <View style={styles.branding}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>RP</Text>
            </View>
            <Text style={styles.appName}>RealPrice</Text>
            <Text style={styles.tagline}>
              So sánh giá bất động sản thông minh
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>Nhập số điện thoại</Text>
            <Text style={styles.formSubtitle}>
              Chúng tôi sẽ gửi mã xác thực OTP qua SMS
            </Text>

            <View style={styles.phoneRow}>
              <View style={styles.prefixBox}>
                <Text style={styles.flagEmoji}>🇻🇳</Text>
                <Text style={styles.prefixText}>{VIETNAM_PREFIX}</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                value={phone}
                onChangeText={text => {
                  clearError();
                  // Strip prefix if user pastes full number
                  const stripped = text.replace(/^(\+84|84|0)/, '');
                  setPhone(stripped.replace(/\D/g, ''));
                }}
                keyboardType="phone-pad"
                placeholder="90 000 0000"
                placeholderTextColor="#9CA3AF"
                maxLength={10}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
            </View>

            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Text style={styles.preview}>
              {phone.length > 0 ? `→ ${displayPhone}` : ' '}
            </Text>

            <TouchableOpacity
              style={[
                styles.submitBtn,
                (!isValid || isLoading) && styles.submitBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!isValid || isLoading}>
              <Text style={styles.submitBtnText}>
                {isLoading ? 'Đang gửi...' : 'Nhận mã OTP →'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={styles.disclaimer}>
            Bằng cách tiếp tục, bạn đồng ý với{' '}
            <Text style={styles.link}>Điều khoản dịch vụ</Text> và{' '}
            <Text style={styles.link}>Chính sách bảo mật</Text> của RealPrice.
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
    justifyContent: 'center',
  },
  branding: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#F97316',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 1,
  },
  appName: {
    fontSize: 26,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  form: {
    gap: 12,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  formSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  prefixBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 52,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  flagEmoji: {
    fontSize: 20,
  },
  prefixText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  phoneInput: {
    flex: 1,
    height: 52,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 20,
    letterSpacing: 2,
    color: '#111827',
    fontWeight: '600',
    backgroundColor: '#F9FAFB',
  },
  preview: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontFamily: 'monospace',
    minHeight: 18,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
  },
  submitBtn: {
    backgroundColor: '#F97316',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#F97316',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 8,
  },
  submitBtnDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  disclaimer: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 40,
    paddingHorizontal: 8,
  },
  link: {
    color: '#F97316',
    fontWeight: '600',
  },
});
