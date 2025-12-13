import React, { useState, useEffect } from 'react';
import { XCircle, Copy, Check, Code } from './icons';
import { ImageSettings, BackgroundEffects, Gradient } from './types';

interface DevModeModalProps {
    isOpen: boolean;
    onClose: () => void;
    config: {
        imageSettings: ImageSettings;
        backgroundEffects: BackgroundEffects;
        gradient: Gradient;
    };
    onApply: (newConfig: any) => void;
}

export const DevModeModal: React.FC<DevModeModalProps> = ({ isOpen, onClose, config, onApply }) => {
    const [jsonContent, setJsonContent] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setJsonContent(JSON.stringify(config, null, 2));
            setError(null);
            setCopied(false);
        }
    }, [isOpen, config]);

    const handleCopy = () => {
        navigator.clipboard.writeText(jsonContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleApply = () => {
        try {
            const parsed = JSON.parse(jsonContent);
            // Basic validation could go here
            onApply(parsed);
            onClose();
        } catch (e) {
            setError((e as Error).message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-2xl h-[600px] max-h-[90vh] flex flex-col shadow-2xl">
                <div className="flex items-center justify-between p-4 border-b border-neutral-800">
                    <div className="flex items-center gap-2">
                        <Code className="w-5 h-5 text-blue-400" />
                        <h2 className="text-lg font-semibold text-white">Developer Mode</h2>
                    </div>
                    <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">
                        <XCircle className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 p-4 overflow-hidden flex flex-col min-h-0 bg-neutral-950/50">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-sm text-neutral-400">
                            Configuration (JSON)
                        </div>
                        <button
                            onClick={handleCopy}
                            className="text-xs px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors flex items-center gap-1.5 border border-neutral-700"
                        >
                            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                    </div>
                    <div className="relative flex-1 bg-neutral-950 rounded-lg border border-neutral-800 overflow-hidden shadow-inner">
                        <textarea
                            value={jsonContent}
                            onChange={(e) => {
                                setJsonContent(e.target.value);
                                setError(null);
                            }}
                            className="w-full h-full bg-transparent p-4 font-mono text-xs md:text-sm text-blue-300 focus:outline-none resize-none leading-relaxed selection:bg-blue-500/30"
                            spellCheck={false}
                        />
                        {error && (
                            <div className="absolute bottom-4 left-4 right-4 bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded-lg text-xs backdrop-blur-md">
                                {error}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-neutral-800 flex justify-end gap-3 bg-neutral-900/50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors text-sm font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleApply}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors text-sm font-medium shadow-lg shadow-blue-500/20"
                    >
                        Apply Changes
                    </button>
                </div>
            </div>
        </div>
    );
};
