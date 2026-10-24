const colorMap = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  red: 'bg-red-50 text-red-700 ring-red-600/20',
  yellow: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  blue: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  gray: 'bg-gray-50 text-gray-600 ring-gray-500/20',
  purple: 'bg-purple-50 text-purple-700 ring-purple-600/20',
};

// Variant aliases → mapped to colorMap keys
const variantMap = {
  success: 'green',
  danger: 'red',
  warning: 'yellow',
  info: 'blue',
  neutral: 'gray',
};

const Badge = ({ children, color, variant, className = '' }) => {
  // Support both `color` and `variant` props
  const resolvedColor = color || variantMap[variant] || 'gray';

  return (
    <span
      className={`
        inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
        ring-1 ring-inset ${colorMap[resolvedColor] || colorMap.gray} ${className}
      `}
    >
      {children}
    </span>
  );
};

export default Badge;
