interface LoadingSkeletonProps {
  className?: string
}

export default function LoadingSkeleton({ className = "" }: LoadingSkeletonProps) {
  return (
    <div 
      className={`bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600 animate-pulse rounded ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

export function IconSkeleton({ className = "" }: LoadingSkeletonProps) {
  return (
    <div className={`relative aspect-square rounded-lg bg-slate-700 animate-pulse ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600 animate-pulse rounded-lg" />
      <div className="absolute bottom-2 left-0 right-0 h-3 bg-slate-600 rounded mx-2 animate-pulse" />
    </div>
  )
}
