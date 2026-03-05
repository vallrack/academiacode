
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';

import { ModuleLessons } from './module-lessons'; // 1. Importar el componente

interface ModuleData {
  title: string;
  courseId: string;
}

export default function EditModulePage() {
  const [module, setModule] = useState<ModuleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const params = useParams();
  const router = useRouter();
  const moduleId = params.moduleId as string;
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore || !moduleId) return;
    const fetchModuleData = async () => {
      setIsLoading(true);
      const moduleRef = doc(firestore, 'modules', moduleId);
      const moduleSnap = await getDoc(moduleRef);

      if (moduleSnap.exists()) {
        setModule(moduleSnap.data() as ModuleData);
      } else {
        console.error("El módulo no existe");
        router.push('/admin/courses');
      }
      setIsLoading(false);
    };

    fetchModuleData();
  }, [firestore, moduleId, router]);

  if (isLoading) {
    return <EditModulePageSkeleton />;
  }

  if (!module) {
    return <div className="p-6">Módulo no encontrado.</div>;
  }

  return (
    <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
            <Link href={`/admin/courses/${module.courseId}/edit`} passHref>
                <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
            </Link>
            <div>
                <p className="text-sm text-muted-foreground">Volver al curso</p>
                <h1 className="text-2xl font-bold">Editando Módulo: {module.title}</h1>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div className="space-y-6">
                {/* TODO: Componente para editar detalles del Módulo */}
                <p className='text-center p-4 border rounded-md'>Próximamente: Detalles del módulo</p>
            </div>
            <div className="space-y-6">
                {/* 2. Integrar el componente de lecciones */}
                <ModuleLessons moduleId={moduleId} courseId={module.courseId} />
            </div>
        </div>
    </div>
  );
}

function EditModulePageSkeleton() {
    return (
        <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
                <Skeleton className="h-10 w-10 rounded-md" />
                <div>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-64" />
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        </div>
    );
}
