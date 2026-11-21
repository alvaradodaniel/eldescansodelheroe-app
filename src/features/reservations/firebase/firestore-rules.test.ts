import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { readFile } from "node:fs/promises";

const enabled = Boolean(process.env["FIRESTORE_EMULATOR_HOST"]);
const suite = enabled ? describe : describe.skip;
let env: RulesTestEnvironment;

suite("Firestore production security rules", () => {
  beforeAll(async () => {
    env = await initializeTestEnvironment({
      projectId: "demo-el-descanso",
      firestore: { rules: await readFile("firestore.rules", "utf8") },
    });
  });
  afterAll(async () => env?.cleanup());
  beforeEach(async () => {
    await env.clearFirestore();
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "events/pub"), { status: "published" });
      await setDoc(doc(ctx.firestore(), "events/draft"), { status: "draft" });
      await setDoc(doc(ctx.firestore(), "events/pub/tables/a"), { reservedCount: 0 });
      await setDoc(doc(ctx.firestore(), "events/pub/reservations/user-a"), { status: "confirmed" });
    });
  });
  it("allows published event/table reads and rejects draft reads", async () => {
    const db = env.unauthenticatedContext().firestore();
    expect((await getDoc(doc(db, "events/pub"))).exists()).toBe(true);
    await expect(getDoc(doc(db, "events/draft"))).rejects.toThrow();
    expect((await getDoc(doc(db, "events/pub/tables/a"))).exists()).toBe(true);
  });
  it("allows reading only the caller's reservation", async () => {
    const db = env.authenticatedContext("user-a").firestore();
    expect((await getDoc(doc(db, "events/pub/reservations/user-a"))).exists()).toBe(true);
    await expect(getDoc(doc(db, "events/pub/reservations/other"))).rejects.toThrow();
    const guestDb = env.unauthenticatedContext().firestore();
    await expect(getDoc(doc(guestDb, "events/pub/reservations/user-a"))).rejects.toThrow();
  });
  it("rejects direct writes and paths without an explicit rule", async () => {
    const db = env.authenticatedContext("user-a").firestore();
    await expect(setDoc(doc(db, "events/new-event"), { status: "published" })).rejects.toThrow();
    await expect(setDoc(doc(db, "events/pub/tables/a"), { reservedCount: 8 })).rejects.toThrow();
    await expect(
      setDoc(doc(db, "events/pub/reservations/user-a"), { status: "cancelled" }),
    ).rejects.toThrow();
    await expect(setDoc(doc(db, "users/user-a/private/document"), {})).rejects.toThrow();
  });
});
