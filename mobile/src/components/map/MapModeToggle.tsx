import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import type {MapMode} from '../../types';

interface MapModeToggleProps {
  mode: MapMode;
  onModeChange: (mode: MapMode) => void;
}

export default function MapModeToggle({
  mode,
  onModeChange,
}: MapModeToggleProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.segment, mode === 'marker' && styles.segmentActive]}
        onPress={() => onModeChange('marker')}
        activeOpacity={0.8}>
        <Text
          style={[
            styles.segmentText,
            mode === 'marker' && styles.segmentTextActive,
          ]}>
          📍 Markers
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.segment, mode === 'heatmap' && styles.segmentActive]}
        onPress={() => onModeChange('heatmap')}
        activeOpacity={0.8}>
        <Text
          style={[
            styles.segmentText,
            mode === 'heatmap' && styles.segmentTextActive,
          ]}>
          🔥 Heatmap
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  segment: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 17,
  },
  segmentActive: {
    backgroundColor: '#F97316',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
