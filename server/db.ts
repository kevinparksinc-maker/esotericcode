import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { type InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let database: ReturnType<typeof drizzle> | undefined;

export async function getDb() {
  if (!database && ENV.databaseUrl) database = drizzle(ENV.databaseUrl);
  return database;
}

export async function upsertUser(user: InsertUser) {
  if (!user.openId) throw new Error("A user open ID is required.");
  const db = await getDb();
  if (!db) return;
  await db.insert(users).values({ ...user, role: user.openId === ENV.ownerOpenId ? "admin" : user.role ?? "user" }).onDuplicateKeyUpdate({
    set: { name: user.name ?? null, email: user.email ?? null, loginMethod: user.loginMethod ?? null, lastSignedIn: new Date() },
  });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const [user] = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return user;
}
