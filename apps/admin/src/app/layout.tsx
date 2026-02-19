import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Keith Muoki’s Agent',
  description: 'Award-winning multi-agent AI sales workspace with real-time inbox and performance insights.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
