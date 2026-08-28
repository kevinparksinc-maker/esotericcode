export type RepositorySource = "public" | "private";

export type RepositoryMetrics = {
  repositoryUrl: string;
  owner: string;
  name: string;
  defaultBranch: string;
  description: string | null;
  primaryLanguage: string | null;
  fileCount: number;
  sourceFileCount: number;
  testFileCount: number;
  testRatio: number;
  directoryDepth: number;
  largestFileBytes: number;
  contributorCount: number;
  recentCommitCount: number;
  complexityScore: number;
  complexityLevel: "low" | "moderate" | "high";
  source: RepositorySource;
  fetchedAt: string;
};

export type ArchitectureEvidence = {
  summary: string;
  topModules: Array<{ path: string; files: number }>;
  entryPoints: string[];
  fileCategories: Array<{ label: string; count: number }>;
  observations: string[];
};

export type TarotCard = {
  name: string;
  number: string;
  position: "Foundation" | "Tension" | "Way forward";
  orientation: "upright" | "reversed";
  archetype: string;
  technicalReading: string;
  action: string;
};

export type IChingReading = {
  number: number;
  name: string;
  chineseName: string;
  image: string;
  developerReading: string;
  changingLine: number;
};

export type KpChart = {
  activeHouse: { number: number; name: string; meaning: string };
  nakshatra: string;
  starLord: string;
  subLord: string;
  significators: string[];
  synthesis: string;
};

export type TechnicalAction = {
  step: "Start here" | "Do this next" | "Keep it healthy";
  title: string;
  detail: string;
};

export type ReadingPayload = {
  metrics: RepositoryMetrics;
  architecture: ArchitectureEvidence;
  tarot: TarotCard[];
  iching: IChingReading;
  kpChart: KpChart;
  actions: TechnicalAction[];
  narrative: string;
};

export const TAROT_LIBRARY = [
  { name: "The Magician", number: "I", archetype: "Capability", correspondence: "Existing tools become leverage when assembled with intention." },
  { name: "The High Priestess", number: "II", archetype: "Hidden knowledge", correspondence: "Signals beneath the interface merit patient observation before change." },
  { name: "The Chariot", number: "VII", archetype: "Directed momentum", correspondence: "Delivery accelerates when interfaces point in one deliberate direction." },
  { name: "Strength", number: "VIII", archetype: "Resilient restraint", correspondence: "Reliable systems are formed through calm control of complexity." },
  { name: "The Hermit", number: "IX", archetype: "Focused inquiry", correspondence: "A small, well-lit investigation can resolve broad uncertainty." },
  { name: "Wheel of Fortune", number: "X", archetype: "Change cycle", correspondence: "Release rhythm and maintenance windows shape the system's next turn." },
  { name: "Justice", number: "XI", archetype: "Balance", correspondence: "Evidence, tests, and explicit decisions keep a codebase accountable." },
  { name: "The Hanged Man", number: "XII", archetype: "Perspective", correspondence: "A paused assumption often reveals the cleanest architecture path." },
  { name: "Death", number: "XIII", archetype: "Renewal", correspondence: "Retiring a brittle boundary makes room for a simpler structure." },
  { name: "Temperance", number: "XIV", archetype: "Integration", correspondence: "Measured interfaces allow separate systems to work as one." },
  { name: "The Tower", number: "XVI", archetype: "Structural truth", correspondence: "Unexamined coupling eventually asks to be made visible." },
  { name: "The Star", number: "XVII", archetype: "Guiding clarity", correspondence: "A concise technical direction restores confidence after complexity." },
] as const;

export const I_CHING_LIBRARY = [
  { number: 1, name: "The Creative", chineseName: "乾 · Qián", image: "Sustained, focused force", correspondence: "Concentrated momentum benefits from a durable technical direction." },
  { number: 2, name: "The Receptive", chineseName: "坤 · Kūn", image: "Responsive support", correspondence: "Careful maintenance and close listening are productive forms of progress." },
  { number: 11, name: "Peace", chineseName: "泰 · Tài", image: "Exchange and balance", correspondence: "Clear boundaries and healthy safeguards let delivery breathe." },
  { number: 18, name: "Work on What Has Been Spoiled", chineseName: "蠱 · Gǔ", image: "Deliberate renewal", correspondence: "Inherited complexity yields to visible, well-tested repair." },
  { number: 29, name: "The Abysmal", chineseName: "坎 · Kǎn", image: "Repeated depth", correspondence: "Risk calls for narrowed scope, explicit failure modes, and disciplined steps." },
  { number: 46, name: "Pushing Upward", chineseName: "升 · Shēng", image: "Patient ascent", correspondence: "Small, compounding improvements create durable system capability." },
  { number: 53, name: "Gradual Development", chineseName: "漸 · Jiàn", image: "Measured progress", correspondence: "Stable interfaces and incremental delivery are the right tempo." },
  { number: 63, name: "After Completion", chineseName: "既濟 · Jì Jì", image: "Order requiring vigilance", correspondence: "A working system still needs careful observation to stay balanced." },
] as const;

export const KP_CORRESPONDENCES = [
  { planet: "Sun", technicalDomain: "Purpose and visible direction", tarot: "The Sun", iching: "The Creative" },
  { planet: "Moon", technicalDomain: "User experience and operational rhythm", tarot: "The High Priestess", iching: "The Receptive" },
  { planet: "Mars", technicalDomain: "Implementation energy and incident response", tarot: "The Tower", iching: "The Abysmal" },
  { planet: "Mercury", technicalDomain: "Interfaces, data flow, and documentation", tarot: "The Magician", iching: "Peace" },
  { planet: "Jupiter", technicalDomain: "Scale, learning, and architectural growth", tarot: "Wheel of Fortune", iching: "Pushing Upward" },
  { planet: "Venus", technicalDomain: "Coherence, craft, and system ergonomics", tarot: "Temperance", iching: "Gradual Development" },
  { planet: "Saturn", technicalDomain: "Boundaries, tests, and long-term responsibility", tarot: "Justice", iching: "After Completion" },
  { planet: "Rahu", technicalDomain: "Novel dependencies and unknown complexity", tarot: "The Hanged Man", iching: "Work on What Has Been Spoiled" },
  { planet: "Ketu", technicalDomain: "Simplification and focused investigation", tarot: "The Hermit", iching: "The Receptive" },
] as const;
