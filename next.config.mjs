/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
<<<<<<< HEAD
=======
  swcMinify: true,
  compress: true,
  allowedDevOrigins: ["http://10.100.6.77"],
>>>>>>> 5602bf6251f6241e94348fd05940a4cef1aa68e0
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
<<<<<<< HEAD
=======
    formats: ["image/avif", "image/webp"],
>>>>>>> 5602bf6251f6241e94348fd05940a4cef1aa68e0
  },
};

export default nextConfig;
