import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GoChat — Community Communication Platform',
  description: 'One platform for communities to connect, communicate, and collaborate in real time.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="h-full bg-[#111214] text-[#F2F3F5] overflow-hidden">{children}</body>
    </html>
  );
}
