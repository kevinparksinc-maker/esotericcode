import type { RepositoryMetrics } from "./esoteric";

export type PlainLanguageAction = {
  step: "Start here" | "Do this next" | "Keep it healthy";
  title: string;
  explanation: string;
  action: string;
  example: string;
};

const percent = (value: number) => `${Math.round(value * 100)}%`;

/**
 * Converts the repository signals already used by the oracle into three
 * concrete, non-symbolic next steps. This stays deterministic so the same
 * repository state always receives the same practical guidance.
 */
export function buildPlainLanguageActions(metrics: RepositoryMetrics): PlainLanguageAction[] {
  const architecture = metrics.architecture;
  const markers = architecture
    ? architecture.maintenanceMarkers.todo + architecture.maintenanceMarkers.fixme + architecture.maintenanceMarkers.deprecated
    : 0;
  const importCount = architecture?.importEdges.length ?? 0;
  const oversizedFile = metrics.largestSourceFileSize > 30_000;
  const broadSystem = metrics.complexityLevel === "high" || metrics.sourceFileCount > 250 || importCount > 70;
  const thinTests = metrics.sourceFileCount >= 20 && metrics.testRatio < 0.1;
  const entryPoint = architecture?.entryPoints[0] ?? "the main user flow";
  const biggestSourceFile = architecture?.largestFiles.find(file => file.category === "source")?.path ?? "the largest source file";
  const busyModule = architecture?.topLevelModules.slice().sort((first, second) => second.files - first.files)[0]?.path ?? "the busiest feature folder";

  const first: PlainLanguageAction = thinTests
    ? {
        step: "Start here",
        title: "Protect one important user path with tests",
        explanation: `Only ${percent(metrics.testRatio)} of the source files look like tests, so a small change can be hard to check with confidence.`,
        action: "Pick one action users rely on—such as signing in, saving work, or submitting a form—and add a basic test before changing that area.",
        example: `If ${entryPoint} starts the app, write one test that opens the main screen and checks that its most important action is available.`,
      }
    : broadSystem
      ? {
          step: "Start here",
          title: "Make one busy area easier to change",
          explanation: "The project has enough moving parts that a change in one place can create surprises somewhere else.",
          action: "Choose one feature that feels crowded, split one responsibility out of it, and check that the feature still works before moving to the next area.",
          example: `Start in ${busyModule}; move only its data-loading or validation work into a separate helper, then run the feature as usual.`,
        }
      : markers > 0
        ? {
            step: "Start here",
            title: "Sort the unfinished work",
            explanation: `${markers} TODO, FIXME, or deprecation note${markers === 1 ? " is" : "s are"} still sitting in the codebase.`,
            action: "Spend 20 minutes labeling each note as “do now,” “plan later,” or “no longer needed,” then remove the stale ones.",
            example: "Take one TODO that mentions a user-facing bug, give it an owner and a next step, then delete a note that describes work already completed.",
          }
        : {
            step: "Start here",
            title: "Keep the current shape clear",
            explanation: "The codebase does not show one urgent structural warning in this reading.",
            action: "Write down the purpose of the main folders and the most important user flow before the next feature makes the structure harder to see.",
            example: `Add a short README note saying where a new developer should look first—such as ${entryPoint}—and what it is responsible for.`,
          };

  const second: PlainLanguageAction = oversizedFile
    ? {
        step: "Do this next",
        title: "Break up the biggest file",
        explanation: `At least one source file is ${(metrics.largestSourceFileSize / 1000).toFixed(1)} KB, which usually means it is carrying several jobs at once.`,
        action: "Move one clear job out of that file—such as data loading, validation, display logic, or shared helpers—then leave the behavior unchanged.",
        example: `In ${biggestSourceFile}, keep the screen or main function where it is, but move one repeated calculation or request into its own small file.`,
      }
    : markers > 0
      ? {
          step: "Do this next",
          title: "Turn loose notes into a small plan",
          explanation: "Open TODO-style notes become expensive when nobody knows whether they still matter.",
          action: "Create a short list of the three notes with the biggest user impact, assign each a next action, and close or delete the rest.",
          example: "Turn “fix error handling” into “show a retry button when the saved request fails,” then put it in the next small work batch.",
        }
      : metrics.recentCommitCount <= 3
        ? {
            step: "Do this next",
            title: "Use the quiet period for a small cleanup",
            explanation: "Recent activity is low, which is a good time to improve the parts that are normally easy to postpone.",
            action: "Fix one small annoyance: improve an error message, remove dead code, clarify a confusing name, or document one tricky setup step.",
            example: "Replace a vague “Something went wrong” message with a sentence that tells the user what happened and what they can try next.",
          }
        : {
            step: "Do this next",
            title: "Write down the next three changes",
            explanation: "The project is actively moving, and momentum is easiest to keep when the next steps are explicit.",
            action: "List the next three changes in order, keep each small enough to review, and finish one before starting the next.",
            example: "Write “add validation,” “test validation,” and “show a friendly error” as three separate changes instead of one large task.",
          };

  const third: PlainLanguageAction = metrics.contributorCount <= 1
    ? {
        step: "Keep it healthy",
        title: "Make it easier for future you to return",
        explanation: "One person currently carries most of the project’s working knowledge.",
        action: "Add a short README note for the hardest part of the app: where it starts, what it depends on, and how to safely test a change.",
        example: `Add a five-line note explaining how to run ${entryPoint}, which service or file it relies on, and one command that checks it still works.`,
      }
    : {
        step: "Keep it healthy",
        title: "Keep the team pointed at the same thing",
        explanation: `${metrics.contributorCount} people are contributing, so unclear ownership can create avoidable friction.`,
        action: "Name an owner for the most important areas and agree on one simple rule for reviews, testing, and merging changes.",
        example: `Write “${busyModule}: reviewed by the platform owner” in the project notes, and require one passing check before changes merge.`,
      };

  return [first, second, third];
}
