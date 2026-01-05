'use client';

import { useEffect, useState } from 'react';
import type {
  DocumentData,
  FirestoreError,
  Query,
  QuerySnapshot,
} from 'firebase/firestore';
import { onSnapshot } from 'firebase/firestore';

type UseCollectionReturn<T> = {
  data: T[];
  loading: boolean;
  error: FirestoreError | null;
};

export function useCollection<T>(
  query: Query | null
): UseCollectionReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      query,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const newData = snapshot.docs.map((doc) => {
          return { id: doc.id, ...doc.data() } as T;
        });
        
        setData(newData);
        setLoading(false);
        setError(null);
      },
      (err: FirestoreError) => {
        console.error(`Error fetching collection: `, err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [query]);

  return { data, loading, error };
}
