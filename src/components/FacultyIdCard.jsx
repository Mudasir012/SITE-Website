import AcademicCrest from './AcademicCrest.jsx';

function Barcode({ value, className = '' }) {
  const bars = [];
  let x = 0;

  for (let i = 0; i < 46; i += 1) {
    const code = value.charCodeAt(i % value.length);
    const width = ((code + i * 3) % 4) * 0.5 + 0.7;
    if (i > 0) x += i % 3 === 0 ? 1.35 : 0.8;
    bars.push({ x, width });
    x += width;
  }

  return (
    <svg
      viewBox={`0 0 ${x + 1} 26`}
      preserveAspectRatio="none"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      {bars.map((bar, i) => (
        <rect key={i} x={bar.x} y="0" width={bar.width} height="26" />
      ))}
    </svg>
  );
}

export default function FacultyIdCard({ person }) {
  const isJudge = person.tag === 'Judge';
  const idNumber = person.idNumber || 'CUI-ABT-26-0000';
  const access = isJudge ? 'ALL AREAS' : 'LABS & LOUNGE';

  return (
    <article className="group relative flex aspect-[54/86] w-full max-w-[300px] flex-col overflow-hidden rounded-[12px] border border-sand-500/60 bg-sand-100 text-navy-950 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.45),0_20px_38px_-18px_rgba(0,0,0,0.8)] transition-transform duration-200 hover:-translate-y-1">
      {/* Lanyard slot */}
      <div className="flex h-5 shrink-0 items-center justify-center">
        <span
          aria-hidden="true"
          className="h-1.5 w-8 rounded-full bg-navy-950/75 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)] ring-1 ring-navy-900/25"
        />
      </div>

      {/* University header */}
      <header className="flex shrink-0 items-center gap-2 border-b border-sand-400/30 bg-navy-900 px-3 py-2 text-sand-100">
        <AcademicCrest className="h-6 w-6 shrink-0 text-sand-300" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-[11px] font-bold uppercase leading-tight tracking-wide">
            COMSATS University Islamabad
          </p>
          <p className="font-mono text-[6.5px] uppercase tracking-[0.18em] text-sand-300/75">
            Abbottabad Campus
          </p>
        </div>
        <span className="shrink-0 font-mono text-[7px] font-bold uppercase tracking-widest text-sand-300">
          CITE&apos;26
        </span>
      </header>

      {/* Card body */}
      <div className="relative flex min-h-0 flex-1 flex-col items-center px-3 pb-2 pt-2.5">
        {/* Photo panel */}
        <div className="relative w-[54%] shrink-0 overflow-hidden rounded-[4px] border border-navy-900/25 bg-navy-800 shadow-sm">
          <div className="relative grid aspect-[3/4] place-items-center">
            <AcademicCrest
              aria-hidden="true"
              className="absolute h-14 w-14 text-sand-200 opacity-10"
            />
            {person.image ? (
              <img
                src={person.image}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="relative font-display text-2xl font-bold tracking-tight text-sand-200">
                {person.initials}
              </span>
            )}
          </div>
          <div className="border-t border-navy-700/60 bg-navy-950 py-0.5 text-center font-mono text-[5.5px] uppercase tracking-[0.18em] text-sand-300/80">
            CUI · ABT
          </div>
        </div>

        {/* Identity details */}
        <div className="relative mt-2 w-full min-w-0 text-center">
          <h3 className="font-display text-[14px] font-bold uppercase leading-tight tracking-tight text-navy-950">
            {person.name}
          </h3>
          <p className="mt-0.5 text-[11px] font-semibold leading-snug text-navy-800">
            {person.role}
          </p>
          <p className="mt-0.5 font-mono text-[7px] uppercase leading-snug tracking-[0.12em] text-navy-700/70">
            {person.org}
          </p>
        </div>

        <dl className="relative mt-2 grid w-full grid-cols-2 gap-x-2 gap-y-1 border-t border-navy-900/15 pt-1.5 text-left">
          <div>
            <dt className="font-mono text-[6px] font-bold uppercase tracking-[0.16em] text-navy-700/55">
              ID No.
            </dt>
            <dd className="truncate font-mono text-[7.5px] font-bold tracking-wide text-navy-900">
              {idNumber}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[6px] font-bold uppercase tracking-[0.16em] text-navy-700/55">
              Panel
            </dt>
            <dd className="font-mono text-[7.5px] font-bold uppercase tracking-wide text-navy-900">
              {person.tag}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[6px] font-bold uppercase tracking-[0.16em] text-navy-700/55">
              Valid Thru
            </dt>
            <dd className="font-mono text-[7.5px] font-bold tracking-wide text-navy-900">
              12 / 2026
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[6px] font-bold uppercase tracking-[0.16em] text-navy-700/55">
              Access
            </dt>
            <dd className="truncate font-mono text-[7.5px] font-bold uppercase tracking-wide text-navy-900">
              {access}
            </dd>
          </div>
        </dl>
      </div>

      {/* Security strip */}
      <div className="shrink-0 border-t border-navy-900/15 bg-sand-50 px-3 py-2">
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <Barcode value={idNumber} className="h-5 w-full text-navy-950" />
            <p className="mt-1 font-mono text-[6.5px] tracking-[0.14em] text-navy-900/65">
              {idNumber}
            </p>
          </div>

          <div className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full border border-navy-900/25 bg-sand-200/70">
            <span
              aria-hidden="true"
              className="absolute inset-1 rounded-full border border-dashed border-navy-900/25"
            />
            <AcademicCrest className="h-4 w-4 text-navy-800/70" />
          </div>
        </div>

        <p className="mt-1 font-mono text-[5px] uppercase tracking-[0.12em] text-navy-900/45">
          Not transferable · Return to CUI security
        </p>
      </div>
    </article>
  );
}
