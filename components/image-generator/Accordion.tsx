"use client";
import React, { createContext, useContext, ReactNode } from 'react';
import { ChevronDown } from './icons';

interface AccordionContextProps {
    type: 'single' | 'multiple';
    value: string[];
    setValue: (value: string[]) => void;
}

const AccordionContext = createContext<AccordionContextProps | null>(null);

const useAccordionContext = () => {
    const context = useContext(AccordionContext);
    if (!context) {
        throw new Error('Accordion components must be used within an Accordion provider');
    }
    return context;
};

interface AccordionItemContextProps {
    value: string;
    disabled: boolean;
}

const AccordionItemContext = createContext<AccordionItemContextProps | null>(null);

const useAccordionItemContext = () => {
    const context = useContext(AccordionItemContext);
    if (!context) {
        throw new Error('Accordion sub-components must be used within an AccordionItem');
    }
    return context;
};

interface AccordionProps {
    children: ReactNode;
    type?: 'single' | 'multiple';
    value: string[];
    onValueChange: (value: string[]) => void;
    className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
    children,
    type = 'single',
    value,
    onValueChange,
    className,
}) => {
    return (
        <AccordionContext.Provider value={{ type, value, setValue: onValueChange }}>
            <div className={`border-t border-neutral-800 ${className}`}>{children}</div>
        </AccordionContext.Provider>
    );
};

interface AccordionItemProps {
    value: string;
    children: ReactNode;
    className?: string;
    disabled?: boolean;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({ value, children, className, disabled = false }) => (
    <AccordionItemContext.Provider value={{ value, disabled }}>
        <div className={`border-b border-neutral-800 ${className} ${disabled ? 'opacity-50' : ''}`}>{children}</div>
    </AccordionItemContext.Provider>
);

interface AccordionTriggerProps {
    children: ReactNode;
    className?: string;
}

export const AccordionTrigger: React.FC<AccordionTriggerProps> = ({ children, className }) => {
    const { type, value, setValue } = useAccordionContext();
    const { value: itemValue, disabled } = useAccordionItemContext();
    const isOpen = value.includes(itemValue);

    const handleClick = () => {
        if (disabled) return;
        if (type === 'single') {
            setValue(isOpen ? [] : [itemValue]);
        } else {
            setValue(isOpen ? value.filter((v) => v !== itemValue) : [...value, itemValue]);
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={disabled}
            className={`flex w-full items-center justify-between py-4 px-2 font-semibold transition-colors rounded-md text-left ${disabled ? 'cursor-not-allowed text-neutral-500' : 'cursor-pointer hover:bg-neutral-800/50'} ${className}`}
        >
            <span className="text-sm text-neutral-100">{children}</span>
            <ChevronDown className={`h-5 w-5 shrink-0 text-neutral-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
    );
};

interface AccordionContentProps {
    children: ReactNode;
    className?: string;
}

export const AccordionContent: React.FC<AccordionContentProps> = ({ children, className }) => {
    const { value: openItems } = useAccordionContext();
    const { value: itemValue } = useAccordionItemContext();
    const isOpen = openItems.includes(itemValue);

    return (
        <div
            className={`overflow-hidden text-sm transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[9999px] opacity-100 pb-6' : 'max-h-0 opacity-0'
                } ${className}`}
        >
            <div className="space-y-6">{children}</div>
        </div>
    );
};
