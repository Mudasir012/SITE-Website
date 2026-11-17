// Realistic Torn Paper / Deckle Edge Divider
export default function TornEdge({
  position = 'bottom', // 'top' or 'bottom'
  fill = '#0B1B33',    // Target color that tears into the next section
  className = '',
}) {
  const isTop = position === 'top';

  return (
    <div
      aria-hidden="true"
      className={`w-full overflow-hidden leading-none select-none pointer-events-none z-20 ${
        isTop ? '-mt-px rotate-180' : '-mb-px'
      } ${className}`}
    >
      <svg
        className="w-full h-5 sm:h-7 md:h-9 block"
        viewBox="0 0 1200 40"
        preserveAspectRatio="none"
        fill="currentColor"
        style={{ color: fill }}
      >
        {/* Jagged, torn, organic paper edge path */}
        <path d="M0,0 
          C40,18 70,8 110,22 
          C140,32 170,12 210,28 
          C250,8 280,30 320,18 
          C360,6 390,26 430,22 
          C470,18 510,34 550,14 
          C590,26 620,10 660,30 
          C700,16 730,28 770,12 
          C810,26 840,8 880,24 
          C920,32 960,14 1000,28 
          C1040,12 1070,30 1110,18 
          C1150,6 1180,24 1200,16 
          L1200,40 L0,40 Z" />
      </svg>
    </div>
  );
}

