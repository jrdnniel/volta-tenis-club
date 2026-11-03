const variants = {
  primary: 'bg-emerald-800 hover:bg-emerald-900 text-white',
  secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  ghost: 'bg-transparent hover:bg-slate-100 text-slate-700',
  success: 'bg-court-700 hover:bg-court-800 text-white',
  cta: 'bg-clay-600 hover:bg-clay-700 text-white',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-xs sm:text-sm',
  lg: 'px-6 py-2.5 text-sm sm:text-base',
};

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  icon: Icon,
  onClick,
  type = 'button',
  ...props
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 rounded-lg font-semibold
        transition-colors duration-200
        focus:outline-none focus:ring-1 focus:ring-emerald-700
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...props}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
