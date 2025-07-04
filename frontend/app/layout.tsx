import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'CRM Dashboard',
  description: 'Login to your CRM dashboard',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}