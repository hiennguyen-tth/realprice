import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import {useComparisonStore} from '../../store/comparisonStore';
import {formatVND, formatArea, formatPricePerM2} from '../../utils/formatPrice';
import type {Listing} from '../../types';
import type {RootStackParamList} from '../../navigation/types';

interface ListingCardProps {
  listing: Listing;
  showCompareButton?: boolean;
  onPress?: () => void;
}

const LEGAL_LABELS: Record<string, string> = {
  so_do: 'Sổ đỏ',
  so_hong: 'Sổ hồng',
  hop_dong: 'Hợp đồng',
  giay_to_khac: 'Giấy tờ khác',
  chua_co: 'Chưa có',
};

const LEGAL_COLORS: Record<string, string> = {
  so_do: '#16A34A',
  so_hong: '#2563EB',
  hop_dong: '#D97706',
  giay_to_khac: '#9CA3AF',
  chua_co: '#EF4444',
};

export default function ListingCard({
  listing,
  showCompareButton = true,
  onPress,
}: ListingCardProps): React.JSX.Element {
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList>>();
  const {addItem, removeItem, isInComparison} = useComparisonStore();

  const inComparison = isInComparison(listing.id);
  const thumbnail = listing.images[0]?.thumbnailUrl;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.navigate('ListingDetail', {listingId: listing.id});
    }
  };

  const handleCompareToggle = () => {
    if (inComparison) {
      removeItem(listing.id);
    } else {
      addItem(listing);
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={handlePress}>
      {/* Image */}
      <View style={styles.imageWrapper}>
        {thumbnail ? (
          <Image source={{uri: thumbnail}} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>🏠</Text>
          </View>
        )}
        {listing.isBoosted && (
          <View style={styles.boostedBadge}>
            <Text style={styles.boostedText}>⚡ Nổi bật</Text>
          </View>
        )}
        <View
          style={[
            styles.legalBadge,
            {
              backgroundColor:
                LEGAL_COLORS[listing.legalStatus] ?? '#9CA3AF',
            },
          ]}>
          <Text style={styles.legalText}>
            {LEGAL_LABELS[listing.legalStatus] ?? listing.legalStatus}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.price} numberOfLines={1}>
          {formatVND(listing.price)}
          {listing.listingType === 'cho_thue' && '/tháng'}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{formatArea(listing.area)}</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaText}>
            {formatPricePerM2(listing.pricePerM2)}
          </Text>
        </View>
        <Text style={styles.address} numberOfLines={2}>
          {listing.address}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.sellerName} numberOfLines={1}>
            {listing.seller.name ?? listing.seller.phone}
            {listing.seller.isVerified && ' ✓'}
          </Text>
          {showCompareButton && (
            <TouchableOpacity
              style={[
                styles.compareBtn,
                inComparison && styles.compareBtnActive,
              ]}
              onPress={handleCompareToggle}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Text
                style={[
                  styles.compareBtnText,
                  inComparison && styles.compareBtnTextActive,
                ]}>
                {inComparison ? '✓' : '+'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 12,
  },
  imageWrapper: {
    height: 160,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontSize: 40,
  },
  boostedBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#F97316',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  boostedText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  legalBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  legalText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  content: {
    padding: 12,
  },
  price: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F97316',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
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
  address: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 8,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sellerName: {
    fontSize: 12,
    color: '#9CA3AF',
    flex: 1,
  },
  compareBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  compareBtnActive: {
    backgroundColor: '#FFF7ED',
    borderColor: '#F97316',
  },
  compareBtnText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '600',
    lineHeight: 20,
  },
  compareBtnTextActive: {
    color: '#F97316',
  },
});
