import { motion, useReducedMotion } from 'framer-motion';
import { Trophy, Check, Award, Sparkles, Star, Heart, Building2, Gift } from 'lucide-react';
import SectionHeading from '../components/SectionHeading.jsx';
import Button from '../components/Button.jsx';
import { podium, specialAwards } from '../data/prizes.js';
import { event } from '../data/event.js';

const podiumOrder = [podium[1], podium[0], podium[2]];
const awardIcons = [Award, Sparkles, Star, Heart];

export default function PrizesPage() {
  const reduced = useReducedMotion();

  return (
    <div className="pt-14 sm:pt-16 md:pt-20 pb-24">
      <div className="wrap">
        <SectionHeading
          as="h1"
          motto="محنت کا صلہ — اعزاز و انعامات"
          title="Awards & Incentives"
          subtitle="Over PKR 600,000 in Cash, Startup Incubation, and Cloud Credits"
          description="We reward technical depth, innovative execution, and civic impact. Winners take home non-dilutive cash grants and long-term ecosystem incubation."
        />

        {/* Podium Display */}
        <div className="mx-auto grid max-w-5xl items-end gap-6 md:grid-cols-3 mt-14">
          {podiumOrder.map((prize, idx) => {
            const isFirst = prize.place === '1st';

            return (
              <motion.div
                key={prize.place}
                initial={reduced ? { opacity: 0 } : { opacity: 0, clipPath: 'inset(100% 0 0 0)' }}
                whileInView={{ opacity: 1, clipPath: 'inset(0% 0 0 0)' }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: reduced ? 0.16 : 0.5, delay: reduced ? 0 : idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className={`rounded-xl p-7 text-center flex flex-col justify-between transition-all ${
                  isFirst
                    ? 'border-2 border-sand-400 bg-navy-800 shadow-2xl md:-translate-y-4 ring-4 ring-sand-400/20'
                    : 'border border-navy-700 bg-navy-850 shadow-md'
                }`}
              >
                <div>
                  <div className="flex justify-center">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded border px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider ${
                        isFirst
                          ? 'bg-sand-300 text-navy-950 border-sand-400'
                          : 'bg-navy-750 text-sand-300 border-navy-600'
                      }`}
                    >
                      <Trophy className="h-3.5 w-3.5" />
                      {prize.place} Place Award
                    </span>
                  </div>

                  <p className="mt-6 font-display font-black text-3xl sm:text-4xl text-ivory">
                    {prize.amount}
                  </p>
                  <span className="font-mono text-xs font-bold uppercase tracking-widest text-sand-400">
                    Direct Cash Grant
                  </span>

                  <ul className="mt-6 space-y-2.5 text-left border-t border-navy-700 pt-5">
                    {prize.perks.map((perk) => (
                      <li key={perk} className="flex items-start gap-2.5 text-xs sm:text-sm text-ivory-muted">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-sand-400 font-bold" />
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-7 inline-flex items-center justify-center gap-2 border-t border-navy-700 pt-4 font-mono text-xs text-sand-300">
                  {isFirst ? <Trophy className="h-4 w-4" /> : <Award className="h-4 w-4" />}
                  {isFirst ? 'Official CUI Grand Champion Trophy' : 'Official CUI Shield of Excellence'}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Special Honors */}
        <div className="mt-20">
          <div className="text-center mb-10">
            <h3 className="font-display text-2xl sm:text-3xl font-bold uppercase text-ivory">
              Special Category Honors
            </h3>
            <p className="mt-2 text-sm text-ivory-muted">
              Recognizing diversity, freshman grit, design excellence, and participant favorites
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {specialAwards.map((award, idx) => {
              const Icon = awardIcons[idx % awardIcons.length];
              return (
                <div
                  key={award.title}
                  className="rounded-xl border border-navy-700 bg-navy-850 p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="grid h-10 w-10 place-items-center rounded bg-navy-750 text-sand-300 border border-navy-700">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="rounded bg-sand-300/10 border border-sand-400/30 px-2.5 py-1 font-mono text-xs font-bold text-sand-300">
                        {award.amount}
                      </span>
                    </div>
                    <h4 className="mt-4 font-display text-base font-bold text-ivory">{award.title}</h4>
                    <p className="mt-2 text-xs text-ivory-muted leading-relaxed">{award.description}</p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-navy-700 text-[11px] font-mono text-sand-400 font-semibold">
                    Cash Grant + Certificate
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CUI ORIC Incubation Details */}
        <div className="mt-16 rounded-xl border border-navy-700 bg-navy-850 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="h-6 w-6 text-sand-400" />
            <h3 className="font-display text-xl font-bold text-ivory">
              About Incubation at CUI Abbottabad ORIC
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-ivory-muted leading-relaxed">
            Winning teams aren&apos;t just given a trophy; they receive access to office space, dedicated high-speed internet, mentorship from seasoned entrepreneurs, intellectual property advisory, and direct connections to the Higher Education Commission (HEC) and Ignite startup grants.
          </p>
        </div>
      </div>
    </div>
  );
}

