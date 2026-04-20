import React, {useCallback, useRef} from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomSheet, {BottomSheetScrollView} from '@gorhom/bottom-sheet';
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import {useListingsByLand} from '../../hooks/useListings';
import ListingCard from './ListingCard';
import {formatVND, formatArea, formatPricePerM2} from '../../utils/formatPrice';
import type {Land} from '../../types';
import type {RootStackParamList} from '../../navigation/types';

interface ListingBottomSheetProps {
  land: Land | null;
  onClose: () => void;
}

const SNAP_POINTS = ['35%', '70%', '95%'];

export default function ListingBottomSheet({
  land,
  onClose,
}: ListingBottomSheetProps): React.JSX.Element {
  const sheetRef = useRef<BottomSheet>(null);
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList>>();

  const {data: listingsData, isLoading} = useListingsByLand(land?.id ?? null);

  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose],
  );

  if (!land) return <View />;

  return (
    <BottomSheet
      ref={sheetRef}
      snapPoints={SNAP_POINTS}
      index={0}
      enablePanDownToClose
      onChange={handleSheetChange}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handle}>
      <BottomSheetScrollView contentContainerStyle={styles.scrollContent}>
        {/* Land summary header */}
        <View style={styles.header}>
          <Text style={styles.address} numberOfLines={2}>
            {land.address}
          </Text>
          <Text style={styles.district}>
            {land.ward}, {land.district}, {land.city}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatArea(land.area)}</Text>
              <Text style={styles.statLabel}>Diện tích</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {formatPricePerM2(land.minPricePerM2)}
              </Text>
              <Text style={styles.statLabel}>Giá thấp nhất</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {formatVND(land.avgPricePerM2)}
              </Text>
              <Text style={styles.statLabel}>TB/m²</Text>
            </View>
          </View>
        </View>

        {/* View full detail */}
        <TouchableOpacity
          style={styles.viewDetailBtn}
          onPress={() =>
            navigation.navigate('LandDetail', {landId: land.id})
          }>
          <Text style={styles.viewDetailText}>
            Xem chi tiết thửa đất →
          </Text>
        </TouchableOpacity>

        {/* Listings */}
        <View style={styles.listingsSection}>
          <Text style={styles.sectionTitle}>
            Tin đăng ({land.activeListings})
          </Text>
          {isLoading && (
            <ActivityIndicator
              color="#F97316"
              style={{marginVertical: 20}}
            />
          )}
          {!isLoading &&
            listingsData?.data.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          {!isLoading && listingsData && listingsData.totalPages > 1 && (
            <TouchableOpacity
              style={styles.seeMoreBtn}
              onPress={() =>
                navigation.navigate('LandDetail', {landId: land.id})
              }>
              <Text style={styles.seeMoreText}>
                Xem thêm {listingsData.total - listingsData.data.length} tin
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  handle: {
    backgroundColor: '#E5E7EB',
    width: 40,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  address: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  district: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F97316',
  },
  statLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#FED7AA',
  },
  viewDetailBtn: {
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  viewDetailText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
  listingsSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  seeMoreBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 4,
  },
  seeMoreText: {
    fontSize: 14,
    color: '#F97316',
    fontWeight: '600',
  },
});
