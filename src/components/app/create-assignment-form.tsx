
'use client';

import React, { useState } from 'react';
import { useFirestore, useMemoFirebase, useAuth } from "@/firebase";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, addDoc, query, where, type DocumentData, Timestamp } from "firebase/firestore";
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

interface CreateAssignmentFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateAssignmentForm({ onClose, onSuccess }: CreateAssignmentFormProps) {
  const firestore = useFirestore();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [targetType, setTargetType] = useState<'group' | 'student'>('group');
  
  const [formData, setFormData] = useState({
    challengeId: '',
    targetId: '',
    dueDate: '',
  });

  const groupsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'groups');
  }, [firestore]);

  const { data: groups, isLoading: loadingGroups } = useCollection<DocumentData>(groupsQuery);

  const challengesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'challenges');
  }, [firestore]);

  const { data: challenges, isLoading: loadingChallenges } = useCollection<DocumentData>(challengesQuery);

  const studentsQuery = useMemoFirebase(() => {
    if (!firestore || targetType !== 'student') return null;
    return query(
      collection(firestore, 'users'),
      where('role', '==', 'STUDENT')
    );
  }, [firestore, targetType]);

  const { data: students, isLoading: loadingStudents } = useCollection<DocumentData>(studentsQuery);

  const handleSubmit = async () => {
    if (!firestore || !user) return;

    if (!formData.challengeId || !formData.targetId) {
      toast({
        variant: "destructive",
        title: 'Campos Incompletos',
        description: 'Por favor selecciona un desafío y un objetivo (grupo o estudiante).'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const assignmentData = {
        challengeId: formData.challengeId,
        targetId: formData.targetId,
        targetType: targetType,
        assignedBy: user.uid,
        assignedAt: Timestamp.now(),
        dueDate: formData.dueDate ? Timestamp.fromDate(new Date(formData.dueDate)) : null,
      };

      await addDoc(collection(firestore, 'assignments'), assignmentData);

      toast({
        title: '¡Asignación Creada!',
        description: 'La nueva asignación ha sido guardada correctamente.'
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error creando asignación:', error);
      toast({
          variant: "destructive",
          title: 'Error al Crear',
          description: `No se pudo crear la asignación. ${(error as Error).message}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in-0">
      <div className="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="sticky top-0 bg-card border-b p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Nueva Asignación</h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            type="button"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          <div className="grid gap-3">
            <Label htmlFor="challenge">Desafío *</Label>
            {loadingChallenges ? <Skeleton className="h-10 w-full" /> : (
              <Select value={formData.challengeId} onValueChange={(value) => setFormData({ ...formData, challengeId: value })}>
                <SelectTrigger id="challenge"><SelectValue placeholder="Selecciona un desafío" /></SelectTrigger>
                <SelectContent>
                  {challenges?.map(challenge => (
                    <SelectItem key={challenge.id} value={challenge.id}>
                      {challenge.title || `Desafío sin título`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid gap-3">
            <Label>Asignar a: *</Label>
             <RadioGroup defaultValue="group" value={targetType} onValueChange={(value) => { setTargetType(value as 'group' | 'student'); setFormData({...formData, targetId: ''}); }}>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="group" id="r-group" />
                    <Label htmlFor="r-group" className="font-normal">Un grupo completo</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="student" id="r-student" />
                    <Label htmlFor="r-student" className="font-normal">Un estudiante específico</Label>
                </div>
            </RadioGroup>
          </div>

            {targetType === 'group' ? (
              <div className="grid gap-3">
                <Label htmlFor="group-select">Selecciona el grupo *</Label>
                 {loadingGroups ? <Skeleton className="h-10 w-full" /> : (
                    <Select value={formData.targetId} onValueChange={(value) => setFormData({ ...formData, targetId: value })}>
                        <SelectTrigger id="group-select"><SelectValue placeholder="Selecciona un grupo" /></SelectTrigger>
                        <SelectContent>
                            {groups?.map(group => <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                 )}
              </div>
            ) : (
              <div className="grid gap-3">
                <Label htmlFor="student-select">Selecciona el estudiante *</Label>
                 {loadingStudents ? <Skeleton className="h-10 w-full" /> : (
                    <Select value={formData.targetId} onValueChange={(value) => setFormData({ ...formData, targetId: value })}>
                        <SelectTrigger id="student-select"><SelectValue placeholder="Selecciona un estudiante" /></SelectTrigger>
                        <SelectContent>
                            {students?.map(student => <SelectItem key={student.id} value={student.id}>{student.displayName || student.email}</SelectItem>)}
                        </SelectContent>
                    </Select>
                 )}
              </div>
            )}

          <div className="grid gap-3">
            <Label htmlFor="due-date">Fecha y hora de entrega</Label>
            <Input
              id="due-date"
              type="datetime-local"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
            <p className="text-sm text-muted-foreground">Opcional. Si se deja en blanco, no habrá fecha límite.</p>
          </div>
        </div>
          
        <div className="flex gap-3 p-6 mt-auto border-t">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={isSubmitting}
              type="button"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={isSubmitting || !formData.challengeId || !formData.targetId}
              type="button"
            >
              {isSubmitting ? 'Creando...' : 'Crear Asignación'}
            </Button>
          </div>
      </div>
    </div>
  );
}
