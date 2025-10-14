"use client"
import Sidenav from "./Sidenav";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { InteractiveHoverButton } from '../magicui/interactive-hover-button';
import { Command } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "motion/react";
import { getAssetPath } from "@/lib/utils/assetPath";

function LogoSection() {
  return (
    <Link href="/">
      <img src={getAssetPath("/delta-logo.svg")} className="h-[32px] sm:h-[40px]" alt="Delta4 Logo" width={150} height={150} />
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
    <div className="hidden md:block">
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

function ContributeButton() {
  return (
    <InteractiveHoverButton className="border border-foreground/20 rounded-md shadow-lg">
      <Link href="https://github.com/delta4infotech/tools" target="_blank">
        Contribute
      </Link>
    </InteractiveHoverButton>
  );
}

function CMDKIndicator() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <kbd
            className="inline-flex h-8 select-none items-center gap-1 rounded border bg-primary/10 px-2 font-mono text-sm font-medium text-primary"
          >
            <Command className="w-3 h-3" />
            <span>K</span>
          </kbd>
        </TooltipTrigger>
        <TooltipContent>
          <p>Press cmd/ctrl+k on keyboard to search tools</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Utility function to check if we're on a tool page
function useIsToolPage() {
  const pathname = usePathname();

  const toolPages = [
    'base64-encoder-and-decoder',
    'code-comparator',
    'find-and-replace',
    'json-code-formatter',
    'js-object-to-json',
    'jwt-token-encoder-and-decoder',
    'readme-today',
    'uri-encode-decode',
    'linkedin-text-formatter'
  ];

  return toolPages.some(tool => pathname.includes(tool));
}

// Updated scroll hook with glassmorphic effect
function useScrollPosition() {
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          // Update scroll position for glassmorphic effect
          setScrollY(currentScrollY);

          // Visibility logic (hide on scroll down, show on scroll up)
          if (currentScrollY > lastScrollY && currentScrollY > 100) {
            // Scrolling down - hide after 100px
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
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return { isVisible, scrollY };
}

export default function Navbar() {
  const { isVisible, scrollY } = useScrollPosition();
  const isToolPage = useIsToolPage();
  const pathname = usePathname();

  // Calculate glassmorphic effect based on scroll position
  const isScrolled = scrollY > 50;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: -20 }}
        animate={{
          opacity: 1,
          y: isVisible ? 0 : -100
        }}
        exit={{ opacity: 0, y: -20 }}
        transition={{
          duration: 0.4,
          ease: "easeInOut",
          type: "spring",
          stiffness: 120,
          damping: 20
        }}
        className={`fixed border left-0 w-full top-0 z-[40] px-4 bg-background/10 backdrop-blur-md shadow-md border-b border-foreground/10 md:border-none md:shadow-none md:backdrop-blur-none md:bg-transparent`}
      >
        <motion.div
          className="py-4 max-w-screen-xl mx-auto"
          animate={{
            backgroundColor: isToolPage && isScrolled ? "rgba(0, 0, 0, 0.2)" : "transparent",
            backdropFilter: isToolPage && isScrolled ? "blur(12px)" : "none",
            boxShadow: isToolPage && isScrolled ? "0 4px 6px -1px rgba(0, 0, 0, 0.1)" : "none",
            borderBottom: isToolPage && isScrolled ? "1px solid rgba(255, 255, 255, 0.2)" : "none",
            padding: isToolPage && isScrolled ? "1rem" : "0",
          }}
          transition={{ duration: 0.15, ease: "easeInOut" }}>
          <div className="flex items-center justify-between min-h-[48px]">
            <LogoSection />
            {!isToolPage && <NavbarLinks />}
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-3 py-4">
                {isToolPage ? (
                  <>
                    <ContributeButton />
                    <CMDKIndicator />
                  </>
                ) : (
                  <HiringButton />
                )}
              </div>
              <Sidenav />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
