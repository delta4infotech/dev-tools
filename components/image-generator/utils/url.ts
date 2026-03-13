export const getAssetUrl = (path: string) => {
  const isProd = process.env.NODE_ENV === 'production';
  const basePath = isProd ? '/tools' : '';
  
  if (path.startsWith('http')) return path;
  if (path.startsWith('data:')) return path;
  if (path.startsWith('blob:')) return path;
  
  // Ensure we don't double slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${basePath}${cleanPath}`;
};

export const getProxyUrl = (url: string) => {
  const isProd = process.env.NODE_ENV === 'production';
  const basePath = isProd ? '/tools' : '';
  return `${basePath}/api/proxy?url=${encodeURIComponent(url)}`;
};
