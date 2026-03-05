
import type { Metadata } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers'; // Importamos el nuevo componente

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AcademiaCode',
  description: 'La plataforma moderna para la evaluación de código académico.',
};

/**
 * El RootLayout ahora es un Componente de Servidor limpio y simple.
 * Delega toda la gestión de proveedores del lado del cliente al componente <Providers>.
 * Esto resuelve el error de hidratación de forma robusta y mantenible.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} font-body antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
