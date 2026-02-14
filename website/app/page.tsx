import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProblemSolution from "@/components/ProblemSolution";
import Features from "@/components/Features";
import Footer from "@/components/Footer";
export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0e1a]">
      <Navbar />
      <Hero />
      <ProblemSolution />
      <Features />
      <Footer />
    </main>
  );
}
