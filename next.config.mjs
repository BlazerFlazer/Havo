import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Pin the workspace root so a stray lockfile in a parent folder is ignored.
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
