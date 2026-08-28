import { z } from "zod";
import { I_CHING_LIBRARY, KP_CORRESPONDENCES, TAROT_LIBRARY } from "@shared/esoteric";
import { createReadingPayload } from "./divination";
import { analyzeGitHubRepository } from "./repository-analysis";
import { publicProcedure, router } from "./_core/trpc";

export const appRouter = router({
  repository: router({
    analyze: publicProcedure.input(z.object({ repositoryUrl: z.string().min(3).max(512) })).mutation(async ({ input }) => {
      const analysis = await analyzeGitHubRepository(input.repositoryUrl, "public");
      return createReadingPayload(analysis.metrics, analysis.architecture);
    }),
  }),
  library: publicProcedure.query(() => ({ tarot: TAROT_LIBRARY, iching: I_CHING_LIBRARY, kp: KP_CORRESPONDENCES })),
});

export type AppRouter = typeof appRouter;
