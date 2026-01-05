
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import type { FirestorePermissionError } from '@/firebase/errors';

/**
 * A client-side component that listens for custom Firestore permission errors
 * and throws them to be caught by Next.js's development error overlay.
 * This provides immediate, rich feedback for debugging security rules.
 * This component does not render any UI.
 */
export function FirebaseErrorListener() {
  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // In a production environment, you might want to log this to a service
      if (process.env.NODE_ENV === 'development') {
        // Throwing the error here will cause it to be displayed in the Next.js
        // development error overlay, which is great for debugging.
        throw error;
      } else {
        // In production, you might want to log the error to a service
        console.error("Firestore Permission Error:", error.message);
      }
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.removeListener('permission-error', handleError);
    };
  }, []);

  return null;
}
