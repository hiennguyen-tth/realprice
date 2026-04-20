import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {getScoreColor, getScoreLabel} from '../../utils/scoreUtils';

interface ScoreBadgeProps {
  score: number;
  compact?: boolean;
}

export default function ScoreBadge({
  score,
  compact = false,
}: ScoreBadgeProps): React.JSX.Element {
  const color = getScoreColor(score);
  const label = getScoreLabel(score);

  if (compact) {
    return (
      <View style={[styles.compactBadge, {borderColor: color}]}>
        <Text style={[styles.compactScore, {color}]}>{score}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.score, {color}]}>{score}/100</Text>
      </View>

      {/* Score bar */}
      <View style={styles.barBackground}>
        <View
          style={[
            styles.barFill,
            {
              width: `${score}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>

      {/* Tick marks */}
      <View style={styles.tickRow}>
        <Text style={styles.tickLabel}>0</Text>
        <Text style={styles.tickLabel}>50</Text>
        <Text style={styles.tickLabel}>100</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  score: {
    fontSize: 20,
    fontWeight: '800',
  },
  barBackground: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  tickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  tickLabel: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  compactBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  compactScore: {
    fontSize: 12,
    fontWeight: '800',
  },
});
