import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
    basePath: isProd ? '/tools' : '',
    assetPrefix: isProd ? '/tools' : '',
}


export default nextConfig;
