import type { KpAstrologyChart, KpHouseEmphasis, KpPlanet, KpPlanetaryCorrespondence, RepositoryMetrics } from "@shared/esoteric";

type PlanetDefinition = KpPlanetaryCorrespondence;

export const KP_PLANETS: PlanetDefinition[] = [
  { planet: "Sun", symbol: "☉", engineeringFocus: "identity, leadership, and the central architectural contract", tarotResonances: ["The Sun", "The Emperor"], hexagramResonances: [{ number: 1, name: "The Creative" }, { number: 34, name: "Great Power" }] },
  { planet: "Moon", symbol: "☽", engineeringFocus: "feedback, team rhythms, and the repository’s responsive layer", tarotResonances: ["The High Priestess", "The Moon"], hexagramResonances: [{ number: 2, name: "The Receptive" }, { number: 58, name: "The Joyous" }] },
  { planet: "Mars", symbol: "♂", engineeringFocus: "execution, incident response, and decisive delivery", tarotResonances: ["The Chariot", "The Tower"], hexagramResonances: [{ number: 21, name: "Biting Through" }, { number: 51, name: "The Arousing" }] },
  { planet: "Mercury", symbol: "☿", engineeringFocus: "interfaces, reasoning, documentation, and information flow", tarotResonances: ["The Magician", "Justice"], hexagramResonances: [{ number: 57, name: "The Gentle" }, { number: 61, name: "Inner Truth" }] },
  { planet: "Jupiter", symbol: "♃", engineeringFocus: "growth, shared wisdom, platform leverage, and durable opportunity", tarotResonances: ["Wheel of Fortune", "The World"], hexagramResonances: [{ number: 42, name: "Increase" }, { number: 14, name: "Great Possession" }] },
  { planet: "Venus", symbol: "♀", engineeringFocus: "developer experience, cohesion, harmony, and sustainable craft", tarotResonances: ["The Empress", "The Lovers"], hexagramResonances: [{ number: 11, name: "Peace" }, { number: 31, name: "Influence" }] },
  { planet: "Saturn", symbol: "♄", engineeringFocus: "boundaries, debt, reliability, and the stewardship of time", tarotResonances: ["The Hermit", "The World"], hexagramResonances: [{ number: 32, name: "Duration" }, { number: 60, name: "Limitation" }] },
  { planet: "Rahu", symbol: "☊", engineeringFocus: "amplified complexity, hidden dependencies, and unfamiliar scale", tarotResonances: ["The Devil", "The Moon"], hexagramResonances: [{ number: 29, name: "The Abysmal" }, { number: 28, name: "Great Preponderance" }] },
  { planet: "Ketu", symbol: "☋", engineeringFocus: "reduction, release, abstraction, and the residue of prior forms", tarotResonances: ["Death", "The Hanged Man"], hexagramResonances: [{ number: 23, name: "Splitting Apart" }, { number: 24, name: "Return" }] },
];

const NAKSHATRAS: Array<{ name: string; ruler: KpPlanet; theme: string }> = [
  { name: "Ashwini", ruler: "Ketu", theme: "swift beginnings and repair" }, { name: "Bharani", ruler: "Venus", theme: "containment and patient maturation" }, { name: "Krittika", ruler: "Sun", theme: "discernment and necessary cutting" },
  { name: "Rohini", ruler: "Moon", theme: "growth and resource cultivation" }, { name: "Mrigashira", ruler: "Mars", theme: "search, exploration, and pursuit" }, { name: "Ardra", ruler: "Rahu", theme: "disruption, weather, and deep investigation" },
  { name: "Punarvasu", ruler: "Jupiter", theme: "renewal and return to purpose" }, { name: "Pushya", ruler: "Saturn", theme: "sustaining structure and dependable care" }, { name: "Ashlesha", ruler: "Mercury", theme: "complex systems and hidden bindings" },
  { name: "Magha", ruler: "Ketu", theme: "lineage, authority, and inherited form" }, { name: "Purva Phalguni", ruler: "Venus", theme: "creative ease and human connection" }, { name: "Uttara Phalguni", ruler: "Sun", theme: "commitment and responsible leadership" },
  { name: "Hasta", ruler: "Moon", theme: "skill, iteration, and deliberate handling" }, { name: "Chitra", ruler: "Mars", theme: "design, construction, and visible craft" }, { name: "Swati", ruler: "Rahu", theme: "independence, adaptability, and distributed motion" },
  { name: "Vishakha", ruler: "Jupiter", theme: "focused ambition and branching paths" }, { name: "Anuradha", ruler: "Saturn", theme: "devotion, cooperation, and reliable bonds" }, { name: "Jyeshtha", ruler: "Mercury", theme: "senior stewardship and complex responsibility" },
  { name: "Mula", ruler: "Ketu", theme: "root cause, removal, and foundational inquiry" }, { name: "Purva Ashadha", ruler: "Venus", theme: "persuasion, polish, and forward confidence" }, { name: "Uttara Ashadha", ruler: "Sun", theme: "enduring success and accountable direction" },
  { name: "Shravana", ruler: "Moon", theme: "listening, learning, and signal reception" }, { name: "Dhanishta", ruler: "Mars", theme: "rhythm, coordination, and disciplined pace" }, { name: "Shatabhisha", ruler: "Rahu", theme: "systems healing and unconventional diagnosis" },
  { name: "Purva Bhadrapada", ruler: "Jupiter", theme: "vision, transition, and deep commitment" }, { name: "Uttara Bhadrapada", ruler: "Saturn", theme: "depth, restraint, and stable foundations" }, { name: "Revati", ruler: "Mercury", theme: "completion, transfer, and safe passage" },
];

const HOUSES: KpHouseEmphasis[] = [
  { number: 1, name: "Ascendant", engineeringDomain: "repository identity", theme: "the system’s essential architectural character" },
  { number: 2, name: "Assets", engineeringDomain: "dependencies and resources", theme: "what the repository accumulates and relies upon" },
  { number: 3, name: "Signals", engineeringDomain: "commits and communication", theme: "how the system expresses change and coordination" },
  { number: 4, name: "Foundation", engineeringDomain: "core infrastructure", theme: "the root layers that make later work possible" },
  { number: 5, name: "Creation", engineeringDomain: "features and product expression", theme: "where invention enters the codebase" },
  { number: 6, name: "Service", engineeringDomain: "defects, tests, and technical debt", theme: "the daily work of repair and operational discipline" },
  { number: 7, name: "Interfaces", engineeringDomain: "integrations and APIs", theme: "how the repository meets external systems" },
  { number: 8, name: "Transformation", engineeringDomain: "risk and deep refactors", theme: "the pressures that require fundamental change" },
  { number: 9, name: "Meaning", engineeringDomain: "documentation and long-range vision", theme: "the principles that guide the system beyond the immediate sprint" },
  { number: 10, name: "Delivery", engineeringDomain: "releases and public reliability", theme: "how the repository is experienced in the wider world" },
  { number: 11, name: "Network", engineeringDomain: "contributors and community", theme: "the collaborative field around the project" },
  { number: 12, name: "Archive", engineeringDomain: "deprecation and recovery", theme: "what must be released, hidden, or restored" },
];

function timestampSeed(value: string) {
  const date = new Date(value);
  const milliseconds = Number.isNaN(date.getTime()) ? 0 : date.getTime();
  return Math.abs(Math.floor(milliseconds / 60000));
}

function primaryPlanet(metrics: RepositoryMetrics): KpPlanet {
  if (metrics.complexityLevel === "high") return metrics.testRatio < 0.1 ? "Rahu" : "Saturn";
  if (metrics.contributorCount >= 8) return "Jupiter";
  if (metrics.recentCommitCount >= 14) return "Mars";
  if (metrics.testRatio >= 0.18) return "Venus";
  if (metrics.recentCommitCount <= 3) return "Moon";
  return "Mercury";
}

function activeHouse(metrics: RepositoryMetrics): KpHouseEmphasis {
  if (metrics.complexityLevel === "high") return HOUSES[7];
  if (metrics.testRatio < 0.08) return HOUSES[5];
  if (metrics.contributorCount >= 8) return HOUSES[10];
  if (metrics.recentCommitCount >= 14) return HOUSES[9];
  if (metrics.recentCommitCount <= 3) return HOUSES[3];
  return HOUSES[0];
}

function byPlanet(planet: KpPlanet) { return KP_PLANETS.find(entry => entry.planet === planet)!; }

export function createRepositoryKpChart(metrics: RepositoryMetrics): KpAstrologyChart {
  const seed = timestampSeed(metrics.repositoryCreatedAt);
  const nakshatraIndex = seed % NAKSHATRAS.length;
  const nakshatra = NAKSHATRAS[nakshatraIndex];
  const primary = primaryPlanet(metrics);
  const starLord = byPlanet(nakshatra.ruler);
  const subLord = byPlanet(KP_PLANETS[(seed + metrics.complexityScore + metrics.contributorCount + metrics.recentCommitCount) % KP_PLANETS.length].planet);
  const significators = Array.from(new Map([primary, starLord.planet, subLord.planet].map(planet => [planet, byPlanet(planet)])).values());
  const house = activeHouse(metrics);
  const created = new Date(metrics.repositoryCreatedAt);
  const ageDays = Number.isNaN(created.getTime()) ? 0 : Math.max(0, Math.floor((Date.now() - created.getTime()) / 86400000));
  const tarotBridge = Array.from(new Set(significators.flatMap(significator => significator.tarotResonances)));
  const ichingBridge = Array.from(new Map(significators.flatMap(significator => significator.hexagramResonances).map(hexagram => [hexagram.number, hexagram])).values());
  return {
    framework: "Repository symbolic chart",
    repositoryBirth: { createdAt: metrics.repositoryCreatedAt, ageDays, source: "GitHub repository creation timestamp" },
    activeHouse: house,
    nakshatra: { index: nakshatraIndex + 1, ...nakshatra },
    starLord,
    subLord,
    significators,
    tarotBridge,
    ichingBridge,
    synthesis: `${house.name} is the active repository house, emphasizing ${house.engineeringDomain}. ${starLord.planet} acts as the star lord through ${nakshatra.name}, a theme of ${nakshatra.theme}; ${subLord.planet} refines this as the sub-lord. Together they connect the current system state to ${tarotBridge.slice(0, 2).join(" and ")} in Tarot and ${ichingBridge.slice(0, 2).map(hexagram => `${hexagram.number}. ${hexagram.name}`).join(" / ")} in the I Ching.`,
    disclaimer: "This is a KP-inspired symbolic repository chart derived from GitHub timestamps and code signals, not a personal natal chart or a predictive astrology calculation.",
  };
}
