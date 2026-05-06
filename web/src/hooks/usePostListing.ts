"use client";

import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createListing, getPresignedUrl } from "@/lib/api";
import type { GeoPoint, ListingType, CreateListingPayload } from "@/types";
import axios from "axios";

export type PostListingStep = 1 | 2 | 3 | 4;

export interface PostListingFormData {
  // Step 1: Location
  address: string;
  district: string;
  location: GeoPoint | null;

  // Step 2: Details
  title: string;
  description: string;
  price: number;
  area: number;
  listingType: ListingType;
  contactName: string;
  contactPhone: string;

  // Step 3: Images
  imageFiles: File[];
  imageUrls: string[];
}

const DEFAULT_FORM: PostListingFormData = {
  address: "",
  district: "",
  location: null,
  title: "",
  description: "",
  price: 0,
  area: 0,
  listingType: "nha_pho",
  contactName: "",
  contactPhone: "",
  imageFiles: [],
  imageUrls: [],
};

export function usePostListing() {
  const router = useRouter();
  const [step, setStep] = useState<PostListingStep>(1);
  const [formData, setFormData] = useState<PostListingFormData>(DEFAULT_FORM);
  const [uploadProgress, setUploadProgress] = useState(0);

  const updateForm = useCallback(
    (updates: Partial<PostListingFormData>) => {
      setFormData((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  const goToStep = useCallback((s: PostListingStep) => setStep(s), []);
  const nextStep = useCallback(
    () => setStep((s) => Math.min(4, s + 1) as PostListingStep),
    []
  );
  const prevStep = useCallback(
    () => setStep((s) => Math.max(1, s - 1) as PostListingStep),
    []
  );

  // Upload images to S3 via presigned URL
  const uploadImages = useCallback(async (files: File[]): Promise<string[]> => {
    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const { url, publicUrl } = await getPresignedUrl(file.name, file.type);
      await axios.put(url, file, {
        headers: { "Content-Type": file.type },
        onUploadProgress: (e) => {
          const percent = Math.round(
            ((i + (e.loaded / (e.total ?? 1))) / files.length) * 100
          );
          setUploadProgress(percent);
        },
      });
      urls.push(publicUrl);
    }
    setUploadProgress(100);
    return urls;
  }, []);

  const { mutate: submitListing, isPending: isSubmitting, error } = useMutation({
    mutationFn: async () => {
      // Upload images first if any local files
      let imageUrls = formData.imageUrls;
      if (formData.imageFiles.length > 0) {
        imageUrls = await uploadImages(formData.imageFiles);
        updateForm({ imageUrls });
      }

      const payload: CreateListingPayload & {
        listingType: string;
        contactName: string;
        contactPhone: string;
        district?: string;
      } = {
        title:        formData.title,
        description:  formData.description,
        price:        formData.price,
        area:         formData.area,
        listingType:  formData.listingType,
        address:      formData.address,
        location:     formData.location ?? undefined,
        contactName:  formData.contactName,
        contactPhone: formData.contactPhone,
        district:     formData.district || undefined,
      };

      return createListing(payload as CreateListingPayload);
    },
    onSuccess: (listing) => {
      const district = listing.land?.district ?? formData.district ?? "";
      if (district) {
        router.push(`/khu-vuc/${encodeURIComponent(district.toLowerCase().replace(/\s+/g, "-"))}`);
      } else {
        router.push("/tai-khoan");
      }
    },
  });

  return {
    step,
    formData,
    updateForm,
    goToStep,
    nextStep,
    prevStep,
    submitListing,
    isSubmitting,
    uploadProgress,
    error,
  };
}
