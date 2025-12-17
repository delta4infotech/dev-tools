"use client";
import React from "react";
import { Lock, Paintbrush, Download, Wand2, ArrowUpRight } from "./icons";

export const LandingSections = () => {
  return (
    <div className="w-full bg-black text-white selection:bg-blue-500/30 pb-24 border-t border-neutral-900">
      {/* Header */}
      <div className="text-center py-20 px-4">
        <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-6">
          Share <span className="text-neutral-600 line-through decoration-red-500/50 decoration-4">ugly</span> <span className="text-blue-500">beautiful</span> screenshots.
        </h2>
        <p className="text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed">
          The only free BG Studio that respects your time, your <span className="bg-orange-500/10 text-orange-500 px-1 rounded-md border border-orange-500/20">pixel-perfect</span> standards, and your privacy.
        </p>
      </div>

      {/* Bento Grid */}
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6 h-auto">
        {/* Privacy - Large Card (Span 2) */}
        <div className="md:col-span-2 md:row-span-1 bg-neutral-900/30 border border-white/5 rounded-3xl p-8 relative overflow-hidden group hover:bg-neutral-900/50 transition-all duration-500">
          <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-400 border border-green-500/20">
                <Lock className="w-6 h-6" />
              </div>
              <div className="px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20 text-xs font-medium text-green-400">Client-Side Only</div>
            </div>
            <div className="mt-8">
              <h3 className="text-2xl font-bold text-white mb-3">Zero Data Leakage</h3>
              <p className="text-neutral-400 max-w-lg text-lg">
                Your sensitive code, API keys, and data never leave your browser. All image processing happens locally on your machine, ensuring 100% security for your intellectual property.
              </p>
            </div>
          </div>
        </div>

        {/* Customization - Tall Card (Row Span 2) */}
        <div className="md:col-span-1 md:row-span-2 bg-neutral-900/30 border border-white/5 rounded-3xl p-8 relative overflow-hidden group hover:bg-neutral-900/50 transition-all duration-500 flex flex-col">
          <div className="absolute bottom-0 inset-x-0 h-2/3 bg-gradient-to-t from-blue-600/10 via-transparent to-transparent pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity" />

          <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/20 mb-6 shrink-0">
            <Paintbrush className="w-6 h-6" />
          </div>

          <h3 className="text-2xl font-bold text-white mb-3">Pixel Control</h3>
          <p className="text-neutral-400 mb-8 leading-relaxed">Fine-grained control over padding, shadows, roundness, and glassmorphism. Make it yours, down to the pixel.</p>

          {/* Visual Abstract UI */}
          <div className="mt-auto space-y-4 bg-neutral-950/80 p-5 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-sm transform group-hover:scale-105 transition-transform duration-500">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
                <span>Shadow</span>
                <span>24px</span>
              </div>
              <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full w-[60%] bg-blue-500 rounded-full" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
                <span>Blur</span>
                <span>80%</span>
              </div>
              <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full w-[80%] bg-purple-500 rounded-full" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
                <span>Opacity</span>
                <span>100%</span>
              </div>
              <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full w-[100%] bg-green-500 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Instant Polish - Standard Card */}
        <div className="md:col-span-1 md:row-span-1 bg-neutral-900/30 border border-white/5 rounded-3xl p-8 relative overflow-hidden group hover:bg-neutral-900/50 transition-all duration-500">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 border border-purple-500/20 mb-6">
            <Wand2 className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Instant Polish</h3>
          <p className="text-neutral-400">Auto-magically selects the perfect background gradient based on your image colors.</p>
        </div>

        {/* Export - Standard Card */}
        <div className="md:col-span-1 md:row-span-1 bg-neutral-900/30 border border-white/5 rounded-3xl p-8 relative overflow-hidden group hover:bg-neutral-900/50 transition-all duration-500">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400 border border-cyan-500/20 mb-6">
            <Download className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">4K Export</h3>
          <p className="text-neutral-400">Download crisp, retina-ready PNGs. No watermarks, ever. free forever.</p>
        </div>
      </div>

      <div className="text-center mt-20">
        <p className="text-neutral-500 text-sm">
          Built for developers, by developers <span className="text-red-500">❤️</span>
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-32">
        <h3 className="text-2xl font-bold text-white mb-8 text-center pt-8 border-t border-neutral-800">More Developer Tools</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[
            { name: "JSON Formatter", url: "/json-code-formatter", desc: "Format and validate JSON" },
            { name: "Code Comparator", url: "/code-comparator", desc: "Diff check your code" },
            { name: "Base64 Converter", url: "/base64-encoder-and-decoder", desc: "Encode and decode Base64" },
            { name: "Find & Replace", url: "/find-and-replace", desc: "Bulk text operations" },
            { name: "JWT Decoder", url: "/jwt-token-encoder-and-decoder", desc: "Debug JWT tokens" },
            { name: "LinkedIn Formatter", url: "/linkedin-text-formatter", desc: "Style your posts" },
            { name: "JS to JSON", url: "/js-object-to-json", desc: "Convert objects to JSON" },
            { name: "URL Encoder", url: "/uri-encode-decode", desc: "Encode/Decode URIs" },
          ].map((tool) => (
            <a key={tool.url} href={tool.url} className="bg-neutral-900/30 border border-white/5 p-4 rounded-xl hover:bg-neutral-800 transition-colors group">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-neutral-200 group-hover:text-white">{tool.name}</span>
                <ArrowUpRight className="w-4 h-4 text-neutral-600 group-hover:text-blue-400 transition-colors" />
              </div>
              <p className="text-sm text-neutral-500">{tool.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};
