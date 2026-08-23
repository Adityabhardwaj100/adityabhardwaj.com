/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Don't resolve symlinks to their real path — keeps module identity
    // stable when the project is mirrored via symlinks (e.g. local dev
    // workaround for slow cloud-synced folders). No-op in normal (Vercel)
    // builds, which have no symlinks to begin with.
    config.resolve.symlinks = false;
    return config;
  },
};

export default nextConfig;
