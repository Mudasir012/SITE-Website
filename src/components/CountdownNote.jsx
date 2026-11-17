import { Car, Coffee, ShieldCheck, Wifi } from 'lucide-react';
import Countdown from './Countdown.jsx';
import StickyNote from './StickyNote.jsx';
import { event } from '../data/event.js';

const perks = [
  { icon: Car, label: 'Free on-campus parking' },
  { icon: Coffee, label: 'Lunch, dinner & unlimited chai' },
  { icon: Wifi, label: 'Gigabit dual Wi-Fi' },
  { icon: ShieldCheck, label: 'CUI ORIC incubation' },
];

export default function CountdownNote() {
  return (
    <StickyNote color="sand" rotate="-1.2deg" tapeAngle="1.5deg" title="" className="h-full">
      <div className="-mx-1">
        <p className="font-handwriting text-3xl leading-none text-[#5B4214]">Countdown to kickoff</p>
        <p className="mt-2 font-handwriting text-lg leading-[22px] text-[#3B2F14]">
          One day. One campus. One shot at the title.
        </p>
        <p className="mt-1 font-handwriting text-base leading-[22px] text-[#5A4315]">
          Friday, 18 December 2026 · 09:00 AM
          <br />
          Main Auditorium, CUI Abbottabad
        </p>

        <div className="mt-6">
          <Countdown target={event.startDate} variant="paper" />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-dashed border-[#947038]/50 pt-4">
          {perks.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-start gap-1.5 font-handwriting text-[15px] leading-tight text-[#3B2F14]">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#947038]" strokeWidth={1.8} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </StickyNote>
  );
}
