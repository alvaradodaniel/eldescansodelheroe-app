import {
  browserLocalPersistence,
  onAuthStateChanged,
  getIdTokenResult,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { useEffect, useState } from "react";
import { firebaseAuth } from "@/lib/firebase";

export interface AdminSession {
  loading: boolean;
  user: User | null;
  isAdmin: boolean;
  error: string | null;
}

export async function signInAdmin(email: string, password: string): Promise<void> {
  await setPersistence(firebaseAuth, browserLocalPersistence);
  const credential = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
  const token = await getIdTokenResult(credential.user, true);
  if (token.claims["admin"] !== true) {
    await signOut(firebaseAuth);
    throw new Error("Esta cuenta no tiene permisos de administrador.");
  }
}

export function signOutAdmin(): Promise<void> {
  return signOut(firebaseAuth);
}

export function useAdminSession(): AdminSession {
  const [session, setSession] = useState<AdminSession>({
    loading: true,
    user: null,
    isAdmin: false,
    error: null,
  });
  useEffect(() => {
    let generation = 0;
    const unsubscribe = onAuthStateChanged(
      firebaseAuth,
      async (user) => {
        if ((firebaseAuth.currentUser?.uid ?? null) !== (user?.uid ?? null)) return;
        const currentGeneration = ++generation;
        setSession((current) => ({ ...current, loading: true, error: null }));
        if (!user) {
          if (generation === currentGeneration) {
            setSession({ loading: false, user: null, isAdmin: false, error: null });
          }
          return;
        }
        try {
          const token = await getIdTokenResult(user);
          const verifiedToken =
            token.claims["admin"] === true || user.isAnonymous
              ? token
              : await getIdTokenResult(user, true);
          if (generation !== currentGeneration || firebaseAuth.currentUser?.uid !== user.uid)
            return;
          setSession({
            loading: false,
            user,
            isAdmin: verifiedToken.claims["admin"] === true,
            error: null,
          });
        } catch {
          if (generation !== currentGeneration || firebaseAuth.currentUser?.uid !== user.uid)
            return;
          setSession({
            loading: false,
            user,
            isAdmin: false,
            error: "No pudimos verificar los permisos de esta cuenta.",
          });
        }
      },
      () => {
        const currentGeneration = ++generation;
        if (generation === currentGeneration) {
          setSession({
            loading: false,
            user: null,
            isAdmin: false,
            error: "No pudimos comprobar tu sesión.",
          });
        }
      },
    );
    return () => {
      generation += 1;
      unsubscribe();
    };
  }, []);
  return session;
}
