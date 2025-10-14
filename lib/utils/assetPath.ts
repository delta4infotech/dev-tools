/**
 * Utility function to get the correct asset path with basePath prefix in production
 * @param path - The asset path (e.g., "/delta-logo.svg")
 * @returns The full path with basePath prefix in production
 */
export function getAssetPath(path: string): string {
  const basePath = process.env.NODE_ENV === 'production' ? '/tools' : '';
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${basePath}${normalizedPath}`;
}
