export type ComplexityLevel = "low" | "moderate" | "high";
export type TarotOrientation = "upright" | "reversed";
export type KpPlanet = "Sun" | "Moon" | "Mars" | "Mercury" | "Jupiter" | "Venus" | "Saturn" | "Rahu" | "Ketu";
export type RepositoryFileCategory = "source" | "test" | "config" | "documentation" | "manifest" | "migration" | "infrastructure" | "other";
export type RepositoryArchitecture = {
  analysisMode: "bounded full-tree architecture scan";
  coverage: { repositoryFiles: number; inspectedTextFiles: number; excludedNoiseFiles: number; contentBatches: number; unprocessedTextFiles: number };
  categoryCounts: Record<RepositoryFileCategory, number>;
  topLevelModules: Array<{ path: string; files: number; categories: RepositoryFileCategory[] }>;
  entryPoints: string[];
  importEdges: Array<{ from: string; to: string }>;
  dependencyCount: number;
  dependencies: string[];
  testDirectories: string[];
  maintenanceMarkers: { todo: number; fixme: number; deprecated: number };
  largestFiles: Array<{ path: string; bytes: number; category: RepositoryFileCategory }>;
  recency: { recentCommitCount: number; mostRecentCommitAt?: string; recentlyTouchedFiles: Array<{ path: string; lastCommitAt?: string }> };
  moduleSummaries: Array<{ module: string; summary: string; responsibilities: string[]; risks: string[] }>;
  unifiedSummary: string;
  synthesisMethod: "batched module summaries followed by one unified synthesis";
};
export type IChingLineValue = 6 | 7 | 8 | 9;
export type IChingLine = {
  position: number;
  positionName: string;
  value: IChingLineValue;
  polarity: "yin" | "yang";
  changing: boolean;
  interpretation: string;
};
export type IChingCast = {
  method: "deterministic repository casting";
  mode: "static" | "changing";
  lines: IChingLine[];
  changingLineNumbers: number[];
  relatingHexagram?: { number: number; name: string; chineseName: string; symbol?: string; developerInterpretation: string };
  transformationSummary: string;
};

export type KpPlanetaryCorrespondence = {
  planet: KpPlanet;
  symbol: string;
  engineeringFocus: string;
  tarotResonances: string[];
  hexagramResonances: Array<{ number: number; name: string }>;
};

export type KpHouseEmphasis = {
  number: number;
  name: string;
  engineeringDomain: string;
  theme: string;
};

export type KpAstrologyChart = {
  framework: "Repository symbolic chart";
  repositoryBirth: { createdAt: string; ageDays: number; source: string };
  activeHouse: KpHouseEmphasis;
  nakshatra: { index: number; name: string; ruler: KpPlanet; theme: string };
  starLord: KpPlanetaryCorrespondence;
  subLord: KpPlanetaryCorrespondence;
  significators: KpPlanetaryCorrespondence[];
  tarotBridge: string[];
  ichingBridge: Array<{ number: number; name: string }>;
  synthesis: string;
  disclaimer: string;
};

export type RepositoryMetrics = {
  repositoryUrl: string;
  owner: string;
  name: string;
  description: string | null;
  defaultBranch: string;
  primaryLanguage: string | null;
  languages: Array<{ name: string; bytes: number; percentage: number }>;
  fileCount: number;
  sourceFileCount: number;
  testFileCount: number;
  testRatio: number;
  contributorCount: number;
  recentCommitCount: number;
  averageCommitsPerWeek: number;
  directoryDepth: number;
  averageSourceFileSize: number;
  largestSourceFileSize: number;
  complexityLevel: ComplexityLevel;
  complexityScore: number;
  complexitySignals: string[];
  repositoryCreatedAt: string;
  fetchedAt: string;
  kpChart?: KpAstrologyChart;
  architecture?: RepositoryArchitecture;
};

export type TarotCard = {
  position: string;
  cardName: string;
  cardNumber: string;
  suit: "major" | "wands" | "cups" | "swords" | "pentacles";
  metricTrigger: string;
  mysticalInterpretation: string;
  technicalActionable: string;
  orientation?: TarotOrientation;
  orientationEvidence?: string;
};

export type IChingReading = {
  number: number;
  name: string;
  chineseName: string;
  symbol?: string;
  classicalText: string;
  developerInterpretation: string;
  trigger: string;
  cast?: IChingCast;
};

export type ReadingPayload = {
  metrics: RepositoryMetrics;
  tarot: TarotCard[];
  iching: IChingReading;
  narrative: string;
};
