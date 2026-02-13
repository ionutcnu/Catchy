"use client";

import { motion } from "framer-motion";

export default function WhatAndHow() {
  return (
    <section className="px-8 pb-10 pt-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 md:grid-cols-2">
          {/* What it does */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="rounded-xl border border-white/10 bg-[#0d1120] p-10"
          >
            <h2 className="mb-8 text-2xl font-semibold text-white">
              What it does
            </h2>
            <ul className="space-y-6 text-base text-zinc-400 leading-relaxed">
              <li className="flex items-start gap-4">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-400" />
                Stays dormant until something goes wrong.
              </li>
              <li className="flex items-start gap-4">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-400" />
                <span>
                  Patches{" "}
                  <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-sm text-blue-300">
                    console.error
                  </code>
                  {", "}
                  <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-sm text-blue-300">
                    window.onerror
                  </code>
                  {", and promise rejections."}
                </span>
              </li>
              <li className="flex items-start gap-4">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-400" />
                Shows a toast on the page when something fires.
              </li>
              <li className="flex items-start gap-4">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-400" />
                Works on your projects and on any site you visit.
              </li>
            </ul>
          </motion.div>

          {/* How it works */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-xl border border-white/10 bg-[#0d1120] p-10"
          >
            <h2 className="mb-8 text-2xl font-semibold text-white">
              How it works
            </h2>
            <ol className="space-y-6 text-base text-zinc-400 leading-relaxed">
              {[
                "Install from the Chrome Web Store.",
                "Browse normally — nothing to configure.",
                "A toast appears when something fires.",
                "Click to see the full error or dismiss.",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/20 font-mono text-sm font-semibold text-blue-400 ring-1 ring-blue-500/30">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
