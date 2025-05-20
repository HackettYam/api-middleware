import './globals.css';
import type { Metadata } from 'next';
import { Providers } from '../lib/providers';

export const metadata: Metadata = {
  title: 'Basic CRUD REST API - Next.js Example with @hackettyam/api-middleware',
  description: 'Example application to demonstrate the use of the @hackettyam/api-middleware library for REST APIs in Next.js',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="min-h-screen">
        <div className="container">
          <Providers>
            {children}
          </Providers>
        </div>
      </body>
    </html>
  );
}
