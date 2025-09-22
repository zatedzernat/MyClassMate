/** @type {import('next').NextConfig} */
const config = {
    async rewrites() {
        return [
          {
            source: '/api/:path*',
            destination: 'http://127.0.0.1:8080/:path*', // Proxy API calls to local backend
          },
        ];
      },
};

export default config;
