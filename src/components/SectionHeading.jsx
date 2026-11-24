import Reveal from './Reveal.jsx';

export default function SectionHeading({
  title,
  subtitle,
  description,
  align = 'center',
  as: Heading = 'h2',
  className = '',
}) {
  const centered = align === 'center';
  return (
    <Reveal className={`mb-12 md:mb-16 ${centered ? 'mx-auto max-w-3xl text-center' : ''} ${className}`}>
      <Heading className="font-display text-3xl font-bold tracking-tight text-ivory sm:text-4xl lg:text-5xl uppercase">
        {title}
      </Heading>
      {subtitle && (
        <p className="mt-2 font-serif italic text-base sm:text-lg text-sand-300">
          {subtitle}
        </p>
      )}
      {description && (
        <p className="mt-4 text-sm sm:text-base leading-relaxed text-ivory-muted max-w-2xl mx-auto">
          {description}
        </p>
      )}
      <div className={`mt-5 flex items-center gap-3 ${centered ? 'justify-center' : ''}`}>
        <span className="h-px w-12 bg-navy-700" />
        <span className="h-1.5 w-1.5 rounded-full bg-sand-400" />
        <span className="h-px w-12 bg-navy-700" />
      </div>
    </Reveal>
  );
}
