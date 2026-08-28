import type { ArchitectureEvidence, RepositoryMetrics } from "@shared/esoteric";

type GitHubRepository = {
  full_name: string;
  name: string;
  owner: { login: string };
  html_url: string;
  default_branch: string;
  description: string | null;
  language: string | null;
};

type GitHubTreeItem = { path: string; type: "blob" | "tree"; size?: number };

const SOURCE_EXTENSIONS = new Set(["ts", "tsx", "js", "jsx", "py", "go", "rs", "java", "rb", "php", "cs", "swift", "kt", "scala", "c", "cc", "cpp", "h", "hpp"]);
const TEST_PATTERN = /(^|[./_-])(test|spec|__tests__)([./_-]|$)/i;
const ENTRY_PATTERN = /(^|\/)(main|index|app|server|cli)\.(ts|tsx|js|jsx|py|go|rs)$/i;

function githubHeaders(accessToken?: string) {
  return {
    Accept: "application/vnd.github+json",
    "User-Agent": "EsotericCode-repository-reader",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

async function githubJson<T>(path: string, accessToken?: string): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, { headers: githubHeaders(accessToken) });
  if (!response.ok) {
    if (response.status === 404) throw new Error("GitHub could not find that repository. Confirm the URL.");
    if (response.status === 403) throw new Error("GitHub rate limited this request. Please wait a moment and try again.");
    throw new Error("GitHub could not read this repository right now. Please try again.");
  }
  return response.json() as Promise<T>;
}

async function optionalGithubJson<T>(path: string, fallback: T, accessToken?: string): Promise<T> {
  try {
    return await githubJson<T>(path, accessToken);
  } catch {
    return fallback;
  }
}

function encodeSegment(value: string) {
  return encodeURIComponent(value);
}

export function parseGitHubRepositoryUrl(input: string) {
  const trimmed = input.trim().replace(/\/$/, "");
  const candidate = trimmed.startsWith("github.com/")
    ? `https://${trimmed}`
    : trimmed.includes("://")
      ? trimmed
      : `https://github.com/${trimmed}`;
  const match = candidate.match(/^https?:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/i);
  if (!match) throw new Error("Enter a GitHub repository URL such as https://github.com/owner/repository.");
  const [, owner, repository] = match;
  return { owner, repository, normalizedUrl: `https://github.com/${owner}/${repository}` };
}

function extension(path: string) {
  return path.split(".").pop()?.toLowerCase() ?? "";
}

function sourceFile(path: string) {
  return SOURCE_EXTENSIONS.has(extension(path));
}

function categoryCounts(paths: string[]) {
  const categories = new Map<string, number>([["Source", 0], ["Tests", 0], ["Configuration", 0], ["Documentation", 0], ["Assets", 0]]);
  for (const path of paths) {
    if (TEST_PATTERN.test(path)) categories.set("Tests", (categories.get("Tests") ?? 0) + 1);
    else if (sourceFile(path)) categories.set("Source", (categories.get("Source") ?? 0) + 1);
    else if (/(^|\/)(package\.json|tsconfig\.json|vite\.config|next\.config|dockerfile|\.github\/|\.env)/i.test(path)) categories.set("Configuration", (categories.get("Configuration") ?? 0) + 1);
    else if (/\.(md|mdx|rst|txt)$/i.test(path)) categories.set("Documentation", (categories.get("Documentation") ?? 0) + 1);
    else categories.set("Assets", (categories.get("Assets") ?? 0) + 1);
  }
  return Array.from(categories, ([label, count]) => ({ label, count })).filter(item => item.count > 0);
}

function architectureFromTree(tree: GitHubTreeItem[], truncated: boolean): ArchitectureEvidence {
  const files = tree.filter(item => item.type === "blob");
  const paths = files.map(item => item.path);
  const moduleCounts = new Map<string, number>();
  for (const path of paths) {
    const module = path.includes("/") ? path.split("/")[0] : "root";
    moduleCounts.set(module, (moduleCounts.get(module) ?? 0) + 1);
  }
  const topModules = Array.from(moduleCounts, ([path, files]) => ({ path, files })).sort((a, b) => b.files - a.files).slice(0, 6);
  const entryPoints = paths.filter(path => ENTRY_PATTERN.test(path) || /(^|\/)package\.json$/i.test(path)).slice(0, 8);
  const sourceCount = paths.filter(sourceFile).length;
  const testCount = paths.filter(path => TEST_PATTERN.test(path)).length;
  const observations = [
    `${sourceCount} recognizable source files and ${testCount} test-oriented files were found in the visible tree.`,
    topModules.length ? `${topModules[0].path} is the largest top-level module with ${topModules[0].files} files.` : "The visible tree is concentrated at the repository root.",
    entryPoints.length ? `${entryPoints.length} conventional entry point${entryPoints.length === 1 ? "" : "s"} were detected.` : "No conventional entry point name was detected.",
    ...(truncated ? ["GitHub marked the recursive tree as truncated, so this reading uses the available repository tree rather than a complete file inventory."] : []),
  ];
  return {
    summary: `A measurable tree scan mapped ${files.length} files across ${topModules.length || 1} principal module${topModules.length === 1 ? "" : "s"}.`,
    topModules,
    entryPoints,
    fileCategories: categoryCounts(paths),
    observations,
  };
}

export async function analyzeGitHubRepository(repositoryUrl: string, source: "public" | "private", accessToken?: string) {
  const identity = parseGitHubRepositoryUrl(repositoryUrl);
  const encoded = `${encodeSegment(identity.owner)}/${encodeSegment(identity.repository)}`;
  const repository = await githubJson<GitHubRepository>(`/repos/${encoded}`, accessToken);
  const [treeResult, contributors, commits] = await Promise.all([
    githubJson<{ tree: GitHubTreeItem[]; truncated?: boolean }>(`/repos/${encoded}/git/trees/${encodeSegment(repository.default_branch)}?recursive=1`, accessToken),
    optionalGithubJson<Array<unknown>>(`/repos/${encoded}/contributors?per_page=100`, [], accessToken),
    optionalGithubJson<Array<unknown>>(`/repos/${encoded}/commits?per_page=100&since=${encodeURIComponent(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())}`, [], accessToken),
  ]);
  const tree = treeResult.tree.filter(item => item.type === "blob");
  const paths = tree.map(item => item.path);
  const sourceFileCount = paths.filter(sourceFile).length;
  const testFileCount = paths.filter(path => TEST_PATTERN.test(path)).length;
  const directoryDepth = paths.reduce((maximum, path) => Math.max(maximum, path.split("/").length - 1), 0);
  const largestFileBytes = tree.reduce((maximum, item) => Math.max(maximum, item.size ?? 0), 0);
  const complexityScore = Math.min(10, Math.round((directoryDepth * 0.7 + sourceFileCount / 18 + Math.min(tree.length, 300) / 90) * 10) / 10);
  const complexityLevel = complexityScore >= 7 ? "high" : complexityScore >= 3.5 ? "moderate" : "low";
  const metrics: RepositoryMetrics = {
    repositoryUrl: repository.html_url,
    owner: repository.owner.login,
    name: repository.name,
    defaultBranch: repository.default_branch,
    description: repository.description,
    primaryLanguage: repository.language,
    fileCount: tree.length,
    sourceFileCount,
    testFileCount,
    testRatio: sourceFileCount ? Math.round((testFileCount / sourceFileCount) * 100) / 100 : 0,
    directoryDepth,
    largestFileBytes,
    contributorCount: contributors.length,
    recentCommitCount: commits.length,
    complexityScore,
    complexityLevel,
    source,
    fetchedAt: new Date().toISOString(),
  };
  return { metrics, architecture: architectureFromTree(tree, Boolean(treeResult.truncated)) };
}
