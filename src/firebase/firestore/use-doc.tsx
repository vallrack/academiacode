'use client';

import { useEffect, useState } from 'react';
import type {
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  FirestoreError,
} from 'firebase/firestore';
import { onSnapshot } from 'firebase/firestore';

type UseDocReturn<T> = {
  data: T | null;
  loading: boolean;
  error: FirestoreError | null;
};

export function useDoc<T>(
  ref: DocumentReference | null
): UseDocReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!ref) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      ref,
      (snapshot: DocumentSnapshot<DocumentData>) => {
        if (snapshot.exists()) {
          setData({ id: snapshot.id, ...snapshot.data() } as T);
        } else {
          setData(null);
        }
        setLoading(false);
        setError(null);
      },
      (err: FirestoreError) => {
        console.error(`Error fetching document: `, err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [ref]);

  return { data, loading, error };
}
