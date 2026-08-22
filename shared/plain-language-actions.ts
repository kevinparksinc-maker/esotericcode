import type { RepositoryMetrics } from "./esoteric";

export type PlainLanguageAction = {
  step: "Start here" | "Do this next" | "Keep it healthy";
  title: string;
  explanation: string;
  action: string;
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

  const first: PlainLanguageAction = thinTests
    ? {
        step: "Start here",
        title: "Protect one important user path with tests",
        explanation: `Only ${percent(metrics.testRatio)} of the source files look like tests, so a small change can be hard to check with confidence.`,
        action: "Pick one action users rely on—such as signing in, saving work, or submitting a form—and add a basic test before changing that area.",
      }
    : broadSystem
      ? {
          step: "Start here",
          title: "Make one busy area easier to change",
          explanation: "The project has enough moving parts that a change in one place can create surprises somewhere else.",
          action: "Choose one feature that feels crowded, split one responsibility out of it, and check that the feature still works before moving to the next area.",
        }
      : markers > 0
        ? {
            step: "Start here",
            title: "Sort the unfinished work",
            explanation: `${markers} TODO, FIXME, or deprecation note${markers === 1 ? " is" : "s are"} still sitting in the codebase.`,
            action: "Spend 20 minutes labeling each note as “do now,” “plan later,” or “no longer needed,” then remove the stale ones.",
          }
        : {
            step: "Start here",
            title: "Keep the current shape clear",
            explanation: "The codebase does not show one urgent structural warning in this reading.",
            action: "Write down the purpose of the main folders and the most important user flow before the next feature makes the structure harder to see.",
          };

  const second: PlainLanguageAction = oversizedFile
    ? {
        step: "Do this next",
        title: "Break up the biggest file",
        explanation: `At least one source file is ${(metrics.largestSourceFileSize / 1000).toFixed(1)} KB, which usually means it is carrying several jobs at once.`,
        action: "Move one clear job out of that file—such as data loading, validation, display logic, or shared helpers—then leave the behavior unchanged.",
      }
    : markers > 0
      ? {
          step: "Do this next",
          title: "Turn loose notes into a small plan",
          explanation: "Open TODO-style notes become expensive when nobody knows whether they still matter.",
          action: "Create a short list of the three notes with the biggest user impact, assign each a next action, and close or delete the rest.",
        }
      : metrics.recentCommitCount <= 3
        ? {
            step: "Do this next",
            title: "Use the quiet period for a small cleanup",
            explanation: "Recent activity is low, which is a good time to improve the parts that are normally easy to postpone.",
            action: "Fix one small annoyance: improve an error message, remove dead code, clarify a confusing name, or document one tricky setup step.",
          }
        : {
            step: "Do this next",
            title: "Write down the next three changes",
            explanation: "The project is actively moving, and momentum is easiest to keep when the next steps are explicit.",
            action: "List the next three changes in order, keep each small enough to review, and finish one before starting the next.",
          };

  const third: PlainLanguageAction = metrics.contributorCount <= 1
    ? {
        step: "Keep it healthy",
        title: "Make it easier for future you to return",
        explanation: "One person currently carries most of the project’s working knowledge.",
        action: "Add a short README note for the hardest part of the app: where it starts, what it depends on, and how to safely test a change.",
      }
    : {
        step: "Keep it healthy",
        title: "Keep the team pointed at the same thing",
        explanation: `${metrics.contributorCount} people are contributing, so unclear ownership can create avoidable friction.`,
        action: "Name an owner for the most important areas and agree on one simple rule for reviews, testing, and merging changes.",
      };

  return [first, second, third];
}
