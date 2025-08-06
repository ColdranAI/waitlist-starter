import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Footer from "../components/footer";

const inter = Inter({
  subsets: ['latin'],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Minimal Waitlist - Simple Waitlist for SaaS",
  description: "A minimal, modern waitlist solution for SaaS products. Built with Next.js and Tailwind CSS, featuring Discord webhooks and a clean user interface.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "Minimal Waitlist - Simple Waitlist for SaaS",
    description: "A minimal, modern waitlist solution for SaaS products. Built with Next.js and Tailwind CSS, featuring Discord webhooks and a clean user interface.",
    images: [{
      url: 'https://waitlist.zerops.xyz/og.webp',
      width: 1200,
      height: 630,
      alt: 'Minimal Waitlist'
    }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Minimal Waitlist - Simple Waitlist for SaaS",
    description: "A minimal, modern waitlist solution for SaaS products. Built with Next.js and Tailwind CSS, featuring Discord webhooks and a clean user interface.",
    images: ['https://waitlist.zerops.xyz/og.webp'],
  },
  keywords: [
    'waitlist',
    'saas',
    'nextjs',
    'tailwindcss',
    'discord webhook',
    'minimal design',
    'open source'
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>

        <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
      </head>
      <body
        className={`${inter.variable} antialiased flex flex-col min-h-screen`}
      >
        <main className="flex-grow">
          {children}
          <Footer />
        </main>
      </body>
    </html>
  );
}
