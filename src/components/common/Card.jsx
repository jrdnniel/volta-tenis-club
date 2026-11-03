const Card = ({ children, className = '', padding = true, hover = false, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-xl border border-slate-200
        ${padding ? 'p-5 sm:p-6' : ''}
        ${hover
          ? 'hover:border-slate-300 hover:shadow-xs transition-colors cursor-pointer'
          : 'shadow-2xs'
        }
        ${className}
      `}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '' }) => (
  <div className={`flex items-center justify-between mb-4 ${className}`}>{children}</div>
);

const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg font-bold text-slate-900 tracking-tight ${className}`}>{children}</h3>
);

Card.Header = CardHeader;
Card.Title = CardTitle;

export default Card;
