export const Button = ({ 
  children, 
  variant = 'primary', 
  type = 'button',
  onClick,
  disabled = false,
  loading = false,
  icon,
  className = ''
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`btn btn-${variant} ${className}`}
    >
      {loading ? (
        <>
          <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
          Loading...
        </>
      ) : (
        <>
          {icon && <span>{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};