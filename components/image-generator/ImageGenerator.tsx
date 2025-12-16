"use client";
import React, { useState, useRef, useCallback, useEffect } from "react";
import { Controls, PRESET_BACKGROUNDS } from "./Controls";
import { ImagePreview } from "./ImagePreview";
import { generateRandomGradient, gradientToString } from "./utils/gradient";
import type { AspectRatio, Gradient, ImageSettings, BackgroundEffects, TextEffects, TextObject, Selection, UploadedImage, DrawingMode, ArrowObject, CounterObject, RedactObject, ShapeObject, CanvasObject } from "./types";
import { FONTS } from "./templates";
import { Type, Undo, Trash2, ZoomIn, ZoomOut, Wand2, ArrowUpRight, Hash, EyeOff, Square, Circle, Triangle, Paintbrush, CounterIcon } from "./icons";
import * as htmlToImage from "html-to-image";
import JSZip from "jszip";
import { Slider } from "./ui/Slider";
import { ColorPicker } from "./ui/ColorPicker";

const DEFAULT_BACKGROUND_EFFECTS: BackgroundEffects = {
  noiseOpacity: 0.29,
  vignetteOpacity: 0.49,
  blur: 1,
  motionBlur: 2,
  watercolor: 0,
  pattern: "none",
  patternOpacity: 0.1,
};

const DEFAULT_TEXT_EFFECTS: TextEffects = {
  isGlassmorphic: false,
  glassColor: "#ffffff",
  glassOpacity: 0.15,
  shadow: { color: "#000000", offsetX: 2, offsetY: 4, blur: 10, opacity: 0.3 },
  stroke: { color: "#000000", width: 0 },
  blur: 0,
};

const createInitialText = (): TextObject => ({
  id: `text-${Date.now()}`,
  content: "Your Text Here",
  yPosition: 50,
  xPosition: 50,
  fontFamily: FONTS[0].family,
  fontColor: "#ffffff",
  fontSizeScale: 1,
});

const createInitialCounter = (count: number = 1): CounterObject => ({
  id: `counter-${Date.now()}`,
  type: "counter",
  x: 50,
  y: 50,
  count,
  format: "number",
  color: "#ef4444",
  scale: 1,
});

const createInitialShape = (shapeType: "rect" | "circle" = "rect"): ShapeObject => ({
  id: `shape-${Date.now()}`,
  type: "shape",
  shapeType,
  x: 50,
  y: 50,
  width: 20,
  height: 20,
  fill: "transparent",
  stroke: "#ef4444",
  strokeWidth: 4,
});

// Redact is usually drawn, but we can start with a default box
const createInitialRedact = (): RedactObject => ({
  id: `redact-${Date.now()}`,
  type: "redact",
  x: 40,
  y: 40,
  width: 20,
  height: 10,
  mode: "blur",
});

const initialText = createInitialText();
const initialAllTextsState: Record<number, TextObject[]> = { [-1]: [], 0: [] };
const initialSelectionState: Selection | null = null;

interface HistoryState {
  texts: Record<number, TextObject[]>;
  arrows: Record<number, ArrowObject[]>;
  counters: Record<number, CounterObject[]>;
  redactions: Record<number, RedactObject[]>;
  shapes: Record<number, ShapeObject[]>;
}

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
      <span className="text-xs font-mono text-neutral-500 w-12 text-right tabular-nums">
        {value.toFixed(label === "Opacity" || step < 1 ? 2 : 0)}
        {unit}
      </span>
    </div>
    <Slider value={[value]} onValueChange={(vals) => onChange(vals[0])} min={min} max={max} step={step} disabled={disabled} className="py-1" />
  </div>
);

const StylePopover: React.FC<{
  selectedObject: CanvasObject;
  selectionType: "text" | "arrow" | "counter" | "redact" | "shape";
  textEffects: TextEffects;
  onUpdateText: (props: Partial<Omit<TextObject, "id">>) => void;
  onUpdateArrow: (props: Partial<Omit<ArrowObject, "id" | "type">>) => void;
  onUpdateCounter: (props: Partial<Omit<CounterObject, "id" | "type">>) => void;
  onUpdateRedact: (props: Partial<Omit<RedactObject, "id" | "type">>) => void;
  onUpdateShape: (props: Partial<Omit<ShapeObject, "id" | "type">>) => void;
  onUpdateEffects: (key: keyof TextEffects, value: TextEffects[keyof TextEffects]) => void;
  onUpdateSubEffects: (prop: "shadow" | "stroke", key: string, value: string | number) => void;
}> = ({ selectedObject, selectionType, textEffects, onUpdateText, onUpdateArrow, onUpdateCounter, onUpdateRedact, onUpdateShape, onUpdateEffects, onUpdateSubEffects }) => {
  const [activeTab, setActiveTab] = useState("style");

  const TabButton: React.FC<{ name: string; label: string }> = ({ name, label }) => (
    <button onClick={() => setActiveTab(name)} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === name ? "bg-neutral-600 text-white" : "text-neutral-400 hover:text-white"}`}>
      {label}
    </button>
  );

  if (selectionType === "arrow") {
    const arrow = selectedObject as ArrowObject;
    return (
      <div
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-80 bg-neutral-800/80 backdrop-blur-xl rounded-xl shadow-2xl shadow-black/30 border border-white/10 z-50 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="p-4 space-y-4">
          <h3 className="text-sm font-medium text-white border-b border-white/10 pb-2 mb-2">Arrow Style</h3>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-neutral-300">Color</label>
            <ColorPicker color={arrow.color} onChange={(c) => onUpdateArrow({ color: c })} />
          </div>
          <SliderControl label="Stroke Width" value={arrow.strokeWidth} onChange={(v) => onUpdateArrow({ strokeWidth: v })} min={1} max={20} step={1} unit="px" />
        </div>
      </div>
    );
  }

  if (selectionType === "counter") {
    const counter = selectedObject as CounterObject;
    return (
      <div
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-80 bg-neutral-800/80 backdrop-blur-xl rounded-xl shadow-2xl shadow-black/30 border border-white/10 z-50 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="p-4 space-y-4">
          <h3 className="text-sm font-medium text-white border-b border-white/10 pb-2 mb-2">Counter Style</h3>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-neutral-300">Color</label>
            <ColorPicker color={counter.color} onChange={(c) => onUpdateCounter({ color: c })} />
          </div>
          <SliderControl label="Scale" value={counter.scale} onChange={(v) => onUpdateCounter({ scale: v })} min={0.5} max={3} step={0.1} />
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-neutral-300">Count</label>
            <input
              type="number"
              value={counter.count}
              onChange={(e) => onUpdateCounter({ count: parseInt(e.target.value) || 0 })}
              className="w-20 bg-neutral-700 text-white text-sm rounded-md p-2 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    );
  }

  if (selectionType === "redact") {
    const redact = selectedObject as RedactObject;
    return (
      <div
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-80 bg-neutral-800/80 backdrop-blur-xl rounded-xl shadow-2xl shadow-black/30 border border-white/10 z-50 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="p-4 space-y-4">
          <h3 className="text-sm font-medium text-white border-b border-white/10 pb-2 mb-2">Redact Style</h3>
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">Mode</label>
            <div className="flex bg-neutral-700 p-1 rounded-lg">
              <button
                onClick={() => onUpdateRedact({ mode: "blur" })}
                className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${redact.mode === "blur" ? "bg-neutral-600 text-white shadow-sm" : "text-neutral-400 hover:text-white"}`}
              >
                Blur
              </button>
              <button
                onClick={() => onUpdateRedact({ mode: "pixelate" })}
                className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${redact.mode === "pixelate" ? "bg-neutral-600 text-white shadow-sm" : "text-neutral-400 hover:text-white"}`}
              >
                Pixelate
              </button>
              <button
                onClick={() => onUpdateRedact({ mode: "solid" })}
                className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${redact.mode === "solid" ? "bg-neutral-600 text-white shadow-sm" : "text-neutral-400 hover:text-white"}`}
              >
                Solid
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectionType === "shape") {
    const shape = selectedObject as ShapeObject;
    return (
      <div
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-80 bg-neutral-800/80 backdrop-blur-xl rounded-xl shadow-2xl shadow-black/30 border border-white/10 z-50 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="p-4 space-y-4">
          <h3 className="text-sm font-medium text-white border-b border-white/10 pb-2 mb-2">Shape Style</h3>
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">Type</label>
            <div className="flex bg-neutral-700 p-1 rounded-lg">
              <button onClick={() => onUpdateShape({ shapeType: "rect" })} className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${shape.shapeType === "rect" ? "bg-neutral-600 text-white" : "text-neutral-400"}`}>
                Rect
              </button>
              <button onClick={() => onUpdateShape({ shapeType: "circle" })} className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${shape.shapeType === "circle" ? "bg-neutral-600 text-white" : "text-neutral-400"}`}>
                Circle
              </button>
              <button onClick={() => onUpdateShape({ shapeType: "triangle" })} className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${shape.shapeType === "triangle" ? "bg-neutral-600 text-white" : "text-neutral-400"}`}>
                Triangle
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-neutral-300">Stroke</label>
            <ColorPicker color={shape.stroke} onChange={(c) => onUpdateShape({ stroke: c })} />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-neutral-300">Fill</label>
            <div className="flex items-center space-x-2">
              {shape.fill === "transparent" && <span className="text-xs text-neutral-400">None</span>}
              <ColorPicker color={shape.fill === "transparent" ? "#ffffff" : shape.fill} onChange={(c) => onUpdateShape({ fill: c })} />
              <button onClick={() => onUpdateShape({ fill: shape.fill === "transparent" ? "#ffffff" : "transparent" })} className="text-xs text-blue-400 hover:text-blue-300">
                {shape.fill === "transparent" ? "Add Fill" : "Clear"}
              </button>
            </div>
          </div>
          <SliderControl label="Stroke Width" value={shape.strokeWidth} onChange={(v) => onUpdateShape({ strokeWidth: v })} min={0} max={20} step={1} unit="px" />
        </div>
      </div>
    );
  }

  const text = selectedObject as TextObject;

  return (
    <div
      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-80 bg-neutral-800/80 backdrop-blur-xl rounded-xl shadow-2xl shadow-black/30 border border-white/10 z-50 overflow-hidden"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="p-2 bg-neutral-900/30">
        <div className="flex items-center space-x-1">
          <TabButton name="style" label="Style" />
          <TabButton name="effects" label="Effects" />
          <TabButton name="shadow" label="Shadow" />
          <TabButton name="stroke" label="Stroke" />
        </div>
      </div>
      <div className="p-4">
        {activeTab === "style" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">Font</label>
              <select
                value={text.fontFamily}
                onChange={(e) => onUpdateText({ fontFamily: e.target.value })}
                className="w-full bg-neutral-700 text-white text-sm rounded-md p-2 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {FONTS.map((f) => (
                  <option key={f.name} value={f.family} style={{ fontFamily: f.family }}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-300">Color</label>
              <ColorPicker color={text.fontColor} onChange={(c) => onUpdateText({ fontColor: c })} />
            </div>
            <SliderControl label="Size" value={text.fontSizeScale || 1} onChange={(v) => onUpdateText({ fontSizeScale: v })} min={0.5} max={5} step={0.1} />
          </div>
        )}
        {activeTab === "effects" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="glass-text-toggle" className="text-sm font-medium text-neutral-300">
                Glassmorphism
              </label>
              <button
                role="switch"
                aria-checked={textEffects.isGlassmorphic}
                onClick={() => onUpdateEffects("isGlassmorphic", !textEffects.isGlassmorphic)}
                id="glass-text-toggle"
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${textEffects.isGlassmorphic ? "bg-blue-600" : "bg-neutral-700"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${textEffects.isGlassmorphic ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
            {textEffects.isGlassmorphic && (
              <div className="space-y-4 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-neutral-300">Glass Color</label>
                  <ColorPicker color={textEffects.glassColor} onChange={(c) => onUpdateEffects("glassColor", c)} />
                </div>
                <SliderControl label="Glass Opacity" value={textEffects.glassOpacity} onChange={(v) => onUpdateEffects("glassOpacity", v)} min={0} max={1} step={0.01} />
              </div>
            )}
            <SliderControl label="Blur" value={textEffects.blur} onChange={(v) => onUpdateEffects("blur", v)} min={0} max={20} step={0.1} unit="px" />
          </div>
        )}
        {activeTab === "shadow" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              <SliderControl label="Blur" value={textEffects.shadow.blur} onChange={(v) => onUpdateSubEffects("shadow", "blur", v)} />
              <SliderControl label="Opacity" value={textEffects.shadow.opacity} onChange={(v) => onUpdateSubEffects("shadow", "opacity", v)} min={0} max={1} step={0.01} />
              <SliderControl label="Offset X" value={textEffects.shadow.offsetX} onChange={(v) => onUpdateSubEffects("shadow", "offsetX", v)} min={-50} max={50} />
              <SliderControl label="Offset Y" value={textEffects.shadow.offsetY} onChange={(v) => onUpdateSubEffects("shadow", "offsetY", v)} min={-50} max={50} />
            </div>
            <div className="flex items-center justify-between pt-2">
              <label className="text-sm font-medium text-neutral-300">Color</label>
              <ColorPicker color={textEffects.shadow.color} onChange={(c) => onUpdateSubEffects("shadow", "color", c)} />
            </div>
          </div>
        )}
        {activeTab === "stroke" && (
          <div className="space-y-4">
            <SliderControl label="Width" value={textEffects.stroke.width} onChange={(v) => onUpdateSubEffects("stroke", "width", v)} min={0} max={10} />
            <div className="flex items-center justify-between pt-2">
              <label className="text-sm font-medium text-neutral-300">Color</label>
              <ColorPicker color={textEffects.stroke.color} onChange={(c) => onUpdateSubEffects("stroke", "color", c)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AnnotationToolbar: React.FC<{
  onAddText: () => void;
  onAddCounter: () => void;
  onAddShape: () => void;
  onAddRedact: () => void;
  onUndo: () => void;
  onDeleteSelected: () => void;
  isObjectSelected: boolean;
  canUndo: boolean;
  children: React.ReactNode;
  isStylePopoverOpen: boolean;
  onToggleStylePopover: () => void;
  drawingMode: DrawingMode;
  setDrawingMode: React.Dispatch<React.SetStateAction<DrawingMode>>;
}> = ({ onAddText, onAddCounter, onAddShape, onAddRedact, onUndo, onDeleteSelected, isObjectSelected, canUndo, children, isStylePopoverOpen, onToggleStylePopover, drawingMode, setDrawingMode }) => {
  const ToolbarButton: React.FC<{
    onClick?: () => void;
    disabled?: boolean;
    title: string;
    isActive?: boolean;
    children: React.ReactNode;
    className?: string;
  }> = ({ onClick, disabled, title, children, className = "", isActive = false }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2.5 rounded-full transition-colors duration-200 ${isActive ? "bg-blue-600 text-white" : disabled ? "text-neutral-600" : "text-neutral-300 hover:text-white hover:bg-white/10"} ${className}`}
    >
      {children}
    </button>
  );

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center space-x-1 bg-neutral-900/50 backdrop-blur-xl p-1.5 rounded-full shadow-2xl shadow-black/30 border border-white/10 z-50">
      {isStylePopoverOpen && children}
      <ToolbarButton onClick={onAddText} title="Add Text">
        <Type className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => setDrawingMode(drawingMode === "counter" ? null : "counter")} isActive={drawingMode === "counter"} title="Add Counter">
        <CounterIcon className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => setDrawingMode(drawingMode === "arrow" ? null : "arrow")} isActive={drawingMode === "arrow"} title="Draw Arrow">
        <ArrowUpRight className="w-5 h-5" />
      </ToolbarButton>

      <ToolbarButton onClick={onToggleStylePopover} disabled={!isObjectSelected} title="Style" isActive={isStylePopoverOpen}>
        <Paintbrush className="w-5 h-5" />
      </ToolbarButton>
      <div className="w-px h-6 bg-white/10 mx-1"></div>
      <ToolbarButton onClick={onUndo} disabled={!canUndo} title="Undo">
        <Undo className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton onClick={onDeleteSelected} disabled={!isObjectSelected} title="Delete Selected" className="disabled:text-neutral-600 text-neutral-300 hover:text-red-400 hover:bg-red-500/20">
        <Trash2 className="w-5 h-5" />
      </ToolbarButton>
    </div>
  );
};

const ZoomControl: React.FC<{ zoom: number; setZoom: React.Dispatch<React.SetStateAction<number>> }> = ({ zoom, setZoom }) => {
  const zoomIn = () => setZoom((z) => Math.min(3, z + 0.1));
  const zoomOut = () => setZoom((z) => Math.max(0.2, z - 0.1));
  const resetZoom = () => setZoom(1);

  return (
    <div className="absolute bottom-6 right-6 flex items-center space-x-1 bg-neutral-900/50 backdrop-blur-xl p-1 rounded-full shadow-2xl shadow-black/30 border border-white/10 z-50">
      <button onClick={zoomOut} title="Zoom Out" className="p-2 text-neutral-300 hover:text-white hover:bg-white/10 rounded-full transition-colors">
        <ZoomOut className="w-5 h-5" />
      </button>
      <button onClick={resetZoom} title="Reset Zoom" className="text-sm font-semibold text-neutral-300 hover:text-white px-2 tabular-nums w-16 h-9">
        {Math.round(zoom * 100)}%
      </button>
      <button onClick={zoomIn} title="Zoom In" className="p-2 text-neutral-300 hover:text-white hover:bg-white/10 rounded-full transition-colors">
        <ZoomIn className="w-5 h-5" />
      </button>
    </div>
  );
};

export default function ImageGenerator() {
  const [allTexts, setAllTexts] = useState<Record<number, TextObject[]>>(initialAllTextsState);
  const [allArrows, setAllArrows] = useState<Record<number, ArrowObject[]>>({});
  const [allCounters, setAllCounters] = useState<Record<number, CounterObject[]>>({});
  const [allRedactions, setAllRedactions] = useState<Record<number, RedactObject[]>>({});
  const [allShapes, setAllShapes] = useState<Record<number, ShapeObject[]>>({});
  const [selection, setSelection] = useState<Selection | null>(initialSelectionState);
  const [editing, setEditing] = useState<Selection | null>(null);

  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [gradient, setGradient] = useState<Gradient>({ colors: ["#e4c5b5", "#cd5aea"], angle: 322 });
  const [backgroundImage, setBackgroundImage] = useState<string | null>(PRESET_BACKGROUNDS.find((bg) => bg.name === "Ripple")?.url || null);

  useEffect(() => {
    // setGradient(generateRandomGradient()); // Disable random initial gradient
  }, []);
  const [backgroundEffects, setBackgroundEffects] = useState<BackgroundEffects>(DEFAULT_BACKGROUND_EFFECTS);
  const [textEffects, setTextEffects] = useState<TextEffects>(DEFAULT_TEXT_EFFECTS);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([
    {
      id: "default-foreground",
      name: "YourGPT",
      src: "https://assets.delta4infotech.com/tools/bg-beautify/YourGPT.png",
    },
  ]);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(0);
  const [imageSettings, setImageSettings] = useState<ImageSettings>({
    padding: 10,
    scale: 1,
    shadow: 20,
    corners: 6,
    alignment: "bottom-center",
    glassmorphicBorder: {
      enabled: true,
      opacity: 0.83,
      size: 6,
      color: "#ffffff",
    },
  });
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDevMode, setIsDevMode] = useState(false);
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [isStylePopoverOpen, setIsStylePopoverOpen] = useState(false);
  const [drawingMode, setDrawingMode] = useState<DrawingMode>(null);

  const singlePreviewRef = useRef<HTMLDivElement>(null);
  const previewRefs = useRef<(HTMLDivElement | null)[]>([]);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fontUrl = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@700&family=Poppins:wght@400;700&display=swap";
    fetch(fontUrl)
      .then((response) => response.text())
      .then((css) => {
        const style = document.createElement("style");
        style.textContent = css;
        document.head.appendChild(style);
      })
      .catch((err) => console.error("Failed to fetch font CSS:", err));
  }, []);

  useEffect(() => {
    previewRefs.current = previewRefs.current.slice(0, uploadedImages.length);
  }, [uploadedImages.length]);

  const pushToHistory = useCallback(() => {
    setHistory((prev) => [...prev, { texts: allTexts, arrows: allArrows, counters: allCounters, redactions: allRedactions, shapes: allShapes }]);
  }, [allTexts, allArrows, allCounters, allRedactions, allShapes]);

  const handleUndo = () => {
    if (history.length === 0) return;
    const previousState = history[history.length - 1];
    setAllTexts(previousState.texts);
    setAllArrows(previousState.arrows);
    setAllCounters(previousState.counters || {});
    setAllRedactions(previousState.redactions || {});
    setAllShapes(previousState.shapes || {});
    setHistory(history.slice(0, -1));
    setSelection(null);
    setEditing(null);
  };

  const handleAddText = useCallback(() => {
    const activeCanvasKey = activeImageIndex !== null ? activeImageIndex : -1;
    pushToHistory();
    const newText = createInitialText();
    setAllTexts((prev) => ({ ...prev, [activeCanvasKey]: [...(prev[activeCanvasKey] || []), newText] }));
    setSelection({ canvasKey: activeCanvasKey, itemId: newText.id, type: "text" });
    setEditing({ canvasKey: activeCanvasKey, itemId: newText.id, type: "text" });
  }, [activeImageIndex, pushToHistory]);

  const handleArrowAdd = useCallback(
    (canvasKey: number, arrow: Omit<ArrowObject, "id" | "type">) => {
      pushToHistory();
      const newArrow: ArrowObject = {
        ...arrow,
        id: `arrow-${Date.now()}`,
        type: "arrow",
      };
      setAllArrows((prev) => ({
        ...prev,
        [canvasKey]: [...(prev[canvasKey] || []), newArrow],
      }));
      setSelection({ canvasKey, itemId: newArrow.id, type: "arrow" });
    },
    [pushToHistory]
  );

  const handleTextUpdate = useCallback((canvasKey: number, id: string, props: Partial<Omit<TextObject, "id">>) => {
    setAllTexts((prev) => {
      const newTextsForCanvas = (prev[canvasKey] || []).map((t) => (t.id === id ? { ...t, ...props } : t));
      return { ...prev, [canvasKey]: newTextsForCanvas };
    });
  }, []);

  const handleTextUpdateWithHistory = useCallback(
    (canvasKey: number, id: string, props: Partial<Omit<TextObject, "id">>) => {
      pushToHistory();
      handleTextUpdate(canvasKey, id, props);
    },
    [pushToHistory, handleTextUpdate]
  );

  const handleArrowUpdate = useCallback((canvasKey: number, id: string, props: Partial<Omit<ArrowObject, "id" | "type">>) => {
    setAllArrows((prev) => {
      const newArrowsForCanvas = (prev[canvasKey] || []).map((a) => (a.id === id ? { ...a, ...props } : a));
      return { ...prev, [canvasKey]: newArrowsForCanvas };
    });
  }, []);

  const handleArrowUpdateWithHistory = useCallback(
    (canvasKey: number, id: string, props: Partial<Omit<ArrowObject, "id" | "type">>) => {
      pushToHistory();
      handleArrowUpdate(canvasKey, id, props);
    },
    [pushToHistory, handleArrowUpdate]
  );

  const handleTextEffectsUpdate = useCallback(
    (props: Partial<TextEffects>) => {
      pushToHistory();
      setTextEffects((prev) => ({ ...prev, ...props }));
    },
    [pushToHistory]
  );

  const handleTextSubEffectChange = useCallback(
    (prop: "shadow" | "stroke", key: string, value: string | number) => {
      pushToHistory();
      setTextEffects((prev) => ({ ...prev, [prop]: { ...prev[prop], [key]: value } }));
    },
    [pushToHistory]
  );

  const handleTextDelete = useCallback(
    (canvasKey: number, id: string) => {
      pushToHistory();
      setAllTexts((prev) => {
        const newTextsForCanvas = (prev[canvasKey] || []).filter((t) => t.id !== id);
        return { ...prev, [canvasKey]: newTextsForCanvas };
      });
      if (selection?.canvasKey === canvasKey && selection.itemId === id) setSelection(null);
      if (editing?.canvasKey === canvasKey && editing.itemId === id) setEditing(null);
    },
    [selection, editing, pushToHistory]
  );

  const handleArrowDelete = useCallback(
    (canvasKey: number, id: string) => {
      pushToHistory();
      setAllArrows((prev) => {
        const newArrowsForCanvas = (prev[canvasKey] || []).filter((a) => a.id !== id);
        return { ...prev, [canvasKey]: newArrowsForCanvas };
      });
      if (selection?.canvasKey === canvasKey && selection.itemId === id) setSelection(null);
    },
    [selection, pushToHistory]
  );

  // Counter Handlers
  const handleCounterAdd = useCallback(
    (coords?: { x: number; y: number }) => {
      const activeCanvasKey = activeImageIndex !== null ? activeImageIndex : -1;
      pushToHistory();
      const existing = allCounters[activeCanvasKey] || [];
      const nextCount = existing.length > 0 ? Math.max(...existing.map((c) => c.count)) + 1 : 1;
      const newCounter = createInitialCounter(nextCount);

      if (coords) {
        newCounter.x = coords.x;
        newCounter.y = coords.y;
      }

      setAllCounters((prev) => ({ ...prev, [activeCanvasKey]: [...(prev[activeCanvasKey] || []), newCounter] }));
      setSelection({ canvasKey: activeCanvasKey, itemId: newCounter.id, type: "counter" });
    },
    [activeImageIndex, allCounters, pushToHistory]
  );

  const handleCounterUpdate = useCallback((canvasKey: number, id: string, props: Partial<Omit<CounterObject, "id" | "type">>) => {
    setAllCounters((prev) => ({
      ...prev,
      [canvasKey]: (prev[canvasKey] || []).map((c) => (c.id === id ? { ...c, ...props } : c)),
    }));
  }, []);

  const handleCounterUpdateWithHistory = useCallback(
    (canvasKey: number, id: string, props: Partial<Omit<CounterObject, "id" | "type">>) => {
      pushToHistory();
      handleCounterUpdate(canvasKey, id, props);
    },
    [pushToHistory, handleCounterUpdate]
  );

  const handleCounterDelete = useCallback(
    (canvasKey: number, id: string) => {
      pushToHistory();
      setAllCounters((prev) => {
        const currentCounters = prev[canvasKey] || [];
        const filtered = currentCounters.filter((c) => c.id !== id);
        // Renumber remaining counters
        const renumbered = filtered.map((c, index) => ({
          ...c,
          count: index + 1,
        }));
        return {
          ...prev,
          [canvasKey]: renumbered,
        };
      });
      if (selection?.itemId === id) setSelection(null);
    },
    [selection, pushToHistory]
  );

  // Redact Handlers
  const handleRedactAdd = useCallback(
    (canvasKeyParam?: number, redact?: Omit<RedactObject, "id" | "type">) => {
      pushToHistory();
      const activeCanvasKey = canvasKeyParam ?? (activeImageIndex !== null ? activeImageIndex : -1);
      const defaultRedact = createInitialRedact();
      const newRedact: RedactObject = { ...(redact || defaultRedact), id: `redact-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, type: "redact" };
      setAllRedactions((prev) => ({ ...prev, [activeCanvasKey]: [...(prev[activeCanvasKey] || []), newRedact] }));
      setSelection({ canvasKey: activeCanvasKey, itemId: newRedact.id, type: "redact" });
      setDrawingMode(null);
    },
    [pushToHistory, activeImageIndex]
  );

  const handleRedactUpdate = useCallback((canvasKey: number, id: string, props: Partial<Omit<RedactObject, "id" | "type">>) => {
    setAllRedactions((prev) => ({
      ...prev,
      [canvasKey]: (prev[canvasKey] || []).map((r) => (r.id === id ? { ...r, ...props } : r)),
    }));
  }, []);

  const handleRedactUpdateWithHistory = useCallback(
    (canvasKey: number, id: string, props: Partial<Omit<RedactObject, "id" | "type">>) => {
      pushToHistory();
      handleRedactUpdate(canvasKey, id, props);
    },
    [pushToHistory, handleRedactUpdate]
  );

  const handleRedactDelete = useCallback(
    (canvasKey: number, id: string) => {
      pushToHistory();
      setAllRedactions((prev) => ({
        ...prev,
        [canvasKey]: (prev[canvasKey] || []).filter((r) => r.id !== id),
      }));
      if (selection?.itemId === id) setSelection(null);
    },
    [selection, pushToHistory]
  );

  const handleSetEditing = useCallback((canvasKey: number, itemId: string | null) => {
    if (itemId) {
      setEditing({ canvasKey, itemId, type: "text" });
    } else {
      setEditing(null);
    }
  }, []);

  // Shape Handlers
  const handleShapeAdd = useCallback(
    (canvasKeyParam?: number, shape?: Omit<ShapeObject, "id" | "type">) => {
      pushToHistory();
      const activeCanvasKey = canvasKeyParam ?? (activeImageIndex !== null ? activeImageIndex : -1);
      const defaultShape = createInitialShape();
      const newShape: ShapeObject = { ...(shape || defaultShape), id: `shape-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, type: "shape" };
      setAllShapes((prev) => ({ ...prev, [activeCanvasKey]: [...(prev[activeCanvasKey] || []), newShape] }));
      setSelection({ canvasKey: activeCanvasKey, itemId: newShape.id, type: "shape" });
      setDrawingMode(null);
    },
    [pushToHistory, activeImageIndex]
  );

  const handleShapeUpdate = useCallback((canvasKey: number, id: string, props: Partial<Omit<ShapeObject, "id" | "type">>) => {
    setAllShapes((prev) => ({
      ...prev,
      [canvasKey]: (prev[canvasKey] || []).map((s) => (s.id === id ? { ...s, ...props } : s)),
    }));
  }, []);

  const handleShapeUpdateWithHistory = useCallback(
    (canvasKey: number, id: string, props: Partial<Omit<ShapeObject, "id" | "type">>) => {
      pushToHistory();
      handleShapeUpdate(canvasKey, id, props);
    },
    [pushToHistory, handleShapeUpdate]
  );

  const handleShapeDelete = useCallback(
    (canvasKey: number, id: string) => {
      pushToHistory();
      setAllShapes((prev) => ({
        ...prev,
        [canvasKey]: (prev[canvasKey] || []).filter((s) => s.id !== id),
      }));
      if (selection?.itemId === id) setSelection(null);
    },
    [selection, pushToHistory]
  );

  const handleDeleteSelected = useCallback(() => {
    if (selection) {
      if (selection.type === "text") {
        handleTextDelete(selection.canvasKey, selection.itemId);
      } else if (selection.type === "arrow") {
        handleArrowDelete(selection.canvasKey, selection.itemId);
      } else if (selection.type === "counter") {
        handleCounterDelete(selection.canvasKey, selection.itemId);
      } else if (selection.type === "redact") {
        handleRedactDelete(selection.canvasKey, selection.itemId);
      } else if (selection.type === "shape") {
        handleShapeDelete(selection.canvasKey, selection.itemId);
      }
    }
  }, [selection, handleTextDelete, handleArrowDelete, handleCounterDelete, handleRedactDelete, handleShapeDelete]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editing) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

      if ((e.key === "Delete" || e.key === "Backspace") && selection) {
        e.preventDefault();
        handleDeleteSelected();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selection, editing, handleDeleteSelected]);

  const generateNewGradient = useCallback(() => {
    setGradient(generateRandomGradient());
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    const input = event.target;
    if (!files || files.length === 0) return;
    const fileCount = files.length;
    if (uploadedImages.length + fileCount > 10) {
      alert("You can upload a maximum of 10 images.");
      input.value = "";
      return;
    }
    const newImagesPromises = Array.from(files).map((file: File) => {
      return new Promise<UploadedImage>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result && typeof e.target.result === "string") {
            resolve({ id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, src: e.target.result, name: file.name.replace(/\.[^/.]+$/, "") });
          } else {
            reject(new Error("Failed to read file"));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });
    Promise.all(newImagesPromises)
      .then((newImages) => {
        const prevUploadedLength = uploadedImages.length;
        setUploadedImages((prev) => [...prev, ...newImages]);
        setActiveImageIndex(prevUploadedLength);
        setAllTexts((prev) => {
          const newTextEntries: Record<number, TextObject[]> = {};
          const textToCarryOver = prev[-1] || [];
          newImages.forEach((_, i) => {
            const newIndex = prevUploadedLength + i;
            if (prevUploadedLength === 0 && i === 0) {
              newTextEntries[newIndex] = textToCarryOver;
            } else {
              newTextEntries[newIndex] = [];
            }
          });
          return { ...prev, ...newTextEntries };
        });
      })
      .catch((err) => console.error("Error reading files:", err))
      .finally(() => {
        if (input) input.value = "";
      });
  };

  const handleBackgroundUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => e.target?.result && setBackgroundImage(e.target.result as string);
      reader.readAsDataURL(file);
      event.target.value = "";
    }
  };

  const removeBackgroundImage = () => setBackgroundImage(null);

  const removeUploadedImage = (indexToRemove: number) => {
    pushToHistory();
    setUploadedImages((prevImages) => prevImages.filter((_, index) => index !== indexToRemove));
    setAllTexts((prevAllTexts) => {
      const newAllTexts: Record<number, TextObject[]> = { "-1": prevAllTexts[-1] || [] };
      Object.keys(prevAllTexts).forEach((keyStr) => {
        const key = parseInt(keyStr, 10);
        if (key !== -1) {
          if (key < indexToRemove) newAllTexts[key] = prevAllTexts[key];
          else if (key > indexToRemove) newAllTexts[key - 1] = prevAllTexts[key];
        }
      });
      return newAllTexts;
    });
    setActiveImageIndex((prev) => {
      if (prev === null) return null;
      if (prev === indexToRemove) return uploadedImages.length - 1 > 0 ? Math.min(prev, uploadedImages.length - 2) : null;
      if (prev > indexToRemove) return prev - 1;
      return prev;
    });
    setSelection(null);
    setEditing(null);
  };

  const removeAllUploadedImages = () => {
    pushToHistory();
    setUploadedImages([]);
    setActiveImageIndex(null);
    setAllTexts({ [-1]: allTexts[-1] || [] });
    setSelection(null);
    setEditing(null);
  };

  const generateRandomFilename = () => `d4_${Math.random().toString(36).substr(2, 6)}`;

  const handleDownloadSingle = useCallback(async () => {
    const activeIdx = activeImageIndex;
    const nodeToCapture: HTMLDivElement | null = activeIdx !== null ? (previewRefs.current[activeIdx] ?? null) : singlePreviewRef.current;
    if (!nodeToCapture) {
      alert(uploadedImages.length > 0 ? "Please select an image to download." : "Could not generate image.");
      return;
    }
    setIsDownloading(true);
    setSelection(null);
    setIsStylePopoverOpen(false);
    await new Promise((resolve) => setTimeout(resolve, 100));
    try {
      const dataUrl: string = await htmlToImage.toPng(nodeToCapture, { cacheBust: true, pixelRatio: 4, quality: 1.0 });
      const link = document.createElement("a");
      const filename = activeIdx !== null && uploadedImages[activeIdx] ? uploadedImages[activeIdx].name : generateRandomFilename();
      link.download = `${filename}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Oops, something went wrong!", err);
      alert("Could not generate image. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  }, [activeImageIndex, uploadedImages]);

  const handleDownloadZip = useCallback(async () => {
    if (uploadedImages.length < 2) return;
    setIsDownloading(true);
    setSelection(null);
    setIsStylePopoverOpen(false);
    await new Promise((resolve) => setTimeout(resolve, 100));
    try {
      const zip = new JSZip();
      for (let i = 0; i < uploadedImages.length; i++) {
        const nodeToCapture = previewRefs.current[i];
        if (nodeToCapture) {
          const dataUrl: string = await htmlToImage.toPng(nodeToCapture, { cacheBust: true, pixelRatio: 4, quality: 1.0 });
          zip.file(`${uploadedImages[i].name}.png`, dataUrl.substring(dataUrl.indexOf(",") + 1), { base64: true });
        }
      }
      const content = (await zip.generateAsync({ type: "blob" })) as Blob;
      const link = document.createElement("a");
      link.download = "d4-images.zip";
      link.href = URL.createObjectURL(content);
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("Oops, something went wrong during zip generation!", err);
      alert("Could not generate images zip. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  }, [uploadedImages]);

  const backgroundValue = gradientToString(gradient);

  const selectedObject: CanvasObject | null = selection
    ? selection.type === "text"
      ? allTexts[selection.canvasKey]?.find((t) => t.id === selection.itemId) || null
      : selection.type === "arrow"
        ? allArrows[selection.canvasKey]?.find((a) => a.id === selection.itemId) || null
        : selection.type === "counter"
          ? allCounters[selection.canvasKey]?.find((c) => c.id === selection.itemId) || null
          : selection.type === "shape"
            ? allShapes[selection.canvasKey]?.find((s) => s.id === selection.itemId) || null
            : selection.type === "redact"
              ? allRedactions[selection.canvasKey]?.find((r) => r.id === selection.itemId) || null
              : null
    : null;

  const hasTextOnCanvas = Object.values(allTexts).some((texts) => Array.isArray(texts) && texts.length > 0);

  useEffect(() => {
    if (!selectedObject) setIsStylePopoverOpen(false);
  }, [selectedObject]);

  useEffect(() => {
    if (drawingMode) {
      setSelection(null);
      setIsStylePopoverOpen(false);
    }
  }, [drawingMode]);

  return (
    <div className="h-screen overflow-hidden bg-black text-neutral-100 font-sans flex flex-col lg:flex-row">
      <header className="p-4 border-b border-neutral-800 lg:hidden">
        <h1 className="text-xl font-semibold text-center">Image Studio</h1>
      </header>
      <aside className="w-full lg:w-[380px] xl:w-[400px] bg-neutral-900/70 backdrop-blur-sm p-6 border-r border-neutral-800 overflow-y-auto order-2 lg:order-1">
        <Controls
          aspectRatio={aspectRatio}
          setAspectRatio={setAspectRatio}
          gradient={gradient}
          setGradient={setGradient}
          backgroundImage={backgroundImage}
          handleBackgroundUpload={handleBackgroundUpload}
          removeBackgroundImage={removeBackgroundImage}
          setBackgroundImage={setBackgroundImage}
          backgroundEffects={backgroundEffects}
          setBackgroundEffects={setBackgroundEffects}
          textEffects={textEffects}
          setTextEffects={setTextEffects}
          imageSettings={imageSettings}
          setImageSettings={setImageSettings}
          uploadedImages={uploadedImages}
          activeImageIndex={activeImageIndex}
          setActiveImageIndex={setActiveImageIndex}
          handleFileUpload={handleFileUpload}
          removeUploadedImage={removeUploadedImage}
          removeAllUploadedImages={removeAllUploadedImages}
          generateNewGradient={generateNewGradient}
          onDownloadSingle={handleDownloadSingle}
          onDownloadZip={handleDownloadZip}
          isDownloading={isDownloading}
          isDevMode={isDevMode}
          setIsDevMode={setIsDevMode}
          hasTextOnCanvas={hasTextOnCanvas}
          drawingMode={drawingMode}
          setDrawingMode={setDrawingMode}
        />
      </aside>
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 bg-black/50 relative order-1 lg:order-2 overflow-hidden">
        <div
          className="w-full h-full overflow-auto flex"
          onClick={() => {
            setSelection(null);
            setIsStylePopoverOpen(false);
          }}
        >
          <div className="m-auto transition-transform duration-200 ease-in-out" style={{ transform: `scale(${canvasZoom})`, transformOrigin: "center" }}>
            {uploadedImages.length > 0 ? (
              <div className={uploadedImages.length > 1 ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 p-4 w-[90vw]" : "p-4 w-[min(80vh,90vw,1200px)]"}>
                {uploadedImages.map((image, index) => (
                  <div key={image.id} className="w-full" onClick={(e) => e.stopPropagation()}>
                    <ImagePreview
                      ref={(el) => {
                        previewRefs.current[index] = el;
                      }}
                      canvasKey={index}
                      isActive={activeImageIndex === index}
                      onActivate={() => setActiveImageIndex(index)}
                      previewContainerRef={previewContainerRef}
                      aspectRatio={aspectRatio}
                      backgroundValue={backgroundValue}
                      backgroundImage={backgroundImage}
                      backgroundEffects={backgroundEffects}
                      textEffects={textEffects}
                      uploadedImage={image.src}
                      imageSettings={imageSettings}
                      texts={allTexts[index] || []}
                      arrows={allArrows[index] || []}
                      counters={allCounters[index] || []}
                      redactions={allRedactions[index] || []}
                      shapes={allShapes[index] || []}
                      onTextUpdate={(id: string, props: Partial<Omit<TextObject, "id">>) => handleTextUpdate(index, id, props)}
                      onTextUpdateWithHistory={(id: string, props: Partial<Omit<TextObject, "id">>) => handleTextUpdateWithHistory(index, id, props)}
                      onTextDelete={(id: string) => handleTextDelete(index, id)}
                      onArrowAdd={(arrow: Omit<ArrowObject, "id" | "type">) => handleArrowAdd(index, arrow)}
                      onArrowUpdate={(id: string, props: Partial<Omit<ArrowObject, "id" | "type">>) => handleArrowUpdate(index, id, props)}
                      onArrowUpdateWithHistory={(id: string, props: Partial<Omit<ArrowObject, "id" | "type">>) => handleArrowUpdateWithHistory(index, id, props)}
                      onArrowDelete={(id: string) => handleArrowDelete(index, id)}
                      onCounterAdd={handleCounterAdd}
                      onCounterUpdate={(id, props) => handleCounterUpdate(index, id, props)}
                      onCounterUpdateWithHistory={(id, props) => handleCounterUpdateWithHistory(index, id, props)}
                      onCounterDelete={(id) => handleCounterDelete(index, id)}
                      onRedactAdd={(redact) => handleRedactAdd(index, redact)}
                      onRedactUpdate={(id, props) => handleRedactUpdate(index, id, props)}
                      onRedactUpdateWithHistory={(id, props) => handleRedactUpdateWithHistory(index, id, props)}
                      onRedactDelete={(id) => handleRedactDelete(index, id)}
                      onShapeAdd={(shape) => handleShapeAdd(index, shape)}
                      onShapeUpdate={(id, props) => handleShapeUpdate(index, id, props)}
                      onShapeUpdateWithHistory={(id, props) => handleShapeUpdateWithHistory(index, id, props)}
                      onShapeDelete={(id) => handleShapeDelete(index, id)}
                      selection={selection}
                      onSelectObject={(canvasKey: number, itemId: string | null, type: any) => (itemId ? setSelection({ canvasKey, itemId, type }) : setSelection(null))}
                      editing={editing}
                      onSetEditing={handleSetEditing}
                      drawingMode={drawingMode}
                      setDrawingMode={setDrawingMode}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 w-[min(80vh,90vw,1200px)]" onClick={(e) => e.stopPropagation()}>
                <ImagePreview
                  ref={singlePreviewRef}
                  canvasKey={-1}
                  isActive={true}
                  onActivate={() => {}}
                  previewContainerRef={previewContainerRef}
                  aspectRatio={aspectRatio}
                  backgroundValue={backgroundValue}
                  backgroundImage={backgroundImage}
                  backgroundEffects={backgroundEffects}
                  textEffects={textEffects}
                  uploadedImage={null}
                  imageSettings={imageSettings}
                  texts={allTexts[-1] || []}
                  arrows={allArrows[-1] || []}
                  counters={allCounters[-1] || []}
                  redactions={allRedactions[-1] || []}
                  shapes={allShapes[-1] || []}
                  onTextUpdate={(id: string, props: Partial<Omit<TextObject, "id">>) => handleTextUpdate(-1, id, props)}
                  onTextUpdateWithHistory={(id: string, props: Partial<Omit<TextObject, "id">>) => handleTextUpdateWithHistory(-1, id, props)}
                  onTextDelete={(id: string) => handleTextDelete(-1, id)}
                  onArrowAdd={(arrow: Omit<ArrowObject, "id" | "type">) => handleArrowAdd(-1, arrow)}
                  onArrowUpdate={(id: string, props: Partial<Omit<ArrowObject, "id" | "type">>) => handleArrowUpdate(-1, id, props)}
                  onArrowUpdateWithHistory={(id: string, props: Partial<Omit<ArrowObject, "id" | "type">>) => handleArrowUpdateWithHistory(-1, id, props)}
                  onArrowDelete={(id: string) => handleArrowDelete(-1, id)}
                  onCounterAdd={handleCounterAdd}
                  onCounterUpdate={(id, props) => handleCounterUpdate(-1, id, props)}
                  onCounterUpdateWithHistory={(id, props) => handleCounterUpdateWithHistory(-1, id, props)}
                  onCounterDelete={(id) => handleCounterDelete(-1, id)}
                  onRedactAdd={(redact) => handleRedactAdd(-1, redact)}
                  onRedactUpdate={(id, props) => handleRedactUpdate(-1, id, props)}
                  onRedactUpdateWithHistory={(id, props) => handleRedactUpdateWithHistory(-1, id, props)}
                  onRedactDelete={(id) => handleRedactDelete(-1, id)}
                  onShapeAdd={(shape) => handleShapeAdd(-1, shape)}
                  onShapeUpdate={(id, props) => handleShapeUpdate(-1, id, props)}
                  onShapeUpdateWithHistory={(id, props) => handleShapeUpdateWithHistory(-1, id, props)}
                  onShapeDelete={(id) => handleShapeDelete(-1, id)}
                  selection={selection}
                  onSelectObject={(canvasKey: number, itemId: string | null, type: any) => (itemId ? setSelection({ canvasKey, itemId, type }) : setSelection(null))}
                  editing={editing}
                  onSetEditing={handleSetEditing}
                  drawingMode={drawingMode}
                  setDrawingMode={setDrawingMode}
                />
              </div>
            )}
          </div>
        </div>
        <AnnotationToolbar
          onAddText={handleAddText}
          onAddCounter={handleCounterAdd}
          onAddShape={handleShapeAdd}
          onAddRedact={handleRedactAdd}
          onUndo={handleUndo}
          onDeleteSelected={handleDeleteSelected}
          isObjectSelected={!!selectedObject}
          canUndo={history.length > 0}
          isStylePopoverOpen={isStylePopoverOpen}
          onToggleStylePopover={() => setIsStylePopoverOpen((p) => !p)}
          drawingMode={drawingMode}
          setDrawingMode={setDrawingMode}
        >
          {selectedObject && (
            <StylePopover
              selectedObject={selectedObject}
              selectionType={selection!.type}
              textEffects={textEffects}
              onUpdateText={(props) => selection?.type === "text" && handleTextUpdateWithHistory(selection.canvasKey, selectedObject.id, props)}
              onUpdateArrow={(props) => selection?.type === "arrow" && handleArrowUpdateWithHistory(selection.canvasKey, selectedObject.id, props)}
              onUpdateCounter={(props) => selection?.type === "counter" && handleCounterUpdateWithHistory(selection.canvasKey, selectedObject.id, props)}
              onUpdateRedact={(props) => selection?.type === "redact" && handleRedactUpdateWithHistory(selection.canvasKey, selectedObject.id, props)}
              onUpdateShape={(props) => selection?.type === "shape" && handleShapeUpdateWithHistory(selection.canvasKey, selectedObject.id, props)}
              onUpdateEffects={(key, value) => handleTextEffectsUpdate({ [key]: value })}
              onUpdateSubEffects={handleTextSubEffectChange}
            />
          )}
        </AnnotationToolbar>
        <ZoomControl zoom={canvasZoom} setZoom={setCanvasZoom} />
      </main>
    </div>
  );
}
