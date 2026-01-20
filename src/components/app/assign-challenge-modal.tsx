
'use client';

import React, { useState, useEffect } from 'react';
import { useFirestore } from "@/firebase";
import { useUser } from '@/firebase/auth/use-user';
import { useUserProfile } from '@/contexts/user-profile-context';
import { collection, addDoc, query, where, type DocumentData, Timestamp, serverTimestamp, onSnapshot } from "firebase/firestore";
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

interface AssignChallengeModalProps {
  challengeId: string;
  challengeTitle: string;
  onClose: () => void;
  onSuccess?: () => void;
}

type GroupSchedule = {
  days: string[];
  startTime: string;
  endTime: string;
};

type Group = { 
  id: string; 
  name: string;
  schedule: GroupSchedule | string;
};

type Student = { 
  id: string; 
  displayName: string;
  email: string;
};

export default function AssignChallengeModal({ challengeId, challengeTitle, onClose, onSuccess }: AssignChallengeModalProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { userProfile } = useUserProfile();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [targetType, setTargetType] = useState<'group' | 'student'>('group');
  const [targetId, setTargetId] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>();

  const [groups, setGroups] = useState<DocumentData[] | null>(null);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [students, setStudents] = useState<DocumentData[] | null>(null);
  const [loadingStudents, setLoadingStudents] = useState(true);

  const isTeacher = userProfile?.role === 'TEACHER';
  const isSuperAdmin = userProfile?.role === 'SUPER_ADMIN';
  const teacherManagedGroups = userProfile?.managedGroupIds || [];

  useEffect(() => {
    if (!firestore) {
      setLoadingGroups(false);
      setLoadingStudents(false);
      return;
    }
    
    // Fetch Groups
    let groupsQuery;
    if (isSuperAdmin) {
      groupsQuery = query(collection(firestore, 'groups'));
    } else if (isTeacher && teacherManagedGroups.length > 0) {
      groupsQuery = query(collection(firestore, 'groups'), where('__name__', 'in', teacherManagedGroups));
    } else {
      setLoadingGroups(false);
      setGroups([]);
    }

    let unsubGroups = () => {};
    if (groupsQuery) {
      unsubGroups = onSnapshot(groupsQuery, (snapshot) => {
        setGroups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoadingGroups(false);
      }, () => setLoadingGroups(false));
    }

    // Fetch Students
    let studentsQuery;
    if(isSuperAdmin) {
        studentsQuery = query(collection(firestore, 'users'), where('role', '==', 'STUDENT'));
    } else if (isTeacher && teacherManagedGroups.length > 0) {
        studentsQuery = query(collection(firestore, 'users'), where('role', '==', 'STUDENT'), where('groupId', 'in', teacherManagedGroups));
    } else {
        setLoadingStudents(false);
        setStudents([]);
    }
    
     let unsubStudents = () => {};
    if (studentsQuery) {
        unsubStudents = onSnapshot(studentsQuery, (snapshot) => {
            setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoadingStudents(false);
        }, () => setLoadingStudents(false));
    }

    return () => {
      unsubGroups();
      unsubStudents();
    };
  }, [firestore, isSuperAdmin, isTeacher, teacherManagedGroups]);

  const handleSubmit = async () => {
    if (!firestore || !user) return;

    if (!challengeId || !targetId || !dueDate) {
      toast({
        variant: "destructive",
        title: 'Campos Incompletos',
        description: 'Por favor selecciona un objetivo y una fecha de entrega.'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const assignmentData = {
        challengeId: challengeId,
        challengeTitle: challengeTitle,
        targetId: targetId,
        targetType: targetType,
        assignedBy: user.uid,
        assignedAt: serverTimestamp(),
        dueDate: dueDate ? Timestamp.fromDate(dueDate) : null,
      };

      await addDoc(collection(firestore, 'assignments'), assignmentData);

      toast({
        title: '¡Desafío Asignado!',
        description: `El desafío ha sido asignado para el ${format(dueDate, 'PPP', { locale: es })}.`
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
  
  const formatSchedule = (schedule: GroupSchedule | string) => {
    if (typeof schedule === 'string') {
      return schedule;
    }
    if (typeof schedule === 'object' && schedule.days && schedule.startTime && schedule.endTime) {
      const days = schedule.days.join(', ');
      return `${days} (${schedule.startTime} - ${schedule.endTime})`;
    }
    return "Horario no definido";
  };


  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in-0">
      <div className="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="sticky top-0 bg-card border-b p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Asignar Desafío: {challengeTitle}</h2>
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
            <Label>Asignar a: *</Label>
             <RadioGroup defaultValue="group" value={targetType} onValueChange={(value) => { setTargetType(value as 'group' | 'student'); setTargetId(''); }}>
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
                    <Select value={targetId} onValueChange={setTargetId}>
                        <SelectTrigger id="group-select"><SelectValue placeholder="Selecciona un grupo" /></SelectTrigger>
                        <SelectContent>
                            {groups?.map(group => <SelectItem key={group.id} value={(group as Group).id}>{(group as Group).name} - {formatSchedule((group as Group).schedule)}</SelectItem>)}
                        </SelectContent>
                    </Select>
                 )}
              </div>
            ) : (
              <div className="grid gap-3">
                <Label htmlFor="student-select">Selecciona el estudiante *</Label>
                 {loadingStudents ? <Skeleton className="h-10 w-full" /> : (
                    <Select value={targetId} onValueChange={setTargetId}>
                        <SelectTrigger id="student-select"><SelectValue placeholder="Selecciona un estudiante" /></SelectTrigger>
                        <SelectContent>
                            {students?.map(student => <SelectItem key={student.id} value={(student as Student).id}>{(student as Student).displayName || (student as Student).email}</SelectItem>)}
                        </SelectContent>
                    </Select>
                 )}
              </div>
            )}

          <div className="grid gap-3">
            <Label>Fecha de Entrega *</Label>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                    variant={"outline"}
                    className={cn("justify-start text-left font-normal", !dueDate && "text-muted-foreground")}
                    >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                    locale={es}
                    />
                </PopoverContent>
            </Popover>
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
              disabled={isSubmitting || !targetId || !dueDate}
              type="button"
            >
              {isSubmitting ? 'Asignando...' : 'Asignar Desafío'}
            </Button>
          </div>
      </div>
    </div>
  );
}
