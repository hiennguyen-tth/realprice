import React, {useState} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useForm, Controller} from 'react-hook-form';
import {z} from 'zod';
import {zodResolver} from '@hookform/resolvers/zod';
import {formatPricePerM2} from '../../utils/formatPrice';
import type {PostFormData} from '../../hooks/usePostListing';
import type {LandType, LegalStatus, ListingType} from '../../types';

const detailsSchema = z.object({
  title: z
    .string()
    .min(10, 'Tiêu đề tối thiểu 10 ký tự')
    .max(120, 'Tiêu đề tối đa 120 ký tự'),
  description: z
    .string()
    .min(30, 'Mô tả tối thiểu 30 ký tự')
    .max(3000, 'Mô tả tối đa 3000 ký tự'),
  area: z
    .string()
    .refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'Diện tích phải lớn hơn 0',
    }),
  price: z
    .string()
    .refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'Giá phải lớn hơn 0',
    }),
  frontage: z.string().optional(),
  alleyWidth: z.string().optional(),
  floors: z.string().optional(),
  bedrooms: z.string().optional(),
  bathrooms: z.string().optional(),
});

type DetailsFormValues = z.infer<typeof detailsSchema>;

interface StepDetailsProps {
  formData: PostFormData;
  onUpdate: (updates: Partial<PostFormData>) => void;
}

const LISTING_TYPES: {label: string; value: ListingType}[] = [
  {label: 'Bán', value: 'ban'},
  {label: 'Cho thuê', value: 'cho_thue'},
];

const LAND_TYPES: {label: string; value: LandType}[] = [
  {label: 'Nhà phố', value: 'nha_pho'},
  {label: 'Biệt thự', value: 'biet_thu'},
  {label: 'Chung cư', value: 'chung_cu'},
  {label: 'Đất nền', value: 'dat_nen_du_an'},
  {label: 'Đất ở', value: 'dat_o'},
  {label: 'Đất vườn', value: 'dat_vuon'},
  {label: 'Nhà trọ', value: 'nha_tro'},
];

const LEGAL_STATUSES: {label: string; value: LegalStatus}[] = [
  {label: 'Sổ đỏ (QSDĐ)', value: 'so_do'},
  {label: 'Sổ hồng (CCPT)', value: 'so_hong'},
  {label: 'Hợp đồng mua bán', value: 'hop_dong'},
  {label: 'Giấy tờ khác', value: 'giay_to_khac'},
  {label: 'Chưa có sổ', value: 'chua_co'},
];

type AccessType = 'frontage' | 'alley';

export default function StepDetails({
  formData,
  onUpdate,
}: StepDetailsProps): React.JSX.Element {
  const [accessType, setAccessType] = useState<AccessType>(
    formData.alleyWidth ? 'alley' : 'frontage',
  );

  const {
    control,
    formState: {errors},
    watch,
  } = useForm<DetailsFormValues>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      title: formData.title,
      description: formData.description,
      area: formData.area?.toString() ?? '',
      price: formData.price?.toString() ?? '',
      frontage: formData.frontage?.toString() ?? '',
      alleyWidth: formData.alleyWidth?.toString() ?? '',
      floors: formData.floors?.toString() ?? '',
      bedrooms: formData.bedrooms?.toString() ?? '',
      bathrooms: formData.bathrooms?.toString() ?? '',
    },
    mode: 'onChange',
  });

  const watchedArea = watch('area');
  const watchedPrice = watch('price');
  const pricePerM2 = (() => {
    const a = parseFloat(watchedArea ?? '0');
    const p = parseFloat(watchedPrice ?? '0');
    if (a > 0 && p > 0) return p / a;
    return null;
  })();

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}>
      {/* Listing type toggle */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Hình thức *</Text>
        <View style={styles.toggleRow}>
          {LISTING_TYPES.map(t => (
            <TouchableOpacity
              key={t.value}
              style={[
                styles.toggleBtn,
                formData.listingType === t.value && styles.toggleBtnActive,
              ]}
              onPress={() => onUpdate({listingType: t.value})}>
              <Text
                style={[
                  styles.toggleBtnText,
                  formData.listingType === t.value &&
                    styles.toggleBtnTextActive,
                ]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Land type */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Loại bất động sản *</Text>
        <View style={styles.chipGrid}>
          {LAND_TYPES.map(t => (
            <TouchableOpacity
              key={t.value}
              style={[
                styles.chip,
                formData.landType === t.value && styles.chipActive,
              ]}
              onPress={() => onUpdate({landType: t.value})}>
              <Text
                style={[
                  styles.chipText,
                  formData.landType === t.value && styles.chipTextActive,
                ]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Title */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Tiêu đề *</Text>
        <Controller
          control={control}
          name="title"
          render={({field: {onChange, value}}) => (
            <TextInput
              style={[styles.input, errors.title && styles.inputError]}
              value={value}
              onChangeText={v => {
                onChange(v);
                onUpdate({title: v});
              }}
              placeholder="VD: Bán nhà phố 3 tầng mặt tiền đường Nguyễn Huệ"
              placeholderTextColor="#9CA3AF"
              multiline={false}
              maxLength={120}
            />
          )}
        />
        {errors.title && (
          <Text style={styles.errorText}>{errors.title.message}</Text>
        )}
      </View>

      {/* Area & Price row */}
      <View style={styles.fieldRow}>
        <View style={styles.fieldHalf}>
          <Text style={styles.sectionLabel}>Diện tích (m²) *</Text>
          <Controller
            control={control}
            name="area"
            render={({field: {onChange, value}}) => (
              <TextInput
                style={[styles.input, errors.area && styles.inputError]}
                value={value}
                onChangeText={v => {
                  onChange(v);
                  const num = parseFloat(v);
                  if (!isNaN(num)) onUpdate({area: num});
                }}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor="#9CA3AF"
              />
            )}
          />
          {errors.area && (
            <Text style={styles.errorText}>{errors.area.message}</Text>
          )}
        </View>

        <View style={styles.fieldHalf}>
          <Text style={styles.sectionLabel}>Giá (VNĐ) *</Text>
          <Controller
            control={control}
            name="price"
            render={({field: {onChange, value}}) => (
              <TextInput
                style={[styles.input, errors.price && styles.inputError]}
                value={value}
                onChangeText={v => {
                  onChange(v);
                  const num = parseFloat(v);
                  if (!isNaN(num)) onUpdate({price: num});
                }}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor="#9CA3AF"
              />
            )}
          />
          {errors.price && (
            <Text style={styles.errorText}>{errors.price.message}</Text>
          )}
        </View>
      </View>

      {pricePerM2 && (
        <View style={styles.pricePerM2Banner}>
          <Text style={styles.pricePerM2Text}>
            Giá/m²: {formatPricePerM2(pricePerM2)}
          </Text>
        </View>
      )}

      {/* Access type */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Lối vào</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              accessType === 'frontage' && styles.toggleBtnActive,
            ]}
            onPress={() => {
              setAccessType('frontage');
              onUpdate({alleyWidth: null});
            }}>
            <Text
              style={[
                styles.toggleBtnText,
                accessType === 'frontage' && styles.toggleBtnTextActive,
              ]}>
              Mặt tiền
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              accessType === 'alley' && styles.toggleBtnActive,
            ]}
            onPress={() => {
              setAccessType('alley');
              onUpdate({frontage: null});
            }}>
            <Text
              style={[
                styles.toggleBtnText,
                accessType === 'alley' && styles.toggleBtnTextActive,
              ]}>
              Hẻm
            </Text>
          </TouchableOpacity>
        </View>
        {accessType === 'frontage' ? (
          <Controller
            control={control}
            name="frontage"
            render={({field: {onChange, value}}) => (
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={v => {
                  onChange(v);
                  const num = parseFloat(v);
                  if (!isNaN(num)) onUpdate({frontage: num});
                }}
                keyboardType="decimal-pad"
                placeholder="Chiều rộng mặt tiền (m)"
                placeholderTextColor="#9CA3AF"
              />
            )}
          />
        ) : (
          <Controller
            control={control}
            name="alleyWidth"
            render={({field: {onChange, value}}) => (
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={v => {
                  onChange(v);
                  const num = parseFloat(v);
                  if (!isNaN(num)) onUpdate({alleyWidth: num});
                }}
                keyboardType="decimal-pad"
                placeholder="Chiều rộng hẻm (m)"
                placeholderTextColor="#9CA3AF"
              />
            )}
          />
        )}
      </View>

      {/* Floors / Bedrooms / Bathrooms */}
      <View style={styles.fieldRow3}>
        {[
          {name: 'floors' as const, label: 'Số tầng', key: 'floors'},
          {name: 'bedrooms' as const, label: 'Phòng ngủ', key: 'bedrooms'},
          {name: 'bathrooms' as const, label: 'WC', key: 'bathrooms'},
        ].map(field => (
          <View key={field.name} style={styles.fieldThird}>
            <Text style={styles.sectionLabel}>{field.label}</Text>
            <Controller
              control={control}
              name={field.name}
              render={({field: {onChange, value}}) => (
                <TextInput
                  style={styles.input}
                  value={value}
                  onChangeText={v => {
                    onChange(v);
                    const num = parseInt(v, 10);
                    if (!isNaN(num))
                      onUpdate({[field.key]: num} as Partial<PostFormData>);
                  }}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                />
              )}
            />
          </View>
        ))}
      </View>

      {/* Legal status */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Pháp lý *</Text>
        {LEGAL_STATUSES.map(ls => (
          <TouchableOpacity
            key={ls.value}
            style={[
              styles.radioRow,
              formData.legalStatus === ls.value && styles.radioRowActive,
            ]}
            onPress={() => onUpdate({legalStatus: ls.value})}>
            <View
              style={[
                styles.radioOuter,
                formData.legalStatus === ls.value && styles.radioOuterActive,
              ]}>
              {formData.legalStatus === ls.value && (
                <View style={styles.radioInner} />
              )}
            </View>
            <Text style={styles.radioLabel}>{ls.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Mô tả *</Text>
        <Controller
          control={control}
          name="description"
          render={({field: {onChange, value}}) => (
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                errors.description && styles.inputError,
              ]}
              value={value}
              onChangeText={v => {
                onChange(v);
                onUpdate({description: v});
              }}
              placeholder="Mô tả chi tiết về bất động sản: vị trí, tiện ích, tình trạng..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          )}
        />
        {errors.description && (
          <Text style={styles.errorText}>{errors.description.message}</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
    gap: 16,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 3,
    gap: 3,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  toggleBtnTextActive: {
    color: '#F97316',
    fontWeight: '700',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  chipActive: {
    backgroundColor: '#FFF7ED',
    borderColor: '#F97316',
  },
  chipText: {
    fontSize: 13,
    color: '#374151',
  },
  chipTextActive: {
    color: '#F97316',
    fontWeight: '600',
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
  inputError: {
    borderColor: '#EF4444',
  },
  textArea: {
    height: 120,
    paddingTop: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 2,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 10,
  },
  fieldRow3: {
    flexDirection: 'row',
    gap: 10,
  },
  fieldHalf: {
    flex: 1,
    gap: 4,
  },
  fieldThird: {
    flex: 1,
    gap: 4,
  },
  pricePerM2Banner: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    alignItems: 'center',
    marginTop: -8,
  },
  pricePerM2Text: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  radioRowActive: {
    borderColor: '#F97316',
    backgroundColor: '#FFF7ED',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: '#F97316',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F97316',
  },
  radioLabel: {
    fontSize: 14,
    color: '#374151',
  },
});
