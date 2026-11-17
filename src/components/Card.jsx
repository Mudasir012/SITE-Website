// Collegiate Card Component
export default function Card({
  as: Tag = 'div',
  className = '',
  hover = true,
  highlighted = false,
  children,
  ...props
}) {
  const hoverStyles = hover ? 'hover:-translate-y-1 academic-card' : '';

  const highlightStyles = highlighted
    ? 'border-sand-400/80 bg-navy-800'
    : 'border-navy-700 bg-navy-800';

  return (
    <Tag
      className={`relative rounded-[6px] border ${highlightStyles} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}
