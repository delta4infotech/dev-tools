export interface DeviceMockup {
  id: string;
  name: string;
  category: 'phone' | 'tablet' | 'laptop' | 'desktop' | 'browser';
  /**
   * Transparent PNG device frame images.
   * Screen area is white/transparent in the PNG so the user's image shows through.
   */
  images: {
    dark: string;
    light: string;
  };
  /**
   * Where the screen area sits inside the frame PNG,
   * expressed as percentages of the **PNG's** own width and height.
   *
   * Used to position/clip the user's foreground image into the device screen.
   */
  screen: {
    x: number;      // left edge, % of PNG width
    y: number;      // top edge, % of PNG height
    width: number;  // screen width, % of PNG width
    height: number; // screen height, % of PNG height
  };
  /** Intrinsic aspect ratio of the frame PNG (width ÷ height) */
  aspectRatio: number;
}

const isProd = process.env.NODE_ENV === 'production';
const BASE_PATH = isProd ? '/tools' : '';

const getAssetPath = (path: string) => `${BASE_PATH}${path}`;

export const DEVICE_MOCKUPS: DeviceMockup[] = [
  {
    id: 'iphone',
    name: 'iPhone',
    category: 'phone',
    images: {
      dark: getAssetPath('/mockups/iphone-black.png'),
      light: getAssetPath('/mockups/iphone-silver.png'),
    },
    // iPhone X portrait PNG (726x1444)
    // Bleed slightly under the bezel to prevent 1px gaps
    screen: { x: 5, y: 3.5, width: 90, height: 93 },
    aspectRatio: 480 / 976,
  },
  {
    id: 'android',
    name: 'Android',
    category: 'phone',
    images: {
      dark: getAssetPath('/mockups/pixel-black.png'),
      light: getAssetPath('/mockups/pixel-white.png'),
    },
    // Google Pixel portrait PNG (1230x2386)
    // Bleed slightly under the bezel to prevent 1px gaps
    screen: { x: 4.5, y: 3.5, width: 91, height: 93 },
    aspectRatio: 420 / 875,
  },
];
