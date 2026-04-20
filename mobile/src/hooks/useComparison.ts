import {useMutation, useQuery} from '@tanstack/react-query';
import {createComparison} from '../api/comparison';
import {useComparisonStore} from '../store/comparisonStore';
import type {Listing} from '../types';

export function useComparison() {
  const {items, addItem, removeItem, clearAll, isInComparison} =
    useComparisonStore();

  const createComparisonMutation = useMutation({
    mutationFn: (listingIds: string[]) => createComparison(listingIds),
  });

  const handleAddItem = (listing: Listing) => {
    addItem(listing);
  };

  const handleRemoveItem = (listingId: string) => {
    removeItem(listingId);
  };

  const handleClearAll = () => {
    clearAll();
  };

  const submitComparison = async () => {
    if (items.length < 2) {
      throw new Error('Cần ít nhất 2 bất động sản để so sánh');
    }
    const listingIds = items.map(item => item.id);
    return createComparisonMutation.mutateAsync(listingIds);
  };

  return {
    items,
    count: items.length,
    isInComparison,
    addItem: handleAddItem,
    removeItem: handleRemoveItem,
    clearAll: handleClearAll,
    submitComparison,
    isSubmitting: createComparisonMutation.isPending,
    submissionError: createComparisonMutation.error,
    comparisonResult: createComparisonMutation.data,
  };
}
