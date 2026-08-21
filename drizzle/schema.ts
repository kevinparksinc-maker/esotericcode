import { boolean, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
import type { IChingReading, RepositoryMetrics, TarotCard } from "../shared/esoteric";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const githubConnections = mysqlTable("githubConnections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  githubLogin: varchar("githubLogin", { length: 255 }).notNull(),
  accessTokenEncrypted: text("accessTokenEncrypted").notNull(),
  scope: text("scope"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const githubOAuthStates = mysqlTable("githubOAuthStates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  state: varchar("state", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const readings = mysqlTable("readings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  repositoryUrl: varchar("repositoryUrl", { length: 512 }).notNull(),
  repositoryOwner: varchar("repositoryOwner", { length: 128 }).notNull(),
  repositoryName: varchar("repositoryName", { length: 256 }).notNull(),
  sourceFileKey: varchar("sourceFileKey", { length: 512 }),
  shareSlug: varchar("shareSlug", { length: 24 }).notNull().unique(),
  isShared: boolean("isShared").notNull().default(false),
  metrics: json("metrics").$type<RepositoryMetrics>().notNull(),
  tarot: json("tarot").$type<TarotCard[]>().notNull(),
  iching: json("iching").$type<IChingReading>().notNull(),
  narrative: text("narrative").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Reading = typeof readings.$inferSelect;
export type InsertReading = typeof readings.$inferInsert;
