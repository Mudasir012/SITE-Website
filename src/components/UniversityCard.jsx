import AcademicCrest from './AcademicCrest.jsx';

const tones = {
  navy: {
    shell: 'border-navy-700 bg-navy-800',
    rule: 'bg-sand-400',
    tab: 'border-sand-500/70 bg-sand-300 text-navy-950',
    crest: 'text-sand-300',
    eyebrow: 'text-sand-400',
    sub: 'text-sand-200/75',
    code: 'text-sand-300/60',
    divider: 'border-navy-700',
    body: 'text-ivory-muted',
    shadow: 'shadow-[0_2px_0_rgba(229,214,186,0.05),0_18px_36px_-14px_rgba(0,0,0,0.55)]',
  },
  paper: {
    shell: 'border-sand-500/50 bg-sand-100',
    rule: 'bg-navy-900',
    tab: 'border-navy-700 bg-navy-900 text-sand-100',
    crest: 'text-navy-800',
    eyebrow: 'text-navy-700',
    sub: 'text-navy-800/70',
    code: 'text-navy-800/70',
    divider: 'border-sand-500/50',
    body: 'text-navy-800/80',
    shadow: 'shadow-[0_2px_0_rgba(255,255,255,0.45),0_18px_36px_-14px_rgba(0,0,0,0.55)]',
  },
};

const ruledStyle = {
  backgroundImage:
    'repeating-linear-gradient(to bottom, transparent 0px, transparent 23px, rgba(11,27,51,0.055) 23px, rgba(11,27,51,0.055) 24px)',
};

export default function UniversityCard({
  children,
  className = '',
  tone = 'navy',
  variant = 'full',
  label = 'CAMPUS FILE',
  eyebrow = 'OFFICIAL CAMPUS FILE',
  sub = "CITE'26 · Official Record",
  code = 'CUI / ABT',
  showCrest = true,
  showTab = true,
  ruled = false,
}) {
  const t = tones[tone] || tones.navy;
  const full = variant === 'full';
  const tabbed = full && showTab;

  return (
    <div className={`relative flex flex-col ${tabbed ? 'pt-4' : ''} ${className}`}>
      {tabbed && (
        <div
          className={`absolute left-5 top-0 z-10 rounded-t-[3px] border border-b-0 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.18em] ${t.tab}`}
        >
          {label}
        </div>
      )}

      <div className={`group relative flex flex-1 flex-col overflow-hidden rounded-[5px] border transition-colors duration-300 hover:border-sand-400/70 ${t.shell} ${t.shadow}`}>
        <div aria-hidden="true" className={`h-px w-full opacity-80 ${t.rule}`} />

        <div className={`relative px-5 sm:px-6 ${full ? 'pt-4 pb-4' : 'pt-4 pb-3'}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {showCrest && <AcademicCrest className={`h-8 w-8 shrink-0 ${t.crest}`} />}
              <div>
                <p className={`font-mono text-[11px] font-bold uppercase tracking-[0.2em] ${t.eyebrow}`}>
                  {full ? eyebrow : label}
                </p>
                {full && (
                  <p className={`mt-0.5 font-serif text-[13px] italic leading-tight ${t.sub}`}>
                    {sub}
                  </p>
                )}
              </div>
            </div>
            <span className={`shrink-0 font-mono text-[11px] uppercase tracking-[0.16em] ${t.code}`}>
              {code}
            </span>
          </div>
          <div className={`mt-3 border-t ${t.divider}`} />
          <div className={`mt-0.5 border-t ${t.divider}`} />
        </div>

        <div
          className={`relative flex-1 px-5 pb-5 sm:px-6 sm:pb-6 ${t.body}`}
          style={ruled ? ruledStyle : undefined}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
