export const Loader = ({ size = 'md' }) => {
  const sizes = {
    sm: '20px',
    md: '40px',
    lg: '60px'
  };

  return (
    <div className="loader-container">
      <div 
        className="spinner" 
        style={{ width: sizes[size], height: sizes[size] }}
      />
    </div>
  );
};