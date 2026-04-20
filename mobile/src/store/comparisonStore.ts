import {create} from 'zustand';
import {Alert} from 'react-native';
import type {Listing} from '../types';

const MAX_COMPARISON_ITEMS = 4;

interface ComparisonState {
  items: Listing[];
}

interface ComparisonActions {
  addItem: (listing: Listing) => void;
  removeItem: (listingId: string) => void;
  clearAll: () => void;
  isInComparison: (listingId: string) => boolean;
}

type ComparisonStore = ComparisonState & ComparisonActions;

export const useComparisonStore = create<ComparisonStore>((set, get) => ({
  items: [],

  addItem: listing => {
    const {items, isInComparison} = get();

    if (isInComparison(listing.id)) {
      return; // Already in comparison, silently ignore
    }

    if (items.length >= MAX_COMPARISON_ITEMS) {
      Alert.alert(
        'Giới hạn so sánh',
        `Bạn chỉ có thể so sánh tối đa ${MAX_COMPARISON_ITEMS} bất động sản cùng lúc. Hãy xoá bớt để thêm mới.`,
        [{text: 'Đồng ý', style: 'default'}],
      );
      return;
    }

    set({items: [...items, listing]});
  },

  removeItem: listingId => {
    set(state => ({
      items: state.items.filter(item => item.id !== listingId),
    }));
  },

  clearAll: () => set({items: []}),

  isInComparison: listingId => {
    return get().items.some(item => item.id === listingId);
  },
}));
