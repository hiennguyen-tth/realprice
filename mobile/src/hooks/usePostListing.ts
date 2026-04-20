import {useState, useCallback} from 'react';
import {Alert} from 'react-native';
import {useMutation} from '@tanstack/react-query';
import {createListing, getUploadUrl} from '../api/listings';
import type {CreateListingInput, LandCoordinates, LandType, LegalStatus, ListingType} from '../types';

export type PostStep = 1 | 2 | 3 | 4;

export interface PostFormData {
  // Step 1 — Location
  address: string;
  ward: string;
  district: string;
  city: string;
  coordinates: LandCoordinates | null;

  // Step 2 — Details
  title: string;
  description: string;
  listingType: ListingType;
  landType: LandType;
  area: number | null;
  price: number | null;
  frontage: number | null;
  alleyWidth: number | null;
  floors: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  legalStatus: LegalStatus;

  // Step 3 — Images
  imageUris: string[];
  imageIds: string[];
  uploadProgress: Record<string, number>; // uri → 0-100

  // Step 4 — Preview / Contact
  contactPhone: string;
  isBoosted: boolean;
}

const DEFAULT_FORM_DATA: PostFormData = {
  address: '',
  ward: '',
  district: '',
  city: 'Hồ Chí Minh',
  coordinates: null,
  title: '',
  description: '',
  listingType: 'ban',
  landType: 'nha_pho',
  area: null,
  price: null,
  frontage: null,
  alleyWidth: null,
  floors: null,
  bedrooms: null,
  bathrooms: null,
  legalStatus: 'so_hong',
  imageUris: [],
  imageIds: [],
  uploadProgress: {},
  contactPhone: '',
  isBoosted: false,
};

export function usePostListing() {
  const [currentStep, setCurrentStep] = useState<PostStep>(1);
  const [formData, setFormData] = useState<PostFormData>(DEFAULT_FORM_DATA);
  const [isUploading, setIsUploading] = useState(false);

  const createListingMutation = useMutation({
    mutationFn: (input: CreateListingInput) => createListing(input),
  });

  const updateFormData = useCallback(
    (updates: Partial<PostFormData>) => {
      setFormData(prev => ({...prev, ...updates}));
    },
    [],
  );

  const goToStep = useCallback((step: PostStep) => {
    setCurrentStep(step);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep(prev => Math.min(4, prev + 1) as PostStep);
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(1, prev - 1) as PostStep);
  }, []);

  const uploadImages = useCallback(
    async (imageUris: string[]): Promise<string[]> => {
      setIsUploading(true);
      const uploadedIds: string[] = [];

      try {
        for (const uri of imageUris) {
          // Get presigned URL
          const fileName = `listing-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}.jpg`;
          const {uploadUrl, fileId} = await getUploadUrl(fileName, 'image/jpeg');

          // Upload to S3
          const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {'Content-Type': 'image/jpeg'},
            body: await fetch(uri).then(r => r.blob()),
          });

          if (!uploadResponse.ok) {
            throw new Error(`Failed to upload image: ${uri}`);
          }

          uploadedIds.push(fileId);

          // Update progress
          updateFormData({
            uploadProgress: {
              ...formData.uploadProgress,
              [uri]:
                ((uploadedIds.length / imageUris.length) * 100),
            },
          });
        }
        return uploadedIds;
      } finally {
        setIsUploading(false);
      }
    },
    [formData.uploadProgress, updateFormData],
  );

  const submitListing = useCallback(async () => {
    if (!formData.coordinates || !formData.area || !formData.price) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }

    try {
      // Upload any remaining images
      let imageIds = formData.imageIds;
      const unuploadedUris = formData.imageUris.filter(
        (_, i) => !formData.imageIds[i],
      );

      if (unuploadedUris.length > 0) {
        const newIds = await uploadImages(unuploadedUris);
        imageIds = [...formData.imageIds, ...newIds];
      }

      const input: CreateListingInput = {
        title: formData.title,
        description: formData.description,
        listingType: formData.listingType,
        landType: formData.landType,
        area: formData.area,
        price: formData.price,
        frontage: formData.frontage ?? undefined,
        alleyWidth: formData.alleyWidth ?? undefined,
        floors: formData.floors ?? undefined,
        bedrooms: formData.bedrooms ?? undefined,
        bathrooms: formData.bathrooms ?? undefined,
        legalStatus: formData.legalStatus,
        address: formData.address,
        ward: formData.ward,
        district: formData.district,
        city: formData.city,
        coordinates: formData.coordinates,
        imageIds,
        contactPhone: formData.contactPhone,
        isBoosted: formData.isBoosted,
      };

      return await createListingMutation.mutateAsync(input);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Không thể đăng tin. Thử lại sau.';
      Alert.alert('Lỗi', message);
      throw err;
    }
  }, [formData, uploadImages, createListingMutation]);

  const reset = useCallback(() => {
    setCurrentStep(1);
    setFormData(DEFAULT_FORM_DATA);
  }, []);

  return {
    currentStep,
    formData,
    isUploading,
    isSubmitting: createListingMutation.isPending,
    submittedListing: createListingMutation.data,
    updateFormData,
    goToStep,
    nextStep,
    prevStep,
    uploadImages,
    submitListing,
    reset,
  };
}
