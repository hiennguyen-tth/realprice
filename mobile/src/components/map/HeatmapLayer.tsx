import React, {useState} from 'react';
import {Modal, Pressable, StyleSheet, Text, View} from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import type {HeatmapArea} from '../../types';
import {formatVND, formatPercentChange} from '../../utils/formatPrice';

interface HeatmapLayerProps {
  areas: HeatmapArea[];
}

const HEAT_COLORS: Record<number, string> = {
  1: '#4ADE80', // green
  2: '#A3E635', // lime
  3: '#FACC15', // yellow
  4: '#FB923C', // orange
  5: '#EF4444', // red
};

const HEAT_LABELS: Record<number, string> = {
  1: 'Rất thấp',
  2: 'Thấp',
  3: 'Trung bình',
  4: 'Cao',
  5: 'Rất cao',
};

interface AreaPopupData {
  areaName: string;
  avgPricePerM2: number;
  priceChange1m: number;
  priceChange12m: number;
  totalListings: number;
  heatLevel: number;
}

export default function HeatmapLayer({areas}: HeatmapLayerProps): React.JSX.Element {
  const [selectedArea, setSelectedArea] = useState<AreaPopupData | null>(null);

  const geojsonCollection: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: areas.map(area => area.geoJson),
  };

  const fillColorExpression: MapboxGL.Expression = [
    'match',
    ['get', 'heatLevel'],
    1, HEAT_COLORS[1]!,
    2, HEAT_COLORS[2]!,
    3, HEAT_COLORS[3]!,
    4, HEAT_COLORS[4]!,
    5, HEAT_COLORS[5]!,
    '#CCCCCC',
  ];

  const handlePress = (event: {features?: GeoJSON.Feature[]}) => {
    const feature = event.features?.[0];
    if (!feature?.properties) return;

    const props = feature.properties;
    const area = areas.find(a => a.areaId === props.areaId);
    if (!area) return;

    setSelectedArea({
      areaName: area.areaName,
      avgPricePerM2: area.avgPricePerM2,
      priceChange1m: area.priceChange1m,
      priceChange12m: area.priceChange12m,
      totalListings: area.totalListings,
      heatLevel: area.heatLevel,
    });
  };

  return (
    <>
      {areas.length > 0 && (
        <MapboxGL.ShapeSource
          id="heatmap-source"
          shape={geojsonCollection}
          onPress={handlePress}>
          <MapboxGL.FillLayer
            id="heatmap-fill"
            style={{
              fillColor: fillColorExpression,
              fillOpacity: 0.45,
            }}
          />
          <MapboxGL.LineLayer
            id="heatmap-line"
            style={{
              lineColor: '#FFFFFF',
              lineWidth: 1,
              lineOpacity: 0.6,
            }}
          />
        </MapboxGL.ShapeSource>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        {([1, 2, 3, 4, 5] as const).map(level => (
          <View key={level} style={styles.legendItem}>
            <View
              style={[styles.legendDot, {backgroundColor: HEAT_COLORS[level]}]}
            />
            <Text style={styles.legendText}>{HEAT_LABELS[level]}</Text>
          </View>
        ))}
      </View>

      {/* Area Stats Popup */}
      {selectedArea && (
        <Modal transparent animationType="fade" onRequestClose={() => setSelectedArea(null)}>
          <Pressable style={styles.overlay} onPress={() => setSelectedArea(null)}>
            <View style={styles.popup}>
              <Text style={styles.popupAreaName}>{selectedArea.areaName}</Text>
              <View
                style={[
                  styles.heatBadge,
                  {backgroundColor: HEAT_COLORS[selectedArea.heatLevel]},
                ]}>
                <Text style={styles.heatBadgeText}>
                  {HEAT_LABELS[selectedArea.heatLevel]}
                </Text>
              </View>
              <View style={styles.popupRow}>
                <Text style={styles.popupLabel}>Giá trung bình</Text>
                <Text style={styles.popupValue}>
                  {formatVND(selectedArea.avgPricePerM2)}/m²
                </Text>
              </View>
              <View style={styles.popupRow}>
                <Text style={styles.popupLabel}>Biến động 1 tháng</Text>
                <Text
                  style={[
                    styles.popupValue,
                    {
                      color:
                        selectedArea.priceChange1m >= 0 ? '#16A34A' : '#DC2626',
                    },
                  ]}>
                  {formatPercentChange(selectedArea.priceChange1m)}
                </Text>
              </View>
              <View style={styles.popupRow}>
                <Text style={styles.popupLabel}>Biến động 12 tháng</Text>
                <Text
                  style={[
                    styles.popupValue,
                    {
                      color:
                        selectedArea.priceChange12m >= 0 ? '#16A34A' : '#DC2626',
                    },
                  ]}>
                  {formatPercentChange(selectedArea.priceChange12m)}
                </Text>
              </View>
              <View style={styles.popupRow}>
                <Text style={styles.popupLabel}>Số tin đăng</Text>
                <Text style={styles.popupValue}>{selectedArea.totalListings}</Text>
              </View>
            </View>
          </Pressable>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  legend: {
    position: 'absolute',
    top: 60,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '500',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: 280,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  popupAreaName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  heatBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 12,
  },
  heatBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  popupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  popupLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  popupValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
});
