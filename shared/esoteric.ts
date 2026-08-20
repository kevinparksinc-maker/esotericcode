export type ComplexityLevel = "low" | "moderate" | "high";
export type TarotOrientation = "upright" | "reversed";
export type KpPlanet = "Sun" | "Moon" | "Mars" | "Mercury" | "Jupiter" | "Venus" | "Saturn" | "Rahu" | "Ketu";

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
