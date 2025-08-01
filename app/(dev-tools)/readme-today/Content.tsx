"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Plus, Trash2, Calendar } from "lucide-react";
import FAQ, { FAQProps } from "../../(components)/FAQ";
import Example from "../../(components)/Example";

// Task status types
type TaskStatus = "not_started" | "pending" | "blocker" | "completed";

interface Task {
    id: string;
    content: string;
    status: TaskStatus;
    createdAt: Date;
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
        content: "The tool automatically detects when it's a new day and offers to clear your tasks for a fresh start. Your previous day's tasks are saved locally and can be exported before clearing."
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
        content: "All data is stored locally in your browser's localStorage. Nothing is sent to external servers, ensuring complete privacy of your tasks and workflow."
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

const Header = () => {
    return (
        <div className="w-full bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-2xl md:text-3xl font-bold text-center text-foreground">README Today</h1>
                <p className="text-sm text-muted-foreground text-center">Notion-style task manager with markdown export for developers.</p>
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

    // Load tasks from localStorage
    useEffect(() => {
        const savedTasks = localStorage.getItem('readme-today-tasks');
        const savedResetDate = localStorage.getItem('readme-today-reset-date');

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

        // Check if it's a new day
        const today = new Date().toDateString();
        if (savedResetDate && savedResetDate !== today && savedTasks && JSON.parse(savedTasks).length > 0) {
            setShowResetPrompt(true);
        } else if (!savedResetDate) {
            setLastResetDate(today);
            localStorage.setItem('readme-today-reset-date', today);
        }
    }, []);

    // Save tasks to localStorage
    useEffect(() => {
        localStorage.setItem('readme-today-tasks', JSON.stringify(tasks));
    }, [tasks]);

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
        setTasks([]);
        const today = new Date().toDateString();
        setLastResetDate(today);
        localStorage.setItem('readme-today-reset-date', today);
        setShowResetPrompt(false);
    };

    const exportAsMarkdown = () => {
        const today = new Date().toLocaleDateString();
        let markdown = `## Daily Tasks - ${today}\n\n`;

        if (tasks.length === 0) {
            markdown += "No tasks for today.\n";
        } else {
            tasks.forEach(task => {
                const status = statusConfig[task.status];
                markdown += `${status.emoji} ${task.content}\n`;
            });
        }

        navigator.clipboard.writeText(markdown);
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
                <div className="max-w-6xl mx-auto px-4 md:px-10 py-8 h-[calc(100vh-10rem)]">
                    <div className="space-y-6 h-full flex flex-col">
                        {/* Header Actions */}
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-foreground">
                                Today&apos;s Tasks (
                                {`${String(new Date().getDate()).padStart(2, '0')}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${new Date().getFullYear()}`}
                                )
                            </h2>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={exportAsMarkdown}
                                    disabled={tasks.length === 0}
                                >
                                    <Copy className="w-4 h-4 mr-2" />
                                    Copy as Markdown
                                </Button>
                                <Button onClick={addTask}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Task
                                </Button>
                            </div>
                        </div>

                        {/* Tasks List */}
                        <div className="space-y-3 flex-1">
                            {tasks.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-muted-foreground">
                                    <Calendar className="w-16 h-16 mx-auto mb-6 opacity-30" />
                                    <h3 className="text-lg font-medium mb-2 text-foreground">Ready for a productive day?</h3>
                                    <p className="text-center max-w-md">No tasks yet. Click &quot;Add Task&quot; to get started with your daily workflow!</p>
                                </div>
                            ) : (
                                tasks.map((task) => (
                                    <TaskItem
                                        key={task.id}
                                        task={task}
                                        onUpdate={updateTask}
                                        onDelete={deleteTask}
                                    />
                                ))
                            )}
                        </div>
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

            {/* FAQs Section */}
            <div className="w-full bg-background py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center text-foreground">Frequently Asked Questions</h2>
                    <FAQ faqs={faqs} />
                </div>
            </div>
        </>
    );
}