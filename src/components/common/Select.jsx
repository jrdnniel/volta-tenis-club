const Select = ({
  label,
  id,
  value,
  onChange,
  options = [],
  placeholder = 'Pilih...',
  error,
  required = false,
  disabled = false,
  className = '',
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`
          block w-full rounded-lg border px-3 py-2.5 text-sm transition-colors duration-200
          ${error
            ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 text-gray-900 focus:ring-emerald-500 focus:border-emerald-500'
          }
          focus:outline-none focus:ring-2
          disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
        `}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default Select;
