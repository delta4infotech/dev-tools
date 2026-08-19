"use client";
import React, { useState, useRef, useCallback, useEffect } from "react";
import { Controls, PRESET_BACKGROUNDS } from "./Controls";
import { ImagePreview } from "./ImagePreview";
import { generateRandomGradient, gradientToString } from "./utils/gradient";
import type { AspectRatio, Gradient, ImageSettings, BackgroundEffects, TextEffects, TextObject, Selection, UploadedImage, DrawingMode, ArrowObject, ArrowDefaults, ArrowLineStyle, ArrowHeadStyle, CounterObject, CounterDefaults, CounterFormat, RedactObject, ShapeObject, CanvasObject, BrushObject, BrushDefaults } from "./types";
import { FONTS } from "./templates";
import { Type, Undo, Redo, Trash2, ZoomIn, ZoomOut, Wand2, ArrowUpRight, Hash, EyeOff, Square, Circle, Triangle, Paintbrush, CounterIcon, Move, Upload, Pencil, Crop } from "./icons";
import * as htmlToImage from "html-to-image";
import JSZip from "jszip";
import { Slider } from "./ui/Slider";
import { ColorPicker } from "./ui/ColorPicker";
import { DevModeModal } from "./DevModeModal";

const DEFAULT_BACKGROUND_EFFECTS: BackgroundEffects = {
  noiseOpacity: 0.29,
  vignetteOpacity: 0.49,
  blur: 1,
  motionBlur: 2,
  watercolor: 0,
  pattern: "none",
  patternOpacity: 0.1,
  canvasCornerRadius: 16,
};

const DEFAULT_TEXT_EFFECTS: TextEffects = {
  isGlassmorphic: false,
  glassColor: "#ffffff",
  glassOpacity: 0.15,
  shadow: { color: "#000000", offsetX: 2, offsetY: 4, blur: 10, opacity: 0.3 },
  stroke: { color: "#000000", width: 0 },
  blur: 0,
};

const DEFAULT_IMAGE_SETTINGS: ImageSettings = {
  padding: 10,
  scale: 1,
  shadow: 20,
  corners: 6,
  alignment: "middle-center",
  glassmorphicBorder: {
    enabled: true,
    opacity: 0.83,
    size: 6,
    color: "#ffffff",
  },
};

const createInitialText = (): TextObject => ({
  id: `text-${Date.now()}`,
  content: "Your Text Here",
  yPosition: 50,
  xPosition: 50,
  fontFamily: FONTS[0].family,
  fontColor: "#ffffff",
  fontSizeScale: 0.4,
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
  brushes: Record<number, BrushObject[]>;
  uploadedImages: UploadedImage[];
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
  selectionType: "text" | "arrow" | "counter" | "redact" | "shape" | "brush";
  textEffects: TextEffects;
  onUpdateText: (props: Partial<Omit<TextObject, "id">>) => void;
  onUpdateArrow: (props: Partial<Omit<ArrowObject, "id" | "type">>) => void;
  onUpdateCounter: (props: Partial<Omit<CounterObject, "id" | "type">>) => void;
  onUpdateRedact: (props: Partial<Omit<RedactObject, "id" | "type">>) => void;
  onUpdateShape: (props: Partial<Omit<ShapeObject, "id" | "type">>) => void;
  onUpdateEffects: (key: keyof TextEffects, value: TextEffects[keyof TextEffects]) => void;
  onUpdateSubEffects: (prop: "shadow" | "stroke", key: string, value: string | number) => void;
  applyToAll: boolean;
  onToggleApplyToAll: (value: boolean) => void;
}> = ({ selectedObject, selectionType, textEffects, onUpdateText, onUpdateArrow, onUpdateCounter, onUpdateRedact, onUpdateShape, onUpdateEffects, onUpdateSubEffects, applyToAll, onToggleApplyToAll }) => {
  const [activeTab, setActiveTab] = useState("style");

  const TabButton: React.FC<{ name: string; label: string }> = ({ name, label }) => (
    <button onClick={() => setActiveTab(name)} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === name ? "bg-neutral-600 text-white" : "text-neutral-400 hover:text-white"}`}>
      {label}
    </button>
  );

  const ApplyToAllCheckbox = () => (
    <label className="flex items-center space-x-2 text-xs font-medium text-neutral-400 cursor-pointer hover:text-white transition-colors border-b border-white/10 pb-4 mb-4">
      <input
        type="checkbox"
        checked={applyToAll}
        onChange={(e) => onToggleApplyToAll(e.target.checked)}
        className="rounded border-neutral-600 bg-neutral-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-neutral-800"
      />
      <span>Apply to all {selectionType}s</span>
    </label>
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
          <ApplyToAllCheckbox />
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
          <ApplyToAllCheckbox />
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
          <ApplyToAllCheckbox />
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
          <ApplyToAllCheckbox />
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
      <div className="p-4 pt-2">
        <label className="flex items-center space-x-2 mb-6 text-xs font-medium text-neutral-400 cursor-pointer hover:text-white transition-colors border-b border-white/10 pb-4">
          <input
            type="checkbox"
            checked={applyToAll}
            onChange={(e) => onToggleApplyToAll(e.target.checked)}
            className="rounded border-neutral-600 bg-neutral-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-neutral-800"
          />
          <span>Apply to all objects</span>
        </label>

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

const ArrowOptionsPopover: React.FC<{
  arrowDefaults: ArrowDefaults;
  setArrowDefaults: React.Dispatch<React.SetStateAction<ArrowDefaults>>;
}> = ({ arrowDefaults, setArrowDefaults }) => {
  const update = <K extends keyof ArrowDefaults>(key: K, value: ArrowDefaults[K]) =>
    setArrowDefaults((prev) => ({ ...prev, [key]: value }));

  const renderLinePreview = (style: ArrowLineStyle) => {
    const dash = style === "dashed" ? "5 3" : style === "dotted" ? "1 3" : undefined;
    return (
      <svg width="34" height="10" viewBox="0 0 34 10">
        <line x1="2" y1="5" x2="32" y2="5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={dash} />
      </svg>
    );
  };

  const renderHeadPreview = (head: ArrowHeadStyle) => (
    <svg width="34" height="14" viewBox="0 0 34 14">
      <line x1="2" y1="7" x2="24" y2="7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {head === "filled" && <path d="M22,2 L32,7 L22,12 Z" fill="currentColor" />}
      {head === "hollow" && <path d="M22,2 L32,7 L22,12 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />}
    </svg>
  );

  return (
    <div
      className="absolute bottom-full left-1/2 -translate-x-1/2 pb-3 w-72 z-50 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity duration-150"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="bg-neutral-800/90 backdrop-blur-xl rounded-xl shadow-2xl shadow-black/40 border border-white/10 overflow-hidden p-3 space-y-3">
        <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Arrow Defaults</div>

        <div className="flex items-center justify-between">
          <label className="text-xs text-neutral-300">Color</label>
          <ColorPicker color={arrowDefaults.color} onChange={(c) => update("color", c)} className="h-7 w-12" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-neutral-300">Stroke Width</label>
            <span className="text-xs font-mono text-neutral-500 tabular-nums">{arrowDefaults.strokeWidth}px</span>
          </div>
          <Slider value={[arrowDefaults.strokeWidth]} onValueChange={(vals) => update("strokeWidth", vals[0])} min={1} max={20} step={1} className="py-1" />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-neutral-300">Line Style</label>
          <div className="flex bg-neutral-700/60 p-0.5 rounded-lg">
            {(["solid", "dashed", "dotted"] as ArrowLineStyle[]).map((style) => (
              <button
                key={style}
                onClick={() => update("lineStyle", style)}
                className={`flex-1 py-1.5 px-1 flex items-center justify-center rounded-md transition-colors ${
                  arrowDefaults.lineStyle === style ? "bg-neutral-600 text-white" : "text-neutral-400 hover:text-white"
                }`}
                title={style}
              >
                {renderLinePreview(style)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-neutral-300">Arrow Head</label>
          <div className="flex bg-neutral-700/60 p-0.5 rounded-lg">
            {(["filled", "hollow", "none"] as ArrowHeadStyle[]).map((head) => (
              <button
                key={head}
                onClick={() => update("headStyle", head)}
                className={`flex-1 py-1.5 px-1 flex items-center justify-center rounded-md transition-colors ${
                  arrowDefaults.headStyle === head ? "bg-neutral-600 text-white" : "text-neutral-400 hover:text-white"
                }`}
                title={head}
              >
                {renderHeadPreview(head)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const BrushOptionsPopover: React.FC<{
  brushDefaults: BrushDefaults;
  setBrushDefaults: React.Dispatch<React.SetStateAction<BrushDefaults>>;
}> = ({ brushDefaults, setBrushDefaults }) => {
  const update = <K extends keyof BrushDefaults>(key: K, value: BrushDefaults[K]) =>
    setBrushDefaults((prev) => ({ ...prev, [key]: value }));

  return (
    <div
      className="absolute bottom-full left-1/2 -translate-x-1/2 pb-3 w-72 z-50 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity duration-150"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="bg-neutral-800/90 backdrop-blur-xl rounded-xl shadow-2xl shadow-black/40 border border-white/10 overflow-hidden p-3 space-y-3">
        <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Brush</div>

        <div className="space-y-1.5">
          <label className="text-xs text-neutral-300">Mode</label>
          <div className="flex bg-neutral-700/60 p-0.5 rounded-lg">
            {(["blur", "highlighter", "pencil"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => update("mode", mode)}
                className={`flex-1 py-1.5 px-2 text-xs font-medium capitalize rounded-md transition-colors ${
                  brushDefaults.mode === mode ? "bg-neutral-600 text-white" : "text-neutral-400 hover:text-white"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {brushDefaults.mode !== "blur" && (
          <div className="flex items-center justify-between">
            <label className="text-xs text-neutral-300">Color</label>
            <ColorPicker color={brushDefaults.color} onChange={(c) => update("color", c)} className="h-7 w-12" />
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-neutral-300">Size</label>
            <span className="text-xs font-mono text-neutral-500 tabular-nums">{brushDefaults.size}px</span>
          </div>
          <Slider value={[brushDefaults.size]} onValueChange={(vals) => update("size", vals[0])} min={4} max={80} step={1} className="py-1" />
        </div>
      </div>
    </div>
  );
};

const CounterOptionsPopover: React.FC<{
  counterDefaults: CounterDefaults;
  setCounterDefaults: React.Dispatch<React.SetStateAction<CounterDefaults>>;
}> = ({ counterDefaults, setCounterDefaults }) => {
  const update = <K extends keyof CounterDefaults>(key: K, value: CounterDefaults[K]) =>
    setCounterDefaults((prev) => ({ ...prev, [key]: value }));

  const previewLabel = (() => {
    const n = counterDefaults.startAt;
    if (counterDefaults.format === "roman") {
      const map: [number, string][] = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
      let num = n, out = "";
      for (const [v, s] of map) {
        while (num >= v) { out += s; num -= v; }
      }
      return out || String(n);
    }
    if (counterDefaults.format === "alpha") {
      // 1 → A, 26 → Z, 27 → AA
      let num = n, out = "";
      while (num > 0) {
        const rem = (num - 1) % 26;
        out = String.fromCharCode(65 + rem) + out;
        num = Math.floor((num - 1) / 26);
      }
      return out || "A";
    }
    return String(n);
  })();

  return (
    <div
      className="absolute bottom-full left-1/2 -translate-x-1/2 pb-3 w-72 z-50 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity duration-150"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="bg-neutral-800/90 backdrop-blur-xl rounded-xl shadow-2xl shadow-black/40 border border-white/10 overflow-hidden p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Counter</div>
          <div
            className="flex items-center justify-center rounded-full font-bold text-white text-xs"
            style={{
              width: 24 * counterDefaults.scale,
              height: 24 * counterDefaults.scale,
              minWidth: 18,
              minHeight: 18,
              backgroundColor: counterDefaults.color,
            }}
            title="Preview"
          >
            {previewLabel}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-xs text-neutral-300">Color</label>
          <ColorPicker color={counterDefaults.color} onChange={(c) => update("color", c)} className="h-7 w-12" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-neutral-300">Size</label>
            <span className="text-xs font-mono text-neutral-500 tabular-nums">{counterDefaults.scale.toFixed(2)}×</span>
          </div>
          <Slider value={[counterDefaults.scale]} onValueChange={(vals) => update("scale", vals[0])} min={0.5} max={3} step={0.1} className="py-1" />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-neutral-300">Format</label>
          <div className="flex bg-neutral-700/60 p-0.5 rounded-lg">
            {(["number", "roman", "alpha"] as CounterFormat[]).map((fmt) => (
              <button
                key={fmt}
                onClick={() => update("format", fmt)}
                className={`flex-1 py-1.5 px-2 text-xs font-medium capitalize rounded-md transition-colors ${
                  counterDefaults.format === fmt ? "bg-neutral-600 text-white" : "text-neutral-400 hover:text-white"
                }`}
                title={fmt === "number" ? "1, 2, 3..." : fmt === "roman" ? "I, II, III..." : "A, B, C..."}
              >
                {fmt === "number" ? "1, 2" : fmt === "roman" ? "I, II" : "A, B"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-xs text-neutral-300">Start at</label>
          <input
            type="number"
            value={counterDefaults.startAt}
            onChange={(e) => update("startAt", Math.max(1, parseInt(e.target.value) || 1))}
            className="w-20 bg-neutral-700 text-white text-xs rounded-md p-1.5 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 text-right tabular-nums"
            min={1}
          />
        </div>
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
  onRedo: () => void;
  onDeleteSelected: () => void;
  isObjectSelected: boolean;
  isStyleableSelected: boolean;
  canUndo: boolean;
  canRedo: boolean;
  children: React.ReactNode;
  isStylePopoverOpen: boolean;
  onToggleStylePopover: () => void;
  drawingMode: DrawingMode;
  setDrawingMode: React.Dispatch<React.SetStateAction<DrawingMode>>;
  arrowDefaults: ArrowDefaults;
  setArrowDefaults: React.Dispatch<React.SetStateAction<ArrowDefaults>>;
  brushDefaults: BrushDefaults;
  setBrushDefaults: React.Dispatch<React.SetStateAction<BrushDefaults>>;
  counterDefaults: CounterDefaults;
  setCounterDefaults: React.Dispatch<React.SetStateAction<CounterDefaults>>;
  onCrop: () => void;
  canCrop: boolean;
}> = ({ onAddText, onAddCounter, onAddShape, onAddRedact, onUndo, onRedo, onDeleteSelected, isObjectSelected, isStyleableSelected, canUndo, canRedo, children, isStylePopoverOpen, onToggleStylePopover, drawingMode, setDrawingMode, arrowDefaults, setArrowDefaults, brushDefaults, setBrushDefaults, counterDefaults, setCounterDefaults, onCrop, canCrop }) => {
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
      <div className="relative group">
        <CounterOptionsPopover counterDefaults={counterDefaults} setCounterDefaults={setCounterDefaults} />
        <ToolbarButton onClick={() => setDrawingMode(drawingMode === "counter" ? null : "counter")} isActive={drawingMode === "counter"} title="Add Counter">
          <CounterIcon className="w-5 h-5" />
        </ToolbarButton>
      </div>
      <div className="w-px h-6 bg-white/10 mx-1"></div>
      <ToolbarButton onClick={() => setDrawingMode(drawingMode === "move" ? null : "move")} isActive={drawingMode === "move"} title="Move Image (Hand Mode)">
        <Move className="w-5 h-5" />
      </ToolbarButton>
      <div className="relative group">
        <ArrowOptionsPopover arrowDefaults={arrowDefaults} setArrowDefaults={setArrowDefaults} />
        <ToolbarButton onClick={() => setDrawingMode(drawingMode === "arrow" ? null : "arrow")} isActive={drawingMode === "arrow"} title="Draw Arrow">
          <ArrowUpRight className="w-5 h-5" />
        </ToolbarButton>
      </div>
      <div className="relative group">
        <BrushOptionsPopover brushDefaults={brushDefaults} setBrushDefaults={setBrushDefaults} />
        <ToolbarButton onClick={() => setDrawingMode(drawingMode === "brush" ? null : "brush")} isActive={drawingMode === "brush"} title="Brush (blur / highlight / pencil)">
          <Pencil className="w-5 h-5" />
        </ToolbarButton>
      </div>
      <ToolbarButton onClick={onCrop} disabled={!canCrop} title="Crop Image">
        <Crop className="w-5 h-5" />
      </ToolbarButton>

      <ToolbarButton onClick={onToggleStylePopover} disabled={!isStyleableSelected} title="Style" isActive={isStylePopoverOpen}>
        <Paintbrush className="w-5 h-5" />
      </ToolbarButton>
      <div className="w-px h-6 bg-white/10 mx-1"></div>
      <ToolbarButton onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
        <Undo className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y / Ctrl+Shift+Z)">
        <Redo className="w-5 h-5" />
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
  const [allBrushes, setAllBrushes] = useState<Record<number, BrushObject[]>>({});
  const [brushDefaults, setBrushDefaults] = useState<BrushDefaults>({
    mode: "blur",
    color: "#fde047",
    size: 20,
  });
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
      src: "https://assets.delta4infotech.com/tools/bg-studio/yourgpt-dashboard.png",
    },
  ]);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(0);
  const handleImageSettingChange = <K extends keyof ImageSettings>(key: K, value: ImageSettings[K]) => {
    if (key === "alignment") {
      setUploadedImages((prevImages) => prevImages.map(img => ({ ...img, x: undefined, y: undefined })));
      setImageSettings((prev) => ({ ...prev, [key]: value, x: undefined, y: undefined }));
    } else if (key === "scale" && activeImageIndex !== null) {
      setUploadedImages((prevImages) => prevImages.map((img, index) => (
        index === activeImageIndex ? { ...img, scale: value as number } : img
      )));
    } else {
      setImageSettings((prev) => ({ ...prev, [key]: value }));
    }
  };

  const onUpdateImage = useCallback((id: string, updates: Partial<UploadedImage>) => {
    setUploadedImages((prev) => prev.map((img) => (img.id === id ? { ...img, ...updates } : img)));
  }, []);
  const [imageSettings, setImageSettings] = useState<ImageSettings>(DEFAULT_IMAGE_SETTINGS);

  const [isDownloading, setIsDownloading] = useState(false);
  const [isDevMode, setIsDevMode] = useState(false);
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [isStylePopoverOpen, setIsStylePopoverOpen] = useState(false);
  const [drawingMode, setDrawingMode] = useState<DrawingMode>(null);
  const [applyToAll, setApplyToAll] = useState(false);
  const [cropImageId, setCropImageId] = useState<string | null>(null);
  const [arrowDefaults, setArrowDefaults] = useState<ArrowDefaults>({
    color: "#ef4444",
    strokeWidth: 4,
    lineStyle: "solid",
    headStyle: "filled",
  });
  const [counterDefaults, setCounterDefaults] = useState<CounterDefaults>({
    color: "#ef4444",
    scale: 1,
    format: "number",
    startAt: 1,
  });
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const dragCounterRef = useRef(0);
  const [exportFormat, setExportFormat] = useState<"png" | "jpeg" | "webp">("png");
  const [exportQuality, setExportQuality] = useState(0.95);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copying" | "copied" | "error">("idle");

  const mainRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const zoomContentRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [zoomContentSize, setZoomContentSize] = useState<{ w: number; h: number } | null>(null);
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

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const defaultBg = PRESET_BACKGROUNDS.find((bg) => bg.name === "Ripple")?.url || null;
      const isDirty =
        history.length > 0 ||
        uploadedImages.length !== 1 ||
        uploadedImages[0].id !== "default-foreground" ||
        backgroundImage !== defaultBg;

      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [history.length, uploadedImages, backgroundImage]);

  const [redoStack, setRedoStack] = useState<HistoryState[]>([]);

  const snapshot = useCallback((): HistoryState => ({
    texts: allTexts,
    arrows: allArrows,
    counters: allCounters,
    redactions: allRedactions,
    shapes: allShapes,
    brushes: allBrushes,
    uploadedImages,
  }), [allTexts, allArrows, allCounters, allRedactions, allShapes, allBrushes, uploadedImages]);

  const applySnapshot = (s: HistoryState) => {
    setAllTexts(s.texts);
    setAllArrows(s.arrows);
    setAllCounters(s.counters || {});
    setAllRedactions(s.redactions || {});
    setAllShapes(s.shapes || {});
    setAllBrushes(s.brushes || {});
    setUploadedImages(s.uploadedImages || []);
    setSelection(null);
    setEditing(null);
  };

  const pushToHistory = useCallback(() => {
    setHistory((prev) => [...prev, snapshot()]);
    setRedoStack([]); // any new action clears redo
  }, [snapshot]);

  const getChunkSize = useCallback(() => {
    if (!imageSettings.mockup) return 1;
    if (imageSettings.mockupLayout === 'grid-3') return 3;
    if (imageSettings.mockupLayout === 'grid-2') return 2;
    return 1;
  }, [imageSettings.mockup, imageSettings.mockupLayout]);

  const getCanvasKeyForImageIndex = useCallback((imageIndex: number | null) => {
    if (imageIndex === null) return -1;
    return Math.floor(imageIndex / getChunkSize());
  }, [getChunkSize]);

  const getActiveCanvasKey = useCallback(() => getCanvasKeyForImageIndex(activeImageIndex), [activeImageIndex, getCanvasKeyForImageIndex]);

  const handleUndo = () => {
    if (history.length === 0) return;
    const previousState = history[history.length - 1];
    setRedoStack((r) => [...r, snapshot()]);
    setHistory(history.slice(0, -1));
    applySnapshot(previousState);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const nextState = redoStack[redoStack.length - 1];
    setHistory((h) => [...h, snapshot()]);
    setRedoStack(redoStack.slice(0, -1));
    applySnapshot(nextState);
  };

  const handleAddText = useCallback(() => {
    const activeCanvasKey = getActiveCanvasKey();
    pushToHistory();
    const newText = createInitialText();
    setAllTexts((prev) => ({ ...prev, [activeCanvasKey]: [...(prev[activeCanvasKey] || []), newText] }));
    setSelection({ canvasKey: activeCanvasKey, itemId: newText.id, type: "text" });
    setEditing({ canvasKey: activeCanvasKey, itemId: newText.id, type: "text" });
  }, [getActiveCanvasKey, pushToHistory]);

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
    // If updating content/position during edit/drag, we don't apply to all usually, 
    // BUT user asked "style option to apply in all". 
    // Position/Content is unlikely to be "Applied to All". 
    // For safety, let's keep basic updates local unless explicitly requested or handled in "WithHistory" which are the "commit" actions.
    // Actually, real-time dragging (without history) definitely shouldn't sync all positions, as that would look weird or be unintended.
    // So we invoke applyToAll ONLY in the 'WithHistory' versions which correspond to "finished" editing actions (like closing color picker or finishing drag).
    // HOWEVER: Style updates (color picker) call handleTextUpdate directly often? 
    // No, controls call `onUpdateText` which maps to `handleTextUpdateWithHistory` in `activeTab === 'style'`.
    // Wait, the ColorPicker calls `onUpdateText` which is `handleTextUpdateWithHistory` in the JSX below (line 1332).
    // So we implement the logic in `handleTextUpdateWithHistory`.
    setAllTexts((prev) => {
      const newTextsForCanvas = (prev[canvasKey] || []).map((t) => (t.id === id ? { ...t, ...props } : t));
      return { ...prev, [canvasKey]: newTextsForCanvas };
    });
  }, []);

  const handleTextUpdateWithHistory = useCallback(
    (canvasKey: number, id: string, props: Partial<Omit<TextObject, "id">>) => {
      pushToHistory();
      if (applyToAll) {
        setAllTexts((prev) => {
          const newAllTexts: Record<number, TextObject[]> = {};

          // Separate style properties from position/content properties
          // We only want to "Apply to All" the STYLES. 
          // Position (x, y) and Content should stay unique to the specific object unless explicitly intended (unlikely for "Style" apply).
          const { xPosition, yPosition, content, id: _id, ...styleProps } = props as any;
          const otherProps = { xPosition, yPosition, content };

          // Remove undefined keys from otherProps to avoid overwriting with undefined
          Object.keys(otherProps).forEach(key => (otherProps as any)[key] === undefined && delete (otherProps as any)[key]);

          const hasStyleUpdates = Object.keys(styleProps).length > 0;
          const hasOtherUpdates = Object.keys(otherProps).length > 0;

          Object.keys(prev).forEach((keyStr) => {
            const key = Number(keyStr);
            const texts = prev[key] || [];

            newAllTexts[key] = texts.map((t) => {
              let updatedText = { ...t };

              // Apply styles to ALL texts
              if (hasStyleUpdates) {
                updatedText = { ...updatedText, ...styleProps };
              }

              // Apply position/content ONLY to the target text
              if (hasOtherUpdates && Number(key) === canvasKey && t.id === id) {
                updatedText = { ...updatedText, ...otherProps };
              }

              return updatedText;
            });
          });
          return newAllTexts;
        });
      } else {
        handleTextUpdate(canvasKey, id, props);
      }
    },
    [pushToHistory, handleTextUpdate, applyToAll]
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
      if (applyToAll) {
        setAllArrows((prev) => {
          const newAllArrows: Record<number, ArrowObject[]> = {};

          /* Separating Props */
          const { start, end, ...styleProps } = props as any; // Arrows have start/end coords
          const otherProps = { start, end };
          Object.keys(otherProps).forEach(key => (otherProps as any)[key] === undefined && delete (otherProps as any)[key]);

          const hasStyleUpdates = Object.keys(styleProps).length > 0;
          const hasOtherUpdates = Object.keys(otherProps).length > 0;

          Object.keys(prev).forEach((keyStr) => {
            const key = Number(keyStr);
            const arrows = prev[key] || [];
            newAllArrows[key] = arrows.map(a => {
              let updatedArrow = { ...a };
              if (hasStyleUpdates) updatedArrow = { ...updatedArrow, ...styleProps };
              if (hasOtherUpdates && Number(key) === canvasKey && a.id === id) updatedArrow = { ...updatedArrow, ...otherProps };
              return updatedArrow;
            });
          });
          return newAllArrows;
        });
      } else {
        handleArrowUpdate(canvasKey, id, props);
      }
    },
    [pushToHistory, handleArrowUpdate, applyToAll]
  );

  const handleTextEffectsUpdate = useCallback(
    (props: Partial<TextEffects>) => {
      pushToHistory();
      // Text Effects are global per image setup in `ImagePreview`? 
      // Wait, `textEffects` is a single state variable in `ImageGenerator` (line 475).
      // `const [textEffects, setTextEffects] = useState<TextEffects>(DEFAULT_TEXT_EFFECTS);`
      // This means text effects are ALREADY global for all texts because there's only one state object passed to all ImagePreviews.
      // Line 1119: `textEffects={textEffects}`
      // So "Apply to All" for effects is redundant unless `textEffects` were per-canvas.
      // But they are not. So changing it changes it everywhere inherently.
      // So we don't need changes here.
      setTextEffects((prev) => ({ ...prev, ...props }));
    },
    [pushToHistory]
  );

  // Wait, `handleTextUpdateWithHistory` updates individual text object properties (font, color).
  // `handleTextEffectsUpdate` updates the shared `textEffects` (shadow, glass, stroke).
  // The user asked for "Style | Effects | Shadow | Stroke"
  // If `textEffects` is global, then Shadow/Stroke/Effects ALREADY apply to all.
  // The "Style" tab (Font, Color, Size) updates the *individual* text object.
  // So my `handleTextUpdateWithHistory` change covers the "Style" tab.
  // The other tabs (Effects, Shadow, Stroke) update `textEffects` which is already global.
  // EXCEPT: `textEffects` applies to ALL texts indiscriminately. 
  // Is that what the user wants? "Apply to all" toggle implies choice.
  // Currently, `textEffects` forces it on everyone.
  // We can't easily "un-apply" it for some without refactoring `textEffects` to be per-object.
  // But given the current architecture, those are global.
  // The user said "so that i do not have to manually change in all".
  // This implies they ARE manually changing something in all.
  // Which confirms they are talking about the "Style" tab (specific object props).
  // Global effects don't need manual repetition.
  // So focusing on `handleTextUpdateWithHistory` (and Arrow/Shape equivalents) is correct.


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
    (canvasKeyParam?: number, coords?: { x: number; y: number }) => {
      const activeCanvasKey = canvasKeyParam ?? getActiveCanvasKey();
      pushToHistory();
      const existing = allCounters[activeCanvasKey] || [];
      // Next count: continue from highest existing, but at minimum start from `counterDefaults.startAt`.
      const highest = existing.length > 0 ? Math.max(...existing.map((c) => c.count)) : counterDefaults.startAt - 1;
      const nextCount = Math.max(highest + 1, counterDefaults.startAt);
      const newCounter: CounterObject = {
        ...createInitialCounter(nextCount),
        color: counterDefaults.color,
        scale: counterDefaults.scale,
        format: counterDefaults.format,
      };

      if (coords) {
        newCounter.x = coords.x;
        newCounter.y = coords.y;
      }

      setAllCounters((prev) => ({ ...prev, [activeCanvasKey]: [...(prev[activeCanvasKey] || []), newCounter] }));
      setSelection({ canvasKey: activeCanvasKey, itemId: newCounter.id, type: "counter" });
    },
    [getActiveCanvasKey, allCounters, pushToHistory, counterDefaults]
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
      if (applyToAll) {
        setAllCounters((prev) => {
          const newAllCounters: Record<number, CounterObject[]> = {};
          const { x, y, count, ...styleProps } = props as any;
          const otherProps = { x, y, count };
          Object.keys(otherProps).forEach(key => (otherProps as any)[key] === undefined && delete (otherProps as any)[key]);

          const hasStyleUpdates = Object.keys(styleProps).length > 0;
          const hasOtherUpdates = Object.keys(otherProps).length > 0;

          Object.keys(prev).forEach((keyStr) => {
            const key = Number(keyStr);
            const counters = prev[key] || [];
            newAllCounters[key] = counters.map(c => {
              let updatedCounter = { ...c };
              if (hasStyleUpdates) updatedCounter = { ...updatedCounter, ...styleProps };
              if (hasOtherUpdates && Number(key) === canvasKey && c.id === id) updatedCounter = { ...updatedCounter, ...otherProps };
              return updatedCounter;
            });
          });
          return newAllCounters;
        });
      } else {
        handleCounterUpdate(canvasKey, id, props);
      }
    },
    [pushToHistory, handleCounterUpdate, applyToAll]
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
      if (applyToAll) {
        setAllRedactions((prev) => {
          const newAllRedactions: Record<number, RedactObject[]> = {};
          const { x, y, width, height, ...styleProps } = props as any;
          const otherProps = { x, y, width, height };
          Object.keys(otherProps).forEach(key => (otherProps as any)[key] === undefined && delete (otherProps as any)[key]);

          const hasStyleUpdates = Object.keys(styleProps).length > 0;
          const hasOtherUpdates = Object.keys(otherProps).length > 0;

          Object.keys(prev).forEach((keyStr) => {
            const key = Number(keyStr);
            const redactions = prev[key] || [];
            newAllRedactions[key] = redactions.map(r => {
              let updatedRedact = { ...r };
              if (hasStyleUpdates) updatedRedact = { ...updatedRedact, ...styleProps };
              if (hasOtherUpdates && Number(key) === canvasKey && r.id === id) updatedRedact = { ...updatedRedact, ...otherProps };
              return updatedRedact;
            });
          });
          return newAllRedactions;
        });
      } else {
        handleRedactUpdate(canvasKey, id, props);
      }
    },
    [pushToHistory, handleRedactUpdate, applyToAll]
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
      if (applyToAll) {
        setAllShapes((prev) => {
          const newAllShapes: Record<number, ShapeObject[]> = {};
          const { x, y, width, height, ...styleProps } = props as any;
          const otherProps = { x, y, width, height };
          Object.keys(otherProps).forEach(key => (otherProps as any)[key] === undefined && delete (otherProps as any)[key]);

          const hasStyleUpdates = Object.keys(styleProps).length > 0;
          const hasOtherUpdates = Object.keys(otherProps).length > 0;

          Object.keys(prev).forEach((keyStr) => {
            const key = Number(keyStr);
            const shapes = prev[key] || [];
            newAllShapes[key] = shapes.map(s => {
              let updatedShape = { ...s };
              if (hasStyleUpdates) updatedShape = { ...updatedShape, ...styleProps };
              if (hasOtherUpdates && Number(key) === canvasKey && s.id === id) updatedShape = { ...updatedShape, ...otherProps };
              return updatedShape;
            });
          });
          return newAllShapes;
        });
      } else {
        handleShapeUpdate(canvasKey, id, props);
      }
    },
    [pushToHistory, handleShapeUpdate, applyToAll]
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

  const handleBrushAdd = useCallback(
    (canvasKeyParam: number | undefined, brush: Omit<BrushObject, "id" | "type">) => {
      pushToHistory();
      const activeCanvasKey = canvasKeyParam ?? (activeImageIndex !== null ? activeImageIndex : -1);
      const newBrush: BrushObject = { ...brush, id: `brush-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, type: "brush" };
      setAllBrushes((prev) => ({ ...prev, [activeCanvasKey]: [...(prev[activeCanvasKey] || []), newBrush] }));
      setSelection({ canvasKey: activeCanvasKey, itemId: newBrush.id, type: "brush" });
    },
    [pushToHistory, activeImageIndex]
  );

  const handleBrushDelete = useCallback(
    (canvasKey: number, id: string) => {
      pushToHistory();
      setAllBrushes((prev) => ({
        ...prev,
        [canvasKey]: (prev[canvasKey] || []).filter((b) => b.id !== id),
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
      } else if (selection.type === "brush") {
        handleBrushDelete(selection.canvasKey, selection.itemId);
      }
    }
  }, [selection, handleTextDelete, handleArrowDelete, handleCounterDelete, handleRedactDelete, handleShapeDelete, handleBrushDelete]);

  const [clipboard, setClipboard] = useState<{ type: string; data: any } | null>(null);

  const handleCopySelected = useCallback(() => {
    if (!selection) return;
    const { canvasKey, itemId, type } = selection;
    let data = null;
    if (type === "text") data = allTexts[canvasKey]?.find(t => t.id === itemId);
    else if (type === "arrow") data = allArrows[canvasKey]?.find(a => a.id === itemId);
    else if (type === "counter") data = allCounters[canvasKey]?.find(c => c.id === itemId);
    else if (type === "redact") data = allRedactions[canvasKey]?.find(r => r.id === itemId);
    else if (type === "shape") data = allShapes[canvasKey]?.find(s => s.id === itemId);
    else if (type === "brush") data = allBrushes[canvasKey]?.find(b => b.id === itemId);
    
    if (data) {
      setClipboard({ type, data });
    }
  }, [selection, allTexts, allArrows, allCounters, allRedactions, allShapes, allBrushes]);

  const handlePaste = useCallback(() => {
    if (!clipboard) return;
    const activeCanvasKey = uploadedImages.length > 0 ? getActiveCanvasKey() : -1;
    
    pushToHistory();
    
    const newId = `${clipboard.type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newData = { ...clipboard.data, id: newId };
    
    // offset slightly so it doesn't perfectly overlap
    const offset = 2;
    if (newData.x !== undefined) newData.x = Math.min(100, newData.x + offset);
    if (newData.y !== undefined) newData.y = Math.min(100, newData.y + offset);
    if (newData.xPosition !== undefined) newData.xPosition = Math.min(100, newData.xPosition + offset);
    if (newData.yPosition !== undefined) newData.yPosition = Math.min(100, newData.yPosition + offset);
    if (newData.x1 !== undefined) newData.x1 = Math.min(100, newData.x1 + offset);
    if (newData.y1 !== undefined) newData.y1 = Math.min(100, newData.y1 + offset);
    if (newData.x2 !== undefined) newData.x2 = Math.min(100, newData.x2 + offset);
    if (newData.y2 !== undefined) newData.y2 = Math.min(100, newData.y2 + offset);
    if (Array.isArray(newData.points)) {
      newData.points = newData.points.map((p: any) => ({ x: Math.min(100, p.x + offset), y: Math.min(100, p.y + offset) }));
    }
    
    if (clipboard.type === "text") {
      setAllTexts(prev => ({ ...prev, [activeCanvasKey]: [...(prev[activeCanvasKey] || []), newData] }));
    } else if (clipboard.type === "arrow") {
      setAllArrows(prev => ({ ...prev, [activeCanvasKey]: [...(prev[activeCanvasKey] || []), newData] }));
    } else if (clipboard.type === "counter") {
      setAllCounters(prev => ({ ...prev, [activeCanvasKey]: [...(prev[activeCanvasKey] || []), newData] }));
    } else if (clipboard.type === "redact") {
      setAllRedactions(prev => ({ ...prev, [activeCanvasKey]: [...(prev[activeCanvasKey] || []), newData] }));
    } else if (clipboard.type === "shape") {
      setAllShapes(prev => ({ ...prev, [activeCanvasKey]: [...(prev[activeCanvasKey] || []), newData] }));
    } else if (clipboard.type === "brush") {
      setAllBrushes(prev => ({ ...prev, [activeCanvasKey]: [...(prev[activeCanvasKey] || []), newData] }));
    }
    
    setSelection({ canvasKey: activeCanvasKey, itemId: newId, type: clipboard.type as any });
  }, [clipboard, getActiveCanvasKey, uploadedImages.length, pushToHistory]);

  const addImageFiles = useCallback(
    (files: File[]) => {
      const imageFiles = files.filter((f) => f.type.startsWith("image/"));
      if (imageFiles.length === 0) return;
      if (uploadedImages.length + imageFiles.length > 10) {
        alert("You can upload a maximum of 10 images.");
        return;
      }
      const newImagesPromises = imageFiles.map((file: File) => {
        return new Promise<UploadedImage>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result && typeof e.target.result === "string") {
              const baseName = file.name ? file.name.replace(/\.[^/.]+$/, "") : `pasted-${Date.now()}`;
              resolve({ id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, src: e.target.result, name: baseName });
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
        .catch((err) => console.error("Error reading files:", err));
    },
    [uploadedImages.length]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editing) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

      if ((e.key === "Delete" || e.key === "Backspace") && selection) {
        e.preventDefault();
        handleDeleteSelected();
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.key.toLowerCase() === 'c' && selection) {
        e.preventDefault();
        handleCopySelected();
      } else if (modifier && e.key.toLowerCase() === 'v' && selection) {
        // Only handle duplicate-paste here when an object is selected.
        // Image-paste from system clipboard is handled by the document-level paste listener below.
        e.preventDefault();
        handlePaste();
      } else if (modifier && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((modifier && e.key.toLowerCase() === 'z' && e.shiftKey) || (modifier && e.key.toLowerCase() === 'y')) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selection, editing, handleDeleteSelected, handleCopySelected, handlePaste]);

  useEffect(() => {
    const handleClipboardPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (selection) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length > 0) {
        e.preventDefault();
        addImageFiles(files);
      }
    };
    window.addEventListener("paste", handleClipboardPaste);
    return () => window.removeEventListener("paste", handleClipboardPaste);
  }, [selection, addImageFiles]);

  // Ctrl/Cmd + wheel zooms the whole canvas viewport. Attached as non-passive so we can
  // preventDefault and stop the browser from zooming the whole page.
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.05 : 1 / 1.05;
      setCanvasZoom((z) => Math.min(2, Math.max(0.3, z * factor)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Measure the unscaled natural size of the canvas content (the first child of the zoom div,
  // which is the grid/single-image wrapper). We read its offsetWidth/Height which give the
  // layout box, unaffected by the parent's transform.
  useEffect(() => {
    const zoomDiv = zoomContentRef.current;
    if (!zoomDiv) return;
    const child = zoomDiv.firstElementChild as HTMLElement | null;
    if (!child) return;
    const update = () => {
      const w = child.offsetWidth;
      const h = child.offsetHeight;
      if (w > 0 && h > 0) setZoomContentSize({ w, h });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(child);
    return () => ro.disconnect();
  }, [uploadedImages.length, aspectRatio, imageSettings.mockup, imageSettings.mockupLayout]);

  const generateNewGradient = useCallback(() => {
    setGradient(generateRandomGradient());
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    const input = event.target;
    if (!files || files.length === 0) return;
    addImageFiles(Array.from(files));
    if (input) input.value = "";
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
    const remapRecord = <T,>(record: Record<number, T[]>) => {
      const remapped: Record<number, T[]> = { [-1]: record[-1] || [] };
      Object.keys(record).forEach((keyStr) => {
        const key = parseInt(keyStr, 10);
        if (key !== -1) {
          if (key < indexToRemove) remapped[key] = record[key];
          else if (key > indexToRemove) remapped[key - 1] = record[key];
        }
      });
      return remapped;
    };
    setAllTexts(remapRecord);
    setAllArrows(remapRecord);
    setAllCounters(remapRecord);
    setAllRedactions(remapRecord);
    setAllShapes(remapRecord);
    setAllBrushes(remapRecord);
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
    setAllArrows({});
    setAllCounters({});
    setAllRedactions({});
    setAllShapes({});
    setAllBrushes({});
    setSelection(null);
    setEditing(null);
  };

  const generateRandomFilename = () => `d4_${Math.random().toString(36).substr(2, 6)}`;

  const captureNode = useCallback(
    async (node: HTMLDivElement, format: "png" | "jpeg" | "webp" = "png", quality: number = 0.95): Promise<string> => {
      // Use offsetWidth/Height (unscaled layout box) so we capture at the true canvas size,
      // independent of the viewport-level canvasZoom transform applied higher in the tree.
      const width = node.offsetWidth;
      const height = node.offsetHeight;
      const options = {
        cacheBust: true,
        pixelRatio: 4,
        quality,
        width,
        height,
        // Override transform on the capture root so the cloned subtree starts at identity.
        style: { transform: "none", transformOrigin: "top left" },
      };
      if (format === "jpeg") return htmlToImage.toJpeg(node, options);
      if (format === "webp") {
        const canvas = await htmlToImage.toCanvas(node, options);
        return canvas.toDataURL("image/webp", quality);
      }
      return htmlToImage.toPng(node, options);
    },
    []
  );

  const handleDownloadSingle = useCallback(async () => {
    const activeIdx = activeImageIndex;
    const previewIndex = activeIdx !== null ? getCanvasKeyForImageIndex(activeIdx) : -1;
    const nodeToCapture: HTMLDivElement | null = activeIdx !== null ? (previewRefs.current[previewIndex] ?? null) : singlePreviewRef.current;
    if (!nodeToCapture) {
      alert(uploadedImages.length > 0 ? "Please select an image to download." : "Could not generate image.");
      return;
    }
    setIsDownloading(true);
    setSelection(null);
    setIsStylePopoverOpen(false);
    setCropImageId(null);
    const prevZoom = canvasZoom;
    setCanvasZoom(1);
    // Wait a frame for the overlay/handles to actually unmount before capturing.
    await new Promise((resolve) => setTimeout(resolve, 250));
    try {
      const dataUrl = await captureNode(nodeToCapture, exportFormat, exportQuality);
      const link = document.createElement("a");
      const filename = activeIdx !== null && uploadedImages[activeIdx] ? uploadedImages[activeIdx].name : generateRandomFilename();
      link.download = `${filename}.${exportFormat === "jpeg" ? "jpg" : exportFormat}`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Oops, something went wrong!", err);
      alert("Could not generate image. Please try again.");
    } finally {
      setIsDownloading(false);
      setCanvasZoom(prevZoom);
    }
  }, [activeImageIndex, uploadedImages, exportFormat, exportQuality, captureNode, getCanvasKeyForImageIndex, canvasZoom]);

  const handleDownloadZip = useCallback(async () => {
    if (uploadedImages.length < 2) return;
    setIsDownloading(true);
    setSelection(null);
    setIsStylePopoverOpen(false);
    setCropImageId(null);
    const prevZoom = canvasZoom;
    setCanvasZoom(1);
    await new Promise((resolve) => setTimeout(resolve, 250));
    try {
      const zip = new JSZip();
      const ext = exportFormat === "jpeg" ? "jpg" : exportFormat;
      const chunkSize = getChunkSize();
      const previewCount = Math.ceil(uploadedImages.length / chunkSize);
      for (let i = 0; i < previewCount; i++) {
        const nodeToCapture = previewRefs.current[i];
        const firstImage = uploadedImages[i * chunkSize];
        if (nodeToCapture && firstImage) {
          const dataUrl = await captureNode(nodeToCapture, exportFormat, exportQuality);
          zip.file(`${firstImage.name}.${ext}`, dataUrl.substring(dataUrl.indexOf(",") + 1), { base64: true });
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
      setCanvasZoom(prevZoom);
    }
  }, [uploadedImages, exportFormat, exportQuality, captureNode, getChunkSize, canvasZoom]);

  const handleCopyToClipboard = useCallback(async () => {
    const activeIdx = activeImageIndex;
    const previewIndex = activeIdx !== null ? getCanvasKeyForImageIndex(activeIdx) : -1;
    const nodeToCapture: HTMLDivElement | null = activeIdx !== null ? (previewRefs.current[previewIndex] ?? null) : singlePreviewRef.current;
    if (!nodeToCapture) return;
    if (typeof window === "undefined" || !navigator.clipboard || typeof ClipboardItem === "undefined") {
      setCopyStatus("error");
      setTimeout(() => setCopyStatus("idle"), 2000);
      return;
    }
    setCopyStatus("copying");
    setSelection(null);
    setIsStylePopoverOpen(false);
    setCropImageId(null);
    const prevZoom = canvasZoom;
    setCanvasZoom(1);
    await new Promise((resolve) => setTimeout(resolve, 250));
    try {
      const width = nodeToCapture.offsetWidth;
      const height = nodeToCapture.offsetHeight;
      const blob = await htmlToImage.toBlob(nodeToCapture, {
        cacheBust: true,
        pixelRatio: 4,
        quality: 1.0,
        width,
        height,
        style: { transform: "none" },
      });
      if (!blob) throw new Error("Failed to generate blob");
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      setCopyStatus("error");
      setTimeout(() => setCopyStatus("idle"), 2000);
    } finally {
      setCanvasZoom(prevZoom);
    }
  }, [activeImageIndex, getCanvasKeyForImageIndex, canvasZoom]);

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
              : selection.type === "brush"
                ? allBrushes[selection.canvasKey]?.find((b) => b.id === selection.itemId) || null
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
        <h1 className="text-xl font-semibold text-center">BG Studio</h1>
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
          imageSettings={{ ...imageSettings, scale: activeImageIndex !== null ? (uploadedImages[activeImageIndex]?.scale ?? imageSettings.scale) : imageSettings.scale }}
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
          onCopyToClipboard={handleCopyToClipboard}
          copyStatus={copyStatus}
          exportFormat={exportFormat}
          setExportFormat={setExportFormat}
          exportQuality={exportQuality}
          setExportQuality={setExportQuality}
          isDownloading={isDownloading}
          isDevMode={isDevMode}
          setIsDevMode={setIsDevMode}
          hasTextOnCanvas={hasTextOnCanvas}
          drawingMode={drawingMode}
          setDrawingMode={setDrawingMode}
          onDevModeClick={() => setIsDevMode(true)}
          isManualPosition={(() => {
            if (activeImageIndex === null) return false;
            const img = uploadedImages[activeImageIndex];
            return img?.x !== undefined && img?.y !== undefined;
          })()}
          onResetPosition={() => {
            if (activeImageIndex !== null) {
              setUploadedImages((prev) => prev.map((img, i) =>
                i === activeImageIndex ? { ...img, x: undefined, y: undefined } : img
              ));
              // Also ensure global settings match the reset, though primarily driven by uploadedImages now
              setImageSettings((prev) => ({ ...prev, x: undefined, y: undefined }));
            }
          }}
          onImageUpload={(file) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              if (e.target?.result && typeof e.target.result === "string") {
                const newImage: UploadedImage = {
                  id: `img-${Date.now()}`,
                  src: e.target.result,
                  name: file.name.replace(/\.[^/.]+$/, ""),
                };
                setUploadedImages((prev) => {
                  const newImages = [...prev, newImage];
                  setTimeout(() => setActiveImageIndex(newImages.length - 1), 0);
                  return newImages;
                });

                setAllTexts((prevTexts) => {
                  return { ...prevTexts, [uploadedImages.length]: [] };
                });
              }
            };
            reader.readAsDataURL(file);
          }}
        />
      </aside>
      <main
        ref={mainRef}
        className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 bg-black/50 relative order-1 lg:order-2 overflow-hidden"
        onDragEnter={(e) => {
          if (drawingMode) return;
          if (!Array.from(e.dataTransfer.types).includes("Files")) return;
          e.preventDefault();
          dragCounterRef.current += 1;
          setIsDraggingFile(true);
        }}
        onDragLeave={(e) => {
          if (drawingMode) return;
          if (!Array.from(e.dataTransfer.types).includes("Files")) return;
          e.preventDefault();
          dragCounterRef.current -= 1;
          if (dragCounterRef.current <= 0) {
            dragCounterRef.current = 0;
            setIsDraggingFile(false);
          }
        }}
        onDragOver={(e) => {
          if (drawingMode) return;
          if (!Array.from(e.dataTransfer.types).includes("Files")) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDrop={(e) => {
          if (drawingMode) return;
          if (!Array.from(e.dataTransfer.types).includes("Files")) return;
          e.preventDefault();
          dragCounterRef.current = 0;
          setIsDraggingFile(false);
          const files = Array.from(e.dataTransfer.files);
          if (files.length > 0) addImageFiles(files);
        }}
      >
        {isDraggingFile && (
          <div className="absolute inset-4 md:inset-8 z-40 pointer-events-none rounded-2xl border-2 border-dashed border-blue-400 bg-blue-500/10 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-blue-100">
              <Upload className="w-10 h-10" />
              <div className="text-lg font-semibold">Drop images to add</div>
              <div className="text-sm text-blue-200/80">PNG, JPEG, WebP</div>
            </div>
          </div>
        )}
        <div
          ref={scrollContainerRef}
          className={`w-full h-full overflow-auto flex flex-col items-center justify-start ${isPanning ? 'cursor-grabbing' : canvasZoom > 1 ? 'cursor-grab' : ''}`}
          onClick={() => {
            setSelection(null);
            setIsStylePopoverOpen(false);
          }}
          onPointerDown={(e) => {
            // Hold-and-drag with primary button on empty space to pan.
            // Only activate when the press lands on the scroll container itself or its
            // immediate spacer (not on an image / annotation, which has stopPropagation).
            const target = e.target as HTMLElement;
            if (e.button !== 0) return;
            if (!scrollContainerRef.current) return;
            // Don't intercept if user is in a drawing mode or pressing on an interactive element.
            if (drawingMode) return;
            // Only pan when zoomed in beyond fit.
            if (canvasZoom <= 1) return;
            // Don't start panning if click is on an image / annotation that handles its own drag.
            if (target.closest('[data-canvas-content]') && target !== scrollContainerRef.current) return;
            const startX = e.clientX;
            const startY = e.clientY;
            const startScrollLeft = scrollContainerRef.current.scrollLeft;
            const startScrollTop = scrollContainerRef.current.scrollTop;
            let didMove = false;
            setIsPanning(true);
            const onMove = (ev: PointerEvent) => {
              const dx = ev.clientX - startX;
              const dy = ev.clientY - startY;
              if (!didMove && Math.hypot(dx, dy) > 3) didMove = true;
              if (didMove && scrollContainerRef.current) {
                scrollContainerRef.current.scrollLeft = startScrollLeft - dx;
                scrollContainerRef.current.scrollTop = startScrollTop - dy;
              }
            };
            const onUp = () => {
              document.removeEventListener('pointermove', onMove);
              document.removeEventListener('pointerup', onUp);
              setIsPanning(false);
            };
            document.addEventListener('pointermove', onMove);
            document.addEventListener('pointerup', onUp);
          }}
        >
          <div
            className="flex-shrink-0 flex items-center justify-center"
            style={{
              minWidth: '100%',
              minHeight: '100%',
              // When zoomed in, grow the layout box so the scroll container shows scrollbars.
              width: zoomContentSize ? `${Math.max(zoomContentSize.w * canvasZoom, 0)}px` : '100%',
              height: zoomContentSize ? `${Math.max(zoomContentSize.h * canvasZoom, 0)}px` : '100%',
            }}
          >
          <div
            ref={zoomContentRef}
            className="w-full"
            style={{
              transform: `scale(${canvasZoom})`,
              transformOrigin: "center center",
              transition: "transform 0.15s ease-out",
            }}
          >
            {(() => {
              const chunkSize = getChunkSize();
              const chunks = [];
              for (let i = 0; i < uploadedImages.length; i += chunkSize) {
                chunks.push(uploadedImages.slice(i, i + chunkSize));
              }

              const activeChunkIndex = activeImageIndex !== null ? Math.floor(activeImageIndex / chunkSize) : null;

              if (chunks.length > 0) {
                return (
                  <div className={chunks.length > 1 ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4 w-full" : "p-4 mx-auto w-[min(80vh,90%,1200px)]"}>
                    {chunks.map((chunk, index) => (
                      <div key={chunk[0].id} className="w-full" onClick={(e) => e.stopPropagation()}>
                        <ImagePreview
                          ref={(el) => {
                            previewRefs.current[index] = el;
                          }}
                          canvasKey={index}
                          isActive={activeChunkIndex === index}
                          onActivate={() => setActiveImageIndex(index * chunkSize)}
                          previewContainerRef={previewContainerRef}
                          aspectRatio={aspectRatio}
                          backgroundValue={backgroundValue}
                          backgroundImage={backgroundImage}
                          backgroundEffects={backgroundEffects}
                          textEffects={textEffects}
                          uploadedImage={chunk[0].src}
                          uploadedImageObj={chunk[0]}
                          uploadedImages={chunk}
                          onUpdateImage={onUpdateImage}
                          imageSettings={imageSettings}
                          texts={allTexts[index] || []}
                          arrows={allArrows[index] || []}
                          arrowDefaults={arrowDefaults}
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
                          onCounterAdd={(coords) => handleCounterAdd(index, coords)}
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
                          brushes={allBrushes[index] || []}
                          brushDefaults={brushDefaults}
                          onBrushAdd={(brush) => handleBrushAdd(index, brush)}
                          onBrushDelete={(id) => handleBrushDelete(index, id)}
                          onBeginInteractionHistory={pushToHistory}
                          cropImageId={cropImageId}
                          onCropApply={(crop) => {
                            pushToHistory();
                            setUploadedImages((prev) => prev.map((i) => i.id === cropImageId ? { ...i, crop } : i));
                            setCropImageId(null);
                          }}
                          onCropCancel={() => setCropImageId(null)}
                          selection={selection}
                          onSelectObject={(canvasKey: number, itemId: string | null, type: any) => (itemId ? setSelection({ canvasKey, itemId, type }) : setSelection(null))}
                          editing={editing}
                          onSetEditing={handleSetEditing}
                          drawingMode={drawingMode}
                          setDrawingMode={setDrawingMode}
                          onImageSettingsChange={handleImageSettingChange}
                        />
                      </div>
                    ))}
                  </div>
                );
              }

              return (
                <div className="p-4 w-[min(80vh,90vw,1200px)]" onClick={(e) => e.stopPropagation()}>
                  <ImagePreview
                    ref={singlePreviewRef}
                    canvasKey={-1}
                    isActive={true}
                    onActivate={() => { }}
                    previewContainerRef={previewContainerRef}
                    aspectRatio={aspectRatio}
                    backgroundValue={backgroundValue}
                    backgroundImage={backgroundImage}
                    backgroundEffects={backgroundEffects}
                    textEffects={textEffects}
                    uploadedImage={null}
                    uploadedImageObj={null}
                    uploadedImages={[]}
                    onUpdateImage={onUpdateImage}
                    imageSettings={imageSettings}
                    drawingMode={drawingMode}
                    texts={allTexts[activeImageIndex ?? -1] || []}
                    arrows={allArrows[-1] || []}
                    arrowDefaults={arrowDefaults}
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
                    onCounterAdd={(coords) => handleCounterAdd(-1, coords)}
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
                    brushes={allBrushes[-1] || []}
                    brushDefaults={brushDefaults}
                    onBrushAdd={(brush) => handleBrushAdd(-1, brush)}
                    onBrushDelete={(id) => handleBrushDelete(-1, id)}
                    onBeginInteractionHistory={pushToHistory}
                    cropImageId={cropImageId}
                    onCropApply={(crop) => {
                      pushToHistory();
                      setUploadedImages((prev) => prev.map((i) => i.id === cropImageId ? { ...i, crop } : i));
                      setCropImageId(null);
                    }}
                    onCropCancel={() => setCropImageId(null)}
                    selection={selection}
                    onSelectObject={(canvasKey: number, itemId: string | null, type: any) => (itemId ? setSelection({ canvasKey, itemId, type }) : setSelection(null))}
                    editing={editing}
                    onSetEditing={handleSetEditing}
                    setDrawingMode={setDrawingMode}
                    onImageSettingsChange={handleImageSettingChange}
                  />
                </div>
              );
            })()}
          </div>
          </div>
        </div>
        <AnnotationToolbar
          onAddText={handleAddText}
          onAddCounter={() => handleCounterAdd()}
          onAddShape={handleShapeAdd}
          onAddRedact={handleRedactAdd}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onDeleteSelected={handleDeleteSelected}
          isObjectSelected={!!selectedObject}
          isStyleableSelected={!!selectedObject && selection?.type !== "brush"}
          canUndo={history.length > 0}
          canRedo={redoStack.length > 0}
          isStylePopoverOpen={isStylePopoverOpen}
          onToggleStylePopover={() => setIsStylePopoverOpen((p) => !p)}
          drawingMode={drawingMode}
          setDrawingMode={setDrawingMode}
          arrowDefaults={arrowDefaults}
          setArrowDefaults={setArrowDefaults}
          brushDefaults={brushDefaults}
          setBrushDefaults={setBrushDefaults}
          counterDefaults={counterDefaults}
          setCounterDefaults={setCounterDefaults}
          onCrop={() => {
            if (activeImageIndex !== null && uploadedImages[activeImageIndex]) {
              setCropImageId(uploadedImages[activeImageIndex].id);
            }
          }}
          canCrop={activeImageIndex !== null && !!uploadedImages[activeImageIndex]}
        >
          {selectedObject && selection?.type !== "brush" && (
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
              applyToAll={applyToAll}
              onToggleApplyToAll={setApplyToAll}
            />
          )}
        </AnnotationToolbar>
        <ZoomControl zoom={canvasZoom} setZoom={setCanvasZoom} />
      </main>
      <DevModeModal
        isOpen={isDevMode}
        onClose={() => setIsDevMode(false)}
        config={{
          imageSettings,
          backgroundEffects,
          gradient,
        }}
        onApply={(newConfig: any) => {
          if (newConfig.imageSettings) setImageSettings(newConfig.imageSettings);
          if (newConfig.backgroundEffects) setBackgroundEffects(newConfig.backgroundEffects);
          if (newConfig.gradient) setGradient(newConfig.gradient);
        }}
      />
    </div>
  );
}
