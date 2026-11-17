import Countdown from './Countdown.jsx';
import StickyNote from './StickyNote.jsx';
import { event } from '../data/event.js';

export default function CountdownNote() {
  return (
    <StickyNote color="sand" rotate="-1.2deg" tapeAngle="1.5deg" title="" className="h-full">
      <div className="-mx-1">
        <p className="font-handwriting text-3xl leading-none text-[#5B4214]">Countdown to kickoff</p>
        <p className="mt-2 font-handwriting text-lg leading-[22px] text-[#3B2F14]">
          One day. One campus. One shot to build.
        </p>
        <p className="mt-1 font-handwriting text-base leading-[22px] text-[#5A4315]">
          Saturday, 12 December 2026 · 09:00 AM
          <br />
          Main Auditorium, CUI Abbottabad
        </p>

        <div className="mt-6">
          <Countdown target={event.startDate} variant="paper" />
        </div>
      </div>
    </StickyNote>
  );
}
