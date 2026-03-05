const sizes = {
  xs: 'w-7 h-7 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
};

const bgColors = [
  'bg-violet-600', 'bg-brand-600', 'bg-emerald-600',
  'bg-rose-600', 'bg-amber-600', 'bg-cyan-600', 'bg-pink-600',
];

function getColor(name) {
  if (!name) return bgColors[0];
  return bgColors[name.charCodeAt(0) % bgColors.length];
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({ src, name, size = 'md', className = '' }) {
  const sizeClass = sizes[size] || sizes.md;
  const initials = getInitials(name);
  const color = getColor(name);

  // Always show initials — no broken image risk
  // Only show image if src is a valid non-empty URL
  const hasValidSrc = src && src.startsWith('http');

  if (hasValidSrc) {
    return (
      <div className={`${sizeClass} rounded-full flex-shrink-0 relative ${className}`}>
        <img
          src={src}
          alt={name || 'User'}
          className={`${sizeClass} rounded-full object-cover ring-2 ring-white/10 absolute inset-0`}
          onError={(e) => {
            // If image fails to load, hide it — initials div shows behind
            e.target.style.display = 'none';
          }}
        />
        {/* Initials shown behind as fallback */}
        <div className={`${sizeClass} ${color} rounded-full flex items-center justify-center font-bold text-white`}>
          {initials}
        </div>
      </div>
    );
  }

  return (
    <div className={`${sizeClass} ${color} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 ${className}`}>
      {initials}
    </div>
  );
}