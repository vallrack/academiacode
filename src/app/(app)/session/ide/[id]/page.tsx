
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, where, updateDoc } from 'firebase/firestore';
import { useUser, useFirestore } from '@/firebase/provider';

import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { InteractiveScene } from '@/components/app/interactive-scene';
import { RealTimeUsers } from '@/components/app/real-time-users';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Message {
  id: string;
  text: string;
  timestamp: any;
  userId: string;
  userName: string;
  userImage?: string;
}

export default function SessionIDEPage() {
    const { id: sessionId } = useParams();
    const user = useUser();
    const firestore = useFirestore();
    
    const [sessionData, setSessionData] = useState<any>(null);
    const [challengeData, setChallengeData] = useState<any>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Cargar datos de la sesión y del desafío
    useEffect(() => {
        if (!firestore || !sessionId) return;
        const sessionRef = doc(firestore, 'sessions', sessionId as string);
        const getSessionData = async () => {
            try {
                const sessionSnap = await getDoc(sessionRef);
                if (!sessionSnap.exists()) {
                    throw new Error('La sesión no existe.');
                }
                const session = sessionSnap.data();
                setSessionData(session);

                const challengeRef = doc(firestore, 'challenges', session.challengeId);
                const challengeSnap = await getDoc(challengeRef);
                if (!challengeSnap.exists()) {
                    throw new Error('El desafío asociado no existe.');
                }
                setChallengeData(challengeSnap.data());

            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        getSessionData();
    }, [firestore, sessionId]);

    // Suscripción a los mensajes del chat
    useEffect(() => {
        if (!firestore || !sessionId) return;
        const messagesQuery = query(
            collection(firestore, 'sessions', sessionId as string, 'messages'),
            orderBy('timestamp', 'asc')
        );
        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
            const newMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
            setMessages(newMessages);
        });
        return () => unsubscribe();
    }, [firestore, sessionId]);

    // Actualizar estado 'online' del usuario en la sesión
    useEffect(() => {
        if (!user || !firestore || !sessionId) return;
        const userStatusRef = doc(firestore, 'sessions', sessionId as string, 'participants', user.uid);

        updateDoc(userStatusRef, { isOnline: true });

        // TODO: Manejar el estado 'offline' cuando el usuario se desconecta
        // (p.ej. con el evento 'beforeunload' o visibilidad de la página)

    }, [user, firestore, sessionId]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !firestore || !newMessage.trim()) return;

        await addDoc(collection(firestore, 'sessions', sessionId as string, 'messages'), {
            text: newMessage,
            timestamp: serverTimestamp(),
            userId: user.uid,
            userName: user.displayName || 'Anónimo',
            userImage: user.photoURL || '',
        });

        setNewMessage('');
    };

    if (isLoading) {
        return <div className='flex items-center justify-center h-screen'>Cargando sesión...</div>;
    }

    if (error) {
        return <div className='flex items-center justify-center h-screen text-red-500'>Error: {error}</div>;
    }

    return (
        <ResizablePanelGroup direction="horizontal" className="h-screen w-full">
            {/* Panel del Desafío y Escena */}
            <ResizablePanel defaultSize={65}>
                <ResizablePanelGroup direction='vertical'>
                    <ResizablePanel defaultSize={60}>
                        <div className="p-4 h-full overflow-y-auto">
                            <h1 className="text-2xl font-bold mb-2">{challengeData?.title}</h1>
                            <p className="text-muted-foreground">{challengeData?.description}</p>
                            {/* Aquí podrías renderizar el markdown si lo tienes */}
                        </div>
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={40}>
                         <InteractiveScene modelUrl={challengeData?.modelUrl} />
                    </ResizablePanel>
                </ResizablePanelGroup>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Panel del Chat y Usuarios */}
            <ResizablePanel defaultSize={35}>
                 <ResizablePanelGroup direction='vertical'>
                    <ResizablePanel defaultSize={20}>
                        <div className='p-4 border-b'>
                           <h2 className='font-bold mb-2'>Participantes</h2>
                           {sessionId && <RealTimeUsers sessionId={sessionId as string} />}
                        </div>
                    </ResizablePanel>
                    <ResizableHandle/>
                    <ResizablePanel defaultSize={80} className='flex flex-col'>
                        <div className="p-4 border-b">
                            <h2 className='font-bold'>Chat de la Sesión</h2>
                        </div>
                        <ScrollArea className="flex-grow p-4">
                            <div className="space-y-4">
                                {messages.map(msg => (
                                    <div key={msg.id} className={`flex items-start gap-3 ${msg.userId === user?.uid ? 'justify-end' : ''}`}>
                                        {msg.userId !== user?.uid && (
                                            <Avatar className='w-8 h-8'>
                                                <AvatarImage src={msg.userImage} />
                                                <AvatarFallback>{msg.userName?.charAt(0) || 'A'}</AvatarFallback>
                                            </Avatar>
                                        )}
                                        <div className={`rounded-lg px-3 py-2 max-w-xs ${msg.userId === user?.uid ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                           <p className='text-sm font-bold mb-0.5'>{msg.userName}</p>
                                           <p>{msg.text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                        <div className="p-4 border-t">
                            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Escribe un mensaje..." />
                                <Button type="submit" size='icon' disabled={!newMessage.trim()}><Send className='h-4 w-4'/></Button>
                            </form>
                        </div>
                    </ResizablePanel>
                 </ResizablePanelGroup>
            </ResizablePanel>
        </ResizablePanelGroup>
    );
}
