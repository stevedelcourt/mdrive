import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Client Portal',
  description: 'File exchange and validation portal',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0a0a0a] text-gray-100 antialiased">
        {children}
      </body>
    </html>
  );
}
