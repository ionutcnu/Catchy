'use client';

import { motion } from 'framer-motion';

const items = [
  {
    label: 'Free',
    detail: 'No account, no subscription.',
  },
  {
    label: 'All entry points covered',
    detail: 'Patches console.error, window.onerror, and unhandled promise rejections.',
  },
  {
    label: 'Duplicate errors are grouped',
    detail: 'Same error firing repeatedly shows once.',
  },
  {
    label: 'Per-site toggle',
    detail: 'Enable or disable from the extension popup per domain.',
  },
  {
    label: "Doesn't affect the page",
    detail: 'Runs in a Shadow DOM. No interference with layout or scripts.',
  },
  {
    label: 'No data collected',
    detail: 'Runs entirely in your browser. Nothing is sent anywhere.',
  },
  {
    label: 'Customizable',
    detail: 'Position, duration, max toasts, and more — from the options page.',
  },
];

export default function Features() {
  return (
    <section id="features" className="px-8 pb-28 pt-14">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-8 text-3xl font-semibold text-white">Features</h2>

        <div className="overflow-hidden rounded-xl border border-white/10">
          {items.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
              className="grid grid-cols-1 md:grid-cols-[2fr_3fr] border-b border-white/[0.06] last:border-0 transition-colors hover:bg-white/[0.03]"
            >
              <div className="px-8 py-5 md:border-r border-white/[0.06]">
                <span className="text-base font-medium text-zinc-200">{item.label}</span>
              </div>
              <div className="px-8 pb-5 pt-0 md:py-5">
                <span className="text-base text-zinc-500 leading-relaxed">{item.detail}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
