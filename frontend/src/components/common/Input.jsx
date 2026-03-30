export const Input = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  ...props
}) => {
  return (
    <div className="form-group">
      {label && (
        <label htmlFor={name} className="form-label">
          {label} {required && <span style={{ color: 'red' }}>*</span>}
        </label>
      )}
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="form-input"
        {...props}
      />
      {error && <div className="form-error">{error}</div>}
    </div>
  );
};

export const Textarea = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  rows = 4,
  ...props
}) => {
  return (
    <div className="form-group">
      {label && (
        <label htmlFor={name} className="form-label">
          {label} {required && <span style={{ color: 'red' }}>*</span>}
        </label>
      )}
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        rows={rows}
        className="form-textarea"
        {...props}
      />
      {error && <div className="form-error">{error}</div>}
    </div>
  );
};

export const Select = ({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
  error,
  ...props
}) => {
  return (
    <div className="form-group">
      {label && (
        <label htmlFor={name} className="form-label">
          {label} {required && <span style={{ color: 'red' }}>*</span>}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="form-select"
        {...props}
      >
        <option value="">Select {label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <div className="form-error">{error}</div>}
    </div>
  );
};