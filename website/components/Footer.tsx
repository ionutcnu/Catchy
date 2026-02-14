import { Github } from "lucide-react";
import Image from "next/image";

// TODO: Replace with real 32-char extension ID once published on Chrome Web Store
const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/catchy-console-error-toast/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
const GITHUB_URL = "https://github.com/ionutcnu/Catchy";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 px-8 py-14">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/catchy-icon.png"
              alt="Catchy"
              width={30}
              height={30}
              className="rounded-md"
            />
            <span className="text-lg font-semibold text-white">Catchy</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 text-base text-zinc-400">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 transition-colors hover:text-white"
            >
              <Github size={16} />
              GitHub
            </a>
            <a
              href={CHROME_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-white"
            >
              Chrome Web Store
            </a>
            <a
              href="https://github.com/ionutcnu/Catchy/blob/main/PRIVACY_POLICY.md"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-white"
            >
              Privacy Policy
            </a>
            <a
              href={`${GITHUB_URL}/releases`}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-white"
            >
              Changelog
            </a>
          </div>

          <div className="flex items-center gap-3">
            <img
              src="https://img.shields.io/github/v/release/ionutcnu/Catchy?style=flat-square&color=f97316&labelColor=1a1a1a"
              alt="version badge"
              className="h-6"
            />
          </div>
        </div>

        <div className="mt-10 text-center text-sm text-zinc-600">
          Built by{" "}
          <a
            href="https://lonut.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-zinc-400"
          >
            Lonut
          </a>
        </div>
      </div>
    </footer>
  );
}
