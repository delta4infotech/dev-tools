"use client";
import React from "react";
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
      className={`group flex items-center justify-center w-10 h-10 bg-foreground/10 backdrop-blur-sm rounded-full transition-all duration-300 ease-out hover:bg-foreground/20 hover:scale-110 ${social.color}`}
      aria-label={`Follow us on ${social.name}`}
    >
      <IconComponent className="w-5 h-5 transition-transform duration-300 group-hover:scale-110 text-foreground" />
    </Link>
  );
};

const CompanySection = () => (
  <div className="flex-1 max-w-sm space-y-6">
    <div className="space-y-3 flex flex-col items-start justify-start">
      <div className="w-40 h-10 flex items-center justify-start">
        <img src="/delta-logo.svg" alt="Delta4 Infotech" className="w-full h-full object-contain" />
      </div>
      <p className="text-foreground/70 text-sm font-medium pl-4 mt-2">
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
    <h3 className="text-xl font-semibold text-foreground mb-4">
      Quick Links
    </h3>
    <nav className="space-y-4 grid grid-cols-2 ">
      {NAVIGATION_LINKS.map((link) => (
        <Link
          key={link.id}
          href={link.url}
          className="block text-foreground/60 hover:text-foreground duration-200 text-sm font-medium hover:translate-x-1 transform transition-transform text-left"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  </div>
);

const ContactSection = () => (
  <div className="flex-1 max-w-sm space-y-6">
    <h3 className="text-xl font-semibold text-white mb-4">
      Contact
    </h3>
    <div className="space-y-4">
      <Link
        href="https://goo.gl/maps/1biUvQXKisRpcMGS6"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start gap-3 text-foreground/70 hover:text-foreground transition-colors duration-200 group"
      >
        <HiOutlineLocationMarker className="w-5 h-5 mt-0.5 flex-shrink-0 group-hover:text-primary transition-colors" />
        <span className="text-sm leading-relaxed">
          F126, Phase 7, Industrial Area, Sector 73,<br />
          S.A.S Nagar, Punjab, India 160055
        </span>
      </Link>

      <Link
        href="mailto:contact@delta4infotech.com"
        className="flex items-center gap-3 text-foreground/70 hover:text-foreground transition-colors duration-200 group"
      >
        <HiOutlineMail className="w-5 h-5 flex-shrink-0 group-hover:text-primary transition-colors" />
        <span className="text-sm font-medium">
          contact@delta4infotech.com
        </span>
      </Link>

      <div className="flex items-center gap-3 text-white/70">
        <HiOutlinePhone className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm font-medium">
          Contact: 0172 5043532
        </span>
      </div>
    </div>
  </div>
);

export default function Footer() {
  return (
    <footer className="relative w-full overflow-hidden">
      {/* Gradient overlay for seamless blend */}
      <div className="absolute top-0 left-0 w-full h-1/2 z-10 pointer-events-none" style={{ background: 'linear-gradient(to bottom, #000 0%, transparent 100%)' }} />
      <div className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true" style={{ backgroundImage: 'url("/footer.webp")', backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center bottom', opacity: 1, zIndex: 0 }} />

      {/* Content */}
      <div className="relative z-20 mx-auto max-w-screen-xl w-full px-6 sm:px-10 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16">
          <CompanySection />
          <QuickLinksSection />
          <ContactSection />
        </div>
      </div>
      {/* Watermark SVG overlaying content */}
      <div className=" inset-0 flex items-center justify-center w-full h-full z-40 pointer-events-none select-none mix-blend-lighten" aria-hidden="true">
        
        <img src="/delta4-icon-footer.svg" alt="Delta4 watermark" className="w-40 max-w-5xl opacity-80 pb-5 object-contain object-center" />
      </div>
    </footer>
  );
}
