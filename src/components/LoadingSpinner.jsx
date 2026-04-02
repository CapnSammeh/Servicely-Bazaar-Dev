export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-4',
  }
  return (
    <div
      className={`inline-block animate-spin rounded-full border-blue-500 border-t-transparent ${sizes[size]} ${className}`}
      role="status"
      aria-label="Loading"
    />
  )
}
