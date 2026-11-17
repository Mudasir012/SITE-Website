import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { BrainCircuit, Cpu, Globe, Leaf, ShieldCheck, Sparkles, ArrowRight, Code2, Target, CheckCircle2 } from 'lucide-react';
import SectionHeading from '../components/SectionHeading.jsx';
import Button from '../components/Button.jsx';
import { tracks } from '../data/tracks.js';
import { event } from '../data/event.js';

const icons = { BrainCircuit, Cpu, Globe, Leaf, ShieldCheck, Sparkles };

const trackDetails = [
  {
    challenges: [
      'Urdu and regional language voice/text assistants for civic and government services',
      'Autonomous vision inspection for local textile & manufacturing in Pakistan',
      'AI-driven diagnostic assistance for rural health centers in KPK',
    ],
    recommendedStack: ['Python', 'PyTorch', 'Hugging Face', 'LangChain', 'FastAPI'],
    mentorFocus: 'Dr. Sara Ahmed (CUI) & Ayesha Rahman (DataForge AI)',
  },
  {
    challenges: [
      'Accessible micro-finance & peer-to-peer digital wallets for Pakistani freelancers',
      'Campus collaboration hub connecting national university student developers',
      'Offline-first supply chain management for local merchants',
    ],
    recommendedStack: ['React / Next.js', 'TypeScript', 'Flutter', 'Tailwind', 'PostgreSQL'],
    mentorFocus: 'Mahnoor Aslam (PayGrid) & Hamza Sheikh (Systems Ltd)',
  },
  {
    challenges: [
      'Automated threat telemetry and phishing defense for Pakistani banking APIs',
      'Zero-trust identity verification using national biometric frameworks',
      'Firmware vulnerability scanners for embedded SCADA systems',
    ],
    recommendedStack: ['Rust', 'Python', 'Wireshark', 'Docker', 'PakCERT Guidelines'],
    mentorFocus: 'Zainab Qureshi (PakCERT Security Researcher)',
  },
  {
    challenges: [
      'Smart agricultural telemetry (soil moisture, pest alerts) for Indus agricultural plains',
      'Automated campus energy management and solar array optimization',
      'Low-cost landslide & flash flood telemetry in Northern Pakistan',
    ],
    recommendedStack: ['ESP32', 'LoRaWAN', 'MQTT', 'Embedded C/C++', 'Node-RED'],
    mentorFocus: 'Dr. Faisal Mehmood (CUI Electrical Engineering)',
  },
  {
    challenges: [
      'River basin flood prediction and community early-warning SMS alerts',
      'Urban waste route optimization and municipal recycling tracking',
      'Carbon footprint auditor for small manufacturing enterprises in Pakistan',
    ],
    recommendedStack: ['GIS Open Data', 'Satellite APIs', 'Python', 'React Native'],
    mentorFocus: 'Green Tech Innovation Circle & Climate Cell',
  },
  {
    challenges: [
      'HealthTech, EdTech, Civic Tech, or any high-impact prototype',
      'Novel hardware-software integration or autonomous robotics',
      'Disruptive solutions that solve an undeniable local friction in Pakistan',
    ],
    recommendedStack: ['Any language or stack', 'Figma prototypes', 'Open APIs'],
    mentorFocus: 'Usman Tariq (CloudPeak) & Bilal Chaudhry (TechNova)',
  },
];

export default function TracksPage() {
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(0);
  const reduced = useReducedMotion();
  const activeTrack = tracks[selectedTrackIndex];
  const activeDetail = trackDetails[selectedTrackIndex];
  const ActiveIcon = icons[activeTrack.icon];

  return (
    <div className="pt-14 sm:pt-16 md:pt-20 pb-24">
      <div className="wrap">
        <SectionHeading
          as="h1"
          motto="تعمیر و تخلیق کی راہیں"
          title="Competitions & Categories"
          subtitle="Six Engineering Arenas • Web, AI, Cybersecurity, IoT & More"
          description="From web development and mobile platforms to embedded hardware and cybersecurity CTFs, explore the competitive categories and challenge problem statements."
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tracks.map(({ icon, title, description }, idx) => {
            const Icon = icons[icon];
            const isSelected = idx === selectedTrackIndex;

            return (
              <motion.button
                key={title}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedTrackIndex(idx)}
                whileTap={{ scale: 0.985 }}
                className="group academic-card flex h-full w-full flex-col justify-between rounded-[6px] border-navy-700 p-6 text-left"
              >
                {isSelected && (
                  <motion.span
                    layoutId="track-active-surface"
                    aria-hidden="true"
                    className="absolute inset-0 border border-sand-400/80 bg-navy-800"
                    transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                  />
                )}

                <span className="relative z-10">
                  <span className="flex items-center justify-between">
                    <span
                      className={`grid h-11 w-11 place-items-center rounded border transition-colors duration-200 ${
                        isSelected
                          ? 'border-sand-400/70 bg-sand-300 text-navy-950'
                          : 'border-navy-700 bg-navy-750 text-sand-300 group-hover:border-sand-400/50'
                      }`}
                    >
                      <Icon className={`h-5 w-5 transition-transform duration-200 ${isSelected ? '' : 'group-hover:-rotate-6 group-hover:scale-110'}`} />
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 font-mono text-[11px] font-bold uppercase ${
                        isSelected ? 'bg-sand-300 text-navy-950' : 'text-sand-400/70'
                      }`}
                    >
                      {isSelected ? 'Selected' : `Track 0${idx + 1}`}
                    </span>
                  </span>
                  <span className="mt-4 block font-display text-lg font-bold text-ivory">{title}</span>
                  <span className="mt-2 block text-xs leading-relaxed text-ivory-muted">{description}</span>
                </span>

                <span className="relative z-10 mt-5 flex items-center justify-between border-t border-navy-700/70 pt-3 font-mono text-[11px]">
                  <span className={`font-bold ${isSelected ? 'text-sand-200' : 'text-sand-300'}`}>
                    {isSelected ? 'Viewing Challenges Below' : 'Inspect Challenges'}
                  </span>
                  <ArrowRight className={`h-3.5 w-3.5 transition-transform duration-200 ${isSelected ? 'rotate-90 text-sand-300' : 'text-sand-400/60 group-hover:translate-x-1'}`} />
                </span>
              </motion.button>
            );
          })}
        </div>

        <div className="academic-panel mt-12 rounded-[8px] p-6 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedTrackIndex}
              initial={reduced ? { opacity: 0 } : { opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduced ? { opacity: 0, transition: { duration: 0.12 } } : { opacity: 0, x: -18, transition: { duration: 0.14 } }}
              transition={{ duration: reduced ? 0.14 : 0.32, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex flex-col gap-4 border-b border-navy-700/80 pb-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded bg-sand-300 text-navy-950">
                    <ActiveIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-mono text-xs font-bold uppercase tracking-wider text-sand-400">
                      Track 0{selectedTrackIndex + 1} Deep Dive
                    </p>
                    <h3 className="font-display text-xl font-bold text-ivory sm:text-2xl">
                      {activeTrack.title}
                    </h3>
                  </div>
                </div>

                <Button href={event.registrationUrl} target="_blank" rel="noopener noreferrer" size="md">
                  Register for this Track
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Button>
              </div>

              <div className="mt-6 grid gap-8 lg:grid-cols-12">
                <div className="lg:col-span-8 lg:border-r lg:border-navy-700/70 lg:pr-8">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-sand-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-ivory sm:text-sm">
                      Target Problem Statements & Pakistani Context
                    </h4>
                  </div>
                  <ul className="mt-4 space-y-3">
                    {activeDetail.challenges.map((challenge, cIdx) => (
                      <li key={challenge} className="flex items-start gap-3 text-xs leading-relaxed text-ivory-muted sm:text-sm">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sand-400" />
                        <span>{challenge}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-6 lg:col-span-4">
                  <div className="border-t border-navy-700/70 pt-4 lg:border-t-0 lg:pt-0">
                    <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-sand-400">
                      <Code2 className="h-4 w-4" /> Recommended Stack
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {activeDetail.recommendedStack.map((tech) => (
                        <span key={tech} className="rounded border border-navy-700 bg-navy-900/70 px-2 py-0.5 font-mono text-[11px] font-semibold text-sand-200">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-navy-700/70 pt-4">
                    <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-sand-400">
                      Track Mentors
                    </h4>
                    <p className="mt-2 text-xs leading-relaxed text-ivory-muted">
                      {activeDetail.mentorFocus}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
