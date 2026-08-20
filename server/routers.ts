import { COOKIE_NAME } from "@shared/const";
import { nanoid } from "nanoid";
import { z } from "zod";
import { createReading, getReadingForUser, getSharedReading, listReadingsForUser, shareReading } from "./db";
import { I_CHING_HEXAGRAMS, TAROT_DECK } from "./divination-library";
import { createDivination, extractRepositoryMetrics } from "./esoteric";
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
    library: publicProcedure.query(() => ({ tarot: TAROT_DECK, hexagrams: I_CHING_HEXAGRAMS })),
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
