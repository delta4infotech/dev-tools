import { Command } from "lucide-react";

export default function KeyboardShortcutHint() {
    return (
        <div className="w-full bg-primary/5 border-y border-primary/10 py-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <span>💡 Pro tip: Press</span>
                    <kbd className="px-2 py-1 text-xs bg-background border border-border rounded shadow-sm inline-flex items-center gap-1">
                        <Command className="w-3 h-3" />
                        <span>K</span>
                    </kbd>
                    <span>to quickly search and navigate between tools</span>
                </div>
            </div>
        </div>
    );
}
