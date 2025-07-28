import Sidenav from "./Sidenav";
import Link from "next/link";

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
        <div className="bg-foreground/10 border border-foreground/20 backdrop-blur-md rounded-xl flex shadow-lg p-1">
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
      className="text-foreground px-3 py-2 rounded-full bg-primary hover:bg-primary/80 transition-all duration-300 text-md"
      target="_blank"
    >
      👋 We are hiring
    </Link>
  );
}

export default function Navbar() {
  return (
    <div className="fixed left-0 w-full top-0 z-[40] px-4 sm:px-6 ">
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
