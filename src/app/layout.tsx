import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Planes BA',
  description: 'Convert Instagram plans into Google Calendar events.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-blush">
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6">
          {children}
        </div>
      </body>
    </html>
  );
}
