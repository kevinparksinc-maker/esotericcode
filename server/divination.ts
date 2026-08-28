import { I_CHING_LIBRARY, KP_CORRESPONDENCES, TAROT_LIBRARY, type ArchitectureEvidence, type IChingReading, type KpChart, type ReadingPayload, type RepositoryMetrics, type TarotCard, type TechnicalAction } from "@shared/esoteric";

function card(name: string) {
  const result = TAROT_LIBRARY.find(item => item.name === name);
  if (!result) throw new Error(`Unknown Tarot card: ${name}`);
  return result;
}

function hexagram(number: number) {
  const result = I_CHING_LIBRARY.find(item => item.number === number);
  if (!result) throw new Error(`Unknown I Ching hexagram: ${number}`);
  return result;
}

function makeTarot(metrics: RepositoryMetrics): TarotCard[] {
  const foundation = metrics.testRatio >= 0.18 ? card("Justice") : metrics.sourceFileCount <= 12 ? card("The Hermit") : card("The Magician");
  const tension = metrics.complexityLevel === "high" ? card("The Tower") : metrics.recentCommitCount >= 30 ? card("Wheel of Fortune") : card("The Hanged Man");
  const wayForward = metrics.testRatio < 0.1 ? card("Strength") : metrics.complexityLevel === "moderate" ? card("Temperance") : card("The Star");
  return [
    { name: foundation.name, number: foundation.number, position: "Foundation", orientation: "upright", archetype: foundation.archetype, technicalReading: foundation.correspondence, action: "Name the system strength worth protecting before changing its shape." },
    { name: tension.name, number: tension.number, position: "Tension", orientation: metrics.complexityLevel === "high" ? "reversed" : "upright", archetype: tension.archetype, technicalReading: tension.correspondence, action: "Choose one observable seam where risk can be reduced without widening scope." },
    { name: wayForward.name, number: wayForward.number, position: "Way forward", orientation: "upright", archetype: wayForward.archetype, technicalReading: wayForward.correspondence, action: "Turn the next technical insight into a small, reviewable change." },
  ];
}

function makeIChing(metrics: RepositoryMetrics): IChingReading {
  const selected = metrics.complexityLevel === "high" && metrics.testRatio < 0.1 ? hexagram(29) : metrics.recentCommitCount >= 20 ? hexagram(1) : metrics.testRatio >= 0.18 ? hexagram(11) : metrics.recentCommitCount <= 3 ? hexagram(2) : hexagram(18);
  return { number: selected.number, name: selected.name, chineseName: selected.chineseName, image: selected.image, developerReading: selected.correspondence, changingLine: (metrics.fileCount % 6) + 1 };
}

function makeKpChart(metrics: RepositoryMetrics): KpChart {
  const houses = ["Identity", "Resources", "Communication", "Foundations", "Expression", "Craft", "Partnerships", "Transformation", "Learning", "Contribution", "Networks", "Release"];
  const activeHouseNumber = (metrics.fileCount % 12) + 1;
  const star = KP_CORRESPONDENCES[metrics.sourceFileCount % KP_CORRESPONDENCES.length];
  const sub = KP_CORRESPONDENCES[(metrics.recentCommitCount + metrics.directoryDepth) % KP_CORRESPONDENCES.length];
  return {
    activeHouse: { number: activeHouseNumber, name: houses[activeHouseNumber - 1], meaning: "The active house names the repository concern asking for deliberate attention." },
    nakshatra: ["Ashwini", "Rohini", "Mrigashira", "Pushya", "Hasta", "Swati", "Anuradha", "Shravana", "Revati"][metrics.fileCount % 9],
    starLord: star.planet,
    subLord: sub.planet,
    significators: [star.technicalDomain, sub.technicalDomain],
    synthesis: `The ${houses[activeHouseNumber - 1]} house is activated through ${star.planet}'s emphasis on ${star.technicalDomain.toLowerCase()}, refined by ${sub.planet}'s concern for ${sub.technicalDomain.toLowerCase()}.`,
  };
}

function makeActions(metrics: RepositoryMetrics, architecture: ArchitectureEvidence): TechnicalAction[] {
  const prominentModule = architecture.topModules[0]?.path ?? "the repository root";
  const entryPoint = architecture.entryPoints[0] ?? "the clearest application entry point";
  return [
    metrics.testRatio < 0.1 ? { step: "Start here", title: "Place a safety rail around the next change", detail: `Add one focused test near ${entryPoint} before altering behavior; the current tree shows a ${Math.round(metrics.testRatio * 100)}% test-to-source ratio.` } : { step: "Start here", title: "Protect the existing feedback loop", detail: `The recognizable test layer is a useful asset. Run and extend the relevant tests before changing ${prominentModule}.` },
    metrics.complexityLevel === "high" ? { step: "Do this next", title: "Narrow one complex boundary", detail: `With a complexity signal of ${metrics.complexityScore}/10, select one responsibility in ${prominentModule} and extract it behind a smaller interface.` } : { step: "Do this next", title: "Clarify the dominant module", detail: `Document the role and entry points of ${prominentModule}; it contains the largest visible concentration of files.` },
    { step: "Keep it healthy", title: "Make the repository legible on return", detail: `Record the intent of ${entryPoint}, the next release-sized change, and the assumptions that would make it unsafe to merge.` },
  ];
}

export function createReadingPayload(metrics: RepositoryMetrics, architecture: ArchitectureEvidence): ReadingPayload {
  const tarot = makeTarot(metrics);
  const iching = makeIChing(metrics);
  const kpChart = makeKpChart(metrics);
  const actions = makeActions(metrics, architecture);
  const language = metrics.primaryLanguage ?? "its mixed implementation languages";
  const narrative = `${metrics.owner}/${metrics.name} presents ${metrics.fileCount} measured files, with ${language} at the visible center. ${architecture.summary} ${tarot[0].name} marks the foundation; ${tarot[1].name} identifies the pressure point. ${iching.name} frames the next movement: ${iching.developerReading}`;
  return { metrics, architecture, tarot, iching, kpChart, actions, narrative };
}
