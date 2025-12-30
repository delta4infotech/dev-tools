"use client";
import React, { forwardRef, useRef, useEffect, useCallback, useState } from 'react';
import type { ImagePreviewProps, TextObject, BackgroundEffects, ArrowObject, CounterObject, RedactObject, ShapeObject } from './types';
import { hexToRgba } from './utils/color';

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
        backgroundSize = '10px 10px';
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

const TextElement: React.FC<Pick<ImagePreviewProps, 'canvasKey' | 'textEffects' | 'aspectRatio' | 'onSetEditing' | 'onSelectObject' | 'onTextUpdate' | 'onTextDelete' | 'onTextUpdateWithHistory'> & { text: TextObject, isSelected: boolean, isEditing: boolean, previewRef: React.RefObject<HTMLDivElement | null> }> =
    ({ canvasKey, text, isSelected, isEditing, onSetEditing, onSelectObject, onTextUpdate, onTextUpdateWithHistory, textEffects, aspectRatio, previewRef }) => {
        const textareaRef = useRef<HTMLTextAreaElement>(null);
        const elementRef = useRef<HTMLDivElement>(null);
        const dragInfo = useRef({ hasMoved: false });
        const lastClickTime = useRef(0);

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

            const onPointerMove = (moveEvent: PointerEvent) => {
                const dx = moveEvent.clientX - startX;
                const dy = moveEvent.clientY - startY;

                if (!dragInfo.current.hasMoved && Math.sqrt(dx * dx + dy * dy) > 5) {
                    dragInfo.current.hasMoved = true;
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
                    onTextUpdateWithHistory(text.id, { xPosition: finalX, yPosition: finalY });
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
                onTextUpdateWithHistory(text.id, { width: finalWidthPercent });
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
                onTextUpdateWithHistory(text.id, { fontSizeScale: newScale });
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
            }
        }, [isEditing]);

        const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if ((e.key === 'Enter' && !e.shiftKey) || e.key === 'Escape') {
                e.preventDefault();
                onSetEditing(canvasKey, null);
            }
        };

        const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
            onTextUpdateWithHistory(text.id, { content: e.target.value });
            onSetEditing(canvasKey, null);
        };

        const baseFontSize = aspectRatio === '1:1' ? '6vw' : '5vw';
        const maxFontSize = aspectRatio === '1:1' ? 72 : 96;

        let fontSize = `clamp(1.5rem, ${baseFontSize}, ${maxFontSize}px)`;
        if (text.content.length > 15) fontSize = `clamp(1.25rem, ${aspectRatio === '1:1' ? '4vw' : '3vw'}, ${maxFontSize}px)`;
        if (text.content.length > 25) fontSize = `clamp(1rem, ${aspectRatio === '1:1' ? '3vw' : '2vw'}, ${maxFontSize}px)`;

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
                        onChange={(e) => onTextUpdate(text.id, { content: e.target.value })}
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

const ArrowElement: React.FC<Pick<ImagePreviewProps, 'canvasKey' | 'onSelectObject' | 'onArrowUpdate' | 'onArrowUpdateWithHistory'> & { arrow: ArrowObject, isSelected: boolean, previewRef: React.RefObject<HTMLDivElement | null> }> =
    ({ canvasKey, arrow, isSelected, onSelectObject, onArrowUpdate, onArrowUpdateWithHistory, previewRef }) => {
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

            const onPointerMove = (moveEvent: PointerEvent) => {
                const dx = moveEvent.clientX - startX;
                const dy = moveEvent.clientY - startY;

                if (!dragInfo.current.hasMoved && Math.sqrt(dx * dx + dy * dy) > 3) {
                    dragInfo.current.hasMoved = true;
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
                if (dragInfo.current.hasMoved) {
                    onArrowUpdateWithHistory(arrow.id, {}); // Trigger history push with current state
                }
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
                onArrowUpdateWithHistory(arrow.id, {});
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
                    markerEnd={`url(#${arrowheadId})`}
                    strokeLinecap="round"
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

const CounterElement: React.FC<Pick<ImagePreviewProps, 'canvasKey' | 'onSelectObject' | 'onCounterUpdate' | 'onCounterUpdateWithHistory'> & { counter: CounterObject, isSelected: boolean, previewRef: React.RefObject<HTMLDivElement | null> }> =
    ({ canvasKey, counter, isSelected, onSelectObject, onCounterUpdate, onCounterUpdateWithHistory, previewRef }) => {
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
                if (dragInfo.current.hasMoved) {
                    onCounterUpdateWithHistory(counter.id, {});
                }
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
                {counter.count}
            </div>
        );
    };

const RedactElement: React.FC<Pick<ImagePreviewProps, 'canvasKey' | 'onSelectObject' | 'onRedactUpdate' | 'onRedactUpdateWithHistory'> & { redact: RedactObject, isSelected: boolean, previewRef: React.RefObject<HTMLDivElement | null> }> =
    ({ canvasKey, redact, isSelected, onSelectObject, onRedactUpdate, onRedactUpdateWithHistory, previewRef }) => {
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
                if (dragInfo.current.hasMoved) {
                    onRedactUpdateWithHistory(redact.id, {});
                }
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
                onRedactUpdateWithHistory(redact.id, {});
            };

            document.addEventListener('pointermove', onPointerMove);
            document.addEventListener('pointerup', onPointerUp);
        }

        return (
            <div
                ref={elementRef}
                className="absolute z-20 cursor-grab active:cursor-grabbing border border-white/20"
                style={{
                    left: `${redact.x}%`,
                    top: `${redact.y}%`,
                    width: `${redact.width}%`,
                    height: `${redact.height}%`,
                    backdropFilter: redact.mode === 'blur' ? 'blur(16px)' : 'none',
                    backgroundColor: redact.mode === 'pixelate' ? 'black' : (redact.mode === 'blur' ? 'transparent' : 'black'), // Fallback for simple redact
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

const ShapeElement: React.FC<Pick<ImagePreviewProps, 'canvasKey' | 'onSelectObject' | 'onShapeUpdate' | 'onShapeUpdateWithHistory'> & { shape: ShapeObject, isSelected: boolean, previewRef: React.RefObject<HTMLDivElement | null> }> =
    ({ canvasKey, shape, isSelected, onSelectObject, onShapeUpdate, onShapeUpdateWithHistory, previewRef }) => {
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
                if (dragInfo.current.hasMoved) {
                    onShapeUpdateWithHistory(shape.id, {});
                }
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
            texts, arrows, counters, redactions, shapes,
            onTextUpdate, onTextUpdateWithHistory, onTextDelete,
            onArrowAdd, onArrowUpdate, onArrowUpdateWithHistory,
            onCounterAdd, onCounterUpdate, onCounterUpdateWithHistory, onCounterDelete,
            onRedactAdd, onRedactUpdate, onRedactUpdateWithHistory, onRedactDelete,
            onShapeAdd, onShapeUpdate, onShapeUpdateWithHistory, onShapeDelete,
            selection, onSelectObject, editing, onSetEditing, onActivate, isActive,
            setDrawingMode, onImageSettingsChange,
            uploadedImageObj, uploadedImage
        } = props;

        const localPreviewRef = useRef<HTMLDivElement>(null);
        const [drawingArrow, setDrawingArrow] = useState<Omit<ArrowObject, 'id' | 'type'> | null>(null);

        const drawingArrowRef = useRef<Omit<ArrowObject, 'id' | 'type'> | null>(null);

        const setRefs = useCallback((node: HTMLDivElement | null) => {
            localPreviewRef.current = node;
            if (typeof fwdRef === 'function') fwdRef(node);
            else if (fwdRef) fwdRef.current = node;
        }, [fwdRef]);

        const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
            if (drawingMode !== 'arrow' || !localPreviewRef.current) return;
            onSelectObject(canvasKey, null, 'text'); // Deselect all

            const previewRect = localPreviewRef.current.getBoundingClientRect();
            const x = ((e.clientX - previewRect.left) / previewRect.width) * 100;
            const y = ((e.clientY - previewRect.top) / previewRect.height) * 100;

            // Default drawing color red, more visible than white
            const newArrow = { x1: x, y1: y, x2: x, y2: y, color: '#ef4444', strokeWidth: 4 };
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

        const aspectClass = aspectRatio === '1:1' ? 'aspect-square' : 'aspect-video';
        const alignmentClass = alignmentClasses[imageSettings.alignment];
        const imageStyle: React.CSSProperties = {
            // transform: `scale(${imageSettings.scale})`, // Moved to wrapper div
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
                // Initial set to lock position
                onUpdateImage(uploadedImageObj.id, { x: currentX, y: currentY });
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

        return (
            <div className={`w-full max-w-4xl mx-auto rounded-3xl transition-all duration-300 ${activeClass}`} ref={previewContainerRef as React.RefObject<HTMLDivElement>}>
                <svg width="0" height="0" className="absolute">
                    <defs>
                        <filter id={motionBlurId}><feGaussianBlur in="SourceGraphic" stdDeviation={`${backgroundEffects.motionBlur} 0`} /></filter>
                        <filter id={watercolorId}><feTurbulence type="fractalNoise" baseFrequency="0.01 0.005" numOctaves="5" seed="2" result="noise" /><feDisplacementMap in="SourceGraphic" in2="noise" scale={backgroundEffects.watercolor} xChannelSelector="R" yChannelSelector="G" /></filter>
                    </defs>
                </svg>

                <div
                    ref={setRefs}
                    className={`${aspectClass} w-full rounded-2xl overflow-hidden relative transition-all duration-300 ease-in-out shadow-2xl shadow-black/50 select-none bg-black`}
                    style={{ cursor: (drawingMode === 'arrow' || drawingMode === 'counter') ? 'crosshair' : 'default' }}
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
                    <div className="absolute inset-0 w-full h-full z-0" style={{ backgroundImage: backgroundImage ? `url(${backgroundImage})` : backgroundValue, backgroundSize: 'cover', backgroundPosition: 'center', filter: `blur(${backgroundEffects.blur}px) ${backgroundEffects.motionBlur > 0 ? `url(#${motionBlurId})` : ''} ${backgroundEffects.watercolor > 0 ? `url(#${watercolorId})` : ''}` }} />
                    <PatternOverlay pattern={backgroundEffects.pattern} opacity={backgroundEffects.patternOpacity} />
                    <NoiseOverlay opacity={backgroundEffects.noiseOpacity} />
                    <VignetteOverlay opacity={backgroundEffects.vignetteOpacity} />

                    {uploadedImage && (
                        <div
                            className={`absolute inset-0 pointer-events-none z-10 ${!isManualPosition ? `flex ${alignmentClass}` : ''}`}
                            style={!isManualPosition ? imageContainerStyle : undefined}
                        >
                            {/* Using inline-flex with lineHeight 0 to strictly wrap content without ghost spacing. */}
                            <div
                                className={`relative inline-flex pointer-events-auto ${drawingMode === 'move' ? 'cursor-grab active:cursor-grabbing' : ''}`}
                                onPointerDown={handleImageDragStart}
                                style={{
                                    transform: `translate(${isManualPosition ? '-50%' : '0'}, ${isManualPosition ? '-50%' : '0'}) scale(${imageSettings.scale})`,
                                    transformOrigin: isManualPosition ? 'center' : imageSettings.alignment.replace('middle', 'center').replace('-', ' '),
                                    lineHeight: 0,
                                    position: isManualPosition ? 'absolute' : 'relative',
                                    left: isManualPosition ? `${uploadedImageObj?.x}%` : undefined,
                                    top: isManualPosition ? `${uploadedImageObj?.y}%` : undefined,
                                }}
                            >
                                {imageSettings.glassmorphicBorder.enabled && (
                                    <div className="absolute backdrop-blur-xl pointer-events-none z-0" style={{
                                        top: `-${imageSettings.glassmorphicBorder.size}px`,
                                        left: `-${imageSettings.glassmorphicBorder.size}px`,
                                        right: `-${imageSettings.glassmorphicBorder.size}px`,
                                        bottom: `-${imageSettings.glassmorphicBorder.size}px`,
                                        backgroundColor: hexToRgba(imageSettings.glassmorphicBorder.color, 0.2),
                                        border: `1px solid ${hexToRgba(imageSettings.glassmorphicBorder.color, 0.3)}`,
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
                                        opacity: imageSettings.glassmorphicBorder.opacity
                                    }} />
                                )}
                                <img src={uploadedImage} style={{
                                    ...imageStyle,
                                    borderRadius: (() => {
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
                                    })(),
                                }} alt="Uploaded content" className="relative block w-auto h-auto z-10 max-w-[90vw] max-h-[90vh]" />
                            </div>
                        </div>
                    )}

                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-30 overflow-visible">
                        <defs>
                            {arrows.map(arrow => (
                                <marker key={arrow.id} id={`arrowhead-${canvasKey}-${arrow.id}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
                                    <path d="M0,0 L0,6 L6,3 z" fill={arrow.color} />
                                </marker>
                            ))}
                            {drawingArrow && (
                                <marker id={`arrowhead-${canvasKey}-drawing`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
                                    <path d="M0,0 L0,6 L6,3 z" fill={drawingArrow.color} />
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
                                previewRef={localPreviewRef}
                            />
                        ))}
                        {drawingArrow && (
                            <line
                                x1={`${drawingArrow.x1}%`} y1={`${drawingArrow.y1}%`}
                                x2={`${drawingArrow.x2}%`} y2={`${drawingArrow.y2}%`}
                                stroke={drawingArrow.color}
                                strokeWidth={drawingArrow.strokeWidth}
                                markerEnd={`url(#arrowhead-${canvasKey}-drawing)`}
                                strokeLinecap="round"
                                style={{ filter: 'drop-shadow(0px 2px 3px rgba(0,0,0,0.3))' }}
                            />
                        )}
                    </svg>

                    {redactions && redactions.map(redact => (
                        <RedactElement key={redact.id} canvasKey={canvasKey} redact={redact} isSelected={selection?.itemId === redact.id} onSelectObject={onSelectObject} onRedactUpdate={onRedactUpdate} onRedactUpdateWithHistory={onRedactUpdateWithHistory} previewRef={localPreviewRef} />
                    ))}
                    {shapes && shapes.map(shape => (
                        <ShapeElement key={shape.id} canvasKey={canvasKey} shape={shape} isSelected={selection?.itemId === shape.id} onSelectObject={onSelectObject} onShapeUpdate={onShapeUpdate} onShapeUpdateWithHistory={onShapeUpdateWithHistory} previewRef={localPreviewRef} />
                    ))}
                    {texts.map(text => (
                        <TextElement key={text.id} canvasKey={canvasKey} text={text} isSelected={selection?.canvasKey === canvasKey && selection.itemId === text.id && selection.type === 'text'} isEditing={editing?.canvasKey === canvasKey && editing.itemId === text.id} onSetEditing={onSetEditing} onSelectObject={onSelectObject} onTextUpdate={onTextUpdate} onTextUpdateWithHistory={onTextUpdateWithHistory} onTextDelete={onTextDelete} textEffects={textEffects} aspectRatio={aspectRatio} previewRef={localPreviewRef} />
                    ))}
                    {counters && counters.map(counter => (
                        <CounterElement key={counter.id} canvasKey={canvasKey} counter={counter} isSelected={selection?.itemId === counter.id} onSelectObject={onSelectObject} onCounterUpdate={onCounterUpdate} onCounterUpdateWithHistory={onCounterUpdateWithHistory} previewRef={localPreviewRef} />
                    ))}
                </div>
            </div>
        );
    }
);
ImagePreview.displayName = 'ImagePreview';
