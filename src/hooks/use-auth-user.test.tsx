import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth, mockSetPersistence, mockSignInAnonymously } = vi.hoisted(() => ({
  mockAuth: {
    currentUser: null as { uid: string; isAnonymous: boolean } | null,
  },
  mockSetPersistence: vi.fn(),
  mockSignInAnonymously: vi.fn(),
}));

vi.mock("@/lib/firebase", () => ({
  firebaseAuth: mockAuth,
}));

vi.mock("firebase/auth", () => ({
  browserLocalPersistence: "local",
  setPersistence: mockSetPersistence,
  signInAnonymously: mockSignInAnonymously,
}));

describe("useAuthUser", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockAuth.currentUser = null;
    mockSetPersistence.mockResolvedValue(undefined);
  });

  it("signs in anonymously once and exposes the UID", async () => {
    const anonymousUser = { uid: "anonymous-uid", isAnonymous: true };
    mockSignInAnonymously.mockImplementation(async () => {
      mockAuth.currentUser = anonymousUser;
      return { user: anonymousUser };
    });

    const { useAuthUser } = await import("./use-auth-user");
    const first = renderHook(() => useAuthUser());
    const second = renderHook(() => useAuthUser());

    await waitFor(() => {
      expect(first.result.current.uid).toBe("anonymous-uid");
      expect(second.result.current.uid).toBe("anonymous-uid");
      expect(first.result.current.loading).toBe(false);
    });

    expect(mockSetPersistence).toHaveBeenCalledOnce();
    expect(mockSetPersistence).toHaveBeenCalledWith(mockAuth, "local");
    expect(mockSignInAnonymously).toHaveBeenCalledOnce();
  });

  it("uses an existing persisted user without signing in again", async () => {
    mockAuth.currentUser = { uid: "persisted-uid", isAnonymous: true };

    const { useAuthUser } = await import("./use-auth-user");
    const result = renderHook(() => useAuthUser());

    await waitFor(() => {
      expect(result.result.current.uid).toBe("persisted-uid");
      expect(result.result.current.loading).toBe(false);
    });

    expect(mockSignInAnonymously).not.toHaveBeenCalled();
  });

  it("exposes authentication errors", async () => {
    const authError = new Error("Anonymous sign-in is disabled.");
    mockSetPersistence.mockRejectedValue(authError);

    const { useAuthUser } = await import("./use-auth-user");
    const result = renderHook(() => useAuthUser());

    await waitFor(() => {
      expect(result.result.current.loading).toBe(false);
      expect(result.result.current.error).toEqual(authError);
      expect(result.result.current.uid).toBeNull();
    });

    expect(mockSignInAnonymously).not.toHaveBeenCalled();
  });
});
