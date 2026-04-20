import React from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {formatVND, formatArea, formatPricePerM2, formatPercentChange} from '../../utils/formatPrice';
import type {PostFormData} from '../../hooks/usePostListing';

interface StepPreviewProps {
  formData: PostFormData;
  onUpdate: (updates: Partial<PostFormData>) => void;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
  districtAvgPerM2?: number;
  usedQuota?: number;
  totalQuota?: number;
}

const LEGAL_LABELS: Record<string, string> = {
  so_do: 'Sổ đỏ',
  so_hong: 'Sổ hồng',
  hop_dong: 'Hợp đồng',
  giay_to_khac: 'Giấy tờ khác',
  chua_co: 'Chưa có',
};

export default function StepPreview({
  formData,
  onUpdate,
  onSubmit,
  isSubmitting,
  districtAvgPerM2,
  usedQuota = 0,
  totalQuota = 3,
}: StepPreviewProps): React.JSX.Element {
  const pricePerM2 =
    formData.area && formData.price
      ? formData.price / formData.area
      : null;

  const vsDistrictPercent =
    pricePerM2 && districtAvgPerM2 && districtAvgPerM2 > 0
      ? ((pricePerM2 - districtAvgPerM2) / districtAvgPerM2) * 100
      : null;

  const firstImageUri = formData.imageUris[0];
  const remainingQuota = totalQuota - usedQuota;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}>
      {/* Preview card */}
      <View style={styles.previewCard}>
        {/* Image */}
        {firstImageUri ? (
          <Image source={{uri: firstImageUri}} style={styles.previewImage} />
        ) : (
          <View style={styles.previewImagePlaceholder}>
            <Text style={styles.previewImageEmoji}>🏠</Text>
          </View>
        )}

        {/* Content */}
        <View style={styles.previewContent}>
          <Text style={styles.previewTitle} numberOfLines={2}>
            {formData.title || 'Tiêu đề chưa nhập'}
          </Text>

          <Text style={styles.previewPrice}>
            {formData.price ? formatVND(formData.price) : '—'}
            {formData.listingType === 'cho_thue' && '/tháng'}
          </Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              {formData.area ? formatArea(formData.area) : '—'}
            </Text>
            {pricePerM2 && (
              <>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.metaText}>
                  {formatPricePerM2(pricePerM2)}
                </Text>
              </>
            )}
          </View>

          <Text style={styles.previewAddress} numberOfLines={1}>
            {formData.address
              ? `${formData.address}, ${formData.district}`
              : '—'}
          </Text>

          <View style={styles.legalBadge}>
            <Text style={styles.legalBadgeText}>
              {LEGAL_LABELS[formData.legalStatus] ?? '—'}
            </Text>
          </View>
        </View>
      </View>

      {/* Price comparison vs district avg */}
      {vsDistrictPercent !== null && (
        <View
          style={[
            styles.priceCompCard,
            {
              backgroundColor:
                vsDistrictPercent <= 0 ? '#F0FDF4' : '#FFF7ED',
              borderColor:
                vsDistrictPercent <= 0 ? '#BBF7D0' : '#FED7AA',
            },
          ]}>
          <Text style={styles.priceCompTitle}>
            So với giá trung bình khu vực
          </Text>
          <Text
            style={[
              styles.priceCompValue,
              {color: vsDistrictPercent <= 0 ? '#16A34A' : '#D97706'},
            ]}>
            {formatPercentChange(vsDistrictPercent)}
          </Text>
          {districtAvgPerM2 && (
            <Text style={styles.priceCompSub}>
              TB khu vực: {formatPricePerM2(districtAvgPerM2)}/m²
            </Text>
          )}
          <Text style={styles.priceCompAdvice}>
            {vsDistrictPercent <= -10
              ? '🎉 Giá rất tốt! Tin đăng của bạn sẽ rất hấp dẫn.'
              : vsDistrictPercent <= 0
              ? '✅ Giá hợp lý so với thị trường.'
              : vsDistrictPercent <= 15
              ? '⚠️ Giá hơi cao. Bạn có thể cân nhắc điều chỉnh.'
              : '❌ Giá cao hơn TB khu vực. Nên xem xét lại.'}
          </Text>
        </View>
      )}

      {/* Contact info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>
        <Text style={styles.fieldLabel}>Số điện thoại</Text>
        <TextInput
          style={styles.input}
          value={formData.contactPhone}
          onChangeText={val => onUpdate({contactPhone: val})}
          keyboardType="phone-pad"
          placeholder="+84..."
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Boost option */}
      <TouchableOpacity
        style={[styles.boostCard, formData.isBoosted && styles.boostCardActive]}
        onPress={() => onUpdate({isBoosted: !formData.isBoosted})}>
        <View style={styles.boostLeft}>
          <Text style={styles.boostEmoji}>⚡</Text>
          <View>
            <Text style={styles.boostTitle}>Tin nổi bật</Text>
            <Text style={styles.boostDesc}>
              Hiển thị đầu trang tìm kiếm và màu cam trên bản đồ
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.checkBox,
            formData.isBoosted && styles.checkBoxActive,
          ]}>
          {formData.isBoosted && <Text style={styles.checkMark}>✓</Text>}
        </View>
      </TouchableOpacity>

      {/* Quota indicator */}
      <View style={styles.quotaCard}>
        <Text style={styles.quotaTitle}>Hạn mức đăng tin</Text>
        <View style={styles.quotaBar}>
          <View
            style={[
              styles.quotaFill,
              {width: `${(usedQuota / totalQuota) * 100}%`},
            ]}
          />
        </View>
        <Text style={styles.quotaText}>
          Đã dùng {usedQuota}/{totalQuota} tin miễn phí
        </Text>
        {remainingQuota === 0 && (
          <Text style={styles.quotaWarning}>
            Bạn đã hết hạn mức miễn phí. Nâng cấp Pro để đăng không giới hạn.
          </Text>
        )}
      </View>

      {/* Image summary */}
      <View style={styles.imageSummary}>
        <Text style={styles.imageSummaryText}>
          📷 {formData.imageUris.length} ảnh đã chọn
          {formData.imageIds.length > 0 &&
            ` (${formData.imageIds.length} đã tải lên)`}
        </Text>
      </View>

      {/* Submit button */}
      <TouchableOpacity
        style={[
          styles.submitBtn,
          (isSubmitting || remainingQuota === 0) && styles.submitBtnDisabled,
        ]}
        onPress={onSubmit}
        disabled={isSubmitting || remainingQuota === 0}>
        {isSubmitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitBtnText}>
            {formData.isBoosted ? '⚡ Đăng tin nổi bật' : 'Đăng tin ngay'}
          </Text>
        )}
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        Bằng cách đăng tin, bạn đồng ý với Điều khoản dịch vụ và Chính sách
        bảo mật của RealPrice.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
    gap: 16,
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  previewImagePlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImageEmoji: {
    fontSize: 60,
  },
  previewContent: {
    padding: 14,
    gap: 6,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  previewPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F97316',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  metaDot: {
    fontSize: 13,
    color: '#D1D5DB',
    marginHorizontal: 6,
  },
  previewAddress: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  legalBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  legalBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803D',
  },
  priceCompCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    gap: 4,
  },
  priceCompTitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  priceCompValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  priceCompSub: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  priceCompAdvice: {
    fontSize: 13,
    color: '#374151',
    marginTop: 4,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  boostCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  boostCardActive: {
    borderColor: '#F97316',
    backgroundColor: '#FFF7ED',
  },
  boostLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  boostEmoji: {
    fontSize: 28,
  },
  boostTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  boostDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxActive: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  checkMark: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  quotaCard: {
    padding: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  quotaTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  quotaBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  quotaFill: {
    height: '100%',
    backgroundColor: '#F97316',
    borderRadius: 3,
  },
  quotaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  quotaWarning: {
    fontSize: 12,
    color: '#EF4444',
    lineHeight: 16,
  },
  imageSummary: {
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  imageSummaryText: {
    fontSize: 13,
    color: '#1D4ED8',
    fontWeight: '500',
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
  },
  submitBtnDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  disclaimer: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 16,
  },
});
