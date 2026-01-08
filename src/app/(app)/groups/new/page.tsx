
'use client';

import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useUser } from '@/firebase/auth/use-user';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

export const dynamic = 'force-dynamic';

const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default function NewGroupPage() {
  const [name, setName] = useState('');
  const [selectedDays, setSelectedDays] = useState<Record<string, boolean>>({});
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useUser();

  const handleDayChange = (day: string) => {
    setSelectedDays(prev => ({ ...prev, [day]: !prev[day] }));
  };

  const handleSave = async () => {
    const finalSelectedDays = Object.keys(selectedDays).filter(day => selectedDays[day]);

    if (!name || finalSelectedDays.length === 0 || !startTime || !endTime) {
      toast({
        variant: 'destructive',
        title: 'Error de Validación',
        description: 'Por favor, completa el nombre, al menos un día y las horas de inicio/fin.',
      });
      return;
    }
    
    if (!user || !firestore) {
        toast({
            variant: "destructive",
            title: "Error de Autenticación",
            description: "Debes iniciar sesión para crear un grupo.",
        });
        return;
    }

    setIsSaving(true);
    
    const groupData = {
        name,
        schedule: {
          days: finalSelectedDays,
          startTime,
          endTime,
        },
        createdBy: user.uid,
        createdAt: serverTimestamp(),
    };

    try {
      const groupsCollection = collection(firestore, 'groups');
      await addDoc(groupsCollection, groupData);

      toast({
        title: '¡Grupo Creado!',
        description: `El grupo "${name}" ha sido creado correctamente.`,
      });
      router.push('/groups');
    } catch (serverError: any) {
        console.error("Error saving group: ", serverError);

        const permissionError = new FirestorePermissionError({
            path: 'groups',
            operation: 'create',
            requestResourceData: groupData,
        });
        errorEmitter.emit('permission-error', permissionError);

        toast({
            variant: "destructive",
            title: "Error al Guardar",
            description: "No se pudo crear el grupo. Verifica que tienes el rol de administrador.",
        });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href="/groups">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Volver</span>
          </Link>
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          Nuevo Grupo
        </h1>
        <div className="hidden items-center gap-2 md:ml-auto md:flex">
          <Button variant="outline" size="sm" asChild>
            <Link href="/groups">Cancelar</Link>
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar Grupo'}
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Detalles del Grupo</CardTitle>
          <CardDescription>
            Crea un nuevo grupo para organizar a tus estudiantes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid gap-3">
              <Label htmlFor="name">Nombre del Grupo</Label>
              <Input
                id="name"
                type="text"
                className="w-full"
                placeholder='ej. "ADS1"'
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-3">
              <Label>Días de la Semana</Label>
              <div className="flex flex-wrap gap-4">
                {daysOfWeek.map(day => (
                  <div key={day} className="flex items-center space-x-2">
                    <Checkbox
                      id={`day-${day}`}
                      checked={selectedDays[day] || false}
                      onCheckedChange={() => handleDayChange(day)}
                    />
                    <Label htmlFor={`day-${day}`} className="font-normal">{day}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="start-time">Hora de Inicio</Label>
                  <Input
                    id="start-time"
                    type="time"
                    className="w-full"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="end-time">Hora de Fin</Label>
                  <Input
                    id="end-time"
                    type="time"
                    className="w-full"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
            </div>
          </div>
        </CardContent>
      </Card>
       <div className="flex items-center justify-center gap-2 md:hidden">
        <Button variant="outline" size="sm" asChild>
          <Link href="/groups">Cancelar</Link>
        </Button>
        <Button size="sm" onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Guardando..." : "Guardar Grupo"}
        </Button>
      </div>
    </div>
  );
}
