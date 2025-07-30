"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const baseUrl = "https://delta4.io"

const LINKS = [
  {
    link: baseUrl,
    name: "Home",
  },
  {
    link: baseUrl + "/about",
    name: "About Us",
  },
  {
    link: baseUrl + "/careers",
    name: "Life at Delta4",
  },
  {
    link: baseUrl + "/contact",
    name: "Contact",
  },

];
const Sidenav = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <div>
        <motion.button
          onClick={() => {
            setOpen((s) => !s);
          }}
          className="text-foreground bg-foreground/10 rounded-full p-2"
        >
          <Menu className="w-6 h-6" />
        </motion.button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed sideMenuContent z-[30]  w-full h-[100svh] flex items-start justify-end left-0 top-0">
            <motion.div
              className="back bg-black/30 backdrop-blur-sm absolute left-0 top-0 w-full h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setOpen(false);
              }}
            />

            <motion.div
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: 10,
              }}
              className="bg-background/40 rounded-2xl shadow-lg w-[280px] relative z-[2] flex flex-col mr-4 mt-4 backdrop-blur-md border border-foreground/10"
            >
              <div className="flex items-center justify-between p-4 border-b border-foreground/30">
                <h3 className="text-lg font-semibold text-foreground">Menu</h3>
                <motion.button
                  onClick={() => {
                    setOpen(false);
                  }}
                  className="h-8 w-8 flex items-center justify-center bg-background/10 hover:bg-background/20 text-foreground hover:text-foreground/80 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              <div className="py-2">
                {LINKS.map((i) => {
                  return (
                    <Link
                      href={i.link}
                      key={i.link}
                      className="block py-3 px-4 text-foreground hover:text-primary hover:bg-background/10 font-medium transition-colors"
                      onClick={() => {
                        setOpen(false);
                      }}
                    >
                      {i.name}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Sidenav;
