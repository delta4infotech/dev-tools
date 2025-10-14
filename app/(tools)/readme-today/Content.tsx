"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Plus, Trash2, Calendar, ChevronDown, History, X } from "lucide-react";
import FAQ, { FAQProps } from "../../(components)/FAQ";
import Example from "../../(components)/Example";
import RelatedTools from "../../(components)/RelatedTools";
import KeyboardShortcutHint from "../../(components)/KeyboardShortcutHint";

// Task status types
type TaskStatus = "not_started" | "pending" | "blocker" | "completed";

interface Task {
    id: string;
    content: string;
    status: TaskStatus;
    createdAt: Date;
}

interface DailyTasks {
    date: string; // Format: YYYY-MM-DD
    tasks: Task[];
}



const statusConfig = {
    not_started: { emoji: "[ ]", label: "Not Started", color: "text-gray-500" },
    pending: { emoji: "[⌛]", label: "Pending", color: "text-yellow-500" },
    blocker: { emoji: "[🔴]", label: "Blocker", color: "text-red-500" },
    completed: { emoji: "[✅]", label: "Done", color: "text-green-500" }
};



const faqs: FAQProps[] = [
    {
        id: "1",
        title: "How does the daily reset work?",
        content: "The tool automatically detects when it's a new day and offers to clear your tasks for a fresh start. Your previous day's tasks are saved locally for up to 30 days and can be accessed from the history dropdown."
    },
    {
        id: "2",
        title: "How do I add new tasks quickly?",
        content: "Simply click the 'Add Task' button in the top right corner to create a new task, or press Enter while editing a task to save it."
    },
    {
        id: "3",
        title: "How do task statuses work in markdown?",
        content: "Tasks export with different markdown formats: [ ] for not started, [⌛] for pending, [🔴] for blockers, and [✅] for completed tasks."
    },
    {
        id: "4",
        title: "Is my data stored anywhere?",
        content: "All data is stored locally in your browser's localStorage for up to 30 days. Nothing is sent to external servers, ensuring complete privacy of your tasks and workflow."
    },
    {
        id: "5",
        title: "Can I export my tasks for README files?",
        content: "Yes! Click the 'Copy as Markdown' button to get properly formatted markdown that you can paste directly into README files, pull requests, or documentation."
    }
];

const examples = [
    {
        title: "Daily Standup Preparation",
        description: "Organize your daily tasks and blockers for team standups with clear status indicators.",
        list: [
            {
                title: "Today's Tasks",
                content: "Add all your planned tasks for the day with initial 'Not Started' status, then update them as you progress through your work."
            },
            {
                title: "Status Updates",
                content: "Mark tasks as pending when in progress, blocker when stuck, and completed when done. Perfect for standup discussions."
            }
        ],
        bottomdesc: "Having organized daily tasks makes standups more productive and helps track progress throughout the day."
    },
    {
        title: "Task Organization",
        description: "Organize your development workflow with flexible task descriptions and status tracking.",
        list: [
            {
                title: "Flexible Content",
                content: "Add any task description, branch names, PR references, or notes directly in the task content field."
            },
            {
                title: "Status Tracking",
                content: "Click the status emoji to cycle through not started, pending, blocker, and completed states for clear progress tracking."
            }
        ],
        bottomdesc: "Simple task management that adapts to your development workflow and preferences."
    },
    {
        title: "README Export",
        description: "Export your daily progress in markdown format for README files and documentation.",
        list: [
            {
                title: "Task Progress",
                content: "Export shows clear visual indicators for each task status, making it easy to communicate progress to team members."
            },
            {
                title: "Documentation Ready",
                content: "The exported markdown is ready to paste into README files, pull request descriptions, or project documentation."
            }
        ],
        bottomdesc: "One-click export makes it simple to share your progress and maintain project documentation."
    }
];

const relatedTools = [
    {
        title: "LinkedIn Text Formatter",
        description: "Format LinkedIn posts with professional styling to boost engagement.",
        link: "/linkedin-text-formatter"
    },
    {
        title: "Find & Replace",
        description: "Quickly find and replace text in code with ease.",
        link: "/find-and-replace"
    },
    {
        title: "Code Comparator",
        description: "Compare two code versions side by side with detailed difference highlighting.",
        link: "/code-comparator"
    }
];

const Header = () => {
    return (
        <div className="w-full bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-2xl md:text-3xl font-bold text-center text-foreground">README Today</h1>
                <p className="text-sm text-muted-foreground text-center mt-2">Notion-style task manager with markdown export for developers.</p>
            </div>
        </div>
    );
};

const TaskItem = ({
    task,
    onUpdate,
    onDelete
}: {
    task: Task;
    onUpdate: (id: string, updates: Partial<Task>) => void;
    onDelete: (id: string) => void;
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(task.content);

    const inputRef = useRef<HTMLInputElement>(null);

    const handleContentChange = (value: string) => {
        setEditContent(value);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            onUpdate(task.id, { content: editContent });
            setIsEditing(false);
        } else if (e.key === 'Escape') {
            setEditContent(task.content);
            setIsEditing(false);
        }
    };



    const cycleStatus = () => {
        const statuses: TaskStatus[] = ["not_started", "pending", "blocker", "completed"];
        const currentIndex = statuses.indexOf(task.status);
        const nextStatus = statuses[(currentIndex + 1) % statuses.length];
        onUpdate(task.id, { status: nextStatus });
    };

    return (
        <div className="group flex items-center gap-3 p-4 bg-card border border-border/50 rounded-lg hover:border-border hover:shadow-sm transition-all relative">
            <button
                onClick={cycleStatus}
                className={`text-lg font-mono ${statusConfig[task.status].color} hover:scale-110 transition-transform`}
                title={`Click to change status (currently: ${statusConfig[task.status].label})`}
            >
                {statusConfig[task.status].emoji}
            </button>

            <div className="flex-1 relative">
                {isEditing ? (
                    <>
                        <Input
                            ref={inputRef}
                            value={editContent}
                            onChange={(e) => handleContentChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={() => {
                                onUpdate(task.id, { content: editContent });
                                setIsEditing(false);
                            }}
                            className="border-none p-0 focus-visible:ring-0 bg-transparent text-foreground text-xl"
                            autoFocus
                        />
                    </>
                ) : (
                    <div
                        onClick={() => setIsEditing(true)}
                        className="cursor-text py-1 text-foreground hover:text-primary transition-colors text-lg"
                    >
                        {task.content || "Click to add task description..."}
                    </div>
                )}
            </div>

            <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(task.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
            >
                <Trash2 className="w-4 h-4" />
            </Button>
        </div>
    );
};

export default function Content() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [, setLastResetDate] = useState<string | null>(null);
    const [showResetPrompt, setShowResetPrompt] = useState(false);
    const [copied, setCopied] = useState(false);
    const [historicalTasks, setHistoricalTasks] = useState<DailyTasks[]>([]);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    // Load tasks from localStorage
    useEffect(() => {
        const savedTasks = localStorage.getItem('readme-today-tasks');
        const savedResetDate = localStorage.getItem('readme-today-reset-date');
        const savedHistoricalTasks = localStorage.getItem('readme-today-historical-tasks');

        if (savedTasks) {
            const parsedTasks = JSON.parse(savedTasks).map((task: { id: string; content: string; status: TaskStatus; createdAt: string }) => ({
                ...task,
                createdAt: new Date(task.createdAt)
            }));
            setTasks(parsedTasks);
        }

        if (savedResetDate) {
            setLastResetDate(savedResetDate);
        }

        if (savedHistoricalTasks) {
            setHistoricalTasks(JSON.parse(savedHistoricalTasks));
        }

        // Check if it's a new day
        const today = new Date().toDateString();
        if (savedResetDate && savedResetDate !== today && savedTasks && JSON.parse(savedTasks).length > 0) {
            setShowResetPrompt(true);
        } else if (!savedResetDate) {
            setLastResetDate(today);
            localStorage.setItem('readme-today-reset-date', today);
        }

        // Clean up old tasks (older than 30 days)
        if (savedHistoricalTasks) {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const filteredTasks = JSON.parse(savedHistoricalTasks).filter(
                (dailyTask: DailyTasks) => new Date(dailyTask.date) >= thirtyDaysAgo
            );

            setHistoricalTasks(filteredTasks);
            localStorage.setItem('readme-today-historical-tasks', JSON.stringify(filteredTasks));
        }
    }, []);

    // Save tasks to localStorage
    useEffect(() => {
        localStorage.setItem('readme-today-tasks', JSON.stringify(tasks));
    }, [tasks]);

    // Save historical tasks to localStorage
    useEffect(() => {
        localStorage.setItem('readme-today-historical-tasks', JSON.stringify(historicalTasks));
    }, [historicalTasks]);

    const addTask = () => {
        const newTask: Task = {
            id: Date.now().toString(),
            content: "",
            status: "not_started",
            createdAt: new Date()
        };
        setTasks([...tasks, newTask]);
    };

    const updateTask = (id: string, updates: Partial<Task>) => {
        setTasks(tasks.map(task =>
            task.id === id ? { ...task, ...updates } : task
        ));
    };

    const deleteTask = (id: string) => {
        setTasks(tasks.filter(task => task.id !== id));
    };

    const resetTasks = () => {
        if (tasks.length > 0) {
            // Save current tasks to historical tasks
            const today = new Date();
            const dateString = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD

            // Check if we already have an entry for today
            const existingIndex = historicalTasks.findIndex(item => item.date === dateString);

            if (existingIndex >= 0) {
                // Update existing entry
                const updatedHistoricalTasks = [...historicalTasks];
                updatedHistoricalTasks[existingIndex] = { date: dateString, tasks: [...tasks] };
                setHistoricalTasks(updatedHistoricalTasks);
            } else {
                // Add new entry
                setHistoricalTasks([...historicalTasks, { date: dateString, tasks: [...tasks] }]);
            }
        }

        setTasks([]);
        const today = new Date().toDateString();
        setLastResetDate(today);
        localStorage.setItem('readme-today-reset-date', today);
        setShowResetPrompt(false);
        setSelectedDate(null);
    };

    const exportAsMarkdown = () => {
        // If viewing historical tasks, export those instead
        let tasksToExport: Task[] = [];
        let dateStr: string;

        if (selectedDate) {
            const selectedHistoricalTasks = historicalTasks.find(item => item.date === selectedDate);
            if (selectedHistoricalTasks) {
                tasksToExport = selectedHistoricalTasks.tasks;
                const date = new Date(selectedDate);
                dateStr = `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
            } else {
                dateStr = new Date().toLocaleDateString();
            }
        } else {
            tasksToExport = tasks;
            dateStr = new Date().toLocaleDateString();
        }

        let markdown = `## Tasks for ${dateStr}\n\n`;

        if (tasksToExport.length === 0) {
            markdown += "No tasks for this day.\n";
        } else {
            tasksToExport.forEach(task => {
                const status = statusConfig[task.status];
                markdown += `${status.emoji} ${task.content}\n\n`;
            });
        }

        navigator.clipboard.writeText(markdown);

        // Set button text to "Copied" temporarily
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };



    return (
        <>
            <Header />

            {/* Reset Prompt */}
            {showResetPrompt && (
                <div className="w-full bg-yellow-50 border-b border-yellow-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-yellow-600" />
                                <span className="text-yellow-800">It&apos;s a new day! Would you like to start fresh?</span>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowResetPrompt(false)}
                                >
                                    Keep Tasks
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={resetTasks}
                                    className="bg-yellow-600 hover:bg-yellow-700"
                                >
                                    Start Fresh
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 bg-background w-full max-w-6xl mx-auto">
                <div className="max-w-6xl mx-auto px-4 md:px-10 py-8 min-h-[calc(100vh-10rem)]">
                    <div className="space-y-6 h-full flex flex-col">
                        {/* Header Actions */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-semibold text-foreground">
                                    {selectedDate ? 'Historical' : 'Today\'s'} Tasks (
                                    {selectedDate ?
                                        (() => {
                                            const date = new Date(selectedDate);
                                            return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
                                        })() :
                                        `${String(new Date().getDate()).padStart(2, '0')}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${new Date().getFullYear()}`}
                                    )
                                </h2>
                                {selectedDate && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedDate(null);
                                        }}
                                        className="text-muted-foreground hover:text-foreground flex items-center gap-1"
                                    >
                                        <X className="w-4 h-4" />
                                        <span>Back to Today</span>
                                    </Button>
                                )}
                            </div>
                            <div className="flex gap-2">
                                {/* Historical Tasks Dropdown */}
                                <div className="relative group">
                                    <Button
                                        variant="outline"
                                        disabled={historicalTasks.length === 0}
                                        className="flex items-center gap-2"
                                        onClick={() => {
                                            const dropdown = document.getElementById('historical-dropdown');
                                            if (dropdown) {
                                                dropdown.classList.toggle('hidden');
                                            }
                                        }}
                                    >
                                        <History className="w-4 h-4" />
                                        <span>History</span>
                                        <ChevronDown className="w-3 h-3 ml-1" />
                                    </Button>

                                    <div id="historical-dropdown" className="absolute hidden right-0 mt-1 w-64 bg-card border border-border shadow-lg rounded-md z-10 max-h-64 overflow-y-auto py-1">
                                        {historicalTasks.length === 0 ? (
                                            <div className="px-4 py-2 text-sm text-muted-foreground">No historical tasks</div>
                                        ) : (
                                            historicalTasks
                                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                                .map(dailyTasks => {
                                                    const date = new Date(dailyTasks.date);
                                                    const formattedDate = `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
                                                    return (
                                                        <button
                                                            key={dailyTasks.date}
                                                            className="w-full text-left px-4 py-2 hover:bg-accent/50 text-sm flex items-center justify-between"
                                                            onClick={() => {
                                                                setSelectedDate(dailyTasks.date);
                                                                const dropdown = document.getElementById('historical-dropdown');
                                                                if (dropdown) {
                                                                    dropdown.classList.add('hidden');
                                                                }
                                                            }}
                                                        >
                                                            <span>{formattedDate}</span>
                                                            <span className="text-muted-foreground">{dailyTasks.tasks.length} tasks</span>
                                                        </button>
                                                    );
                                                })
                                        )}
                                    </div>
                                </div>

                                <Button
                                    variant="outline"
                                    onClick={exportAsMarkdown}
                                    disabled={(selectedDate ? false : tasks.length === 0)}
                                >
                                    <Copy className="w-4 h-4 mr-2" />
                                    {copied ? "Copied" : "Copy as Markdown"}
                                </Button>

                                {!selectedDate && (
                                    <Button onClick={addTask}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Task
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Tasks List */}
                        <div className="space-y-3 flex-1">
                            {selectedDate ? (
                                // Historical tasks view
                                (() => {
                                    const selectedTasks = historicalTasks.find(item => item.date === selectedDate);

                                    if (!selectedTasks || selectedTasks.tasks.length === 0) {
                                        return (
                                            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-muted-foreground">
                                                <Calendar className="w-16 h-16 mx-auto mb-6 opacity-30" />
                                                <h3 className="text-lg font-medium mb-2 text-foreground">No tasks for this day</h3>
                                                <p className="text-center max-w-md">There were no tasks recorded for this date.</p>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="space-y-3">
                                            {selectedTasks.tasks.map((task) => (
                                                <div key={task.id} className="group flex items-center gap-3 p-4 bg-card border border-border/50 rounded-lg hover:border-border hover:shadow-sm transition-all relative">
                                                    <span
                                                        className={`text-lg font-mono ${statusConfig[task.status].color}`}
                                                    >
                                                        {statusConfig[task.status].emoji}
                                                    </span>
                                                    <div className="flex-1 py-1 text-foreground text-lg">
                                                        {task.content}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()
                            ) : tasks.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-muted-foreground">
                                    <Calendar className="w-16 h-16 mx-auto mb-6 opacity-30" />
                                    <h3 className="text-lg font-medium mb-2 text-foreground">Ready for a productive day?</h3>
                                    <p className="text-center max-w-md">No tasks yet. Click &quot;Add Task&quot; to get started with your daily workflow!</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {tasks.map((task) => (
                                        <TaskItem
                                            key={task.id}
                                            task={task}
                                            onUpdate={updateTask}
                                            onDelete={deleteTask}
                                        />
                                    ))}
                                    <div className="flex justify-center">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={addTask}
                                            className="bg-primary/10 rounded-full h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-primary/20 transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Click outside to close dropdown */}
                        <div
                            className="fixed inset-0 bg-transparent z-0 hidden"
                            id="dropdown-backdrop"
                            onClick={() => {
                                const dropdown = document.getElementById('historical-dropdown');
                                const backdrop = document.getElementById('dropdown-backdrop');
                                if (dropdown) dropdown.classList.add('hidden');
                                if (backdrop) backdrop.classList.add('hidden');
                            }}
                        />

                        {/* Script to handle dropdown */}
                        <div dangerouslySetInnerHTML={{
                            __html: `
                            <script>
                                document.addEventListener('click', function(event) {
                                    const dropdown = document.getElementById('historical-dropdown');
                                    const backdrop = document.getElementById('dropdown-backdrop');
                                    const historyButton = event.target.closest('button');
                                    
                                    if (historyButton && historyButton.contains(document.querySelector('[data-lucide="history"]'))) {
                                        if (dropdown && dropdown.classList.contains('hidden')) {
                                            dropdown.classList.remove('hidden');
                                            if (backdrop) backdrop.classList.remove('hidden');
                                        } else {
                                            if (dropdown) dropdown.classList.add('hidden');
                                            if (backdrop) backdrop.classList.add('hidden');
                                        }
                                    } else if (dropdown && !dropdown.contains(event.target)) {
                                        dropdown.classList.add('hidden');
                                        if (backdrop) backdrop.classList.add('hidden');
                                    }
                                });
                            </script>
                        ` }} />
                    </div>
                </div>
            </div>

            {/* Examples Section */}
            <div className="w-full py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center text-foreground">Examples & Use Cases</h2>
                    <Example examples={examples} />
                </div>
            </div>

            {/* Keyboard Shortcut Hint */}
            <KeyboardShortcutHint />

            {/* Examples Section */}
            <div className="w-full py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center text-foreground">Examples & Use Cases</h2>
                    <Example examples={examples} />
                </div>
            </div>

            {/* FAQs Section */}
            <div className="w-full bg-background py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center text-foreground">Frequently Asked Questions</h2>
                    <FAQ faqs={faqs} />
                </div>
            </div>

            {/* Related Tools Section */}
            <RelatedTools tools={relatedTools} />
        </>
    );
}