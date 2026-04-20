import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
} from 'react-native';
import {
  launchImageLibrary,
  type ImagePickerResponse,
} from 'react-native-image-picker';
import type {PostFormData} from '../../hooks/usePostListing';

interface StepImagesProps {
  formData: PostFormData;
  onUpdate: (updates: Partial<PostFormData>) => void;
  isUploading: boolean;
}

const MAX_IMAGES = 10;

export default function StepImages({
  formData,
  onUpdate,
  isUploading,
}: StepImagesProps): React.JSX.Element {
  const imageUris = formData.imageUris;

  const handlePickImages = async () => {
    if (imageUris.length >= MAX_IMAGES) {
      Alert.alert('Giới hạn ảnh', `Bạn chỉ có thể tải lên tối đa ${MAX_IMAGES} ảnh.`);
      return;
    }

    const result: ImagePickerResponse = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: MAX_IMAGES - imageUris.length,
      quality: 0.8,
    });

    if (result.didCancel || !result.assets) return;

    const newUris = result.assets
      .map(a => a.uri)
      .filter((uri): uri is string => !!uri);

    onUpdate({
      imageUris: [...imageUris, ...newUris],
    });
  };

  const handleRemoveImage = (index: number) => {
    const newUris = imageUris.filter((_, i) => i !== index);
    onUpdate({imageUris: newUris});
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: string;
    index: number;
  }) => {
    const progress = formData.uploadProgress[item];
    const isUploaded = formData.imageIds[index] !== undefined;

    return (
      <View style={styles.imageItem}>
        <Image source={{uri: item}} style={styles.image} />

        {/* Upload overlay */}
        {isUploading && !isUploaded && (
          <View style={styles.uploadOverlay}>
            {progress !== undefined ? (
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {width: `${progress}%`},
                  ]}
                />
              </View>
            ) : (
              <ActivityIndicator color="#FFFFFF" size="small" />
            )}
          </View>
        )}

        {/* Uploaded checkmark */}
        {isUploaded && (
          <View style={styles.uploadedBadge}>
            <Text style={styles.uploadedCheck}>✓</Text>
          </View>
        )}

        {/* Remove button */}
        {!isUploading && (
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => handleRemoveImage(index)}>
            <Text style={styles.removeBtnText}>✕</Text>
          </TouchableOpacity>
        )}

        {/* First image label */}
        {index === 0 && (
          <View style={styles.mainBadge}>
            <Text style={styles.mainBadgeText}>Ảnh chính</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ảnh bất động sản</Text>
        <Text style={styles.subtitle}>
          {imageUris.length}/{MAX_IMAGES} ảnh
        </Text>
      </View>

      <Text style={styles.tip}>
        💡 Ảnh chất lượng cao giúp tin đăng thu hút hơn. Ảnh đầu tiên sẽ là
        ảnh đại diện.
      </Text>

      <FlatList
        data={imageUris}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item}-${index}`}
        numColumns={3}
        scrollEnabled={false}
        columnWrapperStyle={styles.columnWrapper}
        style={styles.list}
        ListFooterComponent={
          imageUris.length < MAX_IMAGES ? (
            <TouchableOpacity
              style={styles.addButton}
              onPress={handlePickImages}
              disabled={isUploading}>
              <Text style={styles.addButtonIcon}>+</Text>
              <Text style={styles.addButtonText}>Thêm ảnh</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      {imageUris.length === 0 && (
        <TouchableOpacity
          style={styles.emptyState}
          onPress={handlePickImages}>
          <Text style={styles.emptyIcon}>📷</Text>
          <Text style={styles.emptyTitle}>Chưa có ảnh nào</Text>
          <Text style={styles.emptySubtitle}>
            Nhấn để chọn ảnh từ thư viện
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  tip: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    lineHeight: 18,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  list: {
    flex: 1,
  },
  columnWrapper: {
    gap: 6,
    marginBottom: 6,
  },
  imageItem: {
    flex: 1,
    aspectRatio: 1,
    position: 'relative',
    maxWidth: '33%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  progressBar: {
    width: '80%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F97316',
    borderRadius: 2,
  },
  uploadedBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadedCheck: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  mainBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: '#F97316',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mainBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  addButton: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: '33%',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    marginBottom: 6,
  },
  addButtonIcon: {
    fontSize: 28,
    color: '#D1D5DB',
    fontWeight: '300',
  },
  addButtonText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 12,
    marginTop: 8,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
  },
});
