import type { IChingReading, RepositoryMetrics, TarotCard } from "@shared/esoteric";

import { castCompleteIChing, drawCompleteTarot } from "./divination-library";
import { createRepositoryKpChart } from "./kp-astrology";
import { analyzeRepositoryArchitecture, analyzeUploadedZipArchitecture } from "./repository-analysis";

type GitHubTreeEntry = { path: string; type: "blob" | "tree"; size?: number };
type GitHubRepo = {
  name: string;
  description: string | null;
  default_branch: string;
  created_at: string;
};
type GitHubCommit = { commit?: { author?: { date?: string } } };

const SOURCE_EXTENSIONS = new Set([
  "ts", "tsx", "js", "jsx", "py", "go", "rs", "java", "kt", "rb", "php", "cs", "cpp", "c", "h", "swift", "scala", "vue", "svelte",
]);

const formatNumber = (value: number) => new Intl.NumberFormat("en-US").format(value);

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function parseGitHubRepositoryUrl(input: string): { owner: string; repo: string; normalizedUrl: string } {
  const value = input.trim().replace(/\/$/, "").replace(/\.git$/, "");
  const shorthand = /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/.exec(value);
  if (shorthand) {
    return { owner: shorthand[1], repo: shorthand[2], normalizedUrl: `https://github.com/${shorthand[1]}/${shorthand[2]}` };
  }

  try {
    const url = new URL(value);
    if (url.hostname !== "github.com") throw new Error("Only GitHub repository URLs can be read.");
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length !== 2) throw new Error("Enter a repository URL such as github.com/owner/repository.");
    return { owner: parts[0], repo: parts[1], normalizedUrl: `https://github.com/${parts[0]}/${parts[1]}` };
  } catch (error) {
    if (error instanceof Error && error.message !== "Invalid URL") throw error;
    throw new Error("Enter a public GitHub repository URL or owner/repository.");
  }
}

async function githubJson<T>(path: string, accessToken?: string): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "EsotericCode-oracle",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    if (response.status === 404) throw new Error(accessToken ? "This repository was not found or your GitHub connection is not authorized to read it." : "This repository was not found or is private. EsotericCode can read public repositories.");
    if (response.status === 403) throw new Error(body?.message ?? "GitHub’s public API is temporarily unavailable. Please try again shortly.");
    throw new Error(body?.message ?? "GitHub could not provide this repository’s data.");
  }
  return response.json() as Promise<T>;
}

export async function extractRepositoryMetrics(repositoryUrl: string, accessToken?: string): Promise<RepositoryMetrics> {
  const identity = parseGitHubRepositoryUrl(repositoryUrl);
  const repoPath = `/repos/${encodeURIComponent(identity.owner)}/${encodeURIComponent(identity.repo)}`;
  const repo = await githubJson<GitHubRepo>(repoPath, accessToken);
  const [languageMap, treePayload, commits, contributors] = await Promise.all([
    githubJson<Record<string, number>>(`${repoPath}/languages`, accessToken),
    githubJson<{ tree: GitHubTreeEntry[]; truncated: boolean }>(`${repoPath}/git/trees/${encodeURIComponent(repo.default_branch)}?recursive=1`, accessToken),
    githubJson<GitHubCommit[]>(`${repoPath}/commits?per_page=100`, accessToken),
    githubJson<unknown[]>(`${repoPath}/contributors?per_page=100`, accessToken),
  ]);

  const blobs = treePayload.tree.filter(entry => entry.type === "blob");
  const sourceFiles = blobs.filter(entry => {
    const extension = entry.path.split(".").pop()?.toLowerCase();
    return Boolean(extension && SOURCE_EXTENSIONS.has(extension));
  });
  const testFiles = sourceFiles.filter(entry => /(^|\/)(__tests__|tests?|specs?)(\/|$)|\.(test|spec)\.[^.]+$/i.test(entry.path));
  const sourceSizes = sourceFiles.map(entry => entry.size ?? 0).filter(size => size > 0);
  const maxDepth = blobs.reduce((deepest, entry) => Math.max(deepest, entry.path.split("/").length - 1), 0);
  const averageSize = sourceSizes.length ? Math.round(sourceSizes.reduce((sum, size) => sum + size, 0) / sourceSizes.length) : 0;
  const largestSize = sourceSizes.length ? Math.max(...sourceSizes) : 0;
  const testRatio = sourceFiles.length ? testFiles.length / sourceFiles.length : 0;
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentCommitCount = commits.filter(item => {
    const date = item.commit?.author?.date;
    return date ? new Date(date).getTime() >= cutoff : false;
  }).length;

  let complexityScore = 0;
  if (sourceFiles.length > 250) complexityScore += 2;
  if (maxDepth >= 7) complexityScore += 2;
  else if (maxDepth >= 5) complexityScore += 1;
  if (averageSize > 16_000) complexityScore += 2;
  else if (averageSize > 8_000) complexityScore += 1;
  if (largestSize > 60_000) complexityScore += 2;
  else if (largestSize > 30_000) complexityScore += 1;
  if (testRatio < 0.05 && sourceFiles.length > 20) complexityScore += 1;

  const complexityLevel = complexityScore >= 5 ? "high" : complexityScore >= 2 ? "moderate" : "low";
  const complexitySignals: string[] = [];
  if (sourceFiles.length > 250) complexitySignals.push(`${formatNumber(sourceFiles.length)} source files create a broad surface area.`);
  if (maxDepth >= 5) complexitySignals.push(`Directory paths reach ${maxDepth} levels deep.`);
  if (averageSize > 8_000) complexitySignals.push(`Average source-file size is ${(averageSize / 1000).toFixed(1)} KB.`);
  if (largestSize > 30_000) complexitySignals.push(`The largest source file is ${(largestSize / 1000).toFixed(1)} KB.`);
  if (testRatio < 0.05 && sourceFiles.length > 20) complexitySignals.push(`Only ${percent(testRatio)} of source files are recognizable tests.`);
  if (!complexitySignals.length) complexitySignals.push("The repository presents a compact, legible structural profile.");
  if (treePayload.truncated) complexitySignals.push("GitHub truncated the deepest file tree; totals are conservative.");

  const languageTotal = Object.values(languageMap).reduce((sum, bytes) => sum + bytes, 0);
  const languages = Object.entries(languageMap)
    .sort(([, first], [, second]) => second - first)
    .slice(0, 6)
    .map(([name, bytes]) => ({ name, bytes, percentage: languageTotal ? Math.round((bytes / languageTotal) * 100) : 0 }));

  const metrics: RepositoryMetrics = {
    repositoryUrl: identity.normalizedUrl,
    owner: identity.owner,
    name: repo.name,
    description: repo.description,
    defaultBranch: repo.default_branch,
    primaryLanguage: languages[0]?.name ?? null,
    languages,
    fileCount: blobs.length,
    sourceFileCount: sourceFiles.length,
    testFileCount: testFiles.length,
    testRatio,
    contributorCount: contributors.length,
    recentCommitCount,
    averageCommitsPerWeek: Math.round((recentCommitCount / 4) * 10) / 10,
    directoryDepth: maxDepth,
    averageSourceFileSize: averageSize,
    largestSourceFileSize: largestSize,
    complexityLevel,
    complexityScore,
    complexitySignals,
    repositoryCreatedAt: repo.created_at,
    fetchedAt: new Date().toISOString(),
  };
  let architecture;
  try {
    architecture = await analyzeRepositoryArchitecture({ owner: identity.owner, repo: identity.repo, branch: repo.default_branch, accessToken, repositoryFiles: blobs.length, recentCommitCount, mostRecentCommitAt: commits[0]?.commit?.author?.date });
  } catch (error) {
    console.warn("[Repository analysis] Architecture scan skipped:", error instanceof Error ? error.message : error);
  }
  const enrichedMetrics = { ...metrics, architecture, source: { type: "github" as const, label: identity.normalizedUrl } };
  return { ...enrichedMetrics, kpChart: createRepositoryKpChart(enrichedMetrics) };
}

export async function extractUploadedZipMetrics(fileName: string, archive: Buffer): Promise<RepositoryMetrics> {
  const safeName = fileName.replace(/[^A-Za-z0-9._-]/g, "_").replace(/\.zip$/i, "") || "uploaded-repository";
  const architecture = await analyzeUploadedZipArchitecture(archive);
  const sourceFileCount = architecture.categoryCounts.source;
  const testFileCount = architecture.categoryCounts.test;
  const fileCount = architecture.coverage.repositoryFiles;
  const testRatio = sourceFileCount ? testFileCount / sourceFileCount : 0;
  const largestSourceFileSize = Math.max(0, ...architecture.largestFiles.filter(file => file.category === "source").map(file => file.bytes));
  let complexityScore = 0;
  if (sourceFileCount > 250) complexityScore += 2;
  if (architecture.importEdges.length > 70) complexityScore += 2;
  else if (architecture.importEdges.length > 35) complexityScore += 1;
  if (largestSourceFileSize > 60_000) complexityScore += 2;
  else if (largestSourceFileSize > 30_000) complexityScore += 1;
  if (testRatio < 0.05 && sourceFileCount > 20) complexityScore += 1;
  if (architecture.maintenanceMarkers.fixme + architecture.maintenanceMarkers.deprecated > 8) complexityScore += 1;
  const complexityLevel = complexityScore >= 5 ? "high" : complexityScore >= 2 ? "moderate" : "low";
  const complexitySignals = [
    `${architecture.coverage.inspectedTextFiles} text files were inspected across ${architecture.topLevelModules.length} top-level modules.`,
    architecture.importEdges.length ? `${architecture.importEdges.length} internal import references were identified.` : "No conventional internal import references were identified.",
    `${architecture.maintenanceMarkers.todo} TODO, ${architecture.maintenanceMarkers.fixme} FIXME, and ${architecture.maintenanceMarkers.deprecated} deprecation markers were found.`,
  ];
  const metrics: RepositoryMetrics = {
    repositoryUrl: `upload://${safeName}.zip`, owner: "uploaded", name: safeName, description: "User-uploaded ZIP repository archive.", defaultBranch: "archive",
    primaryLanguage: null, languages: [], fileCount, sourceFileCount, testFileCount, testRatio, contributorCount: 1, recentCommitCount: 0, averageCommitsPerWeek: 0,
    directoryDepth: architecture.topLevelModules.length > 1 ? 2 : 1, averageSourceFileSize: 0, largestSourceFileSize, complexityLevel, complexityScore, complexitySignals,
    repositoryCreatedAt: new Date().toISOString(), fetchedAt: new Date().toISOString(), architecture, source: { type: "zip", label: "Uploaded ZIP archive", originalFileName: fileName },
  };
  return { ...metrics, kpChart: createRepositoryKpChart(metrics) };
}

const cards = {
  emperor: (trigger: string): TarotCard => ({
    position: "Foundation",
    cardName: "The Emperor",
    cardNumber: "IV",
    suit: "major",
    metricTrigger: trigger,
    mysticalInterpretation: "Order has taken root. The system’s boundaries give its inhabitants a dependable place to build.",
    technicalActionable: "Protect the architectural seams already doing their work. Make new changes conform to the established shape.",
  }),
  temperance: (trigger: string): TarotCard => ({
    position: "Foundation",
    cardName: "Temperance",
    cardNumber: "XIV",
    suit: "major",
    metricTrigger: trigger,
    mysticalInterpretation: "The vessels are in balance. Change and stability are meeting with uncommon restraint.",
    technicalActionable: "Preserve the feedback loop between implementation and tests as the codebase evolves.",
  }),
  world: (trigger: string): TarotCard => ({
    position: "Foundation",
    cardName: "The World",
    cardNumber: "XXI",
    suit: "major",
    metricTrigger: trigger,
    mysticalInterpretation: "Many hands orbit one shared center. Collaboration is not merely activity; it is a system’s living perimeter.",
    technicalActionable: "Document conventions and ownership boundaries so the contributor network can remain coherent as it grows.",
  }),
  tower: (trigger: string): TarotCard => ({
    position: "The Fracture",
    cardName: "The Tower",
    cardNumber: "XVI",
    suit: "major",
    metricTrigger: trigger,
    mysticalInterpretation: "A structure under too much internal strain asks for deliberate renewal before disorder chooses the timing.",
    technicalActionable: "Prioritize the largest and most entangled areas for decomposition. Add tests around the boundary before changing it.",
  }),
  pentacles: (trigger: string): TarotCard => ({
    position: "The Fracture",
    cardName: "Five of Pentacles",
    cardNumber: "V",
    suit: "pentacles",
    metricTrigger: trigger,
    mysticalInterpretation: "The system is operating without enough shelter from regression. The missing safety net is now visible.",
    technicalActionable: "Choose one critical flow and establish a small, reliable test baseline before expanding features.",
  }),
  death: (trigger: string): TarotCard => ({
    position: "The Passage",
    cardName: "Death",
    cardNumber: "XIII",
    suit: "major",
    metricTrigger: trigger,
    mysticalInterpretation: "The old form is giving way. This is not an ending but a clean invitation to remove what no longer serves.",
    technicalActionable: "Turn rapid change into an intentional refactor plan with small deletions, migration notes, and reviewable steps.",
  }),
  magician: (trigger: string): TarotCard => ({
    position: "The Passage",
    cardName: "The Magician",
    cardNumber: "I",
    suit: "major",
    metricTrigger: trigger,
    mysticalInterpretation: "The necessary instruments are already at hand. The next gain comes from applying them with focus.",
    technicalActionable: "Extract one repeatable utility or interface from the most active part of the system and let it become a clear internal tool.",
  }),
};

function mapIChing(metrics: RepositoryMetrics): IChingReading {
  if (metrics.complexityLevel === "high" && metrics.testRatio < 0.1) {
    return { number: 29, name: "The Abysmal", chineseName: "坎 · Kǎn", classicalText: "The Abysmal repeated. If you are sincere, you have success in your heart; whatever you do succeeds.", developerInterpretation: "The difficult passage is real, but it can be crossed through disciplined boundaries. Shrink the blast radius, make failures explicit, and move one verified step at a time.", trigger: "High structural complexity paired with a thin recognizable test layer." };
  }
  if (metrics.recentCommitCount >= 14) {
    return { number: 1, name: "The Creative", chineseName: "乾 · Qián", classicalText: "The Creative works sublime success, furthering through perseverance.", developerInterpretation: "Momentum is available. Direct it toward a small number of durable abstractions so velocity compounds instead of scattering.", trigger: `${metrics.recentCommitCount} recent commits signal concentrated forward movement.` };
  }
  if (metrics.testRatio >= 0.18 && metrics.complexityLevel !== "high") {
    return { number: 11, name: "Peace", chineseName: "泰 · Tài", classicalText: "The small departs, the great approaches. Good fortune. Success.", developerInterpretation: "The repository has room to breathe: safeguards and structure are supporting delivery. Use this calm period to strengthen documentation and simplify interfaces.", trigger: `A ${percent(metrics.testRatio)} test-file ratio and ${metrics.complexityLevel} structural complexity suggest equilibrium.` };
  }
  if (metrics.recentCommitCount <= 3) {
    return { number: 2, name: "The Receptive", chineseName: "坤 · Kūn", classicalText: "The Receptive brings about sublime success, furthering through the perseverance of a mare.", developerInterpretation: "This is a maintenance season. Listen closely to small bugs, debt signals, and user friction; precise care is the most generative work now.", trigger: `${metrics.recentCommitCount} recent commits indicate a quiet, maintenance-oriented rhythm.` };
  }
  return { number: 18, name: "Work on What Has Been Spoiled", chineseName: "蠱 · Gǔ", classicalText: "Work on what has been spoiled has supreme success. It furthers one to cross the great water.", developerInterpretation: "Inherited complexity is not a verdict. Audit the seams that have accumulated shortcuts, then renew them in visible, well-tested increments.", trigger: "A mixed health profile calls for deliberate repair before the next expansion." };
}

export function createDivination(metrics: RepositoryMetrics): { tarot: TarotCard[]; iching: IChingReading; narrative: string } {
  const tarot = drawCompleteTarot(metrics);
  const iching = castCompleteIChing(metrics);
  const kp = metrics.kpChart ?? createRepositoryKpChart(metrics);
  const foundation = tarot[0];
  const fracture = tarot[1];
  const passage = tarot[2];
  const dominantLanguage = metrics.primaryLanguage ? `${metrics.primaryLanguage} is the dominant tongue` : "The repository speaks in several tongues";
  const architectureThread = metrics.architecture ? ` The full-tree architecture scan found ${metrics.architecture.coverage.inspectedTextFiles} inspectable text files across ${metrics.architecture.topLevelModules.length} principal modules; ${metrics.architecture.unifiedSummary}` : " The architectural layer was unavailable for this pass, so the reading relies on the repository’s structural metadata.";
  const narrative = `${metrics.name} arrives as a living system of ${formatNumber(metrics.fileCount)} files. ${dominantLanguage}, while ${metrics.contributorCount === 1 ? "one contributor holds the primary thread" : `${metrics.contributorCount} contributors shape its orbit`}.${architectureThread} ${foundation.cardName} reveals the strength beneath the surface: ${foundation.mysticalInterpretation} Yet ${fracture.cardName} stands at the threshold, because ${fracture.metricTrigger.toLowerCase()} ${iching.name} offers the governing counsel: ${iching.developerInterpretation} The repository’s KP-inspired chart activates the ${kp.activeHouse.name} house through ${kp.starLord.planet} as star lord and ${kp.subLord.planet} as sub-lord, bridging ${kp.tarotBridge.slice(0, 2).join(" and ")} with its symbolic evidence. Let the next commit be an act of chosen clarity—${passage.technicalActionable.toLowerCase()}`;
  return { tarot, iching, narrative };
}
