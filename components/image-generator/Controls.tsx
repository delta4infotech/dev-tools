"use client";
import React, { useRef, useState, useEffect } from "react";
import type { ControlsProps, AspectRatio, Alignment, ImageSettings, BackgroundEffects } from "./types";
import {
  AlignTopLeft,
  AlignTopCenter,
  AlignTopRight,
  AlignMiddleLeft,
  AlignMiddleCenter,
  AlignMiddleRight,
  AlignBottomLeft,
  AlignBottomCenter,
  AlignBottomRight,
  Upload,
  Download,
  RefreshCw,
  XCircle,
  Trash2,
  Code,
  Lock,
  Unlock,
  ChevronUp,
  ArrowLeft,
} from "./icons";
import { DevModeModal } from "./DevModeModal";
import Link from "next/link";
import { PRESET_PALETTES } from "./palettes";
import { getHarmoniousColor } from "./utils/color";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./Accordion";
import { Slider } from "./ui/Slider";
import { ColorPicker } from "./ui/ColorPicker";

export const PRESET_BACKGROUNDS = [
  { name: "Aura", url: "https://assets.delta4infotech.com/tools/bg-studio/Aura.png" },
  { name: "Ripple", url: "https://assets.delta4infotech.com/tools/bg-studio/Ripple.png" },
  { name: "Abstract", url: "https://assets.delta4infotech.com/tools/bg-studio/abstract.jpeg" },
  { name: "Nebula", url: "https://assets.delta4infotech.com/tools/bg-studio/nebula.png" },
  { name: "Nature", url: "https://assets.delta4infotech.com/tools/bg-studio/nature.jpeg" },
  { name: "Meadow", url: "https://assets.delta4infotech.com/tools/bg-studio/Meadow.png" },
  { name: "Gradient 1", url: "https://assets.delta4infotech.com/tools/bg-studio/yourgpt-bg-1.png" },
  { name: "Grainy Gradient 1", url: "https://assets.delta4infotech.com/tools/bg-studio/bg-gradient-2.png" },
  { name: "Grainy Gradient 2", url: "https://assets.delta4infotech.com/tools/bg-studio/bg-gradient-3.jpg" },
];

const AspectRatioButton: React.FC<{
  label: string;
  value: AspectRatio;
  currentValue: AspectRatio;
  onClick: (value: AspectRatio) => void;
}> = ({ label, value, currentValue, onClick }) => (
  <button
    onClick={() => onClick(value)}
    className={`flex-1 p-2 text-sm rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 focus:ring-blue-500 ${
      value === currentValue ? "bg-blue-600 text-white" : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
    }`}
  >
    {label}
  </button>
);

const CustomGradientEditor: React.FC<{
  gradient: ControlsProps["gradient"];
  setGradient: ControlsProps["setGradient"];
}> = ({ gradient, setGradient }) => {
  const [isHarmonious, setIsHarmonious] = React.useState(true);

  const handleColorChange = (index: 0 | 1, color: string) => {
    const newColors = [...gradient.colors] as [string, string];
    newColors[index] = color;

    if (isHarmonious) {
      const otherIndex = index === 0 ? 1 : 0;
      newColors[otherIndex] = getHarmoniousColor(color);
    }
    setGradient({ ...gradient, colors: newColors });
  };

  const handleAngleChange = (angle: number) => {
    setGradient({ ...gradient, angle });
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between px-1">
        <div className="text-sm text-neutral-400 font-medium">Custom Colors</div>
        <button onClick={() => setIsHarmonious(!isHarmonious)} className="p-1 text-neutral-400 hover:text-white transition-colors" title={isHarmonious ? "Unlock colors" : "Lock harmonious colors"}>
          {isHarmonious ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
        </button>
      </div>
      <div className="flex items-center space-x-2">
        <ColorPicker color={gradient.colors[0]} onChange={(c) => handleColorChange(0, c)} className="h-8 w-14" />
        <ColorPicker color={gradient.colors[1]} onChange={(c) => handleColorChange(1, c)} className="h-8 w-14" />
        <div className="flex-1">
          <Slider value={[gradient.angle]} onValueChange={(vals) => handleAngleChange(vals[0])} min={0} max={360} step={1} className="w-full py-1" />
          <div className="text-xs text-neutral-500 text-center mt-1.5">{gradient.angle}°</div>
        </div>
      </div>
    </div>
  );
};

const SliderControl: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
}> = ({ label, value, onChange, min = 0, max = 100, step = 1, unit = "", disabled = false }) => (
  <div className={`space-y-3 pt-1 ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
    <div className="flex items-center justify-between">
      <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wider">{label}</label>
      <span className="text-xs font-mono text-neutral-500 w-14 text-right tabular-nums">
        {value.toFixed(label === "Scale" || label === "Opacity" || step < 1 ? 2 : 0)}
        {unit}
      </span>
    </div>
    <Slider value={[value]} onValueChange={(vals) => onChange(vals[0])} min={min} max={max} step={step} disabled={disabled} className="py-1" />
  </div>
);
const ALIGNMENT_OPTIONS: { value: Alignment; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
  { value: "top-left", icon: AlignTopLeft },
  { value: "top-center", icon: AlignTopCenter },
  { value: "top-right", icon: AlignTopRight },
  { value: "middle-left", icon: AlignMiddleLeft },
  { value: "middle-center", icon: AlignMiddleCenter },
  { value: "middle-right", icon: AlignMiddleRight },
  { value: "bottom-left", icon: AlignBottomLeft },
  { value: "bottom-center", icon: AlignBottomCenter },
  { value: "bottom-right", icon: AlignBottomRight },
];

export const Controls: React.FC<ControlsProps> = (props) => {
  const {
    aspectRatio,
    setAspectRatio,
    gradient,
    setGradient,
    backgroundImage,
    handleBackgroundUpload,
    removeBackgroundImage,
    backgroundEffects,
    setBackgroundEffects,
    imageSettings,
    setImageSettings,
    uploadedImages,
    activeImageIndex,
    setActiveImageIndex,
    handleFileUpload,
    removeUploadedImage,
    removeAllUploadedImages,
    generateNewGradient,
    onDownloadSingle,
    onDownloadZip,
    isDownloading,
    setBackgroundImage,
  } = props;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const [openAccordionItems, setOpenAccordionItems] = useState(["foreground", "background"]);
  const [activeBackgroundTab, setActiveBackgroundTab] = useState<"color" | "image">("color");
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const [isDevModeOpen, setIsDevModeOpen] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  const handleDevModeApply = (newConfig: any) => {
    if (newConfig.imageSettings) setImageSettings(newConfig.imageSettings);
    if (newConfig.backgroundEffects) setBackgroundEffects(newConfig.backgroundEffects);
    if (newConfig.gradient) setGradient(newConfig.gradient);
  };

  useEffect(() => {
    if (uploadedImages.length > 0) {
      setOpenAccordionItems((prev) => {
        if (!prev.includes("foreground")) {
          return [...prev, "foreground"];
        }
        return prev;
      });
    }
  }, [uploadedImages.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setIsDownloadMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleUploadClick = () => fileInputRef.current?.click();
  const handleBackgroundUploadClick = () => backgroundInputRef.current?.click();

  const handleImageSettingChange = <K extends keyof ImageSettings>(key: K, value: ImageSettings[K]) => {
    setImageSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleBackgroundEffectChange = <K extends keyof BackgroundEffects>(key: K, value: BackgroundEffects[K]) => {
    setBackgroundEffects((prev) => ({ ...prev, [key]: value }));
  };

  const isPaddingDisabled = imageSettings.alignment !== "middle-center";

  return (
    <div className="flex flex-col space-y-6 h-full">
      <div className="hidden lg:block px-1">
        <Link href="/" className="inline-flex items-center text-sm text-neutral-400 hover:text-white mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Tools
        </Link>
        <h1 className="text-2xl font-bold text-neutral-100">BG Studio</h1>
        <p className="text-base text-neutral-400 mt-1">Create your visual content.</p>
      </div>

      <div className="space-y-4 pt-4 border-t border-neutral-800">
        <label className="block text-sm font-semibold text-neutral-300 px-1">Canvas</label>
        <div className="flex space-x-2">
          <AspectRatioButton label="Square (1:1)" value="1:1" currentValue={aspectRatio} onClick={setAspectRatio} />
          <AspectRatioButton label="Wide (16:9)" value="16:9" currentValue={aspectRatio} onClick={setAspectRatio} />
        </div>
      </div>

      <Accordion type="multiple" value={openAccordionItems} onValueChange={setOpenAccordionItems} className="w-full flex-grow space-y-2">
        <AccordionItem value="foreground">
          <AccordionTrigger>Foreground</AccordionTrigger>
          <AccordionContent className="p-1">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple className="hidden" accept="image/png, image/jpeg, image/webp" />
            {uploadedImages.length > 0 ? (
              <div className="space-y-6">
                <div className="w-full">
                  <div className="flex gap-3 overflow-x-auto p-2 min-w-0">
                    {uploadedImages.map((image, index) => (
                      <div key={index} className="relative group flex-none">
                        <button
                          onClick={() => setActiveImageIndex(index)}
                          className={`w-20 h-20 rounded-xl overflow-hidden focus:outline-none ring-2 ring-offset-2 ring-offset-neutral-900 transition-all ${
                            activeImageIndex === index ? "ring-blue-500" : "ring-transparent hover:ring-neutral-600"
                          }`}
                          aria-label={`Select image ${index + 1}`}
                        >
                          <img src={image.src} className="w-full h-full object-cover" alt={`Uploaded thumbnail ${index + 1}`} />
                        </button>
                        <button
                          onClick={() => removeUploadedImage(index)}
                          className="absolute -top-1.5 -right-1.5 bg-neutral-700 hover:bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                          aria-label={`Remove image ${index + 1}`}
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={handleUploadClick} className="flex items-center justify-center space-x-2 w-full p-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors duration-200 text-sm font-medium">
                    <Upload className="w-4 h-4" />
                    <span>Add More</span>
                  </button>
                  <button onClick={removeAllUploadedImages} className="flex items-center justify-center space-x-2 w-full p-2 bg-neutral-800 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors duration-200 text-sm font-medium">
                    <Trash2 className="w-4 h-4" />
                    <span>Remove All</span>
                  </button>
                </div>

                <div className="space-y-6 pt-6 border-t border-neutral-800">
                  <div>
                    <SliderControl label="Padding" value={imageSettings.padding} onChange={(v) => handleImageSettingChange("padding", v)} max={200} unit="px" disabled={isPaddingDisabled} />
                    {isPaddingDisabled && <p className="text-xs text-neutral-500 mt-2 ml-1">Padding is only available for center alignment.</p>}
                  </div>
                  <SliderControl label="Scale" value={imageSettings.scale} onChange={(v) => handleImageSettingChange("scale", v)} min={0.1} max={2} step={0.01} />
                  <SliderControl label="Shadow" value={imageSettings.shadow} onChange={(v) => handleImageSettingChange("shadow", v)} max={100} />
                  <SliderControl label="Corners" value={imageSettings.corners} onChange={(v) => handleImageSettingChange("corners", v)} max={200} unit="px" />
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">Alignment</label>
                    <div className="grid grid-cols-3 gap-1 w-fit bg-neutral-800 p-1 rounded-lg">
                      {ALIGNMENT_OPTIONS.map(({ value, icon: Icon }) => (
                        <button key={value} onClick={() => handleImageSettingChange("alignment", value)} className={`p-2 rounded-md transition-colors ${imageSettings.alignment === value ? "bg-blue-600" : "hover:bg-neutral-700"}`}>
                          <Icon className="w-5 h-5 mx-auto text-white" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6 pt-6 border-t border-neutral-800">
                  <label className="block text-sm font-semibold text-neutral-300">Glassmorphism Border</label>
                  <div className="space-y-6 rounded-lg bg-neutral-900/50 p-4">
                    <div className="flex items-center justify-between">
                      <label htmlFor="glass-toggle" className="text-sm font-medium text-neutral-300">
                        Enable
                      </label>
                      <button
                        role="switch"
                        aria-checked={imageSettings.glassmorphicBorder.enabled}
                        onClick={() => handleImageSettingChange("glassmorphicBorder", { ...imageSettings.glassmorphicBorder, enabled: !imageSettings.glassmorphicBorder.enabled })}
                        id="glass-toggle"
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${imageSettings.glassmorphicBorder.enabled ? "bg-blue-600" : "bg-neutral-700"}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${imageSettings.glassmorphicBorder.enabled ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </div>
                    <SliderControl
                      label="Size"
                      value={imageSettings.glassmorphicBorder.size}
                      onChange={(v) => handleImageSettingChange("glassmorphicBorder", { ...imageSettings.glassmorphicBorder, size: v })}
                      min={1}
                      max={50}
                      unit="px"
                      disabled={!imageSettings.glassmorphicBorder.enabled}
                    />
                    <SliderControl
                      label="Opacity"
                      value={imageSettings.glassmorphicBorder.opacity}
                      onChange={(v) => handleImageSettingChange("glassmorphicBorder", { ...imageSettings.glassmorphicBorder, opacity: v })}
                      min={0}
                      max={1}
                      step={0.01}
                      disabled={!imageSettings.glassmorphicBorder.enabled}
                    />
                    <div className={`flex items-center justify-between ${!imageSettings.glassmorphicBorder.enabled ? "opacity-50 pointer-events-none" : ""}`}>
                      <label className="text-sm font-medium text-neutral-300">Color</label>
                      <ColorPicker color={imageSettings.glassmorphicBorder.color} onChange={(c) => handleImageSettingChange("glassmorphicBorder", { ...imageSettings.glassmorphicBorder, color: c })} />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <button
                  onClick={handleUploadClick}
                  className="flex items-center justify-center space-x-2 w-full p-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 focus:ring-blue-500 font-medium"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Image</span>
                </button>
                <p className="text-xs text-neutral-500 mt-2 text-center">Add a foreground image to your canvas.</p>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="background">
          <AccordionTrigger>Background</AccordionTrigger>
          <AccordionContent className="p-1">
            <div className="bg-neutral-900/50 p-1 rounded-lg flex mb-4 border border-white/5">
              <button
                onClick={() => setActiveBackgroundTab("color")}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${activeBackgroundTab === "color" ? "bg-neutral-700 text-white shadow-sm" : "text-neutral-400 hover:text-white"}`}
              >
                Color
              </button>
              <button
                onClick={() => setActiveBackgroundTab("image")}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${activeBackgroundTab === "image" ? "bg-neutral-700 text-white shadow-sm" : "text-neutral-400 hover:text-white"}`}
              >
                Image
              </button>
            </div>

            <div className="space-y-4">
              {/* Current Background Preview and Remove */}
              {backgroundImage ? (
                <div className="space-y-3">
                  <div className="relative aspect-video w-full rounded-lg overflow-hidden ring-1 ring-neutral-700 group">
                    <img src={backgroundImage} alt="Background" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button onClick={removeBackgroundImage} className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors shadow-lg" title="Remove background image">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-500 text-center">Image overrides gradient.</p>
                </div>
              ) : null}

              {activeBackgroundTab === "color" && (
                <div className={`space-y-4 transition-opacity duration-300 ${backgroundImage ? "opacity-30 pointer-events-none" : ""}`}>
                  <button
                    onClick={generateNewGradient}
                    className="flex items-center justify-center space-x-2 w-full p-2.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors duration-200 text-neutral-300 font-medium border border-white/5"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Random Gradient</span>
                  </button>
                  <div className="space-y-3 pt-2">
                    <div className="text-sm text-neutral-400 font-medium">Presets</div>
                    <div className="grid grid-cols-4 gap-2">
                      {PRESET_PALETTES.map((palette) => (
                        <button
                          key={palette.name}
                          onClick={() => setGradient(palette.gradient)}
                          className="aspect-square w-full rounded-md border border-white/10 focus:outline-none ring-2 ring-transparent focus:ring-blue-500 hover:scale-105 transition-transform"
                          style={{ background: `linear-gradient(${palette.gradient.angle}deg, ${palette.gradient.colors[0]}, ${palette.gradient.colors[1]})` }}
                          title={palette.name}
                        />
                      ))}
                    </div>
                  </div>
                  <CustomGradientEditor gradient={gradient} setGradient={setGradient} />
                </div>
              )}

              {activeBackgroundTab === "image" && (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <button
                    onClick={handleBackgroundUploadClick}
                    className="flex items-center justify-center space-x-2 w-full p-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors duration-200 font-medium border border-white/5"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Image</span>
                  </button>
                  <input type="file" ref={backgroundInputRef} onChange={handleBackgroundUpload} className="hidden" accept="image/png, image/jpeg, image/webp" />

                  <div className="space-y-3">
                    <div className="text-sm text-neutral-400 font-medium">Preset Images</div>
                    <div className="grid grid-cols-2 gap-2">
                      {PRESET_BACKGROUNDS.map((bg, i) => (
                        <button
                          key={i}
                          onClick={() => setBackgroundImage(bg.url)}
                          className="relative aspect-video rounded-md overflow-hidden border border-white/10 hover:border-white/30 transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 group"
                        >
                          <img src={bg.url} className="w-full h-full object-cover" alt={bg.name} loading="lazy" />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                          <span className="absolute bottom-1 left-2 text-[10px] text-white/90 drop-shadow-md font-medium truncate w-11/12 text-left">{bg.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="background-effects">
          <AccordionTrigger>Effects</AccordionTrigger>
          <AccordionContent className="p-1">
            <div className="space-y-6">
              <SliderControl label="Noise" value={backgroundEffects.noiseOpacity} onChange={(v) => handleBackgroundEffectChange("noiseOpacity", v)} min={0} max={1} step={0.01} />
              <SliderControl label="Vignette" value={backgroundEffects.vignetteOpacity} onChange={(v) => handleBackgroundEffectChange("vignetteOpacity", v)} min={0} max={1} step={0.01} />
              <SliderControl label="Blur" value={backgroundEffects.blur} onChange={(v) => handleBackgroundEffectChange("blur", v)} max={50} unit="px" />
              <SliderControl label="Motion Blur" value={backgroundEffects.motionBlur} onChange={(v) => handleBackgroundEffectChange("motionBlur", v)} max={100} unit="px" />
              <SliderControl label="Watercolor" value={backgroundEffects.watercolor} onChange={(v) => handleBackgroundEffectChange("watercolor", v)} max={100} />
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Pattern</label>
                <select
                  value={backgroundEffects.pattern}
                  onChange={(e) => handleBackgroundEffectChange("pattern", e.target.value as BackgroundEffects["pattern"])}
                  className="w-full bg-neutral-800 text-white text-sm rounded-md p-2 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="none">None</option>
                  <option value="dots">Dots</option>
                  <option value="grid">Grid</option>
                  <option value="lines">Lines</option>
                </select>
              </div>
              <SliderControl label="Pattern Opacity" value={backgroundEffects.patternOpacity} onChange={(v) => handleBackgroundEffectChange("patternOpacity", v)} min={0} max={1} step={0.01} disabled={backgroundEffects.pattern === "none"} />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="p-4 border-t border-neutral-800 space-y-4 bg-neutral-900/50 backdrop-blur-sm fixed bottom-0 left-0 right-0 z-50 lg:relative lg:bottom-auto lg:left-auto lg:right-auto lg:bg-transparent lg:border-none lg:p-0">
        <div className="flex space-x-3 mb-3">
          <button
            onClick={() => setIsDevModeOpen(true)}
            className="flex-1 flex items-center justify-center space-x-2 p-2 bg-transparent hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-all duration-200 border border-neutral-800 hover:border-neutral-700 group text-sm font-medium"
          >
            <Code className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>Dev Mode</span>
          </button>
          {/* Placeholder for potential other secondary actions */}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onDownloadSingle}
            disabled={isDownloading}
            className="flex-1 flex items-center justify-center space-x-2 p-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDownloading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Export PNG</span>
              </>
            )}
          </button>
          <div className="relative" ref={downloadMenuRef}>
            <button onClick={() => setIsDownloadMenuOpen(!isDownloadMenuOpen)} className="h-full px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl transition-colors border border-neutral-700">
              <ChevronUp className={`w-5 h-5 transition-transform duration-200 ${isDownloadMenuOpen ? "rotate-180" : ""}`} />
            </button>
            {isDownloadMenuOpen && (
              <div className="absolute bottom-full right-0 mb-2 w-48 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200">
                <button
                  onClick={() => {
                    onDownloadZip();
                    setIsDownloadMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download ZIP</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <DevModeModal
        isOpen={isDevModeOpen}
        onClose={() => setIsDevModeOpen(false)}
        config={{
          imageSettings,
          backgroundEffects,
          gradient,
        }}
        onApply={handleDevModeApply}
      />
    </div>
  );
};
