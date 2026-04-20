import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import {formatShortPrice} from '../../utils/formatPrice';

interface PriceBubbleProps {
  minPrice: number;
  totalListings: number;
  hasBoosted: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export default function PriceBubble({
  minPrice,
  totalListings,
  hasBoosted,
  onPress,
  style,
}: PriceBubbleProps): React.JSX.Element {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.bubble,
        hasBoosted ? styles.bubbleBoosted : styles.bubbleNormal,
        style,
      ]}>
      <Text
        style={[
          styles.priceText,
          hasBoosted ? styles.priceTextBoosted : styles.priceTextNormal,
        ]}>
        {formatShortPrice(minPrice)}
      </Text>
      {totalListings > 1 && (
        <View
          style={[
            styles.badge,
            hasBoosted ? styles.badgeBoosted : styles.badgeNormal,
          ]}>
          <Text
            style={[
              styles.badgeText,
              hasBoosted ? styles.badgeTextBoosted : styles.badgeTextNormal,
            ]}>
            {totalListings}
          </Text>
        </View>
      )}
      {/* Pointer triangle */}
      <View
        style={[
          styles.pointer,
          hasBoosted ? styles.pointerBoosted : styles.pointerNormal,
        ]}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bubble: {
    minWidth: 60,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    position: 'relative',
  },
  bubbleNormal: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#F97316',
  },
  bubbleBoosted: {
    backgroundColor: '#F97316',
    borderWidth: 0,
  },
  priceText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  priceTextNormal: {
    color: '#F97316',
  },
  priceTextBoosted: {
    color: '#FFFFFF',
  },
  badge: {
    position: 'absolute',
    top: -7,
    right: -7,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeNormal: {
    backgroundColor: '#F97316',
  },
  badgeBoosted: {
    backgroundColor: '#FFFFFF',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  badgeTextNormal: {
    color: '#FFFFFF',
  },
  badgeTextBoosted: {
    color: '#F97316',
  },
  pointer: {
    position: 'absolute',
    bottom: -7,
    left: '50%',
    marginLeft: -5,
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  pointerNormal: {
    borderTopColor: '#F97316',
  },
  pointerBoosted: {
    borderTopColor: '#F97316',
  },
});
