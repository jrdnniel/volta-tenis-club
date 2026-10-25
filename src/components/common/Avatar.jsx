import { HiUser } from 'react-icons/hi2';

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
  '2xl': 'w-28 h-28 text-3xl',
  '3xl': 'w-32 h-32 text-4xl',
};

const Avatar = ({ src, name, size = 'md', className = '' }) => {
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '';

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={`${sizes[size]} rounded-full object-cover ring-2 ring-white ${className}`}
      />
    );
  }

  if (initials) {
    return (
      <div
        className={`${sizes[size]} rounded-full bg-emerald-100 text-emerald-700 font-semibold flex items-center justify-center ring-2 ring-white ${className}`}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className={`${sizes[size]} rounded-full bg-gray-100 text-gray-400 flex items-center justify-center ring-2 ring-white ${className}`}
    >
      <HiUser className="w-1/2 h-1/2" />
    </div>
  );
};

export default Avatar;
