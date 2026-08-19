"use client";
import React, { useState, useRef, useEffect } from "react";
import type { UploadedImage, CropAspectRatio } from "./types";

const CROP_RATIOS: { id: CropAspectRatio; label: string; ratio: number | null }[] = [
    { id: "free", label: "Free", ratio: null },
    { id: "1:1", label: "1:1", ratio: 1 },
    { id: "16:9", label: "16:9", ratio: 16 / 9 },
    { id: "9:16", label: "9:16", ratio: 9 / 16 },
    { id: "4:3", label: "4:3", ratio: 4 / 3 },
    { id: "3:2", label: "3:2", ratio: 3 / 2 },
];

// Inline crop overlay — CleanShot-style. Renders on top of the active image inside the canvas.
// 8 handles (4 corners + 4 edge midpoints), dim mask, rule-of-thirds grid, live W×H readout,
// floating ratio-preset toolbar, Enter applies / Escape cancels.
export const CropOverlay: React.FC<{
    image: UploadedImage;
    onApply: (crop: { x: number; y: number; width: number; height: number } | undefined) => void;
    onClose: () => void;
}> = ({ image, onApply, onClose }) => {
    const [ratio, setRatio] = useState<CropAspectRatio>("free");
    const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
    // crop is in % of the visible (already-cropped) image — what the user sees in the overlay.
    // The previously-applied crop (image.crop) determines what the overlay is showing.
    // On Apply, we compose these to get the final % of the natural source.
    const priorCrop = image.crop ?? { x: 0, y: 0, width: 100, height: 100 };
    const [crop, setCrop] = useState({ x: 0, y: 0, width: 100, height: 100 });
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const ratioValue = CROP_RATIOS.find((r) => r.id === ratio)?.ratio ?? null;
    // The overlay's visible area has the aspect of the displayed (previously-cropped) image.
    const displayedAspect = naturalSize
        ? (naturalSize.w * priorCrop.width) / (naturalSize.h * priorCrop.height)
        : 1;
    const naturalAspect = displayedAspect; // ratio constraints work in displayed-aspect space

    useEffect(() => {
        const img = new window.Image();
        img.onload = () => setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
        img.src = image.src;
    }, [image.src]);

    useEffect(() => {
        if (ratioValue === null) return;
        setCrop((prev) => {
            let w = prev.width;
            let h = (w * naturalAspect) / ratioValue;
            if (h > 100) {
                h = 100;
                w = (h * ratioValue) / naturalAspect;
            }
            const cx = prev.x + prev.width / 2;
            const cy = prev.y + prev.height / 2;
            const x = Math.min(Math.max(0, cx - w / 2), 100 - w);
            const y = Math.min(Math.max(0, cy - h / 2), 100 - h);
            return { x, y, width: w, height: h };
        });
    }, [ratioValue, naturalAspect]);

    // The on-screen W×H readout should reflect natural-source pixels of the final composed crop.
    const cropPxW = naturalSize ? Math.round((naturalSize.w * (crop.width / 100) * priorCrop.width) / 100) : 0;
    const cropPxH = naturalSize ? Math.round((naturalSize.h * (crop.height / 100) * priorCrop.height) / 100) : 0;

    type HandleKind = "move" | "n" | "s" | "e" | "w" | "nw" | "ne" | "sw" | "se";

    const startDrag = (e: React.PointerEvent, mode: HandleKind) => {
        e.preventDefault();
        e.stopPropagation();
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        setIsDragging(true);
        const startX = e.clientX;
        const startY = e.clientY;
        const start = { ...crop };

        const onMove = (ev: PointerEvent) => {
            const dxPct = ((ev.clientX - startX) / rect.width) * 100;
            const dyPct = ((ev.clientY - startY) / rect.height) * 100;
            setCrop(() => {
                if (mode === "move") {
                    return {
                        x: Math.min(Math.max(0, start.x + dxPct), 100 - start.width),
                        y: Math.min(Math.max(0, start.y + dyPct), 100 - start.height),
                        width: start.width,
                        height: start.height,
                    };
                }
                let newX = start.x;
                let newY = start.y;
                let newW = start.width;
                let newH = start.height;
                if (mode.includes("w")) { newX = start.x + dxPct; newW = start.width - dxPct; }
                if (mode.includes("e")) { newW = start.width + dxPct; }
                if (mode.includes("n")) { newY = start.y + dyPct; newH = start.height - dyPct; }
                if (mode.includes("s")) { newH = start.height + dyPct; }

                if (ratioValue !== null) {
                    if (mode === "n" || mode === "s") {
                        const targetW = (newH * ratioValue) / naturalAspect;
                        const cx = start.x + start.width / 2;
                        newX = cx - targetW / 2;
                        newW = targetW;
                    } else if (mode === "e" || mode === "w") {
                        const targetH = (newW * naturalAspect) / ratioValue;
                        const cy = start.y + start.height / 2;
                        newY = cy - targetH / 2;
                        newH = targetH;
                    } else {
                        const targetH = (newW * naturalAspect) / ratioValue;
                        if (mode.includes("n")) newY = newY + (newH - targetH);
                        newH = targetH;
                    }
                }

                const MIN = 2;
                if (newW < MIN) { if (mode.includes("w")) newX = newX + newW - MIN; newW = MIN; }
                if (newH < MIN) { if (mode.includes("n")) newY = newY + newH - MIN; newH = MIN; }

                if (newX < 0) { newW += newX; newX = 0; }
                if (newY < 0) { newH += newY; newY = 0; }
                if (newX + newW > 100) newW = 100 - newX;
                if (newY + newH > 100) newH = 100 - newY;

                return { x: newX, y: newY, width: newW, height: newH };
            });
        };
        const onUp = () => {
            setIsDragging(false);
            document.removeEventListener("pointermove", onMove);
            document.removeEventListener("pointerup", onUp);
        };
        document.addEventListener("pointermove", onMove);
        document.addEventListener("pointerup", onUp);
    };

    // Compose the new crop (in % of the displayed cropped image) with the prior crop
    // (in % of natural source) to get the final crop in natural-source coordinates.
    const composedCrop = () => ({
        x: priorCrop.x + (crop.x / 100) * priorCrop.width,
        y: priorCrop.y + (crop.y / 100) * priorCrop.height,
        width: (crop.width / 100) * priorCrop.width,
        height: (crop.height / 100) * priorCrop.height,
    });

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                onClose();
            } else if (e.key === "Enter") {
                e.preventDefault();
                onApply(composedCrop());
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [crop, onApply, onClose]);

    if (!naturalSize) return null;

    const handleSize = 10;
    const handleStyleBase: React.CSSProperties = {
        position: "absolute",
        width: handleSize,
        height: handleSize,
        background: "#fff",
        border: "1px solid #1f2937",
        boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
        zIndex: 10,
    };

    return (
        <div ref={containerRef} className="absolute inset-0 z-50 select-none">
            <div className="absolute pointer-events-none" style={{ left: 0, top: 0, width: "100%", height: `${crop.y}%`, background: "rgba(0,0,0,0.55)" }} />
            <div className="absolute pointer-events-none" style={{ left: 0, top: `${crop.y + crop.height}%`, width: "100%", height: `${100 - crop.y - crop.height}%`, background: "rgba(0,0,0,0.55)" }} />
            <div className="absolute pointer-events-none" style={{ left: 0, top: `${crop.y}%`, width: `${crop.x}%`, height: `${crop.height}%`, background: "rgba(0,0,0,0.55)" }} />
            <div className="absolute pointer-events-none" style={{ left: `${crop.x + crop.width}%`, top: `${crop.y}%`, width: `${100 - crop.x - crop.width}%`, height: `${crop.height}%`, background: "rgba(0,0,0,0.55)" }} />

            <div
                className="absolute cursor-move"
                style={{
                    left: `${crop.x}%`,
                    top: `${crop.y}%`,
                    width: `${crop.width}%`,
                    height: `${crop.height}%`,
                    boxShadow: "0 0 0 1px #fff",
                }}
                onPointerDown={(e) => startDrag(e, "move")}
            >
                {isDragging && (
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute left-1/3 top-0 bottom-0 border-l border-white/40" />
                        <div className="absolute left-2/3 top-0 bottom-0 border-l border-white/40" />
                        <div className="absolute top-1/3 left-0 right-0 border-t border-white/40" />
                        <div className="absolute top-2/3 left-0 right-0 border-t border-white/40" />
                    </div>
                )}

                <div onPointerDown={(e) => startDrag(e, "n")} style={{ ...handleStyleBase, top: -handleSize / 2, left: `calc(50% - ${handleSize / 2}px)`, cursor: "ns-resize" }} />
                <div onPointerDown={(e) => startDrag(e, "s")} style={{ ...handleStyleBase, bottom: -handleSize / 2, left: `calc(50% - ${handleSize / 2}px)`, cursor: "ns-resize" }} />
                <div onPointerDown={(e) => startDrag(e, "w")} style={{ ...handleStyleBase, left: -handleSize / 2, top: `calc(50% - ${handleSize / 2}px)`, cursor: "ew-resize" }} />
                <div onPointerDown={(e) => startDrag(e, "e")} style={{ ...handleStyleBase, right: -handleSize / 2, top: `calc(50% - ${handleSize / 2}px)`, cursor: "ew-resize" }} />

                <div onPointerDown={(e) => startDrag(e, "nw")} style={{ ...handleStyleBase, top: -handleSize / 2, left: -handleSize / 2, cursor: "nwse-resize" }} />
                <div onPointerDown={(e) => startDrag(e, "ne")} style={{ ...handleStyleBase, top: -handleSize / 2, right: -handleSize / 2, cursor: "nesw-resize" }} />
                <div onPointerDown={(e) => startDrag(e, "sw")} style={{ ...handleStyleBase, bottom: -handleSize / 2, left: -handleSize / 2, cursor: "nesw-resize" }} />
                <div onPointerDown={(e) => startDrag(e, "se")} style={{ ...handleStyleBase, bottom: -handleSize / 2, right: -handleSize / 2, cursor: "nwse-resize" }} />

                {isDragging && (
                    <div
                        className="absolute px-2 py-1 text-xs font-mono tabular-nums bg-black/80 text-white rounded pointer-events-none whitespace-nowrap"
                        style={{ left: "50%", top: -28, transform: "translateX(-50%)" }}
                    >
                        {cropPxW} × {cropPxH}
                    </div>
                )}
            </div>

            <div
                className="absolute flex items-center gap-1 bg-neutral-900/90 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 p-1"
                style={{ left: "50%", bottom: -56, transform: "translateX(-50%)", whiteSpace: "nowrap" }}
                onPointerDown={(e) => e.stopPropagation()}
            >
                {CROP_RATIOS.map((r) => (
                    <button
                        key={r.id}
                        onClick={() => setRatio(r.id)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                            ratio === r.id ? "bg-blue-600 text-white" : "text-neutral-300 hover:bg-white/10"
                        }`}
                    >
                        {r.label}
                    </button>
                ))}
                <div className="w-px h-5 bg-white/10 mx-1" />
                <button onClick={() => onApply(undefined)} className="px-2.5 py-1 text-xs font-medium text-neutral-300 hover:bg-white/10 rounded-md" title="Reset">Reset</button>
                <button onClick={onClose} className="px-2.5 py-1 text-xs font-medium text-neutral-300 hover:bg-white/10 rounded-md" title="Cancel (Esc)">Cancel</button>
                <button onClick={() => onApply(composedCrop())} className="px-3 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-md" title="Apply (Enter)">Apply</button>
            </div>
        </div>
    );
};
