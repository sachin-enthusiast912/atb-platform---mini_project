export const StatsCard = ({ title, value, icon, color = 'primary', subtitle }) => {
  const colors = {
    primary: 'var(--primary)',
    success: 'var(--success)',
    warning: 'var(--warning)',
    danger: 'var(--danger)',
    info: 'var(--info)'
  };

  return (
    <div className="card" style={{
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    }}>
      <div style={{
        fontSize: '2.5rem',
        color: colors[color],
        opacity: 0.8
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ 
          fontSize: '0.875rem', 
          color: 'var(--gray-600)',
          marginBottom: '0.25rem'
        }}>
          {title}
        </div>
        <div style={{ 
          fontSize: '2rem', 
          fontWeight: 'bold',
          color: 'var(--gray-900)'
        }}>
          {value}
        </div>
        {subtitle && (
          <div style={{ 
            fontSize: '0.75rem', 
            color: 'var(--gray-500)'
          }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};