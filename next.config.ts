import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
	dest: "public",
	disable: process.env.NODE_ENV === "development",
	register: true,
	workboxOptions: {
		skipWaiting: true,
		clientsClaim: true,
	},
});

const nextConfig: NextConfig = {
	reactCompiler: true,
	experimental: {
		serverActions: {
			/** Sampul kursus (data URL / string panjang) lewat createCourse / updateCourse */
			bodySizeLimit: "12mb",
		},
	},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "firebasestorage.googleapis.com",
			},
			{
				protocol: "https",
				hostname: "*.googleusercontent.com",
			},
		],
	},
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: [
					{
						key: "Cross-Origin-Opener-Policy",
						value: "unsafe-none",
					},
				],
			},
		];
	},
};

export default withPWA(nextConfig);
