"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FaLinkedin, FaYoutube, FaFacebook, FaGithub, FaXTwitter } from "react-icons/fa6";
import { HiOutlineMail, HiOutlinePhone, HiOutlineLocationMarker } from "react-icons/hi";


const baseUrl = "https://delta4.io"
// Social media configuration

const SOCIAL_LINKS = [
  {
    id: 1,
    name: "LinkedIn",
    icon: FaLinkedin,
    link: "https://www.linkedin.com/company/delta4-infotech/",
    color: "hover:text-blue-400"
  },
  {
    id: 2,
    name: "YouTube",
    icon: FaYoutube,
    link: "https://www.youtube.com/@delta4infotech",
    color: "hover:text-red-500"
  },
  {
    id: 3,
    name: "Facebook",
    icon: FaFacebook,
    link: "https://www.facebook.com/profile.php?id=61562762475758",
    color: "hover:text-blue-500"
  },
  {
    id: 4,
    name: "GitHub",
    icon: FaGithub,
    link: "https://github.com/YourGPT",
    color: "hover:text-gray-300"
  },
  {
    id: 5,
    name: "X (Twitter)",
    icon: FaXTwitter,
    link: "https://x.com/YourGPTAI",
    color: "hover:text-gray-300"
  },
];


const NAVIGATION_LINKS = [
  { id: 1, label: "Home", url: baseUrl },
  { id: 2, label: "Life at Delta4", url: baseUrl + "/careers" },
  { id: 3, label: "About Us", url: baseUrl + "/about" },
  { id: 4, label: "Blog", url: baseUrl + "/blog" },
  { id: 5, label: "Dev Tools", url: baseUrl + "/dev-tools" },
  { id: 6, label: "Contact Us", url: baseUrl + "/contact" },
];

// Modular Components
const SocialIcon = ({ social }: { social: typeof SOCIAL_LINKS[0] }) => {
  const IconComponent = social.icon;
  return (
    <Link
      href={social.link}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex items-center justify-center w-11 h-11 bg-foreground/10 backdrop-blur-sm rounded-xl border border-foreground/10 transition-all duration-300 ease-out hover:bg-foreground/20 hover:scale-110 hover:rotate-3 hover:shadow-lg hover:shadow-primary/20 ${social.color}`}
      aria-label={`Follow us on ${social.name}`}
    >
      <IconComponent className="w-5 h-5 transition-all duration-300 group-hover:scale-125 text-foreground group-hover:drop-shadow-sm" />
    </Link>
  );
};

const CompanySection = () => (
  <div className="flex-1 max-w-sm space-y-6">
    <div className="space-y-4 flex flex-col items-start justify-start">
      <div className="w-40 h-10 flex items-center justify-start">
        <img src="/dev-tools/delta-logo.svg" alt="Delta4 Infotech" className="w-full h-full object-contain filter brightness-110" />
      </div>
      <p className="text-foreground/90 text-sm font-medium pl-4 mt-2 leading-relaxed">
        Find us on social media
      </p>
    </div>
    <div className="flex gap-3 flex-wrap justify-start pl-2">
      {SOCIAL_LINKS.map((social) => (
        <SocialIcon key={social.id} social={social} />
      ))}
    </div>
  </div>
);

const QuickLinksSection = () => (
  <div className="flex-1 max-w-sm space-y-6">
    <h3 className="text-xl font-semibold text-foreground mb-6 relative">
      Quick Links
      <div className="absolute bottom-0 left-0 w-12 h-0.5 bg-gradient-to-r from-primary to-primary/50 rounded-full"></div>
    </h3>
    <nav className="space-y-4 grid grid-cols-2 gap-y-3">
      {NAVIGATION_LINKS.map((link) => (
        <Link
          key={link.id}
          href={link.url}
          className="block text-foreground/90 duration-300 text-sm font-medium hover:translate-x-2 transform transition-all hover:text-primary/90 group"
        >
          <span className="relative">
            {link.label}
            <span className="absolute inset-x-0 -bottom-1 h-px bg-gradient-to-r from-primary/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
          </span>
        </Link>
      ))}
    </nav>
  </div>
);

const ContactSection = () => (
  <div className="flex-1 max-w-sm space-y-6">
    <h3 className="text-xl font-semibold text-foreground mb-6 relative">
      Contact
      <div className="absolute bottom-0 left-0 w-12 h-0.5 bg-gradient-to-r from-primary to-primary/50 rounded-full"></div>
    </h3>
    <div className="space-y-5">
      <Link
        href="https://goo.gl/maps/1biUvQXKisRpcMGS6"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start gap-4 text-foreground/90 hover:text-foreground transition-all duration-300 group hover:translate-x-1"
      >
        <div className="flex-shrink-0 w-5 h-5 mt-0.5 flex items-center justify-center">
          <HiOutlineLocationMarker className="w-5 h-5 group-hover:text-primary transition-colors group-hover:scale-110 transform duration-300" />
        </div>
        <span className="text-sm leading-relaxed">
          F126, Phase 7, Industrial Area, Sector 73,<br />
          S.A.S Nagar, Punjab, India 160055
        </span>
      </Link>

      <Link
        href="mailto:contact@delta4infotech.com"
        className="flex items-center gap-4 text-foreground/90 hover:text-foreground transition-all duration-300 group hover:translate-x-1"
      >
        <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
          <HiOutlineMail className="w-5 h-5 group-hover:text-primary transition-colors group-hover:scale-110 transform duration-300" />
        </div>
        <span className="text-sm font-medium">
          contact@delta4infotech.com
        </span>
      </Link>

      <div className="flex items-center gap-4 text-foreground/90 group">
        <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
          <HiOutlinePhone className="w-5 h-5 group-hover:text-primary transition-colors" />
        </div>
        <span className="text-sm font-medium">
          Contact: 0172 5043532
        </span>
      </div>
    </div>
  </div>
);

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!footerRef.current) return;

      const footer = footerRef.current;
      const footerRect = footer.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Calculate when footer starts entering viewport
      const footerTop = footerRect.top;
      const footerHeight = footerRect.height;

      // Start animation when footer is about to enter viewport
      const startTrigger = windowHeight;
      const endTrigger = windowHeight - footerHeight;

      let progress = 0;

      if (footerTop <= startTrigger && footerTop >= endTrigger) {
        // Footer is partially visible
        progress = (startTrigger - footerTop) / (startTrigger - endTrigger);
      } else if (footerTop < endTrigger) {
        // Footer is fully visible
        progress = 1;
      }

      // Smooth easing function for more natural animation
      const easedProgress = progress * progress * (3 - 2 * progress); // smoothstep
      setScrollProgress(Math.max(0, Math.min(1, easedProgress)));
    };

    // Initial check
    handleScroll();

    // Add scroll listener with throttling for performance
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    return () => {
      window.removeEventListener('scroll', throttledScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  return (
    <footer ref={footerRef} className="relative w-full overflow-hidden">
      {/* Seamless top blend with background */}
      <div className="absolute top-0 left-0 w-full h-20 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, hsl(var(--background)) 0%, hsl(var(--background))/0.9 50%, transparent 100%)' }} />

      {/* Background image with scroll-triggered animation */}
      <div className="absolute inset-0 w-full h-full pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage: 'url("/dev-tools/footer-bg.png")',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center bottom',
          opacity: 0.4 * scrollProgress,
          transform: `translateY(${(1 - scrollProgress) * 50}%)`,
          clipPath: `inset(${(1 - scrollProgress) * 100}% 0 0 0)`,
          transition: scrollProgress === 0 ? 'none' : 'opacity 0.1s ease-out, transform 0.1s ease-out, clip-path 0.1s ease-out',
          zIndex: 1
        }} />

      {/* Sunrise gradient effect - darker top, lighter bottom with brighter content area */}
      <div className="absolute inset-0 w-full h-full z-5 pointer-events-none"
        style={{
          background: `
              linear-gradient(to bottom, 
              rgba(0,0,0,0.9) 0%, 
              rgba(0,0,0,0.6) 25%, 
              rgba(0,0,0,0.3) 50%, 
              rgba(0,0,0,0.2) 70%, 
              rgba(0,0,0,0.1) 85%, 
              rgba(255,255,255,0.05) 100%
            )
          `
        }} />

      {/* Content */}
      <div className="relative z-30 mx-auto max-w-screen-xl w-full px-6 sm:px-10 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16">
          <CompanySection />
          <QuickLinksSection />
          <ContactSection />
        </div>
      </div>

      {/* Centered watermark logo - behind content */}
      <div className="relative flex items-center justify-center w-full h-full z-20 pointer-events-none select-none" aria-hidden="true">
        <div className="relative">
          <img
            src="/dev-tools/delta4-icon-footer.svg"
            alt="Delta4 watermark"
            className="w-18 md:w-38 opacity-40 object-contain mix-blend-soft-light transition-opacity duration-500 filter drop-shadow-sm pb-2"
          />
          {/* Additional glow effect around the logo */}
          <div
            className="absolute inset-0 rounded-full blur-xl scale-150 mix-blend-soft-light"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)'
            }}
          />
        </div>
      </div>
    </footer>
  );
}
