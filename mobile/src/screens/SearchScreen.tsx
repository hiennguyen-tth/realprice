import React, {useState, useCallback} from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import {useListingsInfinite} from '../hooks/useListings';
import {useFilterStore} from '../store/filterStore';
import ListingCard from '../components/listing/ListingCard';
import type {ListingType, LandType} from '../types';
import type {Listing} from '../types';
import type {RootStackParamList} from '../navigation/types';

const LISTING_TYPE_FILTERS: {label: string; value: ListingType | undefined}[] =
  [
    {label: 'Tất cả', value: undefined},
    {label: 'Bán', value: 'ban'},
    {label: 'Cho thuê', value: 'cho_thue'},
  ];

const PRICE_CHIPS: {label: string; min?: number; max?: number}[] = [
  {label: 'Tất cả'},
  {label: '< 1 tỷ', min: undefined, max: 1_000_000_000},
  {label: '1-3 tỷ', min: 1_000_000_000, max: 3_000_000_000},
  {label: '3-5 tỷ', min: 3_000_000_000, max: 5_000_000_000},
  {label: '5-10 tỷ', min: 5_000_000_000, max: 10_000_000_000},
  {label: '> 10 tỷ', min: 10_000_000_000},
];

const AREA_CHIPS: {label: string; min?: number; max?: number}[] = [
  {label: 'Tất cả'},
  {label: '< 50m²', max: 50},
  {label: '50-100m²', min: 50, max: 100},
  {label: '100-200m²', min: 100, max: 200},
  {label: '> 200m²', min: 200},
];

export default function SearchScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [searchQuery, setSearchQuery] = useState('');

  const {
    listingType,
    minPrice,
    maxPrice,
    minArea,
    maxArea,
    setListingType,
    setPriceRange,
    setAreaRange,
    setQuery,
    sortBy,
    setSortBy,
  } = useFilterStore();

  const {data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch} =
    useListingsInfinite({
      listingType,
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      query: searchQuery,
      sortBy,
    });

  const allListings: Listing[] = data?.pages.flatMap(p => p.data) ?? [];

  const handleSearch = useCallback(() => {
    setQuery(searchQuery);
    refetch();
  }, [searchQuery, setQuery, refetch]);

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const totalCount = data?.pages[0]?.total ?? 0;

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      {/* Search bar */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Tìm kiếm địa chỉ, phường, quận..."
            placeholderTextColor="#9CA3AF"
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setQuery('');
              }}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter chips */}
      <View style={styles.filtersContainer}>
        {/* Listing type */}
        <View style={styles.filterRow}>
          {LISTING_TYPE_FILTERS.map(f => (
            <TouchableOpacity
              key={String(f.value)}
              style={[
                styles.filterChip,
                listingType === f.value && styles.filterChipActive,
              ]}
              onPress={() => setListingType(f.value)}>
              <Text
                style={[
                  styles.filterChipText,
                  listingType === f.value && styles.filterChipTextActive,
                ]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Price range chips */}
        <View style={styles.filterRow}>
          {PRICE_CHIPS.map(p => {
            const isActive = minPrice === p.min && maxPrice === p.max;
            return (
              <TouchableOpacity
                key={p.label}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setPriceRange(p.min, p.max)}>
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Area chips */}
        <View style={styles.filterRow}>
          {AREA_CHIPS.map(a => {
            const isActive = minArea === a.min && maxArea === a.max;
            return (
              <TouchableOpacity
                key={a.label}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setAreaRange(a.min, a.max)}>
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}>
                  {a.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Sort + count bar */}
      <View style={styles.sortBar}>
        <Text style={styles.resultCount}>
          {isLoading ? 'Đang tải...' : `${totalCount.toLocaleString('vi-VN')} kết quả`}
        </Text>
        <TouchableOpacity
          style={styles.sortBtn}
          onPress={() => {
            const options: typeof sortBy[] = ['newest', 'price_asc', 'price_desc', 'area_asc'];
            const idx = options.indexOf(sortBy);
            setSortBy(options[(idx + 1) % options.length]);
          }}>
          <Text style={styles.sortBtnText}>
            {sortBy === 'newest'
              ? '🕐 Mới nhất'
              : sortBy === 'price_asc'
              ? '💰 Giá tăng dần'
              : sortBy === 'price_desc'
              ? '💰 Giá giảm dần'
              : '📐 DT tăng dần'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Listings */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#F97316" size="large" />
        </View>
      ) : (
        <FlatList
          data={allListings}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <ListingCard
              listing={item}
              onPress={() =>
                navigation.navigate('ListingDetail', {listingId: item.id})
              }
            />
          )}
          contentContainerStyle={styles.listContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🏠</Text>
              <Text style={styles.emptyTitle}>Không tìm thấy kết quả</Text>
              <Text style={styles.emptySubtitle}>
                Thử điều chỉnh bộ lọc hoặc từ khoá tìm kiếm
              </Text>
            </View>
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator color="#F97316" />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  searchHeader: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchIcon: {
    fontSize: 18,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    height: 44,
  },
  clearIcon: {
    fontSize: 14,
    color: '#9CA3AF',
    padding: 4,
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 6,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  filterChipActive: {
    backgroundColor: '#FFF7ED',
    borderColor: '#F97316',
  },
  filterChipText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#F97316',
    fontWeight: '700',
  },
  sortBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  resultCount: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  sortBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  sortBtnText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 12,
    paddingBottom: 40,
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
