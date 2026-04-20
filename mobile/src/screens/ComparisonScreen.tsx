import React from 'react';
import {
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {useNavigation} from '@react-navigation/native';
import {useComparisonStore} from '../store/comparisonStore';
import {compareBankValuations} from '../api/bankValuations';
import ComparisonTable from '../components/comparison/ComparisonTable';
import ScoreBadge from '../components/comparison/ScoreBadge';
import {formatVND, formatPricePerM2} from '../utils/formatPrice';
import {calcListingScore, getScoreLabel, getScoreColor} from '../utils/scoreUtils';

export default function ComparisonScreen(): React.JSX.Element {
  const {items, removeItem, clearAll} = useComparisonStore();
  const navigation = useNavigation();

  const landIds = [...new Set(items.map(item => item.landId))];
  const {data: bankData} = useQuery({
    queryKey: ['comparison-bank-valuations', landIds],
    queryFn: () => compareBankValuations(landIds),
    enabled: landIds.length > 0,
  });

  // Build bankValuations map: listingId → BankValuation[]
  const bankValuationsMap: Record<string, import('../types').BankValuation[]> = {};
  if (bankData) {
    items.forEach(listing => {
      const match = bankData.find(d => d.landId === listing.landId);
      if (match) {
        bankValuationsMap[listing.id] = match.valuations;
      }
    });
  }

  // Analysis
  const districtAvg =
    items.length > 0
      ? items.reduce((sum, l) => sum + l.pricePerM2, 0) / items.length
      : 0;

  const scores = items.map(l => ({
    id: l.id,
    score: calcListingScore(l, null, districtAvg),
    price: l.price,
    pricePerM2: l.pricePerM2,
    title: l.title,
  }));

  const cheapest = scores.reduce(
    (best, s) => (s.price < best.price ? s : best),
    scores[0] ?? {id: '', score: 0, price: Infinity, pricePerM2: 0, title: ''},
  );

  const bestValue = scores.reduce(
    (best, s) => (s.score > best.score ? s : best),
    scores[0] ?? {id: '', score: 0, price: Infinity, pricePerM2: 0, title: ''},
  );

  const handleShare = async () => {
    try {
      const text = items
        .map(
          l =>
            `${l.title}\n💰 ${formatVND(l.price)} | ${formatPricePerM2(l.pricePerM2)}\n📍 ${l.address}\n`,
        )
        .join('\n');

      await Share.share({
        message: `So sánh bất động sản từ RealPrice:\n\n${text}\n\nTải app RealPrice: https://realprice.vn`,
        title: 'So sánh bất động sản',
      });
    } catch {
      Alert.alert('Lỗi', 'Không thể chia sẻ');
    }
  };

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>📊</Text>
        <Text style={styles.emptyTitle}>Chưa có bất động sản nào</Text>
        <Text style={styles.emptySubtitle}>
          Thêm tối đa 4 tin đăng vào danh sách so sánh để bắt đầu
        </Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Quay lại tìm kiếm</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      {/* Action bar */}
      <View style={styles.actionBar}>
        <Text style={styles.actionBarTitle}>
          So sánh {items.length} bất động sản
        </Text>
        <View style={styles.actionBarBtns}>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Text style={styles.shareBtnText}>📤 Chia sẻ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.clearBtn} onPress={clearAll}>
            <Text style={styles.clearBtnText}>Xoá tất cả</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Analysis summary */}
      <View style={styles.analysisSummary}>
        <Text style={styles.analysisTitle}>Phân tích tổng quan</Text>

        <View style={styles.analysisGrid}>
          {cheapest.id && (
            <View style={[styles.analysisCard, styles.analysisCardGreen]}>
              <Text style={styles.analysisCardIcon}>💰</Text>
              <Text style={styles.analysisCardLabel}>Giá thấp nhất</Text>
              <Text
                style={styles.analysisCardName}
                numberOfLines={2}>
                {cheapest.title}
              </Text>
              <Text style={styles.analysisCardValue}>
                {formatVND(cheapest.price)}
              </Text>
            </View>
          )}

          {bestValue.id && (
            <View style={[styles.analysisCard, styles.analysisCardOrange]}>
              <Text style={styles.analysisCardIcon}>⭐</Text>
              <Text style={styles.analysisCardLabel}>Điểm tốt nhất</Text>
              <Text
                style={styles.analysisCardName}
                numberOfLines={2}>
                {bestValue.title}
              </Text>
              <View
                style={[
                  styles.scorePill,
                  {backgroundColor: getScoreColor(bestValue.score)},
                ]}>
                <Text style={styles.scorePillText}>
                  {bestValue.score}/100 {getScoreLabel(bestValue.score)}
                </Text>
              </View>
            </View>
          )}
        </View>

        <Text style={styles.recommendation}>
          {bestValue.id === cheapest.id
            ? `✅ "${bestValue.title}" vừa có giá tốt nhất vừa có điểm đánh giá cao nhất. Đây là lựa chọn khuyến nghị.`
            : `💡 "${bestValue.title}" có điểm đánh giá tốt nhất. Nếu ưu tiên giá, hãy xem xét "${cheapest.title}".`}
        </Text>
      </View>

      {/* Comparison table */}
      <View style={styles.tableSection}>
        <Text style={styles.tableTitle}>Bảng so sánh chi tiết</Text>
        <ComparisonTable
          listings={items}
          bankValuations={bankValuationsMap}
        />
      </View>

      {/* Individual score badges */}
      <View style={styles.scoresSection}>
        <Text style={styles.scoresTitle}>Điểm đánh giá chi tiết</Text>
        {scores.map(s => {
          const listing = items.find(l => l.id === s.id);
          if (!listing) return null;
          return (
            <View key={s.id} style={styles.scoreItem}>
              <Text style={styles.scoreItemTitle} numberOfLines={1}>
                {listing.title}
              </Text>
              <ScoreBadge score={s.score} />
              <View style={styles.scoreActions}>
                <TouchableOpacity
                  style={styles.scoreActionBtn}
                  onPress={() => removeItem(s.id)}>
                  <Text style={styles.scoreActionBtnText}>Xoá khỏi danh sách</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>

      {/* Contact buttons per listing */}
      <View style={styles.contactSection}>
        <Text style={styles.contactTitle}>Liên hệ người bán</Text>
        {items.map(listing => (
          <View key={listing.id} style={styles.contactItem}>
            <View style={styles.contactLeft}>
              <Text style={styles.contactListingTitle} numberOfLines={1}>
                {listing.title}
              </Text>
              <Text style={styles.contactPrice}>
                {formatVND(listing.price)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.contactBtn}
              onPress={() =>
                Alert.alert(
                  'Liên hệ',
                  `SĐT: ${listing.seller.phone}`,
                  [{text: 'Đóng'}],
                )
              }>
              <Text style={styles.contactBtnText}>📞 Gọi</Text>
            </TouchableOpacity>
          </View>
        ))}
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
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
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
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  backBtnText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  actionBarTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  actionBarBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  shareBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  shareBtnText: {
    fontSize: 13,
    color: '#1D4ED8',
    fontWeight: '600',
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  clearBtnText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '600',
  },
  analysisSummary: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
  },
  analysisTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  analysisGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  analysisCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  analysisCardGreen: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  analysisCardOrange: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  analysisCardIcon: {
    fontSize: 22,
  },
  analysisCardLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  analysisCardName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  analysisCardValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16A34A',
  },
  scorePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  scorePillText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  recommendation: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 19,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F97316',
  },
  tableSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
  },
  tableTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  scoresSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
    gap: 16,
  },
  scoresTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  scoreItem: {
    gap: 8,
  },
  scoreItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  scoreActions: {
    flexDirection: 'row',
  },
  scoreActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  scoreActionBtnText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  contactSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    gap: 12,
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contactLeft: {
    flex: 1,
    marginRight: 8,
  },
  contactListingTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  contactPrice: {
    fontSize: 13,
    color: '#F97316',
    fontWeight: '700',
    marginTop: 2,
  },
  contactBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#F97316',
    borderRadius: 8,
  },
  contactBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
