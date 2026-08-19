"use client";
import React, { forwardRef, useRef, useEffect, useCallback, useState } from 'react';
import type { ImagePreviewProps, TextObject, BackgroundEffects, ArrowObject, CounterObject, RedactObject, ShapeObject, UploadedImage, BrushObject, BrushPoint } from './types';
import { CropOverlay } from './CropOverlay';
import { hexToRgba } from './utils/color';
import { DEVICE_MOCKUPS } from './mockups';
import { getAssetUrl, getProxyUrl } from './utils/url';

const NoiseOverlay: React.FC<{ opacity: number }> = ({ opacity }) => (
    <div
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        style={{
            opacity,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 600 600' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
    />
);

const VignetteOverlay: React.FC<{ opacity: number }> = ({ opacity }) => (
    <div
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        style={{
            opacity,
            background: `radial-gradient(ellipse at center, transparent 50%, black 100%)`
        }}
    />
);

const PatternOverlay: React.FC<{ pattern: BackgroundEffects['pattern'], opacity: number }> = ({ pattern, opacity }) => {
    if (pattern === 'none' || opacity === 0) return null;

    let backgroundImage = '';
    let backgroundSize = '';

    if (pattern === 'dots') {
        backgroundImage = 'radial-gradient(rgba(255, 255, 255, 0.5) 1px, transparent 1px)';
        backgroundSize = '20px 20px';
    } else if (pattern === 'grid') {
        backgroundImage = 'linear-gradient(rgba(255, 255, 255, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.3) 1px, transparent 1px)';
        backgroundSize = '20px 20px';
    } else if (pattern === 'lines') {
        backgroundImage = 'repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.3) 0, rgba(255, 255, 255, 0.3) 1px, transparent 0, transparent 50%)';
    } else if (pattern === 'waves') {
        backgroundImage = `url("data:image/svg+xml,%3Csvg width='40' height='20' viewBox='0 0 40 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10 Q10 0 20 10 T40 10' fill='none' stroke='white' stroke-width='2' stroke-opacity='0.4'/%3E%3C/svg%3E")`;
        backgroundSize = '40px 20px';
    } else if (pattern === 'zigzag') {
        backgroundImage = `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10 L10 0 L20 10 L10 20 Z' fill='none' stroke='white' stroke-width='1.5' stroke-opacity='0.4'/%3E%3C/svg%3E")`;
        backgroundSize = '20px 20px';
    } else if (pattern === 'hexagons') {
        backgroundImage = `url("data:image/svg+xml,%3Csvg width='28' height='49' viewBox='0 0 28 49' xmlns='http://www.w3.org/2000/svg'%3E%3Cg stroke='white' stroke-width='1.5' stroke-opacity='0.4' fill='none' fill-rule='evenodd'%3E%3Cpath d='M14 0l14 8.08v16.16L14 32.32 0 24.24V8.08zM0 48.48L14 40.4l14 8.08'/%3E%3C/g%3E%3C/svg%3E")`;
        backgroundSize = '28px 49px';
    } else if (pattern === 'diagonal-stripes') {
        backgroundImage = 'repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.4) 0, rgba(255, 255, 255, 0.4) 2px, transparent 2px, transparent 10px)';
        backgroundSize = '14px 14px';
    } else if (pattern === 'crosshatch') {
        backgroundImage = 'repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.4) 0, rgba(255, 255, 255, 0.4) 1px, transparent 1px, transparent 10px), repeating-linear-gradient(-45deg, rgba(255, 255, 255, 0.4) 0, rgba(255, 255, 255, 0.4) 1px, transparent 1px, transparent 10px)';
        backgroundSize = '14px 14px';
    } else if (pattern === 'plus') {
        backgroundImage = `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M9 9V0h2v9h9v2h-9v9H9v-9H0V9h9z' fill='white' fill-opacity='0.4'/%3E%3C/svg%3E")`;
        backgroundSize = '20px 20px';
    }

    return (
        <div
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
            style={{
                opacity,
                backgroundImage,
                backgroundSize
            }}
        />
    );
};

// ─── Device Mockup Frame ─────────────────────────────────────────────────────
/**
 * Renders the user's screenshot INSIDE the device screen area.
 *
 * Layout:
 *  - A centred container sized to the device's natural aspect ratio fills the canvas.
 *  - A "screen area" div (at the correct % offsets from the PNG definition) clips
 *    the user's image to exactly the screen rectangle.
 *  - The device PNG overlays on top at z-index 1, hiding everything outside the screen.
 */
const DeviceMockupFrame: React.FC<{
    mockupId: string;
    color: 'dark' | 'light';
    layout?: 'single' | 'grid-2' | 'grid-3';
    uploadedImages: UploadedImage[];
    fallbackImage: string;
    padding: number;
    getImageUrl: (url: string | null) => string | null;
}> = ({ mockupId, color, layout = 'single', uploadedImages, fallbackImage, padding, getImageUrl }) => {
    const device = DEVICE_MOCKUPS.find(d => d.id === mockupId);
    if (!device) return null;

    const frameUrl = device.images[color] ?? device.images.dark;
    const { x, y, width, height } = device.screen;
    
    const deviceCount = layout === 'grid-3' ? 3 : layout === 'grid-2' ? 2 : 1;
    const displayImages: { src: string; crop?: UploadedImage['crop'] }[] = [];
    
    // We want to fill `deviceCount` slots.
    // If the user hasn't uploaded enough images, repeat the first one over and over.
    for (let i = 0; i < deviceCount; i++) {
        if (uploadedImages.length > i) {
            displayImages.push({ src: getImageUrl(uploadedImages[i].src) || uploadedImages[i].src, crop: uploadedImages[i].crop });
        } else if (uploadedImages.length > 0) {
            // fallback to the first uploaded image
            displayImages.push({ src: getImageUrl(uploadedImages[0].src) || uploadedImages[0].src, crop: uploadedImages[0].crop });
        } else {
            // fallback to the single main editor image
            displayImages.push({ src: fallbackImage });
        }
    }

    return (
        <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 overflow-hidden"
            style={{ padding: `${padding}px` }}
        >
            <div className={`relative flex items-center justify-center gap-4 w-full h-full min-w-0 min-h-0`}>
                {displayImages.map((image, index) => {
                    const crop = image.crop;
                    const bgPosX = crop && crop.width < 100 ? (crop.x / (100 - crop.width)) * 100 : 0;
                    const bgPosY = crop && crop.height < 100 ? (crop.y / (100 - crop.height)) * 100 : 0;
                    return (
                    <div key={index} className="relative flex max-h-full max-w-full items-center justify-center h-full min-w-0 min-h-0 shrink">
                        <div className="relative h-full inline-flex justify-center" style={{ aspectRatio: String(device.aspectRatio) }}>
                            {/* Spacer image using frameUrl to naturally bound the size of this block */}
                            <img
                                src={frameUrl}
                                className="h-full w-full opacity-0 pointer-events-none block"
                                alt=""
                                draggable={false}
                            />

                            <div className="absolute inset-0">
                                {/* Screen area - clips the inner content perfectly to the device screen */}
                                <div
                                    className="absolute overflow-hidden pointer-events-auto bg-neutral-900"
                                    style={{
                                        left: `${x}%`,
                                        top: `${y}%`,
                                        width: `${width}%`,
                                        height: `${height}%`,
                                    }}
                                >
                                    {crop ? (
                                        <div
                                            className="w-full h-full"
                                            style={{
                                                backgroundImage: `url(${image.src})`,
                                                backgroundSize: `${10000 / crop.width}% ${10000 / crop.height}%`,
                                                backgroundPosition: `${bgPosX}% ${bgPosY}%`,
                                                backgroundRepeat: 'no-repeat',
                                            }}
                                        />
                                    ) : (
                                        <img src={image.src} className="w-full h-full object-cover" draggable={false} alt="Screen Content" />
                                    )}
                                </div>

                                {/* Frame overlay - sits above the screen area for inner shadows/bezels */}
                                <img
                                    src={frameUrl}
                                    className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-2xl"
                                    alt={device.name}
                                    draggable={false}
                                />
                            </div>
                        </div>
                    </div>
                    );
                })}
            </div>
        </div>
    );
};


const alignmentClasses = {
    'top-left': 'items-start justify-start',
    'top-center': 'items-start justify-center',
    'top-right': 'items-start justify-end',
    'middle-left': 'items-center justify-start',
    'middle-center': 'items-center justify-center',
    'middle-right': 'items-center justify-end',
    'bottom-left': 'items-end justify-start',
    'bottom-center': 'items-end justify-center',
    'bottom-right': 'items-end justify-end',
};

const TextElement: React.FC<Pick<ImagePreviewProps, 'canvasKey' | 'textEffects' | 'aspectRatio' | 'onSetEditing' | 'onSelectObject' | 'onTextUpdate' | 'onTextDelete' | 'onTextUpdateWithHistory' | 'onBeginInteractionHistory'> & { text: TextObject, isSelected: boolean, isEditing: boolean, previewRef: React.RefObject<HTMLDivElement | null> }> =
    ({ canvasKey, text, isSelected, isEditing, onSetEditing, onSelectObject, onTextUpdate, onTextUpdateWithHistory, onBeginInteractionHistory, textEffects, aspectRatio, previewRef }) => {
        const textareaRef = useRef<HTMLTextAreaElement>(null);
        const elementRef = useRef<HTMLDivElement>(null);
        const dragInfo = useRef({ hasMoved: false });
        const lastClickTime = useRef(0);
        const editHistoryStarted = useRef(false);

        const handlePointerDown = (e: React.PointerEvent) => {
            if (e.button !== 0) return;
            e.stopPropagation();

            onSelectObject(canvasKey, text.id, 'text');

            if (isEditing) return;

            const target = elementRef.current;
            const preview = previewRef.current;
            if (!target || !preview) return;

            dragInfo.current.hasMoved = false;
            const startX = e.clientX;
            const startY = e.clientY;
            const startTextX = text.xPosition;
            const startTextY = text.yPosition;
            const previewRect = preview.getBoundingClientRect();
            onBeginInteractionHistory();

            const onPointerMove = (moveEvent: PointerEvent) => {
                const dx = moveEvent.clientX - startX;
                const dy = moveEvent.clientY - startY;

                if (!dragInfo.current.hasMoved && Math.sqrt(dx * dx + dy * dy) > 5) {
                    dragInfo.current.hasMoved = true;
                    onBeginInteractionHistory();
                    target.setPointerCapture(e.pointerId);
                    document.body.style.cursor = 'grabbing';
                }

                if (dragInfo.current.hasMoved) {
                    const newX = startTextX + (dx / previewRect.width) * 100;
                    const newY = startTextY + (dy / previewRect.height) * 100;
                    onTextUpdate(text.id, { xPosition: newX, yPosition: newY });
                }
            };

            const onPointerUp = (upEvent: PointerEvent) => {
                document.removeEventListener('pointermove', onPointerMove);
                document.removeEventListener('pointerup', onPointerUp);

                if (dragInfo.current.hasMoved) {
                    if (target.hasPointerCapture(e.pointerId)) target.releasePointerCapture(e.pointerId);
                    document.body.style.cursor = '';
                    const dx = upEvent.clientX - startX;
                    const dy = upEvent.clientY - startY;
                    const finalX = startTextX + (dx / previewRect.width) * 100;
                    const finalY = startTextY + (dy / previewRect.height) * 100;
                    onTextUpdate(text.id, { xPosition: finalX, yPosition: finalY });
                }
            };

            document.addEventListener('pointermove', onPointerMove);
            document.addEventListener('pointerup', onPointerUp);
        };

        const handleResizePointerDown = (e: React.PointerEvent, handle: 'left' | 'right') => {
            e.stopPropagation();
            const element = elementRef.current;
            const preview = previewRef.current;
            if (!element || !preview) return;
            element.setPointerCapture(e.pointerId);

            const startX = e.clientX;
            const initialRect = element.getBoundingClientRect();
            const previewRect = preview.getBoundingClientRect();

            const onPointerMove = (moveEvent: PointerEvent) => {
                const dx = moveEvent.clientX - startX;
                const direction = handle === 'left' ? -1 : 1;
                const newWidthPx = initialRect.width + (dx * 2 * direction);
                const scale = text.fontSizeScale || 1;
                let newWidthPercent = (newWidthPx / previewRect.width) * 100;
                newWidthPercent = newWidthPercent / scale; // Compensate for scale
                newWidthPercent = Math.max(5, Math.min(500, newWidthPercent)); // Allow up to 500% width
                onTextUpdate(text.id, { width: newWidthPercent });
            };

            const onPointerUp = (upEvent: PointerEvent) => {
                document.removeEventListener('pointermove', onPointerMove);
                document.removeEventListener('pointerup', onPointerUp);
                if (element.hasPointerCapture(e.pointerId)) element.releasePointerCapture(e.pointerId);
                document.body.style.cursor = '';
                const dx = upEvent.clientX - startX;
                const direction = handle === 'left' ? -1 : 1;
                const newWidthPx = initialRect.width + (dx * 2 * direction);

                const scale = text.fontSizeScale || 1;
                let finalWidthPercent = (newWidthPx / previewRect.width) * 100;
                finalWidthPercent = finalWidthPercent / scale; // Compensate for scale
                finalWidthPercent = Math.max(5, Math.min(500, finalWidthPercent));
                onTextUpdate(text.id, { width: finalWidthPercent });
            };

            document.body.style.cursor = 'ew-resize';
            document.addEventListener('pointermove', onPointerMove);
            document.addEventListener('pointerup', onPointerUp);
        };

        const handleScalePointerDown = (e: React.PointerEvent) => {
            e.stopPropagation();
            const element = elementRef.current;
            if (!element) return;
            element.setPointerCapture(e.pointerId);

            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const startDistance = Math.hypot(e.clientX - centerX, e.clientY - centerY);
            const startScale = text.fontSizeScale || 1;
            onBeginInteractionHistory();

            const onPointerMove = (moveEvent: PointerEvent) => {
                const currentDistance = Math.hypot(moveEvent.clientX - centerX, moveEvent.clientY - centerY);
                const scaleChange = currentDistance / startDistance;
                let newScale = startScale * scaleChange;
                newScale = Math.max(0.1, Math.min(10, newScale)); // Reasonable limits
                onTextUpdate(text.id, { fontSizeScale: newScale });
            };

            const onPointerUp = (upEvent: PointerEvent) => {
                document.removeEventListener('pointermove', onPointerMove);
                document.removeEventListener('pointerup', onPointerUp);
                if (element.hasPointerCapture(e.pointerId)) element.releasePointerCapture(e.pointerId);

                // Final update with history
                const currentDistance = Math.hypot(upEvent.clientX - centerX, upEvent.clientY - centerY);
                const scaleChange = currentDistance / startDistance;
                let newScale = startScale * scaleChange;
                newScale = Math.max(0.1, Math.min(10, newScale));
                onTextUpdate(text.id, { fontSizeScale: newScale });
            };

            document.addEventListener('pointermove', onPointerMove);
            document.addEventListener('pointerup', onPointerUp);
        };

        useEffect(() => {
            if (isEditing && textareaRef.current) {
                const textarea = textareaRef.current;
                textarea.focus();
                textarea.select();
                textarea.style.height = 'auto';
                textarea.style.height = `${textarea.scrollHeight}px`;
                editHistoryStarted.current = false;
            }
        }, [isEditing]);

        const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if ((e.key === 'Enter' && !e.shiftKey) || e.key === 'Escape') {
                e.preventDefault();
                onSetEditing(canvasKey, null);
            }
        };

        const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            if (!editHistoryStarted.current) {
                onBeginInteractionHistory();
                editHistoryStarted.current = true;
            }
            onTextUpdate(text.id, { content: e.target.value });
        };

        const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
            onTextUpdate(text.id, { content: e.target.value });
            onSetEditing(canvasKey, null);
        };

        const isPortrait = aspectRatio === '1:1' || aspectRatio === '9:16' || aspectRatio === '4:5';
        const baseFontSize = isPortrait ? '6vw' : '5vw';
        const maxFontSize = isPortrait ? 72 : 96;

        let fontSize = `clamp(1.5rem, ${baseFontSize}, ${maxFontSize}px)`;
        if (text.content.length > 15) fontSize = `clamp(1.25rem, ${isPortrait ? '4vw' : '3vw'}, ${maxFontSize}px)`;
        if (text.content.length > 25) fontSize = `clamp(1rem, ${isPortrait ? '3vw' : '2vw'}, ${maxFontSize}px)`;

        const glassmorphicStyle: React.CSSProperties = textEffects.isGlassmorphic ? {
            backgroundColor: hexToRgba(textEffects.glassColor, textEffects.glassOpacity),
            backdropFilter: 'blur(12px)',
            border: `1px solid ${hexToRgba(textEffects.glassColor, Math.min(1, textEffects.glassOpacity + 0.1))}`,
            borderRadius: '1rem',
        } : {
            borderRadius: '0',
        };

        const shadow = textEffects.shadow;
        const shadowColor = hexToRgba(shadow.color, shadow.opacity);
        const textStyle: React.CSSProperties = {
            fontFamily: text.fontFamily,
            color: text.fontColor,
            fontSize: fontSize,
            textShadow: `${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${shadowColor}`,
            WebkitTextStroke: `${textEffects.stroke.width}px ${textEffects.stroke.color}`,
            paintOrder: 'stroke fill',
            lineHeight: '1.2',
            filter: textEffects.blur > 0 ? `blur(${textEffects.blur}px)` : 'none',
            ...glassmorphicStyle,
        };

        return (
            <div
                ref={elementRef}
                className="absolute w-auto cursor-grab active:cursor-grabbing z-50"
                style={{
                    width: text.width ? `${text.width}%` : 'auto',
                    top: `${text.yPosition}%`,
                    left: `${text.xPosition}%`,
                    transform: `translate(-50%, -50%) scale(${text.fontSizeScale || 1})`,
                    touchAction: 'none',
                }}
                onPointerDown={handlePointerDown}
                onClick={(e) => {
                    e.stopPropagation();
                    const now = Date.now();
                    if (now - lastClickTime.current < 500) {
                        onSetEditing(canvasKey, text.id);
                        lastClickTime.current = 0;
                    } else {
                        lastClickTime.current = now;
                    }
                }}
            >
                {isSelected && !isEditing && (
                    <>
                        <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none"></div>
                        <div
                            className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full border-2 border-blue-500 cursor-ew-resize z-50"
                            onPointerDown={e => handleResizePointerDown(e, 'left')}
                        />
                        <div
                            className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-white rounded-full border-2 border-blue-500 cursor-ew-resize z-50"
                            onPointerDown={e => handleResizePointerDown(e, 'right')}
                        />
                        {/* Corner Handles for Scaling */}
                        <div
                            className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-blue-500 cursor-nwse-resize z-50"
                            onPointerDown={handleScalePointerDown}
                        />
                        <div
                            className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-blue-500 cursor-nesw-resize z-50"
                            onPointerDown={handleScalePointerDown}
                        />
                        <div
                            className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-blue-500 cursor-nwse-resize z-50"
                            onPointerDown={handleScalePointerDown}
                        />
                        <div
                            className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-blue-500 cursor-nesw-resize z-50"
                            onPointerDown={handleScalePointerDown}
                        />
                    </>
                )}
                {isEditing ? (
                    <textarea
                        ref={textareaRef}
                        value={text.content}
                        onChange={handleTextareaChange}
                        onBlur={handleBlur}
                        onKeyDown={handleTextareaKeyDown}
                        className="w-full p-4 bg-transparent border-0 resize-none overflow-hidden text-center font-bold focus:outline-none ring-2 ring-white/50 rounded-lg"
                        style={textStyle}
                    />
                ) : (
                    <h2 className="font-bold text-center break-words p-4 min-w-[10rem]" style={textStyle}>
                        {text.content}
                    </h2>
                )}
            </div >
        );
    };

const ArrowElement: React.FC<Pick<ImagePreviewProps, 'canvasKey' | 'onSelectObject' | 'onArrowUpdate' | 'onArrowUpdateWithHistory' | 'onBeginInteractionHistory'> & { arrow: ArrowObject, isSelected: boolean, previewRef: React.RefObject<HTMLDivElement | null> }> =
    ({ canvasKey, arrow, isSelected, onSelectObject, onArrowUpdate, onArrowUpdateWithHistory, onBeginInteractionHistory, previewRef }) => {
        const lineRef = useRef<SVGLineElement>(null);
        const dragInfo = useRef({ hasMoved: false });
        // Fix: Use unique ID for each arrow's marker to prevent color conflicts
        const arrowheadId = `arrowhead-${canvasKey}-${arrow.id}`;

        const handlePointerDown = (e: React.PointerEvent) => {
            if (e.button !== 0) return;
            e.stopPropagation();
            onSelectObject(canvasKey, arrow.id, 'arrow');

            const preview = previewRef.current;
            if (!preview) return;

            dragInfo.current.hasMoved = false;
            const startX = e.clientX;
            const startY = e.clientY;
            const startArrow = { ...arrow };
            const previewRect = preview.getBoundingClientRect();
            onBeginInteractionHistory();

            const onPointerMove = (moveEvent: PointerEvent) => {
                const dx = moveEvent.clientX - startX;
                const dy = moveEvent.clientY - startY;

                if (!dragInfo.current.hasMoved && Math.sqrt(dx * dx + dy * dy) > 3) {
                    dragInfo.current.hasMoved = true;
                    onBeginInteractionHistory();
                    document.body.style.cursor = 'grabbing';
                }

                if (dragInfo.current.hasMoved) {
                    const dxPercent = (dx / previewRect.width) * 100;
                    const dyPercent = (dy / previewRect.height) * 100;

                    onArrowUpdate(arrow.id, {
                        x1: startArrow.x1 + dxPercent,
                        y1: startArrow.y1 + dyPercent,
                        x2: startArrow.x2 + dxPercent,
                        y2: startArrow.y2 + dyPercent
                    });
                }
            };

            const onPointerUp = () => {
                document.removeEventListener('pointermove', onPointerMove);
                document.removeEventListener('pointerup', onPointerUp);
                document.body.style.cursor = '';

            };

            document.addEventListener('pointermove', onPointerMove);
            document.addEventListener('pointerup', onPointerUp);
        };

        const handleHandlePointerDown = (e: React.PointerEvent, handle: 'start' | 'end') => {
            e.stopPropagation();
            e.preventDefault();

            const target = e.currentTarget; // The circle element
            target.setPointerCapture(e.pointerId);

            const preview = previewRef.current;
            if (!preview) return;

            const startX = e.clientX;
            const startY = e.clientY;
            const startArrow = { ...arrow };
            const previewRect = preview.getBoundingClientRect();

            const onPointerMove = (moveEvent: PointerEvent) => {
                const dx = moveEvent.clientX - startX;
                const dy = moveEvent.clientY - startY;
                const dxPercent = (dx / previewRect.width) * 100;
                const dyPercent = (dy / previewRect.height) * 100;

                if (handle === 'start') {
                    onArrowUpdate(arrow.id, { x1: startArrow.x1 + dxPercent, y1: startArrow.y1 + dyPercent });
                } else {
                    onArrowUpdate(arrow.id, { x2: startArrow.x2 + dxPercent, y2: startArrow.y2 + dyPercent });
                }
            };

            const onPointerUp = (upEvent: PointerEvent) => {
                document.removeEventListener('pointermove', onPointerMove);
                document.removeEventListener('pointerup', onPointerUp);
                if (target.hasPointerCapture(upEvent.pointerId)) {
                    target.releasePointerCapture(upEvent.pointerId);
                }
            };

            document.addEventListener('pointermove', onPointerMove);
            document.addEventListener('pointerup', onPointerUp);
        };

        return (
            <g className="cursor-pointer" onPointerDown={handlePointerDown} onClick={(e) => e.stopPropagation()} pointerEvents="all" style={{ filter: 'drop-shadow(0px 2px 3px rgba(0,0,0,0.3))' }}>
                {/* Invisible thick line for easier selection */}
                <line
                    x1={`${arrow.x1}%`} y1={`${arrow.y1}%`}
                    x2={`${arrow.x2}%`} y2={`${arrow.y2}%`}
                    stroke="transparent"
                    strokeWidth={Math.max(20, arrow.strokeWidth * 4)}
                    strokeLinecap="round"
                />
                {/* Visible line */}
                <line
                    ref={lineRef}
                    x1={`${arrow.x1}%`} y1={`${arrow.y1}%`}
                    x2={`${arrow.x2}%`} y2={`${arrow.y2}%`}
                    stroke={arrow.color}
                    strokeWidth={arrow.strokeWidth}
                    markerEnd={(arrow.headStyle ?? 'filled') === 'none' ? undefined : `url(#${arrowheadId})`}
                    strokeLinecap={arrow.lineStyle === 'dotted' ? 'round' : 'round'}
                    strokeDasharray={
                        arrow.lineStyle === 'dashed'
                            ? `${arrow.strokeWidth * 2.5} ${arrow.strokeWidth * 1.5}`
                            : arrow.lineStyle === 'dotted'
                                ? `0.01 ${arrow.strokeWidth * 2}`
                                : undefined
                    }
                />
                {isSelected && (
                    <>
                        {/* Visual indicator of selection - dashed line overlay */}
                        <line
                            x1={`${arrow.x1}%`} y1={`${arrow.y1}%`}
                            x2={`${arrow.x2}%`} y2={`${arrow.y2}%`}
                            stroke="#3b82f6" // blue-500
                            strokeWidth={1}
                            strokeDasharray="4 2"
                            pointerEvents="none"
                            className="opacity-70"
                        />
                        {/* Start Handle */}
                        <circle
                            cx={`${arrow.x1}%`} cy={`${arrow.y1}%`}
                            r="6"
                            fill="white"
                            stroke="#3b82f6"
                            strokeWidth="2"
                            className="cursor-move"
                            onPointerDown={(e) => handleHandlePointerDown(e, 'start')}
                        />
                        {/* End Handle */}
                        <circle
                            cx={`${arrow.x2}%`} cy={`${arrow.y2}%`}
                            r="6"
                            fill="white"
                            stroke="#3b82f6"
                            strokeWidth="2"
                            className="cursor-move"
                            onPointerDown={(e) => handleHandlePointerDown(e, 'end')}
                        />
                    </>
                )}
            </g>
        );
    };

const formatCounterLabel = (n: number, format: CounterObject['format']): string => {
    if (format === 'roman') {
        const map: [number, string][] = [
            [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
            [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
            [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
        ];
        let num = n, out = '';
        for (const [v, s] of map) {
            while (num >= v) { out += s; num -= v; }
        }
        return out || String(n);
    }
    if (format === 'alpha') {
        let num = n, out = '';
        while (num > 0) {
            const rem = (num - 1) % 26;
            out = String.fromCharCode(65 + rem) + out;
            num = Math.floor((num - 1) / 26);
        }
        return out || 'A';
    }
    return String(n);
};

const CounterElement: React.FC<Pick<ImagePreviewProps, 'canvasKey' | 'onSelectObject' | 'onCounterUpdate' | 'onCounterUpdateWithHistory' | 'onBeginInteractionHistory'> & { counter: CounterObject, isSelected: boolean, previewRef: React.RefObject<HTMLDivElement | null> }> =
    ({ canvasKey, counter, isSelected, onSelectObject, onCounterUpdate, onCounterUpdateWithHistory, onBeginInteractionHistory, previewRef }) => {
        const dragInfo = useRef({ hasMoved: false });

        const handlePointerDown = (e: React.PointerEvent) => {
            if (e.button !== 0) return;
            e.stopPropagation();
            onSelectObject(canvasKey, counter.id, 'counter');

            const preview = previewRef.current;
            if (!preview) return;

            dragInfo.current.hasMoved = false;
            const startX = e.clientX;
            const startY = e.clientY;
            const startXPos = counter.x;
            const startYPos = counter.y;
            const previewRect = preview.getBoundingClientRect();

            const onPointerMove = (moveEvent: PointerEvent) => {
                const dx = moveEvent.clientX - startX;
                const dy = moveEvent.clientY - startY;

                if (!dragInfo.current.hasMoved && Math.hypot(dx, dy) > 3) {
                    dragInfo.current.hasMoved = true;
                    onBeginInteractionHistory();
                    document.body.style.cursor = 'grabbing';
                }

                if (dragInfo.current.hasMoved) {
                    const newX = startXPos + (dx / previewRect.width) * 100;
                    const newY = startYPos + (dy / previewRect.height) * 100;
                    onCounterUpdate(counter.id, { x: newX, y: newY });
                }
            };

            const onPointerUp = () => {
                document.removeEventListener('pointermove', onPointerMove);
                document.removeEventListener('pointerup', onPointerUp);
                document.body.style.cursor = '';

            };

            document.addEventListener('pointermove', onPointerMove);
            document.addEventListener('pointerup', onPointerUp);
        };

        return (
            <div
                className="absolute shadow-lg flex items-center justify-center font-bold text-white select-none cursor-grab active:cursor-grabbing z-30 transform -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110"
                style={{
                    left: `${counter.x}%`,
                    top: `${counter.y}%`,
                    backgroundColor: counter.color,
                    borderRadius: '50%',
                    width: `${32 * counter.scale}px`,
                    height: `${32 * counter.scale}px`,
                    fontSize: `${16 * counter.scale}px`,
                    border: isSelected ? '2px solid white' : '2px solid transparent',
                    boxShadow: isSelected ? '0 0 0 2px #3b82f6' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                onPointerDown={handlePointerDown}
                onClick={(e) => e.stopPropagation()}
            >
                {formatCounterLabel(counter.count, counter.format)}
            </div>
        );
    };

const CroppedImage: React.FC<{
    src: string;
    crop: { x: number; y: number; width: number; height: number };
    imageStyle: React.CSSProperties;
    radius: string;
}> = ({ src, crop, imageStyle, radius }) => {
    const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
    const [parentSize, setParentSize] = useState<{ w: number; h: number } | null>(null);
    const outerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const img = new window.Image();
        img.onload = () => setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
        img.src = src;
    }, [src]);

    // Measure the available canvas area. Walk up past the inline-flex fit-content parent
    // (which would collapse to our own size — circular dependency) to the alignment div.
    // Subtract padding manually because clientWidth/clientHeight include padding in modern browsers.
    useEffect(() => {
        const el = outerRef.current;
        if (!el) return;
        const flexParent = el.parentElement;
        const measureTarget = flexParent?.parentElement;
        if (!measureTarget || !flexParent) return;
        const update = () => {
            const targetStyles = window.getComputedStyle(measureTarget);
            const padL = parseFloat(targetStyles.paddingLeft) || 0;
            const padR = parseFloat(targetStyles.paddingRight) || 0;
            const padT = parseFloat(targetStyles.paddingTop) || 0;
            const padB = parseFloat(targetStyles.paddingBottom) || 0;
            // clientWidth/Height include padding; subtract it to get the true inner content area.
            const w = measureTarget.clientWidth - padL - padR;
            const h = measureTarget.clientHeight - padT - padB;
            // Divide out the inline-flex parent's transform scale so the rendered image fits.
            const flexStyles = window.getComputedStyle(flexParent);
            const matrix = new DOMMatrixReadOnly(flexStyles.transform === 'none' ? '' : flexStyles.transform);
            const scale = matrix.a || 1;
            if (w > 0 && h > 0 && scale > 0) {
                setParentSize({ w: w / scale, h: h / scale });
            }
        };
        update();
        const ro = new ResizeObserver(update);
        ro.observe(measureTarget);
        ro.observe(flexParent);
        return () => ro.disconnect();
    }, []);

    if (!naturalSize) {
        return <div ref={outerRef} style={{ display: 'none' }} />;
    }

    const cropAspect = (naturalSize.w * crop.width) / (naturalSize.h * crop.height);

    // Compute the largest size that fits inside parentSize while preserving aspect.
    let fitW: number;
    let fitH: number;
    if (!parentSize) {
        // Before measurement — use a reasonable initial size based on the crop's natural pixels
        // so the inline-flex parent has something to size against. The ResizeObserver will
        // correct this on the next frame.
        const cropPxWidth = (naturalSize.w * crop.width) / 100;
        const cropPxHeight = (naturalSize.h * crop.height) / 100;
        fitW = cropPxWidth;
        fitH = cropPxHeight;
    } else {
        const parentAspect = parentSize.w / parentSize.h;
        if (cropAspect >= parentAspect) {
            fitW = parentSize.w;
            fitH = fitW / cropAspect;
        } else {
            fitH = parentSize.h;
            fitW = fitH * cropAspect;
        }
    }

    const { width: _w, height: _h, ...imageStyleRest } = imageStyle;
    void _w; void _h;

    // Safe background-position: when crop covers a full axis (width or height = 100),
    // the denominator becomes 0. Default to 0% in that case.
    const bgPosX = crop.width >= 100 ? 0 : (crop.x / (100 - crop.width)) * 100;
    const bgPosY = crop.height >= 100 ? 0 : (crop.y / (100 - crop.height)) * 100;

    return (
        <div
            ref={outerRef}
            className="relative z-10"
            style={{
                ...imageStyleRest,
                borderRadius: radius,
                display: 'block',
                width: `${fitW}px`,
                height: `${fitH}px`,
                backgroundImage: `url(${src})`,
                backgroundSize: `${10000 / crop.width}% ${10000 / crop.height}%`,
                backgroundPosition: `${bgPosX}% ${bgPosY}%`,
                backgroundRepeat: 'no-repeat',
            }}
        />
    );
};

const pointsToPath = (points: BrushPoint[]): string => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    return points.reduce((acc, p, i) => acc + (i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`), '');
};

const BrushLayer: React.FC<{
    brushes: BrushObject[];
    drawingBrush: Omit<BrushObject, 'id' | 'type'> | null;
    canvasKey: number;
    selection: ImagePreviewProps['selection'];
    onSelectObject: ImagePreviewProps['onSelectObject'];
}> = ({ brushes, drawingBrush, canvasKey, selection, onSelectObject }) => {
    const blurBrushes = brushes.filter(b => b.mode === 'blur');
    const inkBrushes = brushes.filter(b => b.mode !== 'blur');
    const drawingIsBlur = drawingBrush?.mode === 'blur';
    const drawingIsInk = drawingBrush && drawingBrush.mode !== 'blur';

    return (
        <>
            {(blurBrushes.length > 0 || drawingIsBlur) && (
                <div
                    className="absolute inset-0 pointer-events-none z-20"
                    style={{
                        backdropFilter: 'blur(14px)',
                        WebkitBackdropFilter: 'blur(14px)',
                        WebkitMaskImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(
                            `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'>${
                                [...blurBrushes, ...(drawingIsBlur ? [drawingBrush!] : [])]
                                    .map((b) => `<path d='${pointsToPath(b.points)}' stroke='black' stroke-width='${b.size / 5}' fill='none' stroke-linecap='round' stroke-linejoin='round' vector-effect='non-scaling-stroke' />`)
                                    .join('')
                            }</svg>`
                        )}")`,
                        maskImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(
                            `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'>${
                                [...blurBrushes, ...(drawingIsBlur ? [drawingBrush!] : [])]
                                    .map((b) => `<path d='${pointsToPath(b.points)}' stroke='black' stroke-width='${b.size / 5}' fill='none' stroke-linecap='round' stroke-linejoin='round' vector-effect='non-scaling-stroke' />`)
                                    .join('')
                            }</svg>`
                        )}")`,
                        WebkitMaskSize: '100% 100%',
                        maskSize: '100% 100%',
                    }}
                />
            )}
            {(inkBrushes.length > 0 || drawingIsInk) && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {inkBrushes.map((b) => {
                        const isSelected = selection?.canvasKey === canvasKey && selection.itemId === b.id && selection.type === 'brush';
                        return (
                            <path
                                key={b.id}
                                d={pointsToPath(b.points)}
                                stroke={b.color}
                                strokeWidth={b.size / 5}
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                opacity={b.mode === 'highlighter' ? 0.4 : 1}
                                vectorEffect="non-scaling-stroke"
                                style={{ pointerEvents: 'stroke', cursor: 'pointer', filter: isSelected ? 'drop-shadow(0 0 2px #3b82f6)' : undefined }}
                                onPointerDown={(e) => { e.stopPropagation(); onSelectObject(canvasKey, b.id, 'brush'); }}
                            />
                        );
                    })}
                    {drawingIsInk && (
                        <path
                            d={pointsToPath(drawingBrush!.points)}
                            stroke={drawingBrush!.color}
                            strokeWidth={drawingBrush!.size / 5}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity={drawingBrush!.mode === 'highlighter' ? 0.4 : 1}
                            vectorEffect="non-scaling-stroke"
                        />
                    )}
                </svg>
            )}
        </>
    );
};

const RedactElement: React.FC<Pick<ImagePreviewProps, 'canvasKey' | 'onSelectObject' | 'onRedactUpdate' | 'onRedactUpdateWithHistory' | 'onBeginInteractionHistory'> & { redact: RedactObject, isSelected: boolean, previewRef: React.RefObject<HTMLDivElement | null> }> =
    ({ canvasKey, redact, isSelected, onSelectObject, onRedactUpdate, onRedactUpdateWithHistory, onBeginInteractionHistory, previewRef }) => {
        const elementRef = useRef<HTMLDivElement>(null);
        const dragInfo = useRef({ hasMoved: false });

        const handlePointerDown = (e: React.PointerEvent) => {
            if (e.button !== 0) return;
            e.stopPropagation();
            onSelectObject(canvasKey, redact.id, 'redact');

            const preview = previewRef.current;
            if (!preview) return;

            dragInfo.current.hasMoved = false;
            const startX = e.clientX;
            const startY = e.clientY;
            const startXPos = redact.x;
            const startYPos = redact.y;
            const previewRect = preview.getBoundingClientRect();

            const onPointerMove = (moveEvent: PointerEvent) => {
                const dx = moveEvent.clientX - startX;
                const dy = moveEvent.clientY - startY;

                if (!dragInfo.current.hasMoved && Math.hypot(dx, dy) > 3) {
                    dragInfo.current.hasMoved = true;
                    onBeginInteractionHistory();
                    document.body.style.cursor = 'grabbing';
                }

                if (dragInfo.current.hasMoved) {
                    const newX = startXPos + (dx / previewRect.width) * 100;
                    const newY = startYPos + (dy / previewRect.height) * 100;
                    onRedactUpdate(redact.id, { x: newX, y: newY });
                }
            };

            const onPointerUp = () => {
                document.removeEventListener('pointermove', onPointerMove);
                document.removeEventListener('pointerup', onPointerUp);
                document.body.style.cursor = '';

            };

            document.addEventListener('pointermove', onPointerMove);
            document.addEventListener('pointerup', onPointerUp);
        };

        const handleResize = (e: React.PointerEvent, handle: string) => {
            e.stopPropagation();
            const element = elementRef.current;
            const preview = previewRef.current;
            if (!element || !preview) return;
            element.setPointerCapture(e.pointerId);

            const startX = e.clientX;
            const startY = e.clientY;
            const startW = redact.width;
            const startH = redact.height;
            const previewRect = preview.getBoundingClientRect();
            onBeginInteractionHistory();

            const onPointerMove = (moveEvent: PointerEvent) => {
                const dx = moveEvent.clientX - startX;
                const dy = moveEvent.clientY - startY;

                const dxPercent = (dx / previewRect.width) * 100;
                const dyPercent = (dy / previewRect.height) * 100;

                const newW = Math.max(2, startW + dxPercent); // Minimum 2%
                const newH = Math.max(2, startH + dyPercent);

                onRedactUpdate(redact.id, { width: newW, height: newH });
            };

            const onPointerUp = (upEvent: PointerEvent) => {
                document.removeEventListener('pointermove', onPointerMove);
                document.removeEventListener('pointerup', onPointerUp);
                if (element.hasPointerCapture(upEvent.pointerId)) element.releasePointerCapture(upEvent.pointerId);
            };

            document.addEventListener('pointermove', onPointerMove);
            document.addEventListener('pointerup', onPointerUp);
        }

        const backdropFilter = (() => {
            if (redact.mode === 'blur') return 'blur(16px)';
            if (redact.mode === 'pixelate') return 'blur(4px) contrast(1.4) saturate(1.2)';
            return 'none';
        })();
        const backgroundImage = redact.mode === 'pixelate'
            ? 'linear-gradient(to right, rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.08) 1px, transparent 1px)'
            : undefined;
        const backgroundColor = redact.mode === 'solid' ? 'black' : 'transparent';

        return (
            <div
                ref={elementRef}
                className="absolute z-20 cursor-grab active:cursor-grabbing border border-white/20"
                style={{
                    left: `${redact.x}%`,
                    top: `${redact.y}%`,
                    width: `${redact.width}%`,
                    height: `${redact.height}%`,
                    backdropFilter,
                    WebkitBackdropFilter: backdropFilter,
                    backgroundColor,
                    backgroundImage,
                    backgroundSize: redact.mode === 'pixelate' ? '8px 8px' : undefined,
                    boxShadow: isSelected ? '0 0 0 2px #3b82f6' : 'none',
                }}
                onPointerDown={handlePointerDown}
            >
                {/* Resize Handle */}
                {isSelected && (
                    <div
                        className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 rounded-full cursor-nwse-resize translate-x-1/2 translate-y-1/2 z-30 ring-2 ring-white"
                        onPointerDown={(e) => handleResize(e, 'se')}
                    />
                )}
            </div>
        );
    };

const ShapeElement: React.FC<Pick<ImagePreviewProps, 'canvasKey' | 'onSelectObject' | 'onShapeUpdate' | 'onShapeUpdateWithHistory' | 'onBeginInteractionHistory'> & { shape: ShapeObject, isSelected: boolean, previewRef: React.RefObject<HTMLDivElement | null> }> =
    ({ canvasKey, shape, isSelected, onSelectObject, onShapeUpdate, onShapeUpdateWithHistory, onBeginInteractionHistory, previewRef }) => {
        const dragInfo = useRef({ hasMoved: false });

        const handlePointerDown = (e: React.PointerEvent) => {
            if (e.button !== 0) return;
            e.stopPropagation();
            onSelectObject(canvasKey, shape.id, 'shape');

            const preview = previewRef.current;
            if (!preview) return;

            dragInfo.current.hasMoved = false;
            const startX = e.clientX;
            const startY = e.clientY;
            const startXPos = shape.x;
            const startYPos = shape.y;
            const previewRect = preview.getBoundingClientRect();

            const onPointerMove = (moveEvent: PointerEvent) => {
                const dx = moveEvent.clientX - startX;
                const dy = moveEvent.clientY - startY;

                if (!dragInfo.current.hasMoved && Math.hypot(dx, dy) > 3) {
                    dragInfo.current.hasMoved = true;
                    onBeginInteractionHistory();
                    document.body.style.cursor = 'grabbing';
                }

                if (dragInfo.current.hasMoved) {
                    const newX = startXPos + (dx / previewRect.width) * 100;
                    const newY = startYPos + (dy / previewRect.height) * 100;
                    onShapeUpdate(shape.id, { x: newX, y: newY });
                }
            };

            const onPointerUp = () => {
                document.removeEventListener('pointermove', onPointerMove);
                document.removeEventListener('pointerup', onPointerUp);
                document.body.style.cursor = '';

            };
            document.addEventListener('pointermove', onPointerMove);
            document.addEventListener('pointerup', onPointerUp);
        };

        // Basic resize logic can be added later, fixed size for now or reuse Redact resize logic

        return (
            <div
                className="absolute z-40 cursor-grab active:cursor-grabbing flex items-center justify-center pointer-events-auto"
                style={{
                    left: `${shape.x}%`,
                    top: `${shape.y}%`,
                    width: `${shape.width}%`,
                    height: `${shape.height}%`,
                    transform: 'translate(-50%, -50%)',
                }}
                onPointerDown={handlePointerDown}
            >
                <svg width="100%" height="100%" viewBox="0 0 100 100" overflow="visible">
                    {/* Invisible hit target for easier selection */}
                    <rect x="0" y="0" width="100" height="100" fill="transparent" stroke="none" pointerEvents="all" />
                    {shape.shapeType === 'rect' && (
                        <rect x="0" y="0" width="100" height="100" fill={shape.fill} stroke={shape.stroke} strokeWidth={shape.strokeWidth} vectorEffect="non-scaling-stroke" pointerEvents="all" />
                    )}
                    {shape.shapeType === 'circle' && (
                        <circle cx="50" cy="50" r="48" fill={shape.fill} stroke={shape.stroke} strokeWidth={shape.strokeWidth} vectorEffect="non-scaling-stroke" pointerEvents="all" />
                    )}
                    {shape.shapeType === 'triangle' && (
                        <polygon points="50,2 98,98 2,98" fill={shape.fill} stroke={shape.stroke} strokeWidth={shape.strokeWidth} vectorEffect="non-scaling-stroke" pointerEvents="all" />
                    )}
                    {isSelected && (
                        <rect x="0" y="0" width="100" height="100" fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
                    )}
                </svg>
            </div>
        );
    };

export const ImagePreview = forwardRef<HTMLDivElement, ImagePreviewProps>(
    (props: ImagePreviewProps, fwdRef: React.ForwardedRef<HTMLDivElement>) => {
        const {
            canvasKey, previewContainerRef, aspectRatio, backgroundValue, backgroundImage,
            backgroundEffects, textEffects, onUpdateImage,
            imageSettings,
            drawingMode,
            texts, arrows, arrowDefaults, counters, redactions, shapes, brushes, brushDefaults,
            onTextUpdate, onTextUpdateWithHistory, onTextDelete,
            onArrowAdd, onArrowUpdate, onArrowUpdateWithHistory,
            onCounterAdd, onCounterUpdate, onCounterUpdateWithHistory, onCounterDelete,
            onRedactAdd, onRedactUpdate, onRedactUpdateWithHistory, onRedactDelete,
            onShapeAdd, onShapeUpdate, onShapeUpdateWithHistory, onShapeDelete,
            onBrushAdd, onBrushDelete, onBeginInteractionHistory,
            cropImageId, onCropApply, onCropCancel,
            selection, onSelectObject, editing, onSetEditing, onActivate, isActive,
            setDrawingMode, onImageSettingsChange,
            uploadedImageObj, uploadedImage, uploadedImages
        } = props;

        const localPreviewRef = useRef<HTMLDivElement>(null);
        const [drawingArrow, setDrawingArrow] = useState<Omit<ArrowObject, 'id' | 'type'> | null>(null);
        const [drawingBrush, setDrawingBrush] = useState<Omit<BrushObject, 'id' | 'type'> | null>(null);

        const drawingArrowRef = useRef<Omit<ArrowObject, 'id' | 'type'> | null>(null);
        const drawingBrushRef = useRef<Omit<BrushObject, 'id' | 'type'> | null>(null);

        const setRefs = useCallback((node: HTMLDivElement | null) => {
            localPreviewRef.current = node;
            if (typeof fwdRef === 'function') fwdRef(node);
            else if (fwdRef) fwdRef.current = node;
        }, [fwdRef]);

        const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
            if (!localPreviewRef.current) return;

            if (drawingMode === 'brush') {
                onSelectObject(canvasKey, null, 'text');
                const previewRect = localPreviewRef.current.getBoundingClientRect();
                const x = ((e.clientX - previewRect.left) / previewRect.width) * 100;
                const y = ((e.clientY - previewRect.top) / previewRect.height) * 100;

                const newBrush: Omit<BrushObject, 'id' | 'type'> = {
                    mode: brushDefaults.mode,
                    color: brushDefaults.color,
                    size: brushDefaults.size,
                    points: [{ x, y }],
                };
                drawingBrushRef.current = newBrush;
                setDrawingBrush(newBrush);

                const onMove = (moveEvent: PointerEvent) => {
                    if (!drawingBrushRef.current) return;
                    const cx = ((moveEvent.clientX - previewRect.left) / previewRect.width) * 100;
                    const cy = ((moveEvent.clientY - previewRect.top) / previewRect.height) * 100;
                    const last = drawingBrushRef.current.points[drawingBrushRef.current.points.length - 1];
                    // Throttle: only add if moved >0.3% to keep paths smooth but small
                    if (Math.hypot(cx - last.x, cy - last.y) < 0.3) return;
                    drawingBrushRef.current = {
                        ...drawingBrushRef.current,
                        points: [...drawingBrushRef.current.points, { x: cx, y: cy }],
                    };
                    setDrawingBrush({ ...drawingBrushRef.current });
                };
                const onUp = () => {
                    document.removeEventListener('pointermove', onMove);
                    document.removeEventListener('pointerup', onUp);
                    if (drawingBrushRef.current && drawingBrushRef.current.points.length > 1) {
                        onBrushAdd(drawingBrushRef.current);
                    }
                    drawingBrushRef.current = null;
                    setDrawingBrush(null);
                };
                document.addEventListener('pointermove', onMove);
                document.addEventListener('pointerup', onUp);
                return;
            }

            if (drawingMode !== 'arrow') return;
            onSelectObject(canvasKey, null, 'text'); // Deselect all

            const previewRect = localPreviewRef.current.getBoundingClientRect();
            const x = ((e.clientX - previewRect.left) / previewRect.width) * 100;
            const y = ((e.clientY - previewRect.top) / previewRect.height) * 100;

            const newArrow: Omit<ArrowObject, 'id' | 'type'> = {
                x1: x, y1: y, x2: x, y2: y,
                color: arrowDefaults.color,
                strokeWidth: arrowDefaults.strokeWidth,
                lineStyle: arrowDefaults.lineStyle,
                headStyle: arrowDefaults.headStyle,
            };
            drawingArrowRef.current = newArrow;
            setDrawingArrow(newArrow);

            const onPointerMove = (moveEvent: PointerEvent) => {
                const currentX = ((moveEvent.clientX - previewRect.left) / previewRect.width) * 100;
                const currentY = ((moveEvent.clientY - previewRect.top) / previewRect.height) * 100;

                if (drawingArrowRef.current) {
                    drawingArrowRef.current = { ...drawingArrowRef.current, x2: currentX, y2: currentY };
                    setDrawingArrow({ ...drawingArrowRef.current });
                }
            };

            const onPointerUp = () => {
                document.removeEventListener('pointermove', onPointerMove);
                document.removeEventListener('pointerup', onPointerUp);

                if (drawingArrowRef.current) {
                    const { x1, y1, x2, y2 } = drawingArrowRef.current;
                    // Don't add arrow if it's just a click (no drag)
                    if (Math.hypot(x2 - x1, y2 - y1) > 1) {
                        onArrowAdd(drawingArrowRef.current);
                    }
                }
                drawingArrowRef.current = null;
                setDrawingArrow(null);
                setDrawingMode(null);
            };

            document.addEventListener('pointermove', onPointerMove);
            document.addEventListener('pointerup', onPointerUp);
        };

        const aspectClass = (() => {
            switch (aspectRatio) {
                case '1:1': return 'aspect-square';
                case '16:9': return 'aspect-video';
                case '9:16': return '';
                case '4:5': return '';
                case '4:3': return '';
                case '3:2': return '';
                case '1.91:1': return '';
                default: return 'aspect-video';
            }
        })();
        const aspectStyle: React.CSSProperties = (() => {
            switch (aspectRatio) {
                case '9:16': return { aspectRatio: '9 / 16' };
                case '4:5': return { aspectRatio: '4 / 5' };
                case '4:3': return { aspectRatio: '4 / 3' };
                case '3:2': return { aspectRatio: '3 / 2' };
                case '1.91:1': return { aspectRatio: '1.91 / 1' };
                default: return {};
            }
        })();
        const alignmentClass = alignmentClasses[imageSettings.alignment];
        const imageStyle: React.CSSProperties = {
            // transform: `scale(${foregroundScale})`, // Moved to wrapper div
            boxShadow: `0 25px 50px -12px rgba(0, 0, 0, ${imageSettings.shadow / 100 * 0.5})`,
            borderRadius: (() => {
                const r = imageSettings.corners;
                const a = imageSettings.alignment;
                let tl = r, tr = r, br = r, bl = r;
                if (a.includes('top')) { tl = 0; tr = 0; }
                if (a.includes('bottom')) { bl = 0; br = 0; }
                if (a.includes('left')) { tl = 0; bl = 0; }
                if (a.includes('right')) { tr = 0; br = 0; }
                return `${tl}px ${tr}px ${br}px ${bl}px`;
            })(),
            // maxWidth: '100%',
            // maxHeight: '100%',
            // objectFit: 'contain',
            width: 'auto',
            height: 'auto',
            display: 'block', // Ensures no line-height spacing
        };

        const getImageContainerStyle = (): React.CSSProperties => {
            if (imageSettings.mockup) return { padding: '0px' };
            if (imageSettings.alignment === 'middle-center') return { padding: `${imageSettings.padding}px` };
            const edgePadding = '20px';
            const styles: React.CSSProperties = { paddingTop: edgePadding, paddingBottom: edgePadding, paddingLeft: edgePadding, paddingRight: edgePadding };
            if (imageSettings.alignment.includes('top')) styles.paddingTop = '0px';
            if (imageSettings.alignment.includes('bottom')) styles.paddingBottom = '0px';
            if (imageSettings.alignment.includes('left')) styles.paddingLeft = '0px';
            if (imageSettings.alignment.includes('right')) styles.paddingRight = '0px';
            return styles;
        };

        const imageContainerStyle = getImageContainerStyle();
        const foregroundScale = uploadedImageObj?.scale ?? imageSettings.scale;

        const activeClass = isActive ? 'ring-4 ring-offset-4 ring-offset-neutral-950 ring-blue-500' : 'ring-0';

        const motionBlurId = `motionBlur-${canvasKey}`;
        const watercolorId = `watercolor-${canvasKey}`;

        const handleImageDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
            if (drawingMode !== 'move') return;

            e.stopPropagation();
            e.preventDefault(); // Keep preventDefault to stop default browser drag behavior
            const target = e.currentTarget;
            target.setPointerCapture(e.pointerId);

            const container = localPreviewRef.current;
            if (!container || !uploadedImageObj) return; // Ensure container and uploadedImageObj are available
            onBeginInteractionHistory();

            const containerRect = container.getBoundingClientRect();
            const startX = e.clientX;
            const startY = e.clientY;

            // Determine start X/Y (if not set, calculate from current position)
            let currentX = uploadedImageObj.x;
            let currentY = uploadedImageObj.y;

            if (currentX === undefined || currentY === undefined) {
                const rect = target.getBoundingClientRect();
                currentX = ((rect.left + rect.width / 2 - containerRect.left) / containerRect.width) * 100;
                currentY = ((rect.top + rect.height / 2 - containerRect.top) / containerRect.height) * 100;

                // Calculate current width in % of container, compensating for the scale transform
                // rect.width includes the scale, so we divide by scale to get the "unscaled" base size
                const currentWidth = ((rect.width / foregroundScale) / containerRect.width) * 100;
                // const currentHeight = ((rect.height / imageSettings.scale) / containerRect.height) * 100; // Removed to fix stretching

                // Initial set to lock position AND dimensions to prevent auto-scaling "jump"
                onUpdateImage(uploadedImageObj.id, {
                    x: currentX,
                    y: currentY,
                    width: currentWidth,
                    height: undefined // Ensure height is undefined so aspect ratio is preserved
                });
            }

            const activeCurrentX = currentX!;
            const activeCurrentY = currentY!;
            const dragInfo = { hasMoved: false };

            const onPointerMove = (moveEvent: PointerEvent) => {
                const dx = moveEvent.clientX - startX;
                const dy = moveEvent.clientY - startY;

                if (!dragInfo.hasMoved && Math.hypot(dx, dy) > 2) {
                    dragInfo.hasMoved = true;
                    document.body.style.cursor = 'grabbing';
                }

                if (dragInfo.hasMoved) {
                    const newX = activeCurrentX + (dx / containerRect.width) * 100;
                    const newY = activeCurrentY + (dy / containerRect.height) * 100;
                    onUpdateImage(uploadedImageObj.id, { x: newX, y: newY });
                }
            };

            const onPointerUp = (upEvent: PointerEvent) => {
                document.removeEventListener('pointermove', onPointerMove);
                document.removeEventListener('pointerup', onPointerUp);
                if (target.hasPointerCapture(upEvent.pointerId)) {
                    target.releasePointerCapture(upEvent.pointerId);
                }
                document.body.style.cursor = '';
            };

            document.addEventListener('pointermove', onPointerMove);
            document.addEventListener('pointerup', onPointerUp);
        };

        const isManualPosition = uploadedImageObj?.x !== undefined && uploadedImageObj?.y !== undefined;

        // Calculate explicit padding values for manual positioning constraints - No longer primary constraint method but kept for safety reference if needed
        const getPaddingValues = () => {
            if (imageSettings.alignment === 'middle-center') {
                const p = imageSettings.padding;
                return { top: p, bottom: p, left: p, right: p };
            }
            const edge = 20;
            let top = edge, bottom = edge, left = edge, right = edge;
            const a = imageSettings.alignment;
            if (a.includes('top')) top = 0;
            if (a.includes('bottom')) bottom = 0;
            if (a.includes('left')) left = 0;
            if (a.includes('right')) right = 0;
            return { top, bottom, left, right };
        };

        const paddings = getPaddingValues();


        const getProxiedUrl = useCallback((url: string | null) => {
            if (!url) return null;
            if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('/')) {
                // If it's a relative path, it might still need the basePath if it's not a data/blob URL
                if (url.startsWith('/')) {
                    return getAssetUrl(url);
                }
                return url;
            }
            return getProxyUrl(url);
        }, []);

        const proxiedBackgroundImage = getProxiedUrl(backgroundImage);
        const proxiedUploadedImage = getProxiedUrl(uploadedImage);

        // Match the ring's corner radius to the canvas radius. The ring sits OUTSIDE the canvas
        // (via ring-offset-4), so its radius should equal canvas radius + offset (~8px) to look
        // visually concentric. Cap below at 0 to keep sharp corners working.
        const canvasRadius = backgroundEffects.canvasCornerRadius ?? 16;
        const ringRadius = isActive ? Math.max(0, canvasRadius + 8) : canvasRadius;

        return (
            <div
                className={`w-full max-w-4xl mx-auto ${activeClass}`}
                style={{
                    borderRadius: `${ringRadius}px`,
                    transition: 'box-shadow 200ms ease, --tw-ring-offset-width 200ms ease',
                }}
                ref={previewContainerRef as React.RefObject<HTMLDivElement>}
            >
                <svg width="0" height="0" className="absolute">
                    <defs>
                        <filter id={motionBlurId} x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur in="SourceGraphic" stdDeviation={`${backgroundEffects.motionBlur} 0`} />
                        </filter>
                        <filter id={watercolorId} x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur in="SourceGraphic" stdDeviation={backgroundEffects.watercolor * 0.03} result="blur1" />
                            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="2" result="noise" />
                            <feDisplacementMap in="blur1" in2="noise" scale={backgroundEffects.watercolor * 0.2} xChannelSelector="R" yChannelSelector="G" result="displaced" />
                            <feComponentTransfer in="displaced" result="colorized">
                                <feFuncR type="linear" slope="1.05" intercept="-0.02" />
                                <feFuncG type="linear" slope="1.05" intercept="-0.02" />
                                <feFuncB type="linear" slope="1.05" intercept="-0.02" />
                            </feComponentTransfer>
                        </filter>
                    </defs>
                </svg>

                <div
                    ref={setRefs}
                    className={`${aspectClass} w-full overflow-hidden relative shadow-2xl shadow-black/50 select-none bg-black`}
                    style={{
                        ...aspectStyle,
                        borderRadius: `${backgroundEffects.canvasCornerRadius ?? 16}px`,
                        cursor: (drawingMode === 'arrow' || drawingMode === 'counter') ? 'crosshair' : drawingMode === 'brush' ? 'crosshair' : 'default',
                    }}
                    onClick={(e) => {
                        if (drawingMode === 'counter') {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = ((e.clientX - rect.left) / rect.width) * 100;
                            const y = ((e.clientY - rect.top) / rect.height) * 100;
                            onCounterAdd({ x, y });
                            return;
                        }

                        if (drawingMode) return;
                        onActivate();
                        if (e.target === e.currentTarget) {
                            onSelectObject(canvasKey, null, 'text');
                            onSetEditing(canvasKey, null);
                        }
                    }}
                    onPointerDown={handlePointerDown}
                >
                    <div className="absolute inset-0 w-full h-full z-0" style={{
                        backgroundImage: proxiedBackgroundImage ? `url(${proxiedBackgroundImage})` : backgroundValue,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: `blur(${backgroundEffects.blur}px) ${backgroundEffects.motionBlur > 0 ? `url(#${motionBlurId})` : ''} ${backgroundEffects.watercolor > 0 ? `url(#${watercolorId})` : ''}`,
                        transform: `scale(${1 + (backgroundEffects.blur * 0.0015) + (backgroundEffects.motionBlur * 0.0015) + (backgroundEffects.watercolor * 0.0005)})`,
                        transformOrigin: 'center'
                    }} />
                    <PatternOverlay pattern={backgroundEffects.pattern} opacity={backgroundEffects.patternOpacity} />
                    <NoiseOverlay opacity={backgroundEffects.noiseOpacity} />
                    <VignetteOverlay opacity={backgroundEffects.vignetteOpacity} />

                    {(() => {
                        if (!proxiedUploadedImage) return null;

                        if (imageSettings.mockup) {
                             return (
                                <DeviceMockupFrame
                                    mockupId={imageSettings.mockup}
                                    color={imageSettings.mockupColor ?? 'dark'}
                                    layout={imageSettings.mockupLayout}
                                    uploadedImages={uploadedImages}
                                    fallbackImage={proxiedUploadedImage}
                                    padding={imageSettings.padding}
                                    getImageUrl={getProxiedUrl}
                                />
                             );
                        }

                        const content = (
                            <div
                                className={`absolute inset-0 pointer-events-none z-10 ${!isManualPosition ? `flex ${alignmentClass}` : ''}`}
                                style={!isManualPosition ? imageContainerStyle : undefined}
                            >
                                {/* Using inline-flex with lineHeight 0 to strictly wrap content without ghost spacing. */}
                                <div
                                    className={`relative inline-flex pointer-events-auto group ${drawingMode === 'move' ? 'cursor-grab active:cursor-grabbing' : ''}`}
                                    onPointerDown={handleImageDragStart}
                                    data-uploaded-image-id={uploadedImageObj?.id}
                                    style={{
                                        transform: `translate3d(${isManualPosition ? '-50%' : '0'}, ${isManualPosition ? '-50%' : '0'}, 0) scale(${foregroundScale})`,
                                        transformOrigin: isManualPosition ? 'center' : imageSettings.alignment.replace('middle', 'center').replace('-', ' '),
                                        willChange: drawingMode === 'move' ? 'transform' : 'auto',
                                        backfaceVisibility: 'hidden',
                                        lineHeight: 0,
                                        position: isManualPosition ? 'absolute' : 'relative',
                                        left: isManualPosition ? `${uploadedImageObj?.x}%` : undefined,
                                        top: isManualPosition ? `${uploadedImageObj?.y}%` : undefined,
                                        width: uploadedImageObj?.width ? `${uploadedImageObj.width}%` : 'fit-content',
                                        height: uploadedImageObj?.width ? 'auto' : 'fit-content',
                                        maxWidth: '100%',
                                        maxHeight: '100%',
                                    }}
                                >
                                    {isManualPosition && drawingMode === 'move' && (
                                        <>
                                            {['nw', 'ne', 'sw', 'se'].map((cursor) => (
                                                <div
                                                    key={cursor}
                                                    className={`absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full z-50 hover:bg-blue-100 transition-all opacity-0 group-hover:opacity-100`}
                                                    style={{
                                                        cursor: `${cursor}-resize`,
                                                        top: cursor.includes('n') ? '-8px' : 'auto',
                                                        bottom: cursor.includes('s') ? '-8px' : 'auto',
                                                        left: cursor.includes('w') ? '-8px' : 'auto',
                                                        right: cursor.includes('e') ? '-8px' : 'auto',
                                                    }}
                                                    onPointerDown={(e) => {
                                                        e.stopPropagation();
                                                        e.preventDefault();
                                                        const target = e.currentTarget;
                                                        target.setPointerCapture(e.pointerId);

                                                        const container = localPreviewRef.current;
                                                        if (!container || !uploadedImageObj) return;
                                                        onBeginInteractionHistory();

                                                        const containerRect = container.getBoundingClientRect();
                                                        const imageWrapper = target.parentElement as HTMLElement;
                                                        const wrapperRect = imageWrapper.getBoundingClientRect();

                                                        const startX = e.clientX;
                                                        // const startY = e.clientY; // Unused for uniform scaling logic based on X-axis dominance or hypotenuse

                                                        const startWidthPercent = uploadedImageObj.width || (wrapperRect.width / containerRect.width) * 100;
                                                        // const startHeightPercent = uploadedImageObj.height || (wrapperRect.height / containerRect.height) * 100; // Unused

                                                        // const aspectRatio = wrapperRect.width / wrapperRect.height;
                                                        const isLeft = cursor.includes('w');
                                                        // const isTop = cursor.includes('n');

                                                        const onResizing = (moveEvent: PointerEvent) => {
                                                            const dx = moveEvent.clientX - startX;

                                                            // Determine direction multiplier: dragging left corner left increases size (-dx adds width), right corner right adds width (+dx)
                                                            // If isLeft (west), dx < 0 means increasing width.
                                                            // If !isLeft (east), dx > 0 means increasing width.
                                                            // Since the image is centered (translate -50%), varying width expands both ways visually, 
                                                            // so the logic is: total width change = dx * 2 * (isLeft ? -1 : 1)
                                                            // Wait, since it's width % based, we calculate absolute pixel diff then convert to % of container

                                                            const changePx = dx * (isLeft ? -1 : 1);
                                                            // We multiply by 2 because transforming from center effectively doubles the edge movement impact visually
                                                            // BUT strictly speaking, we want the width to increase by X amount. 
                                                            // If I drag right edge by 10px, width increases by 20px if I want the center to stay put? 
                                                            // Yes, because `left: 50%` with `transform: translate(-50%)` means center is anchored. 
                                                            // So to drag the right edge 10px further right, the width must grow by 20px (10px left, 10px right).

                                                            const changePercent = (changePx * 2 / containerRect.width) * 100;

                                                            const newWidth = Math.max(5, startWidthPercent + changePercent); // Min 5% width
                                                            // const newHeight = newWidth / aspectRatio * (containerRect.width / containerRect.height);

                                                            onUpdateImage(uploadedImageObj.id, {
                                                                width: newWidth,
                                                                height: undefined // Ensure height is undefined
                                                            });
                                                        };

                                                        const onResizeEnd = (upEvent: PointerEvent) => {
                                                            document.removeEventListener('pointermove', onResizing);
                                                            document.removeEventListener('pointerup', onResizeEnd);
                                                            if (target.hasPointerCapture(upEvent.pointerId)) {
                                                                target.releasePointerCapture(upEvent.pointerId);
                                                            }
                                                        };

                                                        document.addEventListener('pointermove', onResizing);
                                                        document.addEventListener('pointerup', onResizeEnd);
                                                    }}
                                                />
                                            ))}
                                        </>
                                    )}
                                    {imageSettings.glassmorphicBorder.enabled && !imageSettings.mockup && (
                                        <div
                                            key={`glass-${imageSettings.corners}`}
                                            className="absolute backdrop-blur-xl pointer-events-none z-0"
                                            style={{
                                                top: `-${imageSettings.glassmorphicBorder.size}px`,
                                                left: `-${imageSettings.glassmorphicBorder.size}px`,
                                                right: `-${imageSettings.glassmorphicBorder.size}px`,
                                                bottom: `-${imageSettings.glassmorphicBorder.size}px`,
                                                backgroundColor: hexToRgba(imageSettings.glassmorphicBorder.color, 0.2),
                                                border: `${Math.max(1, 1 / foregroundScale)}px solid ${hexToRgba(imageSettings.glassmorphicBorder.color, 0.3)}`,
                                                borderRadius: (() => {
                                                    const r = imageSettings.corners + imageSettings.glassmorphicBorder.size;
                                                    const a = imageSettings.alignment;
                                                    let tl = r, tr = r, br = r, bl = r;
                                                    if (!isManualPosition) {
                                                        if (a.includes('top')) { tl = 0; tr = 0; }
                                                        if (a.includes('bottom')) { bl = 0; br = 0; }
                                                        if (a.includes('left')) { tl = 0; bl = 0; }
                                                        if (a.includes('right')) { tr = 0; br = 0; }
                                                    }
                                                    return `${tl}px ${tr}px ${br}px ${bl}px`;
                                                })(),
                                                opacity: imageSettings.glassmorphicBorder.opacity,
                                            }}
                                        />
                                    )}
                                    {(() => {
                                        const radius = (() => {
                                            if (imageSettings.mockup) return '0px';
                                            const r = imageSettings.corners;
                                            const a = imageSettings.alignment;
                                            let tl = r, tr = r, br = r, bl = r;
                                            if (!isManualPosition) {
                                                if (a.includes('top')) { tl = 0; tr = 0; }
                                                if (a.includes('bottom')) { bl = 0; br = 0; }
                                                if (a.includes('left')) { tl = 0; bl = 0; }
                                                if (a.includes('right')) { tr = 0; br = 0; }
                                            }
                                            return `${tl}px ${tr}px ${br}px ${bl}px`;
                                        })();
                                        const crop = uploadedImageObj?.crop;
                                        if (crop) {
                                            // Use a single <img> rendered at the source's natural size scaled down
                                            // via transform, but use object-* properties to make the box represent only
                                            // the crop region. Simplest reliable approach: render the source image at the
                                            // size of (crop.width%, crop.height%) of the original natural dimensions via
                                            // a wrapper sized with width:auto + aspect-ratio + an inline-block sizer.
                                            //
                                            // Implementation: track the natural image dimensions via a stateful image and
                                            // render the wrapper at the exact pixel dimensions of the crop.
                                            return (
                                                <CroppedImage
                                                    src={proxiedUploadedImage || ""}
                                                    crop={crop}
                                                    imageStyle={uploadedImageObj?.width ? { ...imageStyle, width: '100%', height: '100%' } : imageStyle}
                                                    radius={radius}
                                                />
                                            );
                                        }
                                        return (
                                            <img
                                                src={proxiedUploadedImage || ""}
                                                draggable={false}
                                                style={{ ...imageStyle, borderRadius: radius, width: uploadedImageObj?.width ? '100%' : imageStyle.width, height: uploadedImageObj?.width ? '100%' : imageStyle.height, objectFit: uploadedImageObj?.width ? 'contain' : undefined }}
                                                alt="Uploaded content"
                                                className="relative block w-auto h-auto z-10 max-w-full max-h-full"
                                            />
                                        );
                                    })()}
                                    {uploadedImageObj && cropImageId === uploadedImageObj.id && (
                                        <CropOverlay
                                            image={uploadedImageObj}
                                            onApply={onCropApply}
                                            onClose={onCropCancel}
                                        />
                                    )}
                                </div>
                            </div>
                        );

                        return content;
                    })()}

                    {/* Show device frame only (no image yet) when mockup selected but no image uploaded */}
                    {
                        imageSettings.mockup && !proxiedUploadedImage && (() => {
                            const device = DEVICE_MOCKUPS.find(d => d.id === imageSettings.mockup);
                            if (!device) return null;
                            const frameUrl = device.images[imageSettings.mockupColor ?? 'dark'];
                            return (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                                    <div
                                        className="relative flex-shrink-0"
                                        style={{ height: '100%', aspectRatio: String(device.aspectRatio), maxWidth: '100%' }}
                                    >
                                        <img src={frameUrl} alt={device.name} className="absolute inset-0 w-full h-full object-fill" draggable={false} />
                                    </div>
                                </div>
                            );
                        })()
                    }

                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-30 overflow-visible">
                        <defs>
                            {arrows.map(arrow => {
                                const head = arrow.headStyle ?? 'filled';
                                if (head === 'none') return null;
                                return (
                                    <marker key={arrow.id} id={`arrowhead-${canvasKey}-${arrow.id}`} markerWidth="6" markerHeight="6" refX={head === 'hollow' ? 5 : 5} refY="3" orient="auto" markerUnits="strokeWidth">
                                        {head === 'hollow' ? (
                                            <path d="M0.5,0.5 L5.5,3 L0.5,5.5 Z" fill="none" stroke={arrow.color} strokeWidth="1" strokeLinejoin="round" />
                                        ) : (
                                            <path d="M0,0 L0,6 L6,3 z" fill={arrow.color} />
                                        )}
                                    </marker>
                                );
                            })}
                            {drawingArrow && (drawingArrow.headStyle ?? 'filled') !== 'none' && (
                                <marker id={`arrowhead-${canvasKey}-drawing`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
                                    {(drawingArrow.headStyle ?? 'filled') === 'hollow' ? (
                                        <path d="M0.5,0.5 L5.5,3 L0.5,5.5 Z" fill="none" stroke={drawingArrow.color} strokeWidth="1" strokeLinejoin="round" />
                                    ) : (
                                        <path d="M0,0 L0,6 L6,3 z" fill={drawingArrow.color} />
                                    )}
                                </marker>
                            )}
                        </defs>
                        {arrows.map(arrow => (
                            <ArrowElement
                                key={arrow.id}
                                canvasKey={canvasKey}
                                arrow={arrow}
                                isSelected={selection?.canvasKey === canvasKey && selection.itemId === arrow.id && selection.type === 'arrow'}
                                onSelectObject={onSelectObject}
                                onArrowUpdate={onArrowUpdate}
                                onArrowUpdateWithHistory={onArrowUpdateWithHistory}
                                onBeginInteractionHistory={onBeginInteractionHistory}
                                previewRef={localPreviewRef}
                            />
                        ))}
                        {drawingArrow && (
                            <line
                                x1={`${drawingArrow.x1}%`} y1={`${drawingArrow.y1}%`}
                                x2={`${drawingArrow.x2}%`} y2={`${drawingArrow.y2}%`}
                                stroke={drawingArrow.color}
                                strokeWidth={drawingArrow.strokeWidth}
                                markerEnd={(drawingArrow.headStyle ?? 'filled') === 'none' ? undefined : `url(#arrowhead-${canvasKey}-drawing)`}
                                strokeLinecap="round"
                                strokeDasharray={
                                    drawingArrow.lineStyle === 'dashed'
                                        ? `${drawingArrow.strokeWidth * 2.5} ${drawingArrow.strokeWidth * 1.5}`
                                        : drawingArrow.lineStyle === 'dotted'
                                            ? `0.01 ${drawingArrow.strokeWidth * 2}`
                                            : undefined
                                }
                                style={{ filter: 'drop-shadow(0px 2px 3px rgba(0,0,0,0.3))' }}
                            />
                        )}
                    </svg>

                    {
                        redactions && redactions.map(redact => (
                            <RedactElement key={redact.id} canvasKey={canvasKey} redact={redact} isSelected={selection?.itemId === redact.id} onSelectObject={onSelectObject} onRedactUpdate={onRedactUpdate} onRedactUpdateWithHistory={onRedactUpdateWithHistory} onBeginInteractionHistory={onBeginInteractionHistory} previewRef={localPreviewRef} />
                        ))
                    }
                    <BrushLayer brushes={brushes || []} drawingBrush={drawingBrush} canvasKey={canvasKey} selection={selection} onSelectObject={onSelectObject} />
                    {
                        shapes && shapes.map(shape => (
                            <ShapeElement key={shape.id} canvasKey={canvasKey} shape={shape} isSelected={selection?.itemId === shape.id} onSelectObject={onSelectObject} onShapeUpdate={onShapeUpdate} onShapeUpdateWithHistory={onShapeUpdateWithHistory} onBeginInteractionHistory={onBeginInteractionHistory} previewRef={localPreviewRef} />
                        ))
                    }
                    {
                        texts.map(text => (
                            <TextElement key={text.id} canvasKey={canvasKey} text={text} isSelected={selection?.canvasKey === canvasKey && selection.itemId === text.id && selection.type === 'text'} isEditing={editing?.canvasKey === canvasKey && editing.itemId === text.id} onSetEditing={onSetEditing} onSelectObject={onSelectObject} onTextUpdate={onTextUpdate} onTextUpdateWithHistory={onTextUpdateWithHistory} onBeginInteractionHistory={onBeginInteractionHistory} onTextDelete={onTextDelete} textEffects={textEffects} aspectRatio={aspectRatio} previewRef={localPreviewRef} />
                        ))
                    }
                    {
                        counters && counters.map(counter => (
                            <CounterElement key={counter.id} canvasKey={canvasKey} counter={counter} isSelected={selection?.itemId === counter.id} onSelectObject={onSelectObject} onCounterUpdate={onCounterUpdate} onCounterUpdateWithHistory={onCounterUpdateWithHistory} onBeginInteractionHistory={onBeginInteractionHistory} previewRef={localPreviewRef} />
                        ))
                    }
                </div >
            </div >
        );
    }
);
ImagePreview.displayName = 'ImagePreview';
