import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';

interface ClusterBubbleProps {
  pointCount: number;
  onPress: () => void;
}

/**
 * A circular marker that represents a cluster of nearby land parcels.
 * Size scales with the number of points inside.
 */
export default function ClusterBubble({
  pointCount,
  onPress,
}: ClusterBubbleProps): React.JSX.Element {
  const size = getClusterSize(pointCount);
  const {bg, border} = getClusterColors(pointCount);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.cluster,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          borderColor: border,
        },
      ]}>
      <Text style={styles.countText}>{formatCount(pointCount)}</Text>
    </TouchableOpacity>
  );
}

function getClusterSize(count: number): number {
  if (count < 10) return 40;
  if (count < 50) return 50;
  if (count < 100) return 60;
  return 70;
}

function getClusterColors(count: number): {bg: string; border: string} {
  if (count < 10) return {bg: 'rgba(249,115,22,0.15)', border: '#F97316'};
  if (count < 50) return {bg: 'rgba(249,115,22,0.25)', border: '#EA580C'};
  if (count < 100) return {bg: 'rgba(249,115,22,0.4)', border: '#C2410C'};
  return {bg: 'rgba(249,115,22,0.6)', border: '#9A3412'};
}

function formatCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
}

const styles = StyleSheet.create({
  cluster: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  countText: {
    color: '#7C2D12',
    fontWeight: '700',
    fontSize: 13,
  },
});
