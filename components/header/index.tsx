"use client"
import Sidenav from "./Sidenav";
import Link from "next/link";
import { useState, useEffect } from "react";

function LogoSection() {
  return (
    <Link href="/">
      <img src="/dev-tools/delta-logo.svg" className="h-[32px] sm:h-[40px]" alt="Delta4 Logo" width={150} height={150} />
    </Link>
  );
}

const baseUrl = "https://delta4.io"

function NavbarLinks() {
  const LINKS = [
    { link: baseUrl, name: "Home" },
    { link: baseUrl + "/about", name: "About Us" },
    { link: baseUrl + "/careers", name: "Life at Delta4" },
    { link: baseUrl + "/blog", name: "Blog" },
    { link: baseUrl + "/contact", name: "Contact" },
  ];
  return (
    <div className="hidden sm:block">
      <div className="flex justify-center flex-1">
        <div className="bg-background/10 border border-foreground/20 backdrop-blur-md rounded-xl flex shadow-lg p-1">
          {LINKS.map((i) => (
            <Link
              href={i.link}
              key={i.link}
              className="py-3 px-4 flex text-foreground hover:text-primary transition-all duration-300"
            >
              <span className="text-md">{i.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function HiringButton() {
  return (
    <Link
      href={"https://join.delta4infotech.com/"}
      className="text-foreground px-3 py-2 rounded-full bg-primary hover:bg-primary/80 transition-all duration-300 text-md flex items-center gap-2"
      target="_blank"
    >
      👋 We are hiring
    </Link>
  );
}

function useScrollDirection() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          if (currentScrollY > lastScrollY) {
            // Scrolling down - hide immediately
            setIsVisible(false);
          } else if (currentScrollY < lastScrollY) {
            // Scrolling up - show
            setIsVisible(true);
          }

          setLastScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [lastScrollY]);

  return isVisible;
}

export default function Navbar() {
  const isVisible = useScrollDirection();

  return (
    <div
      className={`fixed left-0 w-full top-0 z-[40] px-4 sm:px-6 transition-transform duration-200 ease-in-out ${isVisible ? "translate-y-0" : "-translate-y-full"
        }`}
    >
      <div className="py-4 max-w-screen-xl mx-auto">
        <div className="flex items-center justify-between">
          <LogoSection />
          <NavbarLinks />
          <div className="flex items-center gap-3">
            <HiringButton />
            <Sidenav />
          </div>
        </div>
      </div>
    </div>
  );
}
