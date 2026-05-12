import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LandingNavbar from "./LandingNavbar";

function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

const SECTIONS = [
  { id: "section-hero", label: "Home" },
  { id: "section-learn", label: "Learn" },
  { id: "section-countries", label: "Countries" },
  { id: "section-mission", label: "Mission" },
  { id: "section-cta", label: "Start" },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [showBottomNav, setShowBottomNav] = useState(false);
  const [activeSection, setActiveSection] = useState("section-hero");

  useEffect(() => {
    const onScroll = () => {
      setShowBottomNav(window.scrollY > 120);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  
  useEffect(() => {
    const observers = [];
    
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setActiveSection(entry.target.id);
            }
          });
        },
        { threshold: 0.01, rootMargin: "-10% 0px -60% 0px" }
      );
      
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach(obs => obs.disconnect());
  }, []);

  return (
    <div className="min-h-screen bg-[#1a1d29] text-white relative overflow-hidden">
      {}
      <div className="absolute inset-0 bg-gradient-to-br from-[#252a3a] via-[#1e2230] to-[#1a1d29]" />
      
      {}
      <div className="absolute inset-0 opacity-[0.015] bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E')]" />
      
      {}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-radial from-amber-500/5 via-transparent to-transparent rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-radial from-blue-500/5 via-transparent to-transparent rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10">
        <LandingNavbar activeSection={activeSection} onLogin={() => navigate("/app")} />
        
        {}
        <section id="section-hero" className="min-h-[75vh] sm:min-h-[80vh] flex items-center justify-center px-4 sm:px-6 text-center">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">Welcome to SkillSwap</h1>
            <p className="text-base sm:text-lg md:text-xl text-neutral-300 mb-8">
              Learn from others, teach what you know. Connect with skill-sharers around the world.
            </p>
            <button
              onClick={() => navigate("/app")}
              className="text-[15px] font-semibold text-black bg-lime-400 hover:bg-lime-300 px-8 py-3 rounded-full transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
            >
              Get Started
            </button>
          </div>
        </section>

        {}
        <section id="section-learn" className="py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Learn New Skills</h2>
            <p className="text-neutral-300 mb-12">
              Discover thousands of skills and connect directly with experts willing to teach.
            </p>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {["Programming", "Design", "Business"].map((skill) => (
                <div key={skill} className="p-6 bg-white/5 rounded-lg border border-white/10 hover:border-lime-400/50 transition-all">
                  <h3 className="text-xl font-semibold mb-3">{skill}</h3>
                  <p className="text-neutral-400">Master {skill.toLowerCase()} from experienced professionals</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {}
        <section id="section-countries" className="py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Global Community</h2>
            <p className="text-neutral-300 mb-8">
              Connect with learners and teachers from over 150 countries worldwide.
            </p>
            <div className="text-5xl sm:text-6xl font-bold text-lime-400">150+</div>
            <p className="text-neutral-300 mt-4">Countries Supported</p>
          </div>
        </section>

        {}
        <section id="section-mission" className="py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Mission</h2>
            <p className="text-neutral-300 mb-8">
              We believe that knowledge should be accessible to everyone. SkillSwap empowers individuals to learn and teach, creating a more connected and skilled global community.
            </p>
          </div>
        </section>

        {}
        <section id="section-cta" className="py-16 sm:py-20 px-4 sm:px-6 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Start?</h2>
            <p className="text-neutral-300 mb-10">
              Join thousands of learners and teachers already sharing skills on SkillSwap.
            </p>
            <button
              onClick={() => navigate("/app")}
              className="text-[15px] font-semibold text-black bg-lime-400 hover:bg-lime-300 px-8 py-3 rounded-full transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
            >
              Get Started Now
            </button>
          </div>
        </section>

        {}
        <footer className="border-t border-white/10 py-12 px-4 sm:px-6 text-center text-neutral-400 text-sm">
          <p>&copy; 2024 SkillSwap. All rights reserved.</p>
        </footer>
      </div>

      <div
        className="fixed bottom-4 sm:bottom-8 left-1/2 z-50 flex gap-2 bg-white/10 backdrop-blur-xl rounded-full p-2 border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.3)] max-w-[92vw] overflow-x-auto scrollbar-hide"
        style={{
          opacity: showBottomNav ? 1 : 0,
          transform: showBottomNav
            ? "translateX(-50%) translateY(0)"
            : "translateX(-50%) translateY(16px)",
          pointerEvents: showBottomNav ? "auto" : "none",
          transition: "opacity 220ms ease, transform 220ms ease",
        }}
      >
        {SECTIONS.map(({ id, label }) => {
          const isActive = activeSection === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => scrollToId(id)}
              className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                isActive
                  ? "bg-lime-400 text-black"
                  : "text-white hover:text-lime-400"
              }`}
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
