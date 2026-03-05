export function LoadingSpinner({ size = 'md' }) {
  const s = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }[size];
  return <div className={`${s} border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin`} />;
}
export function PageLoader() {
  return <div className="flex items-center justify-center h-64"><LoadingSpinner size="md" /></div>;
}