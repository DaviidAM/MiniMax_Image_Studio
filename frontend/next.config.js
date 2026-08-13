/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/generate',
        destination: 'http://localhost:8000/generate',
      },
    ];
  },
};

module.exports = nextConfig;
