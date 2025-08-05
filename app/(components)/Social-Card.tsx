import {
    Heart,
    MessageCircle,
    Share2,
    Bookmark,
    Link as LinkIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SocialCardProps {
    id?: string;
    author?: {
        name?: string;
        username?: string;
        avatar?: string;
        timeAgo?: string;
    };
    content?: {
        text?: string;
        link?: {
            title?: string;
            description?: string;
            icon?: React.ReactNode;
        };
    };
    engagement?: {
        likes?: number;
        comments?: number;
        shares?: number;
        isLiked?: boolean;
        isBookmarked?: boolean;
    };
    onLike?: () => void;
    onComment?: () => void;
    onShare?: () => void;
    onBookmark?: () => void;
    className?: string;
}

const defaultProps: SocialCardProps = {
    author: {
        name: "Dorian Baffier",
        username: "dorian_baffier",
        avatar: "https://github.com/shadcn.png",
        timeAgo: "2h ago",
    },
    content: {
        text: "Just launched Ruixen UI! Check out the documentation and let me know what you think 🎨",
        link: {
            title: "Ruixen UI Documentation",
            description: "A comprehensive guide to Ruixen UI",
            icon: <LinkIcon className="w-5 h-5 text-blue-500" />,
        },
    },
    engagement: {
        likes: 128,
        comments: 32,
        shares: 24,
        isLiked: false,
        isBookmarked: false,
    },
};

export default function SocialCard({
    author = defaultProps.author,
    content = defaultProps.content,
    engagement = defaultProps.engagement,
    onLike,
    onComment,
    onShare,
    onBookmark,
    className,
}: SocialCardProps) {
    return (
        <div className={cn(
            "w-full max-w-2xl mx-auto rounded-2xl bg-card border border-border shadow-lg transition-all",
            className
        )}>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4">
                <div className="flex items-center gap-3">
                    <img
                        src={author?.avatar}
                        alt={author?.name}
                        className="w-10 h-10 rounded-full border border-border object-cover"
                    />
                    
                    <div>
                        <p className="text-sm font-semibold text-card-foreground">{author?.name}</p>
                        <p className="text-xs text-muted-foreground">@{author?.username} · {author?.timeAgo}</p>
                    </div>
                    <span className="bg-green-500 w-2 h-2 rounded-full"></span>
                </div>
                <div>
                    <Bookmark
                        onClick={onBookmark}
                        className={cn(
                            "w-4 h-4 cursor-pointer transition hover:text-yellow-500",
                            engagement?.isBookmarked ? "text-yellow-500" : "text-muted-foreground"
                        )}
                    />
                </div>
            </div>

            {/* Content */}
            <div className="px-4 py-4 text-card-foreground text-sm leading-relaxed whitespace-pre-wrap">
                {content?.text}
            </div>

            {/* Optional Link Box */}
            {content?.link && (
                <div className="mx-4 mb-4 rounded-lg bg-muted border border-border p-3 hover:bg-muted/80 transition">
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-md bg-background">
                            {content.link.icon}
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-card-foreground">{content.link.title}</h4>
                            <p className="text-xs text-muted-foreground">{content.link.description}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Reactions Footer */}
            <div className="grid grid-cols-3 divide-x divide-border text-xs">
                <button
                    onClick={onLike}
                    className={cn(
                        "py-3 flex items-center justify-center gap-2 transition hover:bg-muted/50",
                        engagement?.isLiked ? "text-red-500 font-semibold" : "text-muted-foreground"
                    )}
                >
                    <Heart className={cn("w-3.5 h-3.5", engagement?.isLiked && "fill-current")} />
                    {engagement?.likes}
                </button>
                <button
                    onClick={onComment}
                    className="py-3 flex items-center justify-center gap-2 text-muted-foreground hover:bg-muted/50 transition"
                >
                    <MessageCircle className="w-3.5 h-3.5" />
                    {engagement?.comments}
                </button>
                <button
                    onClick={onShare}
                    className="py-3 flex items-center justify-center gap-2 text-muted-foreground hover:bg-muted/50 transition"
                >
                    <Share2 className="w-3.5 h-3.5" />
                    {engagement?.shares}
                </button>
            </div>
        </div>
    );
}
