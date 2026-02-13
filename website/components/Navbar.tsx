import Image from "next/image";

export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0a0e1a]/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">
        <div className="flex items-center gap-3">
          <Image
            src="/catchy-icon.png"
            alt="Catchy"
            width={34}
            height={34}
            className="rounded-md"
          />
          <span className="text-xl font-semibold text-white">Catchy</span>
        </div>
      </nav>
    </header>
  );
}
