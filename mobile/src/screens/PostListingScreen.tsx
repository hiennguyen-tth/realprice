import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {usePostListing} from '../hooks/usePostListing';
import StepLocation from '../components/postListing/StepLocation';
import StepDetails from '../components/postListing/StepDetails';
import StepImages from '../components/postListing/StepImages';
import StepPreview from '../components/postListing/StepPreview';
import type {PostStep} from '../hooks/usePostListing';

const STEPS: {step: PostStep; label: string}[] = [
  {step: 1, label: 'Vị trí'},
  {step: 2, label: 'Chi tiết'},
  {step: 3, label: 'Ảnh'},
  {step: 4, label: 'Xem trước'},
];

function canAdvance(step: PostStep, formData: ReturnType<typeof usePostListing>['formData']): boolean {
  switch (step) {
    case 1:
      return !!formData.coordinates && !!formData.address;
    case 2:
      return (
        !!formData.title &&
        formData.title.length >= 10 &&
        !!formData.area &&
        formData.area > 0 &&
        !!formData.price &&
        formData.price > 0 &&
        !!formData.description &&
        formData.description.length >= 30
      );
    case 3:
      return formData.imageUris.length > 0;
    case 4:
      return !!formData.contactPhone;
    default:
      return false;
  }
}

export default function PostListingScreen(): React.JSX.Element {
  const {
    currentStep,
    formData,
    isUploading,
    isSubmitting,
    updateFormData,
    nextStep,
    prevStep,
    uploadImages,
    submitListing,
  } = usePostListing();

  const canGoNext = canAdvance(currentStep, formData);

  const handleNext = async () => {
    if (currentStep === 3 && formData.imageUris.length > 0) {
      // Upload images before proceeding to preview
      const unuploaded = formData.imageUris.filter(
        (_, i) => !formData.imageIds[i],
      );
      if (unuploaded.length > 0) {
        const newIds = await uploadImages(unuploaded);
        updateFormData({imageIds: [...formData.imageIds, ...newIds]});
      }
    }
    nextStep();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Step progress indicator */}
        <View style={styles.progressBar}>
          {STEPS.map(({step, label}) => (
            <View key={step} style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  currentStep === step && styles.stepCircleActive,
                  currentStep > step && styles.stepCircleDone,
                ]}>
                {currentStep > step ? (
                  <Text style={styles.stepCheckmark}>✓</Text>
                ) : (
                  <Text
                    style={[
                      styles.stepNumber,
                      currentStep === step && styles.stepNumberActive,
                    ]}>
                    {step}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  currentStep === step && styles.stepLabelActive,
                ]}>
                {label}
              </Text>
              {step < STEPS.length && (
                <View
                  style={[
                    styles.stepLine,
                    currentStep > step && styles.stepLineDone,
                  ]}
                />
              )}
            </View>
          ))}
        </View>

        {/* Step content */}
        <View style={styles.stepContent}>
          {currentStep === 1 && (
            <StepLocation formData={formData} onUpdate={updateFormData} />
          )}
          {currentStep === 2 && (
            <StepDetails formData={formData} onUpdate={updateFormData} />
          )}
          {currentStep === 3 && (
            <StepImages
              formData={formData}
              onUpdate={updateFormData}
              isUploading={isUploading}
            />
          )}
          {currentStep === 4 && (
            <StepPreview
              formData={formData}
              onUpdate={updateFormData}
              onSubmit={submitListing}
              isSubmitting={isSubmitting}
            />
          )}
        </View>

        {/* Navigation buttons */}
        {currentStep < 4 && (
          <View style={styles.navBar}>
            {currentStep > 1 && (
              <TouchableOpacity style={styles.backBtn} onPress={prevStep}>
                <Text style={styles.backBtnText}>← Quay lại</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.nextBtn,
                !canGoNext && styles.nextBtnDisabled,
                currentStep === 1 && styles.nextBtnFull,
              ]}
              onPress={handleNext}
              disabled={!canGoNext || isUploading}>
              <Text style={styles.nextBtnText}>
                {isUploading
                  ? 'Đang tải ảnh...'
                  : currentStep === 3
                  ? 'Tải ảnh & Tiếp theo →'
                  : 'Tiếp theo →'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
  },
  progressBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    zIndex: 1,
  },
  stepCircleActive: {
    borderColor: '#F97316',
    backgroundColor: '#FFF7ED',
  },
  stepCircleDone: {
    borderColor: '#16A34A',
    backgroundColor: '#16A34A',
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  stepNumberActive: {
    color: '#F97316',
  },
  stepCheckmark: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  stepLabelActive: {
    color: '#F97316',
    fontWeight: '600',
  },
  stepLine: {
    position: 'absolute',
    top: 13,
    left: '60%',
    right: '-40%',
    height: 2,
    backgroundColor: '#E5E7EB',
    zIndex: 0,
  },
  stepLineDone: {
    backgroundColor: '#16A34A',
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  navBar: {
    flexDirection: 'row',
    gap: 8,
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  nextBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#F97316',
    alignItems: 'center',
  },
  nextBtnFull: {
    flex: 1,
  },
  nextBtnDisabled: {
    backgroundColor: '#E5E7EB',
  },
  nextBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
