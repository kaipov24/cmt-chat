import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CMT Community Platform',
  description: 'Location-based community support for people with Charcot-Marie-Tooth disease.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
