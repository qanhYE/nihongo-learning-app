/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},
  webpack: (config) => {
    // pdfjs-dist needs canvas to be excluded in server context
    config.resolve.alias.canvas = false
    return config
  },
}

export default nextConfig
