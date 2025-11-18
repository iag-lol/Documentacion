import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Documentos de Buses',
  description: 'Gestión integral de documentos para buses urbanos'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <div className="min-h-screen mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </body>
    </html>
  );
}
