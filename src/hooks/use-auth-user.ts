import { useEffect, useState } from "react";
import {
  browserLocalPersistence,
  setPersistence,
  signInAnonymously,
  type User,
} from "firebase/auth";

import { firebaseAuth } from "@/lib/firebase";

export interface AuthUserState {
  uid: string | null;
  loading: boolean;
  error: Error | null;
}

let anonymousSignInPromise: Promise<User> | null = null;
let persistencePromise: Promise<void> | null = null;

function toAuthError(error: unknown): Error {
  return error instanceof Error ? error : new Error("Firebase Authentication failed.");
}

function ensureAnonymousUser(): Promise<User> {
  if (!persistencePromise) {
    persistencePromise = setPersistence(firebaseAuth, browserLocalPersistence).catch(
      (error: unknown) => {
        persistencePromise = null;
        throw toAuthError(error);
      },
    );
  }

  const existingUser = firebaseAuth.currentUser;

  if (existingUser) {
    return persistencePromise.then(() => existingUser);
  }

  if (!anonymousSignInPromise) {
    anonymousSignInPromise = persistencePromise
      .then(() => {
        const persistedUser = firebaseAuth.currentUser;

        return persistedUser ?? signInAnonymously(firebaseAuth).then(({ user }) => user);
      })
      .catch((error: unknown) => {
        anonymousSignInPromise = null;
        throw toAuthError(error);
      })
      .finally(() => {
        anonymousSignInPromise = null;
      });
  }

  return anonymousSignInPromise;
}

export function useAuthUser(): AuthUserState {
  const [state, setState] = useState<AuthUserState>({
    uid: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let active = true;
    setState((currentState) => ({ ...currentState, loading: true, error: null }));
    void ensureAnonymousUser()
      .then((user) => {
        if (active) setState({ uid: user.uid, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (active) setState({ uid: null, loading: false, error: toAuthError(error) });
      });

    return () => {
      active = false;
    };
  }, []);

  return state;
}
