"use client";

import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useComparisonStore } from "@/store/comparisonStore";
import { createComparison } from "@/lib/api";
import type { Listing } from "@/types";

export function useComparison() {
  const { items, addItem, removeItem, clearAll, isInComparison, isFull } =
    useComparisonStore();
  const router = useRouter();

  const { mutate: startComparison, isPending: isCreatingComparison } =
    useMutation({
      mutationFn: () =>
        createComparison({ listingIds: items.map((i) => i.id) }),
      onSuccess: (comparison) => {
        router.push(`/so-sanh/${comparison.id}`);
      },
    });

  const toggle = useCallback(
    (listing: Listing) => {
      if (isInComparison(listing.id)) {
        removeItem(listing.id);
      } else if (!isFull) {
        addItem(listing);
      }
    },
    [addItem, removeItem, isInComparison, isFull]
  );

  const canCompare = items.length >= 2;

  return {
    items,
    addItem,
    removeItem,
    clearAll,
    toggle,
    isInComparison,
    isFull,
    canCompare,
    startComparison,
    isCreatingComparison,
  };
}
