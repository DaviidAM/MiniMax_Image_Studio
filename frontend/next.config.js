/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/generate',
        destination: 'http://backend:8000/generate',
      },
    ];
  },
};

module.exports = nextConfig;
