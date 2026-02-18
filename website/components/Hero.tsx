"use client";

import { motion } from "framer-motion";
import { Github } from "lucide-react";
import Image from "next/image";

const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/catchy-console-error-toas/jpkohplmikjpabfejhmlihpadbjlkpjn";
const GITHUB_URL = "https://github.com/ionutcnu/Catchy";

export default function Hero() {
  return (
    <section className="min-h-screen px-8 pt-28 pb-20 flex items-center">
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid gap-16 md:grid-cols-[2fr_4fr] md:items-center">
          {/* Left: text + CTA */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col gap-7"
          >
            <h1 className="text-6xl font-bold leading-tight tracking-tight text-white md:text-7xl">
              Console errors,{" "}
              <span className="text-blue-400">on the page.</span>
            </h1>

            <p className="max-w-md text-lg text-zinc-400 leading-relaxed">
              A Chrome extension that shows JavaScript errors as toasts.
              Useful when you don&apos;t have DevTools open.
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

          {/* Right: browser mockup */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="w-full overflow-hidden rounded-xl border border-white/10 shadow-2xl shadow-black/60"
          >
            <Image
              src="/demo.gif"
              alt="Catchy demo — console error toast notification"
              width={1000}
              height={625}
              unoptimized
              className="w-full"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
