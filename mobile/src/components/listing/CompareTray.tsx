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
import {formatShortPrice} from '../../utils/formatPrice';
import type {RootStackParamList} from '../../navigation/types';

export default function CompareTray(): React.JSX.Element | null {
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList>>();
  const {items, removeItem, clearAll} = useComparisonStore();

  if (items.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.itemsRow}>
        {items.map(listing => (
          <View key={listing.id} style={styles.itemWrapper}>
            {listing.images[0]?.thumbnailUrl ? (
              <Image
                source={{uri: listing.images[0].thumbnailUrl}}
                style={styles.itemImage}
              />
            ) : (
              <View style={styles.itemImagePlaceholder}>
                <Text style={styles.itemImageEmoji}>🏠</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => removeItem(listing.id)}
              hitSlop={{top: 4, bottom: 4, left: 4, right: 4}}>
              <Text style={styles.removeBtnText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.itemPrice} numberOfLines={1}>
              {formatShortPrice(listing.price)}
            </Text>
          </View>
        ))}

        {/* Placeholder slots */}
        {Array.from({length: Math.max(0, 4 - items.length)}).map((_, i) => (
          <View key={`placeholder-${i}`} style={styles.placeholderSlot}>
            <Text style={styles.placeholderText}>+</Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.clearBtn} onPress={clearAll}>
          <Text style={styles.clearBtnText}>Xoá</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.compareBtn,
            items.length < 2 && styles.compareBtnDisabled,
          ]}
          disabled={items.length < 2}
          onPress={() => navigation.navigate('Comparison')}>
          <Text style={styles.compareBtnText}>
            So sánh ({items.length})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80,
    left: 12,
    right: 12,
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 50,
  },
  itemsRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  itemWrapper: {
    alignItems: 'center',
    position: 'relative',
  },
  itemImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#F97316',
  },
  itemImagePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F97316',
  },
  itemImageEmoji: {
    fontSize: 20,
  },
  removeBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  removeBtnText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  itemPrice: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    maxWidth: 44,
  },
  placeholderSlot: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4B5563',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#6B7280',
    fontSize: 20,
    fontWeight: '300',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  clearBtnText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
  },
  compareBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F97316',
  },
  compareBtnDisabled: {
    backgroundColor: '#4B5563',
  },
  compareBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
