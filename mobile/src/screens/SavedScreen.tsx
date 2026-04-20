import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import {useAuthStore} from '../store/authStore';
import {getSavedListings} from '../api/user';
import ListingCard from '../components/listing/ListingCard';
import type {Listing} from '../types';
import type {RootStackParamList} from '../navigation/types';

export default function SavedScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  const {data, isLoading, refetch, isRefetching} = useQuery({
    queryKey: ['saved-listings'],
    queryFn: () => getSavedListings(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2,
  });

  const savedListings: Listing[] = data?.data ?? [];

  if (!isAuthenticated) {
    return (
      <View style={[styles.authContainer, {paddingTop: insets.top + 16}]}>
        <Text style={styles.authEmoji}>🔐</Text>
        <Text style={styles.authTitle}>Đăng nhập để xem tin đã lưu</Text>
        <Text style={styles.authSubtitle}>
          Lưu các tin đăng yêu thích để xem lại bất cứ lúc nào
        </Text>
        <TouchableOpacity
          style={styles.authBtn}
          onPress={() => navigation.navigate('Auth' as any)}>
          <Text style={styles.authBtnText}>Đăng nhập ngay</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tin đã lưu</Text>
        {savedListings.length > 0 && (
          <Text style={styles.headerCount}>
            {savedListings.length} tin
          </Text>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#F97316" size="large" />
        </View>
      ) : savedListings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🤍</Text>
          <Text style={styles.emptyTitle}>Chưa có tin đã lưu</Text>
          <Text style={styles.emptySubtitle}>
            Nhấn vào biểu tượng ❤️ trên mỗi tin đăng để lưu lại
          </Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => {
              // Navigate to Search tab
            }}>
            <Text style={styles.browseBtnText}>Khám phá ngay</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={savedListings}
          keyExtractor={item => item.id}
          numColumns={1}
          renderItem={({item}) => (
            <ListingCard
              listing={item}
              onPress={() =>
                navigation.navigate('ListingDetail', {listingId: item.id})
              }
            />
          )}
          contentContainerStyle={styles.listContent}
          onRefresh={refetch}
          refreshing={isRefetching}
          showsVerticalScrollIndicator={false}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerCount: {
    fontSize: 14,
    color: '#F97316',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  browseBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#F97316',
    borderRadius: 10,
  },
  browseBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  listContent: {
    padding: 12,
    paddingBottom: 40,
  },
  authContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#F9FAFB',
  },
  authEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  authTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  authSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  authBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#F97316',
    borderRadius: 10,
  },
  authBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
