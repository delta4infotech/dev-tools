import { Gradient } from '../types';
import { randomHexColor } from './color';

const randomInt = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const generateRandomGradient = (): Gradient => {
    return {
        colors: [randomHexColor(), randomHexColor()],
        angle: randomInt(0, 360),
    };
};

export const gradientToString = (gradient: Gradient): string => {
    return `linear-gradient(${gradient.angle}deg, ${gradient.colors.join(', ')})`;
};
