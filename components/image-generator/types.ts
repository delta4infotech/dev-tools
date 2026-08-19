import React from 'react';

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:5' | '4:3' | '3:2' | '1.91:1';

export interface AspectRatioPreset {
    id: AspectRatio;
    label: string;
    description: string;
    width: number;
    height: number;
}

export const ASPECT_RATIO_PRESETS: AspectRatioPreset[] = [
    { id: '1:1', label: 'Square', description: 'Instagram post', width: 1080, height: 1080 },
    { id: '16:9', label: 'Wide', description: 'YouTube / Twitter', width: 1920, height: 1080 },
    { id: '9:16', label: 'Story', description: 'Instagram / TikTok story', width: 1080, height: 1920 },
    { id: '4:5', label: 'Portrait', description: 'Instagram portrait', width: 1080, height: 1350 },
    { id: '4:3', label: 'Classic', description: 'Standard', width: 1600, height: 1200 },
    { id: '3:2', label: 'Photo', description: 'Photography', width: 1500, height: 1000 },
    { id: '1.91:1', label: 'OG / LinkedIn', description: 'Open Graph / LinkedIn', width: 1200, height: 627 },
];

export type Alignment =
    'top-left' | 'top-center' | 'top-right' |
    'middle-left' | 'middle-center' | 'middle-right' |
    'bottom-left' | 'bottom-center' | 'bottom-right';

export interface Gradient {
    colors: [string, string];
    angle: number;
}

export interface ImageSettings {
    padding: number;
    scale: number;
    shadow: number;
    corners: number;
    alignment: Alignment;
    glassmorphicBorder: {
        enabled: boolean;
        opacity: number;
        size: number;
        color: string;
    };
    x?: number;
    y?: number;
    mockup?: string; // id of selected device mockup, or undefined for none
    mockupColor?: 'dark' | 'light';
    mockupLayout?: 'single' | 'grid-2' | 'grid-3';
}

export interface BackgroundEffects {
    noiseOpacity: number;
    vignetteOpacity: number;
    blur: number;
    motionBlur: number;
    watercolor: number;
    pattern: 'none' | 'dots' | 'grid' | 'lines' | 'waves' | 'zigzag' | 'hexagons' | 'diagonal-stripes' | 'crosshatch' | 'plus';
    patternOpacity: number;
    canvasCornerRadius?: number;
}

export interface TextShadow {
    color: string;
    offsetX: number;
    offsetY: number;
    blur: number;
    opacity: number;
}

export interface TextStroke {
    color: string;
    width: number;
}

export interface TextEffects {
    isGlassmorphic: boolean;
    glassColor: string;
    glassOpacity: number;
    shadow: TextShadow;
    stroke: TextStroke;
    blur: number;
}

export interface TextObject {
    id: string;
    content: string;
    yPosition: number;
    xPosition: number;
    fontFamily: string;
    fontColor: string;
    fontSizeScale: number;
    width?: number;
}

export type ArrowLineStyle = 'solid' | 'dashed' | 'dotted';
export type ArrowHeadStyle = 'filled' | 'hollow' | 'none';

export interface ArrowObject {
    id: string;
    type: 'arrow';
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    color: string;
    strokeWidth: number;
    lineStyle?: ArrowLineStyle;
    headStyle?: ArrowHeadStyle;
}

export interface ArrowDefaults {
    color: string;
    strokeWidth: number;
    lineStyle: ArrowLineStyle;
    headStyle: ArrowHeadStyle;
}

export type CounterFormat = 'number' | 'roman' | 'alpha';

export interface CounterObject {
    id: string;
    type: 'counter';
    x: number;
    y: number;
    count: number;
    format: CounterFormat;
    color: string;
    scale: number;
}

export interface CounterDefaults {
    color: string;
    scale: number;
    format: CounterFormat;
    startAt: number;
}

export interface RedactObject {
    id: string;
    type: 'redact';
    x: number;
    y: number;
    width: number;
    height: number;
    mode: 'blur' | 'pixelate' | 'solid';
}

export interface ShapeObject {
    id: string;
    type: 'shape';
    shapeType: 'rect' | 'circle' | 'triangle';
    x: number;
    y: number;
    width: number;
    height: number;
    fill: string;
    stroke: string;
    strokeWidth: number;
}

export type BrushMode = 'pencil' | 'highlighter' | 'blur';

export interface BrushPoint {
    x: number;
    y: number;
}

export interface BrushObject {
    id: string;
    type: 'brush';
    mode: BrushMode;
    points: BrushPoint[];
    color: string;
    size: number;
}

export interface BrushDefaults {
    mode: BrushMode;
    color: string;
    size: number;
}

export type CanvasObject = TextObject | ArrowObject | CounterObject | RedactObject | ShapeObject | BrushObject;


export interface Selection {
    canvasKey: number;
    itemId: string;
    type: 'text' | 'arrow' | 'counter' | 'redact' | 'shape' | 'brush';
}

export interface UploadedImage {
    id: string;
    src: string;
    name: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    scale?: number;
    crop?: { x: number; y: number; width: number; height: number };
}

export type CropAspectRatio = 'free' | '1:1' | '16:9' | '9:16' | '4:3' | '3:2';

export type DrawingMode = 'arrow' | 'redact' | 'shape' | 'counter' | 'move' | 'brush' | 'crop' | null;

export interface ControlsProps {
    aspectRatio: AspectRatio;
    setAspectRatio: React.Dispatch<React.SetStateAction<AspectRatio>>;
    gradient: Gradient;
    setGradient: React.Dispatch<React.SetStateAction<Gradient>>;
    backgroundImage: string | null;
    setBackgroundImage: React.Dispatch<React.SetStateAction<string | null>>;
    handleBackgroundUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    removeBackgroundImage: () => void;
    backgroundEffects: BackgroundEffects;
    setBackgroundEffects: React.Dispatch<React.SetStateAction<BackgroundEffects>>;
    textEffects: TextEffects;
    setTextEffects: React.Dispatch<React.SetStateAction<TextEffects>>;
    imageSettings: ImageSettings;
    setImageSettings: React.Dispatch<React.SetStateAction<ImageSettings>>;
    uploadedImages: UploadedImage[];
    activeImageIndex: number | null;
    setActiveImageIndex: React.Dispatch<React.SetStateAction<number | null>>;
    isManualPosition?: boolean;
    onResetPosition: () => void;
    handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    removeUploadedImage: (index: number) => void;
    removeAllUploadedImages: () => void;
    generateNewGradient: () => void;
    onDownloadSingle: () => void;
    onDownloadZip: () => void;
    onCopyToClipboard: () => void;
    copyStatus: 'idle' | 'copying' | 'copied' | 'error';
    exportFormat: 'png' | 'jpeg' | 'webp';
    setExportFormat: React.Dispatch<React.SetStateAction<'png' | 'jpeg' | 'webp'>>;
    exportQuality: number;
    setExportQuality: React.Dispatch<React.SetStateAction<number>>;
    isDownloading: boolean;
    isDevMode: boolean;
    setIsDevMode: React.Dispatch<React.SetStateAction<boolean>>;
    hasTextOnCanvas: boolean;
    drawingMode: DrawingMode;
    setDrawingMode: React.Dispatch<React.SetStateAction<DrawingMode>>;
    onDevModeClick: () => void;
    onImageUpload: (file: File) => void;
}

export interface ImagePreviewProps {
    canvasKey: number;
    previewContainerRef: React.RefObject<HTMLDivElement | null>;
    aspectRatio: AspectRatio;
    backgroundValue: string;
    backgroundImage: string | null;
    backgroundEffects: BackgroundEffects;
    textEffects: TextEffects;
    uploadedImage: string | null;
    uploadedImageObj: UploadedImage | null;
    uploadedImages: UploadedImage[];
    onUpdateImage: (id: string, updates: Partial<UploadedImage>) => void;

    imageSettings: ImageSettings;

    texts: TextObject[];
    arrows: ArrowObject[];
    arrowDefaults: ArrowDefaults;
    onTextUpdate: (id: string, props: Partial<Omit<TextObject, 'id'>>) => void;
    onTextUpdateWithHistory: (id: string, props: Partial<Omit<TextObject, 'id'>>) => void;
    onTextDelete: (id: string) => void;
    onArrowAdd: (arrow: Omit<ArrowObject, 'id' | 'type'>) => void;
    onArrowUpdate: (id: string, props: Partial<Omit<ArrowObject, 'id' | 'type'>>) => void;
    onArrowUpdateWithHistory: (id: string, props: Partial<Omit<ArrowObject, 'id' | 'type'>>) => void;
    onArrowDelete: (id: string) => void;
    counters: CounterObject[];
    onCounterAdd: (coords?: { x: number, y: number }) => void;
    onCounterUpdate: (id: string, props: Partial<Omit<CounterObject, 'id' | 'type'>>) => void;
    onCounterUpdateWithHistory: (id: string, props: Partial<Omit<CounterObject, 'id' | 'type'>>) => void;
    onCounterDelete: (id: string) => void;
    redactions: RedactObject[];
    onRedactAdd: (redact: Omit<RedactObject, 'id' | 'type'>) => void;
    onRedactUpdate: (id: string, props: Partial<Omit<RedactObject, 'id' | 'type'>>) => void;
    onRedactUpdateWithHistory: (id: string, props: Partial<Omit<RedactObject, 'id' | 'type'>>) => void;
    onRedactDelete: (id: string) => void;
    shapes: ShapeObject[];
    onShapeAdd: (shape: Omit<ShapeObject, 'id' | 'type'>) => void;
    onShapeUpdate: (id: string, props: Partial<Omit<ShapeObject, 'id' | 'type'>>) => void;
    onShapeUpdateWithHistory: (id: string, props: Partial<Omit<ShapeObject, 'id' | 'type'>>) => void;
    onShapeDelete: (id: string) => void;
    brushes: BrushObject[];
    brushDefaults: BrushDefaults;
    onBrushAdd: (brush: Omit<BrushObject, 'id' | 'type'>) => void;
    onBrushDelete: (id: string) => void;
    onBeginInteractionHistory: () => void;
    cropImageId: string | null;
    onCropApply: (crop: { x: number; y: number; width: number; height: number } | undefined) => void;
    onCropCancel: () => void;
    onImageSettingsChange: <K extends keyof ImageSettings>(key: K, value: ImageSettings[K]) => void;
    selection: Selection | null;
    onSelectObject: (canvasKey: number, id: string | null, type: 'text' | 'arrow' | 'counter' | 'redact' | 'shape' | 'brush') => void;
    editing: Selection | null;
    onSetEditing: (canvasKey: number, id: string | null) => void;
    onActivate: () => void;
    isActive: boolean;
    drawingMode: DrawingMode;
    setDrawingMode: React.Dispatch<React.SetStateAction<DrawingMode>>;
}
