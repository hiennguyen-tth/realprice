import React, {useState, useRef} from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import type {PostFormData} from '../../hooks/usePostListing';
import type {LandCoordinates} from '../../types';

MapboxGL.setAccessToken(
  'YOUR_MAPBOX_TOKEN', // Replace with actual Mapbox token
);

interface StepLocationProps {
  formData: PostFormData;
  onUpdate: (updates: Partial<PostFormData>) => void;
}

const VIETNAM_CENTER: [number, number] = [106.7009, 10.7769];

export default function StepLocation({
  formData,
  onUpdate,
}: StepLocationProps): React.JSX.Element {
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const [pinCoordinates, setPinCoordinates] = useState<[number, number]>(
    formData.coordinates
      ? [formData.coordinates.longitude, formData.coordinates.latitude]
      : VIETNAM_CENTER,
  );
  const [addressInput, setAddressInput] = useState(formData.address);

  const handleMapPress = (feature: GeoJSON.Feature<GeoJSON.Point>) => {
    const coords = feature.geometry.coordinates as [number, number];
    setPinCoordinates(coords);
    const landCoords: LandCoordinates = {
      latitude: coords[1],
      longitude: coords[0],
    };
    onUpdate({coordinates: landCoords});
  };

  const handleAddressSearch = () => {
    onUpdate({address: addressInput});
    // In a real app, you'd call a geocoding API here
  };

  const handlePinDrag = (feature: GeoJSON.Feature<GeoJSON.Point>) => {
    const coords = feature.geometry.coordinates as [number, number];
    setPinCoordinates(coords);
    onUpdate({
      coordinates: {
        latitude: coords[1],
        longitude: coords[0],
      },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>
        Nhấn vào bản đồ hoặc kéo ghim để chọn vị trí bất động sản
      </Text>

      {/* Address search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={addressInput}
          onChangeText={setAddressInput}
          placeholder="Nhập địa chỉ..."
          placeholderTextColor="#9CA3AF"
          returnKeyType="search"
          onSubmitEditing={handleAddressSearch}
        />
        <TouchableOpacity
          style={styles.searchBtn}
          onPress={handleAddressSearch}>
          <Text style={styles.searchBtnText}>Tìm</Text>
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={styles.mapWrapper}>
        <MapboxGL.MapView
          style={styles.map}
          styleURL={MapboxGL.StyleURL.Street}
          onPress={handleMapPress}>
          <MapboxGL.Camera
            ref={cameraRef}
            zoomLevel={14}
            centerCoordinate={pinCoordinates}
            animationMode="flyTo"
            animationDuration={600}
          />

          {/* Draggable pin */}
          <MapboxGL.PointAnnotation
            id="location-pin"
            coordinate={pinCoordinates}
            draggable
            onDragEnd={handlePinDrag}>
            <View style={styles.pin}>
              <Text style={styles.pinEmoji}>📍</Text>
            </View>
          </MapboxGL.PointAnnotation>
        </MapboxGL.MapView>
      </View>

      {/* Address fields */}
      {formData.coordinates && (
        <View style={styles.addressFields}>
          <Text style={styles.coordText}>
            📍 {formData.coordinates.latitude.toFixed(6)},{' '}
            {formData.coordinates.longitude.toFixed(6)}
          </Text>

          <View style={styles.fieldRow}>
            <View style={styles.fieldHalf}>
              <Text style={styles.fieldLabel}>Phường/Xã</Text>
              <TextInput
                style={styles.fieldInput}
                value={formData.ward}
                onChangeText={val => onUpdate({ward: val})}
                placeholder="Phường/Xã"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View style={styles.fieldHalf}>
              <Text style={styles.fieldLabel}>Quận/Huyện</Text>
              <TextInput
                style={styles.fieldInput}
                value={formData.district}
                onChangeText={val => onUpdate({district: val})}
                placeholder="Quận/Huyện"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Thành phố</Text>
            <TextInput
              style={styles.fieldInput}
              value={formData.city}
              onChangeText={val => onUpdate({city: val})}
              placeholder="Thành phố"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Địa chỉ chi tiết</Text>
            <TextInput
              style={styles.fieldInput}
              value={formData.address}
              onChangeText={val => onUpdate({address: val})}
              placeholder="Số nhà, tên đường..."
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  instruction: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 18,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  searchBtn: {
    paddingHorizontal: 16,
    height: 44,
    backgroundColor: '#F97316',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  mapWrapper: {
    height: 280,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  map: {
    flex: 1,
  },
  pin: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinEmoji: {
    fontSize: 32,
  },
  addressFields: {
    gap: 10,
  },
  coordText: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 8,
  },
  fieldHalf: {
    flex: 1,
  },
  field: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  fieldInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
});
