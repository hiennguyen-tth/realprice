import React from 'react';
import {
  Alert,
  ScrollView,
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
import {useAuth} from '../hooks/useAuth';
import {getMyListings} from '../api/user';
import ListingCard from '../components/listing/ListingCard';
import type {RootStackParamList} from '../navigation/types';

const PLAN_LABELS: Record<string, string> = {
  free: 'Miễn phí',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

const PLAN_COLORS: Record<string, {bg: string; text: string}> = {
  free: {bg: '#F3F4F6', text: '#6B7280'},
  pro: {bg: '#FFF7ED', text: '#F97316'},
  enterprise: {bg: '#EFF6FF', text: '#1D4ED8'},
};

export default function ProfileScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const {user, isAuthenticated} = useAuthStore();
  const {signOut} = useAuth();

  const {data: myListings, isLoading: listingsLoading} = useQuery({
    queryKey: ['my-listings'],
    queryFn: () => getMyListings(1, 5),
    enabled: isAuthenticated,
  });

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất không?', [
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: signOut,
      },
      {text: 'Huỷ', style: 'cancel'},
    ]);
  };

  if (!isAuthenticated || !user) {
    return (
      <View style={[styles.authContainer, {paddingTop: insets.top + 16}]}>
        <Text style={styles.authEmoji}>👤</Text>
        <Text style={styles.authTitle}>Đăng nhập để xem hồ sơ</Text>
        <TouchableOpacity
          style={styles.authBtn}
          onPress={() => navigation.navigate('Auth' as any)}>
          <Text style={styles.authBtnText}>Đăng nhập</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const planStyle = PLAN_COLORS[user.plan] ?? PLAN_COLORS.free!;

  return (
    <ScrollView
      style={[styles.container, {paddingTop: insets.top}]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      {/* User info */}
      <View style={styles.userSection}>
        <View style={styles.avatarWrapper}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user.name ?? user.phone).charAt(0).toUpperCase()}
            </Text>
          </View>
          {user.isVerified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓</Text>
            </View>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {user.name ?? 'Người dùng RealPrice'}
          </Text>
          <Text style={styles.userPhone}>{user.phone}</Text>
          {user.email && (
            <Text style={styles.userEmail}>{user.email}</Text>
          )}
        </View>
        <View
          style={[styles.planBadge, {backgroundColor: planStyle.bg}]}>
          <Text style={[styles.planBadgeText, {color: planStyle.text}]}>
            {PLAN_LABELS[user.plan] ?? user.plan}
          </Text>
        </View>
      </View>

      {/* Quota bar */}
      <View style={styles.quotaSection}>
        <View style={styles.quotaHeader}>
          <Text style={styles.quotaTitle}>Hạn mức đăng tin</Text>
          <Text style={styles.quotaValue}>
            {user.listingQuota.used}/{user.listingQuota.total}
          </Text>
        </View>
        <View style={styles.quotaBarBg}>
          <View
            style={[
              styles.quotaBarFill,
              {
                width: `${(user.listingQuota.used / user.listingQuota.total) * 100}%`,
                backgroundColor:
                  user.listingQuota.used >= user.listingQuota.total
                    ? '#EF4444'
                    : '#F97316',
              },
            ]}
          />
        </View>
        {user.plan === 'free' && (
          <TouchableOpacity style={styles.upgradeBtn}>
            <Text style={styles.upgradeBtnText}>
              ⚡ Nâng cấp Pro — đăng không giới hạn
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* My listings */}
      <View style={styles.listingsSection}>
        <View style={styles.listingsSectionHeader}>
          <Text style={styles.listingsSectionTitle}>Tin đăng của tôi</Text>
          {(myListings?.total ?? 0) > 5 && (
            <TouchableOpacity>
              <Text style={styles.viewAllText}>
                Xem tất cả {myListings?.total}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {listingsLoading && (
          <Text style={styles.loadingText}>Đang tải...</Text>
        )}

        {!listingsLoading && (myListings?.data ?? []).length === 0 && (
          <View style={styles.noListings}>
            <Text style={styles.noListingsText}>
              Bạn chưa đăng tin nào
            </Text>
            <TouchableOpacity
              style={styles.postBtn}
              onPress={() => navigation.navigate('PostListing')}>
              <Text style={styles.postBtnText}>+ Đăng tin ngay</Text>
            </TouchableOpacity>
          </View>
        )}

        {myListings?.data.map(listing => (
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
      </View>

      {/* Settings */}
      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionTitle}>Cài đặt</Text>
        {[
          {icon: '👤', label: 'Chỉnh sửa hồ sơ', onPress: () => {}},
          {icon: '🔔', label: 'Thông báo', onPress: () => {}},
          {icon: '🔒', label: 'Bảo mật & Quyền riêng tư', onPress: () => {}},
          {icon: '📋', label: 'Điều khoản dịch vụ', onPress: () => {}},
          {icon: '❓', label: 'Trợ giúp & Hỗ trợ', onPress: () => {}},
        ].map(item => (
          <TouchableOpacity
            key={item.label}
            style={styles.settingsItem}
            onPress={item.onPress}>
            <Text style={styles.settingsIcon}>{item.icon}</Text>
            <Text style={styles.settingsLabel}>{item.label}</Text>
            <Text style={styles.settingsArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutBtnText}>Đăng xuất</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>RealPrice v1.0.0</Text>
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
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    gap: 14,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  verifiedText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 13,
    color: '#6B7280',
  },
  userEmail: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  planBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  planBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  quotaSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
    gap: 8,
  },
  quotaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quotaTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  quotaValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F97316',
  },
  quotaBarBg: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  quotaBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  upgradeBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FFF7ED',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FED7AA',
    alignItems: 'center',
  },
  upgradeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F97316',
  },
  listingsSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
  },
  listingsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listingsSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  viewAllText: {
    fontSize: 13,
    color: '#F97316',
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 12,
  },
  noListings: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  noListingsText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  postBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#F97316',
    borderRadius: 10,
  },
  postBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  settingsSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
  },
  settingsSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
    gap: 12,
  },
  settingsIcon: {
    fontSize: 18,
    width: 28,
    textAlign: 'center',
  },
  settingsLabel: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
  },
  settingsArrow: {
    fontSize: 20,
    color: '#D1D5DB',
  },
  logoutBtn: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
  },
  logoutBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#D1D5DB',
    paddingBottom: 8,
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
    marginBottom: 24,
  },
  authBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: '#F97316',
    borderRadius: 12,
  },
  authBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
