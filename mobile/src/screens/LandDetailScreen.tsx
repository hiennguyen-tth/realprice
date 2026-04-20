import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import {getLandById, getPriceHistory, getNearbyLands} from '../api/lands';
import {getBankValuationsForLand} from '../api/lands';
import {getListingsByLandId} from '../api/listings';
import {formatVND, formatArea, formatPricePerM2, formatPercentChange} from '../utils/formatPrice';
import PriceChart from '../components/listing/PriceChart';
import BankValuationPanel from '../components/bank/BankValuationPanel';
import ListingCard from '../components/listing/ListingCard';
import type {RootStackParamList} from '../navigation/types';
import type {RootStackScreenProps} from '../navigation/types';

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

type Props = RootStackScreenProps<'LandDetail'>;

export default function LandDetailScreen({route}: Props): React.JSX.Element {
  const {landId} = route.params;
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const {data: land, isLoading} = useQuery({
    queryKey: ['land', landId],
    queryFn: () => getLandById(landId),
    staleTime: 1000 * 60 * 5,
  });

  const {data: priceHistory} = useQuery({
    queryKey: ['land-price-history', landId],
    queryFn: () => getPriceHistory(landId, 6),
    enabled: !!land,
  });

  const {data: bankValuations, isLoading: bankLoading} = useQuery({
    queryKey: ['land-bank-valuations', landId],
    queryFn: () => getBankValuationsForLand(landId),
    enabled: !!land,
  });

  const {data: listings} = useQuery({
    queryKey: ['land-listings', landId],
    queryFn: () => getListingsByLandId(landId, {pageSize: 5}),
    enabled: !!land,
  });

  const {data: nearbyData} = useQuery({
    queryKey: ['land-nearby', landId],
    queryFn: () => getNearbyLands(landId, 500, 5),
    enabled: !!land,
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#F97316" size="large" />
      </View>
    );
  }

  if (!land) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Không tìm thấy thửa đất</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      {/* Land info header */}
      <View style={styles.header}>
        <Text style={styles.address}>{land.address}</Text>
        <Text style={styles.location}>
          {land.ward}, {land.district}, {land.city}
        </Text>
        <Text style={styles.parcelCode}>Mã thửa: {land.parcelCode}</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{formatArea(land.area)}</Text>
            <Text style={styles.statLabel}>Diện tích</Text>
          </View>
          <View style={styles.statBox}>
            <View style={[
              styles.legalBadge,
              {backgroundColor: LEGAL_COLORS[land.legalStatus] ?? '#9CA3AF'},
            ]}>
              <Text style={styles.legalText}>
                {LEGAL_LABELS[land.legalStatus] ?? land.legalStatus}
              </Text>
            </View>
            <Text style={styles.statLabel}>Pháp lý</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{land.activeListings}</Text>
            <Text style={styles.statLabel}>Tin đang đăng</Text>
          </View>
        </View>
      </View>

      {/* Price range */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Khoảng giá</Text>
        <View style={styles.priceRow}>
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>Thấp nhất</Text>
            <Text style={styles.priceValue}>
              {formatPricePerM2(land.minPricePerM2)}
            </Text>
          </View>
          <View style={[styles.priceBox, styles.priceBoxCenter]}>
            <Text style={styles.priceLabel}>Trung bình</Text>
            <Text style={[styles.priceValue, styles.priceAvg]}>
              {formatPricePerM2(land.avgPricePerM2)}
            </Text>
          </View>
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>Cao nhất</Text>
            <Text style={styles.priceValue}>
              {formatPricePerM2(land.maxPricePerM2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Price history chart */}
      {priceHistory && priceHistory.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lịch sử giá</Text>
          <PriceChart data={priceHistory} />
        </View>
      )}

      {/* Bank valuations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Định giá ngân hàng</Text>
        <BankValuationPanel
          data={bankValuations}
          isLoading={bankLoading}
        />
      </View>

      {/* Listings */}
      {listings && listings.data.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Tin đăng ({listings.total})
            </Text>
          </View>
          {listings.data.map(listing => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onPress={() =>
                navigation.navigate('ListingDetail', {
                  listingId: listing.id,
                })
              }
            />
          ))}
          {listings.totalPages > 1 && (
            <TouchableOpacity style={styles.seeMoreBtn}>
              <Text style={styles.seeMoreText}>
                Xem tất cả {listings.total} tin →
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Nearby lands */}
      {nearbyData && nearbyData.data.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thửa đất lân cận</Text>
          {nearbyData.data.map(nearby => (
            <TouchableOpacity
              key={nearby.id}
              style={styles.nearbyItem}
              onPress={() =>
                navigation.push('LandDetail', {landId: nearby.id})
              }>
              <View style={styles.nearbyLeft}>
                <Text style={styles.nearbyAddress} numberOfLines={1}>
                  {nearby.address}
                </Text>
                <Text style={styles.nearbyDistrict}>
                  {nearby.district}, {nearby.city}
                </Text>
              </View>
              <View style={styles.nearbyRight}>
                <Text style={styles.nearbyPrice}>
                  {formatPricePerM2(nearby.avgPricePerM2)}
                </Text>
                <Text style={styles.nearbyListings}>
                  {nearby.activeListings} tin
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingBottom: 40,
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
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
  },
  address: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  location: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  parcelCode: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  legalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  legalText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priceBox: {
    flex: 1,
    padding: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    alignItems: 'center',
  },
  priceBoxCenter: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  priceLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
  },
  priceAvg: {
    color: '#F97316',
    fontSize: 13,
  },
  seeMoreBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  seeMoreText: {
    fontSize: 14,
    color: '#F97316',
    fontWeight: '600',
  },
  nearbyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  nearbyLeft: {
    flex: 1,
    marginRight: 12,
  },
  nearbyAddress: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  nearbyDistrict: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  nearbyRight: {
    alignItems: 'flex-end',
  },
  nearbyPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F97316',
  },
  nearbyListings: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
});
