import { COOKIE_NAME } from "@shared/const";
import { nanoid } from "nanoid";
import { z } from "zod";
import { createReading, deleteGitHubConnection, getGitHubConnection, getReadingForUser, getSharedReading, listReadingsForUser, shareReading } from "./db";
import { I_CHING_HEXAGRAMS, TAROT_DECK } from "./divination-library";
import { KP_PLANETS } from "./kp-astrology";
import { createDivination, extractRepositoryMetrics, extractUploadedZipMetrics, parseGitHubRepositoryUrl } from "./esoteric";
import { decryptGitHubToken } from "./github-crypto";
import { listConnectedGitHubRepositories } from "./github-api";
import { ZIP_UPLOAD_LIMIT } from "./repository-analysis";
import { storagePut } from "./storage";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  divination: router({
    library: publicProcedure.query(() => ({ tarot: TAROT_DECK, hexagrams: I_CHING_HEXAGRAMS, kpPlanets: KP_PLANETS })),
  }),
  github: router({
    status: protectedProcedure.query(async ({ ctx }) => {
      const connection = await getGitHubConnection(ctx.user.id);
      return connection ? { connected: true, login: connection.githubLogin, scope: connection.scope } : { connected: false, login: null, scope: null };
    }),
    repositories: protectedProcedure.query(async ({ ctx }) => {
      const connection = await getGitHubConnection(ctx.user.id);
      if (!connection) throw new Error("Connect GitHub before selecting a private repository.");
      return listConnectedGitHubRepositories(decryptGitHubToken(connection.accessTokenEncrypted));
    }),
    analyze: protectedProcedure.input(z.object({ fullName: z.string().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/, "Select a repository from your connected GitHub account.") })).mutation(async ({ input, ctx }) => {
      const connection = await getGitHubConnection(ctx.user.id);
      if (!connection) throw new Error("Connect GitHub before analyzing a private repository.");
      const identity = parseGitHubRepositoryUrl(input.fullName);
      const metrics = await extractRepositoryMetrics(identity.normalizedUrl, decryptGitHubToken(connection.accessTokenEncrypted));
      const divination = createDivination(metrics);
      const id = await createReading({ userId: ctx.user.id, repositoryUrl: metrics.repositoryUrl, repositoryOwner: metrics.owner, repositoryName: metrics.name, shareSlug: nanoid(12), isShared: false, metrics, tarot: divination.tarot, iching: divination.iching, narrative: divination.narrative });
      return { id };
    }),
    disconnect: protectedProcedure.mutation(async ({ ctx }) => { await deleteGitHubConnection(ctx.user.id); return { success: true } as const; }),
  }),
  readings: router({
    create: protectedProcedure
      .input(z.object({ repositoryUrl: z.string().min(3).max(512) }))
      .mutation(async ({ input, ctx }) => {
        const metrics = await extractRepositoryMetrics(input.repositoryUrl);
        const divination = createDivination(metrics);
        const id = await createReading({
          userId: ctx.user.id,
          repositoryUrl: metrics.repositoryUrl,
          repositoryOwner: metrics.owner,
          repositoryName: metrics.name,
          shareSlug: nanoid(12),
          isShared: false,
          metrics,
          tarot: divination.tarot,
          iching: divination.iching,
          narrative: divination.narrative,
        });
        return { id };
      }),
    createFromZip: protectedProcedure
      .input(z.object({ fileName: z.string().min(5).max(255).regex(/\.zip$/i, "Upload a .zip archive."), archiveBase64: z.string().min(8).max(17_000_000) }))
      .mutation(async ({ input, ctx }) => {
        const archive = Buffer.from(input.archiveBase64, "base64");
        if (archive.length === 0 || archive.length > ZIP_UPLOAD_LIMIT) throw new Error("ZIP archives must be 12 MB or smaller.");
        if (archive[0] !== 0x50 || archive[1] !== 0x4b) throw new Error("The uploaded file is not a valid ZIP archive.");
        const normalizedFileName = input.fileName.replace(/[^A-Za-z0-9._-]/g, "_");
        const metrics = await extractUploadedZipMetrics(normalizedFileName, archive);
        const storedArchive = await storagePut(`repository-uploads/${ctx.user.id}/${nanoid(10)}-${normalizedFileName}`, archive, "application/zip");
        const divination = createDivination(metrics);
        const id = await createReading({
          userId: ctx.user.id,
          repositoryUrl: metrics.repositoryUrl,
          repositoryOwner: metrics.owner,
          repositoryName: metrics.name,
          sourceFileKey: storedArchive.key,
          shareSlug: nanoid(12),
          isShared: false,
          metrics,
          tarot: divination.tarot,
          iching: divination.iching,
          narrative: divination.narrative,
        });
        return { id };
      }),
    get: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(({ input, ctx }) => getReadingForUser(input.id, ctx.user.id)),
    history: protectedProcedure.query(({ ctx }) => listReadingsForUser(ctx.user.id)),
    share: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        const reading = await shareReading(input.id, ctx.user.id);
        if (!reading) throw new Error("Reading not found.");
        return { shareSlug: reading.shareSlug };
      }),
    shared: publicProcedure
      .input(z.object({ shareSlug: z.string().min(6).max(24) }))
      .query(({ input }) => getSharedReading(input.shareSlug)),
  }),
});

export type AppRouter = typeof appRouter;
