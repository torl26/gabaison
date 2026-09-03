import type { Metadata } from 'next';
import { Geist_Mono, Noto_Sans_JP } from 'next/font/google';
import './globals.css';

const japaneseSans = Noto_Sans_JP({
  variable: '--font-japanese-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'TechTies',
  description: '学生とメンターをつなぐマッチングサービス TechTies',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ja" className={`${japaneseSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
