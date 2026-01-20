'use client';

import { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Logo } from '@/components/app/logo';
import InteractiveScene from '@/components/app/interactive-scene';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BrainCircuit, Code, Users } from 'lucide-react';

export default function InteractiveLandingPage() {
  const [isLocked, setIsLocked] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleClick = () => {
    setIsLocked(true);
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className={cn('w-screen h-screen bg-slate-900 overflow-hidden', isLocked && 'locked')}>
      <div id="scene-container">
        <Suspense fallback={<div className="w-full h-full bg-slate-900" />}>
          <Canvas shadows camera={{ position: [0, 0, 8], fov: 45 }}>
            <InteractiveScene />
          </Canvas>
        </Suspense>
      </div>

      <header id="page-header">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="text-xl font-bold text-white">AcademiaCode</span>
          </div>
          <div className={cn("flex gap-2 transition-opacity duration-500", isLocked ? "opacity-100" : "opacity-0 pointer-events-none")}>
            <Button asChild className="shadow-md border-b-4 border-black/30 active:translate-y-0.5 active:border-b-0 transition-transform">
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
            <Button asChild variant="secondary" className="shadow-md border-b-4 border-black/30 active:translate-y-0.5 active:border-b-0 transition-transform">
              <Link href="/register">Registrarse</Link>
            </Button>
          </div>
        </div>
      </header>

      <div id="overlay" aria-label="Click to start" onClick={handleClick} tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}>
        <div id="overlay-inner">
          <div id="overlay-title">Entrar al Futuro</div>
          <div id="overlay-sub">Haz clic para explorar la plataforma</div>
        </div>
      </div>
      
      <main id="content-container">
        <div className="container mx-auto px-4 pt-24 pb-16 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            Bienvenido a AcademiaCode
          </h1>
          <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            La plataforma definitiva para la evaluación de código que combina un IDE en la nube, análisis con IA y gestión académica completa.
          </p>
        </div>

        <div className="container mx-auto px-4 pb-16">
          <div className="grid md:grid-cols-3 gap-8 text-white">
            <div className="bg-black/30 backdrop-blur-md p-8 rounded-lg border border-white/10 shadow-lg animate-fade-in-up" style={{ animationDelay: '600ms' }}>
              <Code className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">IDE Integrado</h3>
              <p className="text-slate-400">Un entorno de desarrollo completo en el navegador para resolver desafíos sin configuración previa.</p>
            </div>
            <div className="bg-black/30 backdrop-blur-md p-8 rounded-lg border border-white/10 shadow-lg animate-fade-in-up" style={{ animationDelay: '800ms' }}>
              <BrainCircuit className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Evaluación con IA</h3>
              <p className="text-slate-400">Análisis automático de código que califica, detecta plagio y proporciona feedback detallado.</p>
            </div>
            <div className="bg-black/30 backdrop-blur-md p-8 rounded-lg border border-white/10 shadow-lg animate-fade-in-up" style={{ animationDelay: '1000ms' }}>
              <Users className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Gestión Académica</h3>
              <p className="text-slate-400">Administra estudiantes, grupos y asignaciones de manera centralizada y eficiente.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
