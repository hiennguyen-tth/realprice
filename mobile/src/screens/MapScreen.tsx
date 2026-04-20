import React, {useCallback, useRef, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import {useMapStore} from '../store/mapStore';
import {useMapData} from '../hooks/useMapData';
import {useQuery} from '@tanstack/react-query';
import {getLandById} from '../api/lands';
import {clusterMarkers, isCluster} from '../utils/clustering';
import {mapboxBoundsToBbox} from '../utils/geoUtils';
import PriceBubble from '../components/map/PriceBubble';
import ClusterBubble from '../components/map/ClusterBubble';
import HeatmapLayer from '../components/map/HeatmapLayer';
import MapModeToggle from '../components/map/MapModeToggle';
import ListingBottomSheet from '../components/listing/ListingBottomSheet';
import CompareTray from '../components/listing/CompareTray';
import type {LandMarker, MapMode, MapRegion} from '../types';

MapboxGL.setAccessToken('YOUR_MAPBOX_TOKEN');

// ── Category definitions ───────────────────────────────────────────────────

type CategoryValue = 'dat_nen' | 'nha_pho' | 'chung_cu' | 'biet_thu' | 'van_phong' | '';

const CATEGORIES: {value: CategoryValue; label: string; icon: string}[] = [
  {value: '', label: 'Tất cả', icon: '🏘️'},
  {value: 'dat_nen', label: 'Đất nền', icon: '🌿'},
  {value: 'nha_pho', label: 'Nhà phố', icon: '🏠'},
  {value: 'chung_cu', label: 'Chung cư', icon: '🏢'},
  {value: 'biet_thu', label: 'Biệt thự', icon: '🏰'},
  {value: 'van_phong', label: 'Văn phòng', icon: '🏬'},
];

// ── Price formatting ────────────────────────────────────────────────────────

function formatPriceShort(pricePerM2: number): string {
  if (pricePerM2 >= 1_000_000_000) {
    return `${(pricePerM2 / 1_000_000_000).toFixed(1)} tỷ/m²`;
  }
  if (pricePerM2 >= 1_000_000) {
    return `${Math.round(pricePerM2 / 1_000_000)} tr/m²`;
  }
  return `${Math.round(pricePerM2 / 1000)}k/m²`;
}

// ── Listing card ───────────────────────────────────────────────────────────

const BG_COLORS = ['#FED7AA', '#BAE6FD', '#BBF7D0', '#DDD6FE', '#FEF08A'];

function MarkerCard({
  marker,
  isSelected,
  onPress,
}: {
  marker: LandMarker;
  isSelected: boolean;
  onPress: () => void;
}) {
  const bgColor = BG_COLORS[marker.id.charCodeAt(0) % BG_COLORS.length] ?? '#FED7AA';
  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={onPress}
      activeOpacity={0.85}>
      {/* Thumbnail */}
      <View style={[styles.cardThumb, {backgroundColor: bgColor}]}>
        <Text style={styles.cardThumbIcon}>🏘️</Text>
        <View style={styles.cardPriceBadge}>
          <Text style={styles.cardPriceBadgeText}>
            {formatPriceShort(marker.pricePerM2)}
          </Text>
        </View>
        {marker.totalListings > 1 && (
          <View style={styles.cardCountBadge}>
            <Text style={styles.cardCountBadgeText}>{marker.totalListings}</Text>
          </View>
        )}
      </View>
      {/* Info */}
      <View style={styles.cardInfo}>
        <Text style={styles.cardAddress} numberOfLines={2}>
          {marker.address}
        </Text>
        <Text style={styles.cardDistrict}>{marker.district}</Text>
        <Text style={styles.cardPrice}>{formatPriceShort(marker.pricePerM2)}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────

export default function MapScreen(): React.JSX.Element {
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const {viewport, mapMode, setViewport, setMapMode, selectedLandId, setSelectedLandId} =
    useMapStore();

  const {markers, heatAreas, loading, fetchData} = useMapData(mapMode);
  const [currentRegion, setCurrentRegion] = useState<MapRegion>({
    latitude: viewport.latitude,
    longitude: viewport.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
    zoom: viewport.zoom,
  });
  const [activeCategory, setActiveCategory] = useState<CategoryValue>('');

  const {data: selectedLand} = useQuery({
    queryKey: ['land', selectedLandId],
    queryFn: () => getLandById(selectedLandId!),
    enabled: !!selectedLandId,
    staleTime: 1000 * 60 * 5,
  });

  const handleRegionChange = useCallback(
    async (
      feature: GeoJSON.Feature<GeoJSON.Point> & {
        properties: {visibleBounds: number[][]; zoomLevel: number};
      },
    ) => {
      const {properties} = feature;
      const bounds = properties.visibleBounds;
      const zoom = properties.zoomLevel;
      const center = feature.geometry.coordinates;

      const newRegion: MapRegion = {
        latitude: center[1] ?? 10.7769,
        longitude: center[0] ?? 106.7009,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
        zoom,
      };

      setCurrentRegion(newRegion);
      setViewport({latitude: newRegion.latitude, longitude: newRegion.longitude, zoom});

      if (bounds && bounds.length >= 2) {
        const bbox = mapboxBoundsToBbox([
          bounds[0]?.[0] ?? 0,
          bounds[1]?.[1] ?? 0,
          bounds[1]?.[0] ?? 0,
          bounds[0]?.[1] ?? 0,
        ]);
        fetchData({
          ...newRegion,
          latitudeDelta: bbox.north - bbox.south,
          longitudeDelta: bbox.east - bbox.west,
        });
      } else {
        fetchData(newRegion);
      }
    },
    [fetchData, setViewport],
  );

  const handleModeChange = (mode: MapMode) => {
    setMapMode(mode);
    fetchData(currentRegion);
  };

  const handleMarkerPress = (landId: string) => setSelectedLandId(landId);

  const handleClusterPress = (clusterId: number, coordinates: [number, number]) => {
    cameraRef.current?.flyTo(coordinates, 500);
    cameraRef.current?.zoomTo(Math.min(viewport.zoom + 2, 18), 500);
  };

  const clustered =
    mapMode === 'marker' && markers.length > 0
      ? clusterMarkers(markers, currentRegion.zoom, {
          west: currentRegion.longitude - currentRegion.longitudeDelta / 2,
          south: currentRegion.latitude - currentRegion.latitudeDelta / 2,
          east: currentRegion.longitude + currentRegion.longitudeDelta / 2,
          north: currentRegion.latitude + currentRegion.latitudeDelta / 2,
        })
      : [];

  // Filter + sort markers (cheapest first)
  const filteredMarkers = [...markers]
    .filter(m => !activeCategory || (m as any).listingType === activeCategory)
    .sort((a, b) => a.pricePerM2 - b.pricePerM2);

  return (
    <View style={styles.container}>
      {/* ── MAP ───────────────────────────────────────────────────── */}
      <View style={styles.mapContainer}>
        <MapboxGL.MapView
          style={styles.map}
          styleURL={MapboxGL.StyleURL.Street}
          onRegionDidChange={handleRegionChange}
          compassEnabled
          logoEnabled={false}
          attributionEnabled={false}>
          <MapboxGL.Camera
            ref={cameraRef}
            zoomLevel={viewport.zoom}
            centerCoordinate={[viewport.longitude, viewport.latitude]}
            animationMode="flyTo"
            animationDuration={0}
          />

          {mapMode === 'heatmap' && <HeatmapLayer areas={heatAreas} />}

          {mapMode === 'marker' &&
            clustered.map(item => {
              const [lng, lat] = item.geometry.coordinates;
              const coordPair: [number, number] = [lng ?? 0, lat ?? 0];

              if (isCluster(item)) {
                return (
                  <MapboxGL.PointAnnotation
                    key={`cluster-${item.id}`}
                    id={`cluster-${item.id}`}
                    coordinate={coordPair}>
                    <ClusterBubble
                      pointCount={item.properties.point_count}
                      onPress={() =>
                        handleClusterPress(
                          typeof item.id === 'number' ? item.id : 0,
                          coordPair,
                        )
                      }
                    />
                  </MapboxGL.PointAnnotation>
                );
              }

              return (
                <MapboxGL.PointAnnotation
                  key={`land-${item.properties.landId}`}
                  id={`land-${item.properties.landId}`}
                  coordinate={coordPair}>
                  <PriceBubble
                    minPrice={item.properties.minPrice}
                    totalListings={item.properties.totalListings}
                    hasBoosted={item.properties.hasBoosted}
                    onPress={() => handleMarkerPress(item.properties.landId)}
                  />
                </MapboxGL.PointAnnotation>
              );
            })}
        </MapboxGL.MapView>

        {/* Top controls */}
        <View style={styles.topControls}>
          <MapModeToggle mode={mapMode} onModeChange={handleModeChange} />
        </View>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color="#F97316" size="small" />
          </View>
        )}
      </View>

      {/* ── BOTTOM PANEL ──────────────────────────────────────────── */}
      <View style={styles.bottomPanel}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Count */}
        <View style={styles.countRow}>
          <Text style={styles.countText}>
            {filteredMarkers.length > 0
              ? `${filteredMarkers.length} vị trí · Giá thấp nhất trước`
              : 'Di chuyển bản đồ để xem'}
          </Text>
        </View>

        {/* Category scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryScrollContent}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.value}
              style={styles.categoryItem}
              onPress={() => setActiveCategory(cat.value)}
              activeOpacity={0.75}>
              <View
                style={[
                  styles.categoryIcon,
                  activeCategory === cat.value && styles.categoryIconActive,
                ]}>
                <Text style={styles.categoryEmoji}>{cat.icon}</Text>
              </View>
              <Text
                style={[
                  styles.categoryLabel,
                  activeCategory === cat.value && styles.categoryLabelActive,
                ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Listing cards */}
        <FlatList
          data={filteredMarkers}
          keyExtractor={m => m.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardListContent}
          ListEmptyComponent={
            <View style={styles.emptyList}>
              <Text style={styles.emptyText}>Không có kết quả</Text>
            </View>
          }
          renderItem={({item}) => (
            <MarkerCard
              marker={item}
              isSelected={selectedLandId === item.id}
              onPress={() => handleMarkerPress(item.id)}
            />
          )}
        />

        {/* Compare tray */}
        <CompareTray />
      </View>

      {/* Land detail bottom sheet overlay */}
      {selectedLandId && (
        <ListingBottomSheet
          land={selectedLand ?? null}
          onClose={() => setSelectedLandId(null)}
        />
      )}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9FAFB'},
  mapContainer: {flex: 1, minHeight: 260},
  map: {flex: 1},
  topControls: {
    position: 'absolute',
    top: 56,
    alignSelf: 'center',
    zIndex: 10,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 110,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Bottom panel
  bottomPanel: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -3},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  countRow: {paddingHorizontal: 16, paddingBottom: 4},
  countText: {fontSize: 12, fontWeight: '600', color: '#374151'},

  // Categories
  categoryScroll: {borderBottomWidth: 1, borderBottomColor: '#F3F4F6'},
  categoryScrollContent: {paddingHorizontal: 12, paddingVertical: 8, gap: 8},
  categoryItem: {alignItems: 'center', gap: 4, minWidth: 60},
  categoryIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconActive: {
    backgroundColor: '#FFF7ED',
    borderWidth: 2,
    borderColor: '#F97316',
  },
  categoryEmoji: {fontSize: 24},
  categoryLabel: {fontSize: 11, fontWeight: '500', color: '#6B7280'},
  categoryLabelActive: {color: '#F97316', fontWeight: '700'},

  // Card list
  cardListContent: {paddingHorizontal: 12, paddingVertical: 12, gap: 10},

  // Card
  card: {
    width: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardSelected: {borderColor: '#F97316', borderWidth: 2},
  cardThumb: {
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cardThumbIcon: {fontSize: 32},
  cardPriceBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cardPriceBadgeText: {fontSize: 11, fontWeight: '700', color: '#F97316'},
  cardCountBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cardCountBadgeText: {fontSize: 10, fontWeight: '600', color: '#FFFFFF'},
  cardInfo: {padding: 10},
  cardAddress: {fontSize: 12, fontWeight: '600', color: '#111827', lineHeight: 16},
  cardDistrict: {fontSize: 11, color: '#6B7280', marginTop: 2},
  cardPrice: {fontSize: 13, fontWeight: '700', color: '#F97316', marginTop: 6},

  // Empty
  emptyList: {
    width: 240,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {fontSize: 13, color: '#9CA3AF'},
});
