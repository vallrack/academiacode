
'use server';

import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Tipado para los datos de entrada
interface CreateUserInput {
  email: string;
  password: string;
  displayName: string;
  role: 'STUDENT' | 'TEACHER' | 'SUPER_ADMIN';
  groupId: string | null;
}

export async function createUser(data: CreateUserInput) {
  const { email, password, displayName, role, groupId } = data;

  try {
    // 1. Crear el usuario en Authentication
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
    });

    // 2. Establecer Custom Claims (El rol dentro del token JWT)
    await adminAuth.setCustomUserClaims(userRecord.uid, { role });

    // 3. Crear el documento en Firestore con una lógica más robusta
    const userProfileData: any = {
      uid: userRecord.uid,
      email,
      displayName,
      role,
      status: 'offline', // Estado inicial
      lastSeen: Timestamp.now(),
    };

    if (role === 'STUDENT') {
      userProfileData.groupId = groupId;
    } else if (role === 'TEACHER') {
      userProfileData.managedGroupIds = [];
    }
    
    // Para SUPER_ADMIN, no se añaden campos de grupo.

    await adminDb.collection('users').doc(userRecord.uid).set(userProfileData);

    return { success: true, uid: userRecord.uid };
    
  } catch (error: any) {
    console.error("Error en la creación del usuario:", error);
    
    // Si el usuario de Auth ya existe, puede que el doc de Firestore no.
    // Intentamos eliminar el usuario de Auth para permitir un reintento limpio.
    if (error.code === 'auth/email-already-exists') {
        try {
            const existingUser = await adminAuth.getUserByEmail(email);
            if (existingUser) {
              await adminAuth.deleteUser(existingUser.uid);
            }
        } catch (deleteError) {
             console.error("Error limpiando usuario de Auth existente:", deleteError);
        }
        throw new Error('El correo electrónico ya está en uso. Se ha intentado limpiar, por favor intenta registrarte de nuevo.');
    }
    
    // Lanza un nuevo error con un mensaje más genérico o el específico de Firebase
    throw new Error(error.message || 'Ocurrió un error al crear el usuario en el servidor.');
  }
}
