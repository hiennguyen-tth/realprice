import { clsx } from "clsx";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "rect" | "circle";
}

export function Skeleton({ className, variant = "rect" }: SkeletonProps) {
  return (
    <div
      className={clsx(
        "animate-pulse bg-gray-200",
        variant === "circle" && "rounded-full",
        variant === "text" && "rounded h-4",
        variant === "rect" && "rounded-lg",
        className
      )}
    />
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-border shadow-card">
      <Skeleton className="h-48 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton variant="text" className="w-3/4" />
        <Skeleton variant="text" className="w-1/2 h-5" />
        <Skeleton variant="text" className="w-full" />
        <div className="flex gap-2">
          <Skeleton variant="text" className="w-16 h-6 rounded-full" />
          <Skeleton variant="text" className="w-16 h-6 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function LandDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-card space-y-4">
        <Skeleton variant="text" className="w-2/3 h-7" />
        <Skeleton variant="text" className="w-1/2 h-10" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton variant="text" className="w-full h-4" />
              <Skeleton variant="text" className="w-2/3 h-6" />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-card">
        <Skeleton className="w-full h-48" />
      </div>
    </div>
  );
}

export function MapSkeleton() {
  return (
    <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center">
      <div className="text-gray-400 text-sm">Đang tải bản đồ...</div>
    </div>
  );
}
