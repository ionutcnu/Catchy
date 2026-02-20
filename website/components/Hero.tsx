'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Github } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

const CHROME_STORE_URL =
  'https://chromewebstore.google.com/detail/catchy-console-error-toas/jpkohplmikjpabfejhmlihpadbjlkpjn';
const GITHUB_URL = 'https://github.com/ionutcnu/Catchy';

const SLIDES = [
  { src: '/demo.gif', label: 'In action', unoptimized: true, duration: 9000 },
  { src: '/screenshot_1_per_site.png', label: 'Per-site', unoptimized: false, duration: 3500 },
  { src: '/screenshot_2_display.png', label: 'Display', unoptimized: false, duration: 3500 },
  { src: '/screenshot_3_toast.png', label: 'Position', unoptimized: false, duration: 3500 },
  { src: '/screenshot_4_visual.png', label: 'Visuals', unoptimized: false, duration: 3500 },
  {
    src: '/screenshot_5_error_types.png',
    label: 'Error types',
    unoptimized: false,
    duration: 3500,
  },
];

export default function Hero() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [barKey, setBarKey] = useState(0);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const next = useCallback(() => {
    setActive((i) => (i + 1) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = setTimeout(next, SLIDES[active].duration);
    return () => clearTimeout(id);
  }, [paused, next, active]);

  function pick(i: number) {
    setActive(i);
    setPaused(true);
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setPaused(false), 8000);
  }

  const slide = SLIDES[active];

  return (
    <section className="min-h-screen px-8 pt-28 pb-20 flex items-center">
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid gap-16 md:grid-cols-[2fr_4fr] md:items-center">
          {/* Left: text + CTA */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="flex flex-col gap-7"
          >
            <h1 className="text-6xl font-bold leading-tight tracking-tight text-white md:text-7xl">
              Console errors, <span className="text-blue-400">on the page.</span>
            </h1>

            <p className="max-w-md text-lg text-zinc-400 leading-relaxed">
              A Chrome extension that shows JavaScript errors as toasts. Useful when you don&apos;t
              have DevTools open.
            </p>

            <p className="flex w-fit items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/5 px-5 py-2 text-sm text-zinc-300">
              Free · No account · No config required
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={CHROME_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-blue-500 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-400"
              >
                Add to Chrome
              </a>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-md border border-white/20 px-6 py-3 text-base font-semibold text-white transition-colors hover:border-white/40 hover:bg-white/5"
              >
                <Github size={15} />
                View on GitHub
              </a>
            </div>
          </motion.div>

          {/* Right: carousel */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="flex flex-col gap-3"
          >
            {/* Main viewer */}
            <div className="relative w-full overflow-hidden rounded-xl border border-white/10 shadow-2xl shadow-black/60 bg-[#0d1120] aspect-[16/10]">
              <AnimatePresence mode="wait" onExitComplete={() => setBarKey((k) => k + 1)}>
                <motion.div
                  key={slide.src}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={slide.src}
                    alt={slide.label}
                    fill
                    unoptimized={slide.unoptimized}
                    className="object-cover object-top"
                  />
                </motion.div>
              </AnimatePresence>

              {/* Progress bar — starts only after previous slide has fully exited */}
              {!paused && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5">
                  <motion.div
                    key={barKey}
                    className="h-full bg-blue-400/60"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: SLIDES[active].duration / 1000, ease: 'linear' }}
                  />
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${SLIDES.length}, minmax(0, 1fr))` }}
            >
              {SLIDES.map((s, i) => (
                <button
                  type="button"
                  key={s.src}
                  onClick={() => pick(i)}
                  className="group flex flex-col gap-1.5 rounded-md p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0e1a]"
                >
                  <div
                    className={`relative overflow-hidden rounded-md border bg-[#0d1120] transition-all duration-200 ${
                      i === active
                        ? 'border-blue-400/60 ring-1 ring-blue-400/30'
                        : 'border-white/[0.07] opacity-50 group-hover:opacity-80 group-hover:border-white/20'
                    }`}
                  >
                    <Image
                      src={s.src}
                      alt={s.label}
                      width={160}
                      height={100}
                      unoptimized={s.unoptimized}
                      className="w-full object-cover object-top"
                    />
                  </div>
                  <span
                    className={`text-center text-[10px] transition-colors ${
                      i === active ? 'text-blue-400' : 'text-zinc-600 group-hover:text-zinc-400'
                    }`}
                  >
                    {s.label}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
