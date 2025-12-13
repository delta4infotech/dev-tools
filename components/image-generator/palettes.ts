import { Gradient } from './types';

interface Palette {
    name: string;
    gradient: Gradient;
}

export const PRESET_PALETTES: Palette[] = [
    { name: 'Sunset', gradient: { colors: ['#ff7e5f', '#feb47b'], angle: 135 } },
    { name: 'Ocean', gradient: { colors: ['#2193b0', '#6dd5ed'], angle: 45 } },
    { name: 'Grape', gradient: { colors: ['#cc2b5e', '#753a88'], angle: 90 } },
    { name: 'Forest', gradient: { colors: ['#134e5e', '#71b280'], angle: 180 } },
    { name: 'Peach', gradient: { colors: ['#ed4264', '#ffedbc'], angle: 225 } },
    { name: 'Sky', gradient: { colors: ['#2980b9', '#6dd5fa',], angle: 315 } },
    { name: 'Mango', gradient: { colors: ['#ffe259', '#ffa751'], angle: 70 } },
    { name: 'Rose', gradient: { colors: ['#f4c4f3', '#fc67fa'], angle: 160 } },
];
