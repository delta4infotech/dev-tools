import React from 'react';
import { Metadata } from 'next';
import ImageGenerator from '@/components/image-generator/ImageGenerator';
import { LandingSections } from '@/components/image-generator/LandingSections';

export const metadata: Metadata = {
    title: 'Image Studio - Create Beautiful Screenshots & Social Cards | Dev Tools',
    description: 'Turn boring screenshots into beautiful social media assets. Free, privacy-focused image studio with customizable gradients, glassmorphism, and pixel-perfect controls. No watermarks.',
};

export default function ImageGeneratorPage() {
    return (
        <div className="w-full min-h-screen">
            <ImageGenerator />
            <LandingSections />
        </div>
    );
}
