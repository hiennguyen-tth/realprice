"use client";

import { clsx } from "clsx";
import { usePostListing, type PostListingStep } from "@/hooks/usePostListing";
import { StepLocation } from "./StepLocation";
import { StepDetails } from "./StepDetails";
import { StepImages } from "./StepImages";
import { StepPreview } from "./StepPreview";

const STEPS: Array<{ step: PostListingStep; label: string; icon: string }> = [
  { step: 1, label: "Vị trí", icon: "📍" },
  { step: 2, label: "Chi tiết", icon: "📝" },
  { step: 3, label: "Hình ảnh", icon: "🖼️" },
  { step: 4, label: "Đăng tin", icon: "✅" },
];

export function PostListingWizard() {
  const {
    step,
    formData,
    updateForm,
    goToStep,
    nextStep,
    prevStep,
    submitListing,
    isSubmitting,
    uploadProgress,
  } = usePostListing();

  return (
    <div className="min-h-screen bg-surface-secondary">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar steps */}
          <aside className="lg:w-56 shrink-0">
            <div className="bg-white rounded-2xl shadow-card border border-border p-4">
              <h2 className="text-sm font-bold text-gray-900 mb-4 px-1">Đăng tin bán</h2>
              <nav className="space-y-1">
                {STEPS.map(({ step: s, label, icon }) => (
                  <button
                    key={s}
                    onClick={() => s < step && goToStep(s)}
                    className={clsx(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left",
                      step === s
                        ? "bg-primary text-white font-semibold"
                        : s < step
                        ? "text-gray-700 hover:bg-gray-100 cursor-pointer"
                        : "text-gray-400 cursor-not-allowed"
                    )}
                    disabled={s > step}
                  >
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0">
                      {s < step ? (
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className={clsx(
                          "font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center",
                          step === s ? "bg-white text-primary" : "bg-gray-100 text-gray-500"
                        )}>
                          {s}
                        </span>
                      )}
                    </span>
                    <span>{icon} {label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 bg-white rounded-2xl shadow-card border border-border p-6 lg:p-8">
            {/* Progress bar (mobile) */}
            <div className="lg:hidden mb-6">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Bước {step}/4</span>
                <span>{STEPS[step - 1].label}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all"
                  style={{ width: `${(step / 4) * 100}%` }}
                />
              </div>
            </div>

            {step === 1 && (
              <StepLocation
                formData={formData}
                updateForm={updateForm}
                onNext={nextStep}
              />
            )}
            {step === 2 && (
              <StepDetails
                formData={formData}
                updateForm={updateForm}
                onNext={nextStep}
                onPrev={prevStep}
              />
            )}
            {step === 3 && (
              <StepImages
                formData={formData}
                updateForm={updateForm}
                onNext={nextStep}
                onPrev={prevStep}
              />
            )}
            {step === 4 && (
              <StepPreview
                formData={formData}
                onPrev={prevStep}
                onSubmit={() => submitListing()}
                isSubmitting={isSubmitting}
                uploadProgress={uploadProgress}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
