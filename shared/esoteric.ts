export type ComplexityLevel = "low" | "moderate" | "high";
export type TarotOrientation = "upright" | "reversed";

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
  fetchedAt: string;
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
};

export type ReadingPayload = {
  metrics: RepositoryMetrics;
  tarot: TarotCard[];
  iching: IChingReading;
  narrative: string;
};
