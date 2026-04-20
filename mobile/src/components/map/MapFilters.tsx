import React, {useState} from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFilterStore} from '../../store/filterStore';
import type {LandType, ListingType} from '../../types';
import {formatVND} from '../../utils/formatPrice';

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

const PRICE_RANGES: {label: string; min?: number; max?: number}[] = [
  {label: 'Tất cả', min: undefined, max: undefined},
  {label: 'Dưới 1 tỷ', min: undefined, max: 1_000_000_000},
  {label: '1 - 3 tỷ', min: 1_000_000_000, max: 3_000_000_000},
  {label: '3 - 5 tỷ', min: 3_000_000_000, max: 5_000_000_000},
  {label: '5 - 10 tỷ', min: 5_000_000_000, max: 10_000_000_000},
  {label: 'Trên 10 tỷ', min: 10_000_000_000, max: undefined},
];

const AREA_RANGES: {label: string; min?: number; max?: number}[] = [
  {label: 'Tất cả', min: undefined, max: undefined},
  {label: 'Dưới 50 m²', min: undefined, max: 50},
  {label: '50 - 100 m²', min: 50, max: 100},
  {label: '100 - 200 m²', min: 100, max: 200},
  {label: '200 - 500 m²', min: 200, max: 500},
  {label: 'Trên 500 m²', min: 500, max: undefined},
];

type ModalType = 'type' | 'price' | 'area' | 'more' | null;

export default function MapFilters(): React.JSX.Element {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const {
    listingType,
    landType,
    minPrice,
    maxPrice,
    minArea,
    maxArea,
    setListingType,
    setLandType,
    setPriceRange,
    setAreaRange,
    reset,
    hasActiveFilters,
  } = useFilterStore();

  const hasFilters = hasActiveFilters();

  const priceLabel = (() => {
    if (minPrice === undefined && maxPrice === undefined) return 'Giá';
    if (!maxPrice) return `Từ ${formatVND(minPrice ?? 0)}`;
    if (!minPrice) return `Đến ${formatVND(maxPrice)}`;
    return `${formatVND(minPrice)} - ${formatVND(maxPrice)}`;
  })();

  const areaLabel = (() => {
    if (minArea === undefined && maxArea === undefined) return 'DT';
    if (!maxArea) return `≥ ${minArea} m²`;
    if (!minArea) return `≤ ${maxArea} m²`;
    return `${minArea} - ${maxArea} m²`;
  })();

  const typeLabel = (() => {
    if (!listingType && !landType) return 'Loại';
    if (listingType && !landType)
      return listingType === 'ban' ? 'Bán' : 'Cho thuê';
    if (!listingType && landType)
      return LAND_TYPES.find(t => t.value === landType)?.label ?? 'Loại';
    return 'Loại';
  })();

  return (
    <>
      <View style={styles.container}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          {/* Type chip */}
          <TouchableOpacity
            style={[styles.chip, (listingType || landType) && styles.chipActive]}
            onPress={() => setActiveModal('type')}>
            <Text
              style={[
                styles.chipText,
                (listingType || landType) && styles.chipTextActive,
              ]}>
              {typeLabel} ▾
            </Text>
          </TouchableOpacity>

          {/* Price chip */}
          <TouchableOpacity
            style={[
              styles.chip,
              (minPrice !== undefined || maxPrice !== undefined) &&
                styles.chipActive,
            ]}
            onPress={() => setActiveModal('price')}>
            <Text
              style={[
                styles.chipText,
                (minPrice !== undefined || maxPrice !== undefined) &&
                  styles.chipTextActive,
              ]}>
              {priceLabel} ▾
            </Text>
          </TouchableOpacity>

          {/* Area chip */}
          <TouchableOpacity
            style={[
              styles.chip,
              (minArea !== undefined || maxArea !== undefined) &&
                styles.chipActive,
            ]}
            onPress={() => setActiveModal('area')}>
            <Text
              style={[
                styles.chipText,
                (minArea !== undefined || maxArea !== undefined) &&
                  styles.chipTextActive,
              ]}>
              {areaLabel} ▾
            </Text>
          </TouchableOpacity>

          {/* Reset */}
          {hasFilters && (
            <TouchableOpacity style={styles.resetChip} onPress={reset}>
              <Text style={styles.resetChipText}>✕ Xoá lọc</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Type Modal */}
      <Modal
        visible={activeModal === 'type'}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveModal(null)}>
        <Pressable
          style={styles.overlay}
          onPress={() => setActiveModal(null)}
        />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Loại bất động sản</Text>
          <Text style={styles.sectionLabel}>Hình thức</Text>
          <View style={styles.optionRow}>
            {LISTING_TYPES.map(t => (
              <TouchableOpacity
                key={t.value}
                style={[
                  styles.optionChip,
                  listingType === t.value && styles.optionChipActive,
                ]}
                onPress={() =>
                  setListingType(listingType === t.value ? undefined : t.value)
                }>
                <Text
                  style={[
                    styles.optionChipText,
                    listingType === t.value && styles.optionChipTextActive,
                  ]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.sectionLabel}>Loại nhà đất</Text>
          <View style={styles.optionGrid}>
            {LAND_TYPES.map(t => (
              <TouchableOpacity
                key={t.value}
                style={[
                  styles.optionChip,
                  landType === t.value && styles.optionChipActive,
                ]}
                onPress={() =>
                  setLandType(landType === t.value ? undefined : t.value)
                }>
                <Text
                  style={[
                    styles.optionChipText,
                    landType === t.value && styles.optionChipTextActive,
                  ]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.applyBtn}
            onPress={() => setActiveModal(null)}>
            <Text style={styles.applyBtnText}>Áp dụng</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Price Modal */}
      <Modal
        visible={activeModal === 'price'}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveModal(null)}>
        <Pressable
          style={styles.overlay}
          onPress={() => setActiveModal(null)}
        />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Khoảng giá</Text>
          {PRICE_RANGES.map(range => {
            const isSelected = minPrice === range.min && maxPrice === range.max;
            return (
              <TouchableOpacity
                key={range.label}
                style={[styles.listOption, isSelected && styles.listOptionActive]}
                onPress={() => {
                  setPriceRange(range.min, range.max);
                  setActiveModal(null);
                }}>
                <Text
                  style={[
                    styles.listOptionText,
                    isSelected && styles.listOptionTextActive,
                  ]}>
                  {range.label}
                </Text>
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </Modal>

      {/* Area Modal */}
      <Modal
        visible={activeModal === 'area'}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveModal(null)}>
        <Pressable
          style={styles.overlay}
          onPress={() => setActiveModal(null)}
        />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Diện tích</Text>
          {AREA_RANGES.map(range => {
            const isSelected = minArea === range.min && maxArea === range.max;
            return (
              <TouchableOpacity
                key={range.label}
                style={[styles.listOption, isSelected && styles.listOptionActive]}
                onPress={() => {
                  setAreaRange(range.min, range.max);
                  setActiveModal(null);
                }}>
                <Text
                  style={[
                    styles.listOptionText,
                    isSelected && styles.listOptionTextActive,
                  ]}>
                  {range.label}
                </Text>
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  scrollContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  chipActive: {
    backgroundColor: '#FFF7ED',
    borderColor: '#F97316',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  chipTextActive: {
    color: '#F97316',
  },
  resetChip: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  resetChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#EF4444',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    marginTop: 8,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  optionChipActive: {
    backgroundColor: '#FFF7ED',
    borderColor: '#F97316',
  },
  optionChipText: {
    fontSize: 13,
    color: '#374151',
  },
  optionChipTextActive: {
    color: '#F97316',
    fontWeight: '600',
  },
  applyBtn: {
    marginTop: 20,
    backgroundColor: '#F97316',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  listOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  listOptionActive: {
    backgroundColor: '#FFF7ED',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  listOptionText: {
    fontSize: 15,
    color: '#374151',
  },
  listOptionTextActive: {
    color: '#F97316',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 16,
    color: '#F97316',
    fontWeight: '700',
  },
});
