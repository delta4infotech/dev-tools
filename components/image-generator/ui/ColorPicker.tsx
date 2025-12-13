"use client"

import React from 'react';
import { HexColorPicker } from 'react-colorful';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ColorPickerProps {
    color: string;
    onChange: (color: string) => void;
    className?: string;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange, className }) => {
    return (
        <PopoverPrimitive.Root>
            <PopoverPrimitive.Trigger asChild>
                <button
                    className={cn(
                        "w-8 h-8 rounded-full border border-neutral-700 overflow-hidden relative shadow-sm transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 shrink-0",
                        className
                    )}
                >
                    <div
                        className="w-full h-full"
                        style={{ backgroundColor: color }}
                    />
                </button>
            </PopoverPrimitive.Trigger>
            <PopoverPrimitive.Portal>
                <PopoverPrimitive.Content
                    align="start"
                    sideOffset={5}
                    className="z-50 w-64 rounded-xl border border-white/10 bg-neutral-900 p-3 shadow-xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                >
                    <div className="space-y-3">
                        <HexColorPicker color={color} onChange={onChange} className="!w-full !flex-[0_0_auto]" />
                        <div className="flex items-center space-x-2">
                            <div
                                className="h-8 w-8 rounded-md border border-white/10 shrink-0"
                                style={{ backgroundColor: color }}
                            />
                            <input
                                type="text"
                                value={color}
                                onChange={(e) => onChange(e.target.value)}
                                className="flex-1 h-8 rounded-md bg-neutral-800 border-white/5 px-2 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase"
                                placeholder="#000000"
                            />
                        </div>
                    </div>
                </PopoverPrimitive.Content>
            </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
    );
};
