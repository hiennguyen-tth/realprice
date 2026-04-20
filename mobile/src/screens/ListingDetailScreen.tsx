import React, {useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useQuery, useMutation} from '@tanstack/react-query';
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import {getListingById, getSimilarListings, contactListing} from '../api/listings';
import {getBankValuations} from '../api/bankValuations';
import {formatVND, formatArea, formatPricePerM2} from '../utils/formatPrice';
import {calcListingScore, getScoreLabel, getScoreColor} from '../utils/scoreUtils';
import BankValuationPanel from '../components/bank/BankValuationPanel';
import ListingCard from '../components/listing/ListingCard';
import ScoreBadge from '../components/comparison/ScoreBadge';
import {useComparisonStore} from '../store/comparisonStore';
import {saveListing, unsaveListing} from '../api/user';
import type {RootStackParamList} from '../navigation/types';
import type {RootStackScreenProps} from '../navigation/types';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const LEGAL_LABELS: Record<string, string> = {
  so_do: 'Sổ đỏ',
  so_hong: 'Sổ hồng',
  hop_dong: 'Hợp đồng',
  giay_to_khac: 'Giấy tờ khác',
  chua_co: 'Chưa có',
};

type Props = RootStackScreenProps<'ListingDetail'>;

export default function ListingDetailScreen({route}: Props): React.JSX.Element {
  const {listingId} = route.params;
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);

  const {addItem, isInComparison} = useComparisonStore();

  const {data: listing, isLoading} = useQuery({
    queryKey: ['listing', listingId],
    queryFn: () => getListingById(listingId),
    staleTime: 1000 * 60 * 5,
  });

  const {data: bankData, isLoading: bankLoading} = useQuery({
    queryKey: ['bank-valuations', listing?.landId],
    queryFn: () => getBankValuations(listing!.landId),
    enabled: !!listing?.landId,
  });

  const {data: similarListings} = useQuery({
    queryKey: ['similar-listings', listingId],
    queryFn: () => getSimilarListings(listingId, 4),
    enabled: !!listing,
  });

  const contactMutation = useMutation({
    mutationFn: (message?: string) => contactListing(listingId, message),
    onSuccess: () => {
      Alert.alert(
        'Đã gửi yêu cầu',
        'Chúng tôi sẽ chuyển thông tin của bạn đến người bán.',
      );
    },
  });

  const handleContact = () => {
    Alert.alert('Liên hệ người bán', `SĐT: ${listing?.seller.phone}`, [
      {
        text: 'Gọi ngay',
        onPress: () => contactMutation.mutate('Tôi muốn hỏi về bất động sản này'),
      },
      {text: 'Huỷ', style: 'cancel'},
    ]);
  };

  const handleSaveToggle = async () => {
    try {
      if (isSaved) {
        await unsaveListing(listingId);
        setIsSaved(false);
      } else {
        await saveListing(listingId);
        setIsSaved(true);
      }
    } catch {
      Alert.alert('Lỗi', 'Không thể lưu tin. Thử lại sau.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#F97316" size="large" />
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Không tìm thấy tin đăng</Text>
      </View>
    );
  }

  const score = calcListingScore(listing, null, listing.pricePerM2);
  const inComparison = isInComparison(listingId);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      {/* Image gallery */}
      <View style={styles.gallery}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={e => {
            const idx = Math.round(
              e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
            );
            setActiveImageIndex(idx);
          }}
          scrollEventThrottle={16}>
          {listing.images.length > 0 ? (
            listing.images.map((img, idx) => (
              <Image
                key={img.id}
                source={{uri: img.url}}
                style={styles.galleryImage}
              />
            ))
          ) : (
            <View style={styles.galleryPlaceholder}>
              <Text style={styles.galleryPlaceholderEmoji}>🏠</Text>
            </View>
          )}
        </ScrollView>

        {/* Image dots */}
        {listing.images.length > 1 && (
          <View style={styles.imageDots}>
            {listing.images.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  idx === activeImageIndex && styles.dotActive,
                ]}
              />
            ))}
          </View>
        )}

        {/* Image count badge */}
        {listing.images.length > 0 && (
          <View style={styles.imageCount}>
            <Text style={styles.imageCountText}>
              {activeImageIndex + 1}/{listing.images.length}
            </Text>
          </View>
        )}

        {/* Save button */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveToggle}>
          <Text style={styles.saveBtnText}>{isSaved ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title & Price */}
        <View style={styles.titleSection}>
          {listing.isBoosted && (
            <View style={styles.boostedBadge}>
              <Text style={styles.boostedText}>⚡ Tin nổi bật</Text>
            </View>
          )}
          <Text style={styles.title}>{listing.title}</Text>
          <Text style={styles.price}>
            {formatVND(listing.price)}
            {listing.listingType === 'cho_thue' && '/tháng'}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{formatArea(listing.area)}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>
              {formatPricePerM2(listing.pricePerM2)}
            </Text>
            <Text style={styles.metaDot}>•</Text>
            <View style={styles.legalBadge}>
              <Text style={styles.legalText}>
                {LEGAL_LABELS[listing.legalStatus] ?? listing.legalStatus}
              </Text>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Details */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Chi tiết</Text>
          <View style={styles.detailsGrid}>
            {[
              {label: 'Địa chỉ', value: listing.address},
              {
                label: 'Phường/Xã',
                value: `${listing.ward}, ${listing.district}`,
              },
              {label: 'Thành phố', value: listing.city},
              listing.frontage
                ? {label: 'Mặt tiền', value: `${listing.frontage}m`}
                : null,
              listing.alleyWidth
                ? {label: 'Hẻm', value: `${listing.alleyWidth}m`}
                : null,
              listing.floors
                ? {label: 'Số tầng', value: `${listing.floors}`}
                : null,
              listing.bedrooms
                ? {label: 'Phòng ngủ', value: `${listing.bedrooms}`}
                : null,
              listing.bathrooms
                ? {label: 'WC', value: `${listing.bathrooms}`}
                : null,
            ]
              .filter(Boolean)
              .map((item, idx) => (
                <View key={idx} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{item!.label}</Text>
                  <Text style={styles.detailValue} numberOfLines={2}>
                    {item!.value}
                  </Text>
                </View>
              ))}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Score */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Đánh giá</Text>
          <ScoreBadge score={score} />
        </View>

        <View style={styles.divider} />

        {/* Seller info */}
        <View style={styles.sellerSection}>
          <Text style={styles.sectionTitle}>Người đăng</Text>
          <View style={styles.sellerRow}>
            <View style={styles.sellerAvatar}>
              <Text style={styles.sellerAvatarText}>
                {(listing.seller.name ?? listing.seller.phone).charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>
                {listing.seller.name ?? 'Ẩn danh'}
                {listing.seller.isVerified && ' ✓'}
              </Text>
              <Text style={styles.sellerPhone}>{listing.seller.phone}</Text>
            </View>
            <TouchableOpacity style={styles.contactBtn} onPress={handleContact}>
              <Text style={styles.contactBtnText}>Liên hệ</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mô tả</Text>
          <Text style={styles.description}>{listing.description}</Text>
        </View>

        <View style={styles.divider} />

        {/* Bank valuation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Định giá ngân hàng</Text>
          <BankValuationPanel data={bankData} isLoading={bankLoading} />
        </View>

        {/* Similar listings */}
        {similarListings && similarListings.length > 0 && (
          <>
            <View style={styles.divider} />
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tin tương tự</Text>
              {similarListings.map(sl => (
                <ListingCard
                  key={sl.id}
                  listing={sl}
                  onPress={() =>
                    navigation.replace('ListingDetail', {listingId: sl.id})
                  }
                />
              ))}
            </View>
          </>
        )}
      </View>

      {/* Bottom action bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[
            styles.compareActionBtn,
            inComparison && styles.compareActionBtnActive,
          ]}
          onPress={() => {
            addItem(listing);
          }}>
          <Text
            style={[
              styles.compareActionBtnText,
              inComparison && styles.compareActionBtnTextActive,
            ]}>
            {inComparison ? '✓ Đang so sánh' : '+ So sánh'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.contactActionBtn}
          onPress={handleContact}>
          <Text style={styles.contactActionBtnText}>📞 Liên hệ người bán</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 15,
    color: '#6B7280',
  },
  gallery: {
    height: 260,
    position: 'relative',
  },
  galleryImage: {
    width: SCREEN_WIDTH,
    height: 260,
    resizeMode: 'cover',
  },
  galleryPlaceholder: {
    width: SCREEN_WIDTH,
    height: 260,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryPlaceholderEmoji: {
    fontSize: 80,
  },
  imageDots: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 16,
  },
  imageCount: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  imageCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  saveBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 18,
  },
  content: {
    backgroundColor: '#FFFFFF',
  },
  titleSection: {
    padding: 16,
  },
  boostedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F97316',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  boostedText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    lineHeight: 24,
  },
  price: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F97316',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  metaDot: {
    fontSize: 14,
    color: '#D1D5DB',
  },
  legalBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  legalText: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 8,
    backgroundColor: '#F9FAFB',
  },
  detailsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  section: {
    padding: 16,
  },
  detailsGrid: {
    gap: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  detailLabel: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  sellerSection: {
    padding: 16,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sellerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  sellerPhone: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  contactBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  contactBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  description: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 12,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 6,
  },
  compareActionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  compareActionBtnActive: {
    borderColor: '#F97316',
    backgroundColor: '#FFF7ED',
  },
  compareActionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  compareActionBtnTextActive: {
    color: '#F97316',
  },
  contactActionBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F97316',
    alignItems: 'center',
  },
  contactActionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
