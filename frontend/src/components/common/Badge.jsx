import { getStatusColor } from '../../utils/helpers';

export const Badge = ({ children, variant = 'gray' }) => {
  return (
    <span className={`badge badge-${variant}`}>
      {children}
    </span>
  );
};

export const StatusBadge = ({ status }) => {
  const color = getStatusColor(status);
  return <Badge variant={color}>{status}</Badge>;
};