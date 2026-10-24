const variants = {
  primary: 'bg-court-600 hover:bg-court-700 text-white shadow-lg shadow-court-600/20 hover:shadow-court-600/30',
  secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm hover:shadow-md',
  danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20',
  ghost: 'bg-transparent hover:bg-slate-100 text-slate-600',
  success: 'bg-court-600 hover:bg-court-700 text-white shadow-lg shadow-court-600/20',
  cta: 'bg-clay-500 hover:bg-clay-600 text-white shadow-lg shadow-clay-500/25 hover:shadow-clay-500/40',
};

const sizes = {
  sm: 'px-3.5 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
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
        inline-flex items-center justify-center gap-2 rounded-xl font-semibold
        transition-all duration-300 ease-out
        focus:outline-none focus:ring-2 focus:ring-court-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        hover:-translate-y-0.5 active:translate-y-0
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
