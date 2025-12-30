import React from 'react';

export type AspectRatio = '1:1' | '16:9';

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
}

export interface BackgroundEffects {
    noiseOpacity: number;
    vignetteOpacity: number;
    blur: number;
    motionBlur: number;
    watercolor: number;
    pattern: 'none' | 'dots' | 'grid' | 'lines';
    patternOpacity: number;
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

export interface ArrowObject {
    id: string;
    type: 'arrow';
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    color: string;
    strokeWidth: number;
}

export interface CounterObject {
    id: string;
    type: 'counter';
    x: number;
    y: number;
    count: number;
    format: 'number' | 'roman' | 'alpha';
    color: string;
    scale: number;
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

export type CanvasObject = TextObject | ArrowObject | CounterObject | RedactObject | ShapeObject;


export interface Selection {
    canvasKey: number;
    itemId: string;
    type: 'text' | 'arrow' | 'counter' | 'redact' | 'shape';
}

export interface UploadedImage {
    id: string;
    src: string;
    name: string;
    x?: number;
    y?: number;
}

export type DrawingMode = 'arrow' | 'redact' | 'shape' | 'counter' | 'move' | null;

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
    onUpdateImage: (id: string, updates: Partial<UploadedImage>) => void;

    imageSettings: ImageSettings;

    texts: TextObject[];
    arrows: ArrowObject[];
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
    onImageSettingsChange: <K extends keyof ImageSettings>(key: K, value: ImageSettings[K]) => void;
    selection: Selection | null;
    onSelectObject: (canvasKey: number, id: string | null, type: 'text' | 'arrow' | 'counter' | 'redact' | 'shape') => void;
    editing: Selection | null;
    onSetEditing: (canvasKey: number, id: string | null) => void;
    onActivate: () => void;
    isActive: boolean;
    drawingMode: DrawingMode;
    setDrawingMode: React.Dispatch<React.SetStateAction<DrawingMode>>;
}
