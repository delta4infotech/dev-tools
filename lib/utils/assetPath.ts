/**
 * Utility function to get the correct asset path
 * In production, uses delta4.io assets; in development, uses local assets
 * @param path - The asset path (e.g., "/delta-logo.svg")
 * @returns The full path to the asset
 */
export function getAssetPath(path: string): string {
  const isProd = process.env.NODE_ENV === 'production';

  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // In production, use delta4.io for shared assets
  // Map specific assets to their locations on delta4.io
  if (isProd) {
    const assetMap: Record<string, string> = {
      '/delta-logo.svg': 'https://delta4.io/svg/delta-logo.svg',
      '/delta4-icon-footer.svg': 'https://delta4.io/delta4-icon-footer.svg',
      '/footer-bg.png': 'https://delta4.io/footer-bg.png',
      '/example-bg.png': '/tools/example-bg.png', // This is specific to dev-tools
    };

    return assetMap[normalizedPath] || `/tools${normalizedPath}`;
  }

  return normalizedPath;
}
