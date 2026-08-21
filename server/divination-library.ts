import type { IChingCast, IChingLine, IChingLineValue, IChingReading, RepositoryMetrics, TarotCard } from "@shared/esoteric";

export type SignalKey = "activity" | "change" | "stability" | "testing" | "complexity" | "risk" | "collaboration" | "scale" | "maintenance" | "craft" | "growth";
type Profile = Record<SignalKey, number>;
type TarotEntry = Omit<TarotCard, "position" | "metricTrigger" | "orientation" | "orientationEvidence"> & { id: string; affinities: SignalKey[]; reversedInterpretation?: string; reversedAction?: string };
type HexagramEntry = Omit<IChingReading, "trigger"> & { affinities: SignalKey[] };

const roman = ["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"];
const clamp = (value: number) => Math.max(0, Math.min(1, value));

function major(index: number, cardName: string, affinities: SignalKey[], mysticalInterpretation: string, technicalActionable: string): TarotEntry {
  return { id: `major-${index}`, cardName, cardNumber: roman[index], suit: "major", affinities, mysticalInterpretation, technicalActionable };
}

const MAJOR_ARCANA: TarotEntry[] = [
  major(0, "The Fool", ["change", "activity", "craft"], "The first step is open, unburdened by the old map. Possibility is real, but it asks for attention.", "Prototype the smallest reversible path; name its assumptions before momentum makes them invisible."),
  major(1, "The Magician", ["craft", "activity", "change"], "The instruments are already gathered. Focus turns scattered capability into deliberate power.", "Extract the repeated capability into one clear interface and make it available to the whole system."),
  major(2, "The High Priestess", ["craft", "maintenance", "risk"], "A quiet layer of the system is asking to be listened to before it is altered.", "Read the contracts, logs, and edge cases first; treat missing knowledge as a design signal."),
  major(3, "The Empress", ["growth", "collaboration", "craft"], "The codebase has fertile ground. Care, coherence, and useful abundance are its current gifts.", "Invest in onboarding, examples, and developer experience so the system can nourish new work."),
  major(4, "The Emperor", ["stability", "scale", "maintenance"], "Order has taken root. Strong boundaries give the system a dependable place to build.", "Protect architectural seams and require new work to honor the project’s clearest conventions."),
  major(5, "The Hierophant", ["stability", "collaboration", "testing"], "Shared practice is carrying knowledge that no single file can contain.", "Codify the conventions in checks, templates, and review guidance so they outlive individual memory."),
  major(6, "The Lovers", ["collaboration", "craft", "change"], "A meaningful choice is present: alignment matters more than merely having options.", "Make the trade-off explicit and choose the dependency, abstraction, or boundary the team can maintain together."),
  major(7, "The Chariot", ["activity", "change", "scale"], "Competing forces can move in one direction when purpose is held firmly.", "Set a narrow delivery target, sequence the work, and remove side quests from the current iteration."),
  major(8, "Strength", ["risk", "maintenance", "stability"], "Gentle persistence has more power here than force. The difficult part can be contained.", "Place tests and observability around the fragile path, then improve it in small, calm increments."),
  major(9, "The Hermit", ["maintenance", "craft", "stability"], "Insight comes by stepping back from the noise and examining the system’s inner logic.", "Schedule a focused audit of one domain; leave behind a concise architectural note for future maintainers."),
  major(10, "Wheel of Fortune", ["change", "activity", "risk"], "The conditions are turning. What was stable may now require a different response.", "Make volatile dependencies and external assumptions explicit; design the next move so it remains reversible."),
  major(11, "Justice", ["testing", "risk", "stability"], "Consequences are becoming visible. The system asks for proportion, evidence, and clear accountability.", "Turn the important expectations into executable checks and use measured evidence to prioritize remediation."),
  major(12, "The Hanged Man", ["maintenance", "risk", "craft"], "Progress comes through a changed perspective, not another push in the same direction.", "Pause feature work long enough to reframe the problem, inspect constraints, and simplify the decision."),
  major(13, "Death", ["change", "maintenance", "risk"], "A former shape has completed its work. Release creates room for a more viable form.", "Delete the obsolete path deliberately, document the migration, and let the remaining interface become simpler."),
  major(14, "Temperance", ["testing", "stability", "craft"], "The system is finding balance through careful combination rather than dramatic intervention.", "Keep implementation and verification in proportion; integrate changes in small batches with fast feedback."),
  major(15, "The Devil", ["risk", "complexity", "maintenance"], "An attachment is constraining the system: a shortcut, dependency, or fear of changing a costly part.", "Name the lock-in, measure its cost, and create one escape hatch rather than accepting the constraint as fate."),
  major(16, "The Tower", ["complexity", "risk", "change"], "A structure under too much internal strain asks for deliberate renewal before disorder chooses the timing.", "Prioritize the largest and most entangled areas for decomposition; establish tests at their boundary before moving them."),
  major(17, "The Star", ["craft", "stability", "maintenance"], "After strain, a credible signal of renewal appears. The next direction can be both modest and hopeful.", "Choose a visible quality improvement that restores confidence: clarity, documentation, or one long-delayed repair."),
  major(18, "The Moon", ["risk", "complexity", "craft"], "Uncertainty is shaping perception. Not every apparent pattern is a dependable fact.", "Instrument the ambiguous behavior and verify assumptions with production evidence before changing core logic."),
  major(19, "The Sun", ["testing", "growth", "collaboration"], "The codebase is showing its work in the open. Clarity and shared confidence can grow here.", "Celebrate and preserve the practices that make behavior observable, documented, and easy to verify."),
  major(20, "Judgement", ["maintenance", "testing", "change"], "The past is calling for an honest review. A decision can now be made with more complete awareness.", "Review legacy choices against current needs, then record the decision and retire uncertainty from the backlog."),
  major(21, "The World", ["collaboration", "scale", "stability"], "Many hands orbit one shared center. Collaboration is not merely activity; it is a living perimeter.", "Clarify ownership and contribution conventions so the growing network can remain coherent as it expands."),
];

const minorRanks = [
  ["Ace", "A concentrated seed of capability is ready to be made real.", "Start with one thin, demonstrable slice."],
  ["Two", "A useful tension asks for balance rather than premature simplification.", "Compare the alternatives against one durable criterion."],
  ["Three", "Skilled perspectives can combine into work no lone contributor could hold.", "Invite a deliberate design or review partnership."],
  ["Four", "A pause can become a boundary that preserves what is already working.", "Stabilize the interface before introducing another change."],
  ["Five", "Friction has surfaced. The disagreement or loss contains information.", "Name the trade-off and reduce the exposed surface."],
  ["Six", "A reciprocal flow of support can restore movement.", "Share knowledge, remove a blocker, or simplify the handoff."],
  ["Seven", "The current gains need discernment before further investment.", "Measure outcomes and prune the effort that is not compounding."],
  ["Eight", "Deliberate repetition is turning effort into mastery.", "Standardize the successful pattern and document the craft."],
  ["Nine", "A hard-won boundary can protect a valuable achievement.", "Preserve the reliable core while preparing the next improvement."],
  ["Ten", "The current load has reached a visible limit.", "Reduce scope, split responsibility, and remove unnecessary weight."],
  ["Page", "A new signal invites curiosity, study, and a modest experiment.", "Explore with a short-lived spike rather than a permanent commitment."],
  ["Knight", "Committed motion can carry the work forward, provided direction stays clear.", "Move decisively on a bounded task and review the outcome soon."],
  ["Queen", "Mature attention makes the surrounding system more habitable.", "Improve the conditions for maintainers, collaborators, and users."],
  ["King", "Stewardship is the work now: hold the whole without losing the details.", "Set durable policy, ownership, and technical direction."],
] as const;

const minorSuits: Array<{ suit: TarotCard["suit"]; label: string; affinities: SignalKey[]; domain: string }> = [
  { suit: "wands", label: "Wands", affinities: ["activity", "change", "craft"], domain: "momentum, initiative, and creative delivery" },
  { suit: "cups", label: "Cups", affinities: ["collaboration", "stability", "craft"], domain: "trust, communication, and team connection" },
  { suit: "swords", label: "Swords", affinities: ["complexity", "risk", "testing"], domain: "reasoning, conflict, and decisive clarity" },
  { suit: "pentacles", label: "Pentacles", affinities: ["maintenance", "scale", "stability"], domain: "sustainability, resources, and dependable foundations" },
];

const MINOR_ARCANA: TarotEntry[] = minorSuits.flatMap(suit => minorRanks.map(([rank, insight, action], index) => ({
  id: `${suit.suit}-${index + 1}`,
  cardName: `${rank} of ${suit.label}`,
  cardNumber: rank === "Ace" ? "A" : index < 10 ? String(index + 1) : rank.slice(0, 1),
  suit: suit.suit,
  affinities: suit.affinities,
  mysticalInterpretation: `${insight} In the domain of ${suit.domain}, this card asks for attentive participation.`,
  technicalActionable: action,
})));

const majorReversals: Record<string, [string, string]> = {
  "The Fool": ["An unexamined leap risks becoming avoidable rework. Freedom needs one conscious boundary.", "Write down the assumption that would make the experiment unsafe, then add a small guardrail."],
  "The Magician": ["Capability is present but scattered, overextended, or being used without enough focus.", "Reduce competing abstractions and make one tool or interface the deliberate source of truth."],
  "The High Priestess": ["Important knowledge is obscured, deferred, or being mistaken for intuition.", "Replace the hunch with logs, documentation, and a concrete question that can be answered."],
  "The Empress": ["Growth is becoming excess: the system is being fed faster than it can be tended.", "Prune optional surface area and restore care to the maintainer and user experience."],
  "The Emperor": ["Structure has hardened into control, making necessary adaptation difficult.", "Loosen one outdated convention or boundary while preserving the principles it was meant to protect."],
  "The Hierophant": ["Convention is being followed without reflection, or shared practice is missing entirely.", "Revisit the rule’s purpose and encode only the practices that still serve the current system."],
  "The Lovers": ["A choice has been avoided, leaving incompatible directions entangled.", "Name the architectural fork and decide which relationship, dependency, or contract must change."],
  "The Chariot": ["Momentum is pulling in more than one direction; force alone will not create progress.", "Stop parallel drift, choose one near-term outcome, and sequence dependent work behind it."],
  "Strength": ["Patience is thinning or a fragile area is being handled with unnecessary force.", "Slow the change, strengthen tests, and restore a calm feedback loop before pushing further."],
  "The Hermit": ["Isolation has become a blind spot; insight is not reaching the people who need it.", "Share the audit, ask for a second perspective, and turn private understanding into durable documentation."],
  "Wheel of Fortune": ["Change is being treated as random fate instead of a condition that can be prepared for.", "Identify volatile dependencies and add contingencies instead of hoping the cycle turns favorably."],
  "Justice": ["The evidence and the decision are out of balance, or responsibility is being blurred.", "Define the measurable acceptance criteria and make the ownership of the risk explicit."],
  "The Hanged Man": ["The pause has become paralysis or sacrifice without new perspective.", "Set a deadline for discovery, then convert the insight into a bounded decision or experiment."],
  "Death": ["An obsolete form is being kept alive, preventing the next system from taking root.", "Commit to a deprecation date, migration path, and removal of the remaining dead branch."],
  "Temperance": ["Balance has tipped into indecision, or integration is happening without enough discipline.", "Choose the smallest coherent integration point and verify it before adding the next ingredient."],
  "The Devil": ["A shortcut, dependency, or legacy fear is exerting more control than it should.", "Make the lock-in visible and build one practical escape route instead of accepting it as permanent."],
  "The Tower": ["The warning signs are already visible, but the destabilizing work is being postponed.", "Contain the critical path immediately; decouple, test, and replace the brittle boundary before it fails under load."],
  "The Star": ["Recovery is possible, but optimism is outrunning the evidence needed to sustain it.", "Pair the renewal plan with a measurable quality signal and a modest, observable milestone."],
  "The Moon": ["Ambiguity is generating false confidence or anxiety, obscuring the actual state of the system.", "Instrument the unknown path and delay irreversible changes until the behavior is observable."],
  "The Sun": ["Visibility is exposing a gap between the story and the system’s real behavior.", "Treat the revealed discrepancy as useful feedback and bring documentation, tests, and behavior back into alignment."],
  "Judgement": ["The system is repeating an old decision without completing the review it now requires.", "Audit the legacy choice, document the new conclusion, and retire the unresolved ambiguity."],
  "The World": ["A broad collaboration field is losing coherence at its edges.", "Clarify ownership, contribution paths, and system boundaries before additional coordination cost accumulates."],
};

function reversalFor(card: TarotEntry) {
  const major = majorReversals[card.cardName];
  if (major) return { reversedInterpretation: major[0], reversedAction: major[1] };
  const suitWarning: Record<Exclude<TarotCard["suit"], "major">, string> = {
    wands: "Initiative is becoming scattered or overextended.", cups: "Communication and trust are not flowing as clearly as they appear.", swords: "Reasoning is turning into friction, avoidance, or unnecessary conflict.", pentacles: "The practical foundation is being neglected or carrying more weight than it can sustain.",
  };
  return {
    reversedInterpretation: `${suitWarning[card.suit as Exclude<TarotCard["suit"], "major">]} The card’s invitation is present, but its energy is blocked, excessive, or turned inward.`,
    reversedAction: "Reduce the immediate pressure, make the hidden constraint visible, and take one smaller action that restores healthy movement.",
  };
}

export const TAROT_DECK: TarotEntry[] = [...MAJOR_ARCANA, ...MINOR_ARCANA].map(card => ({ ...card, ...reversalFor(card) }));

type HexRow = [number, string, string, string, string, SignalKey[]];
const hexRows: HexRow[] = [
  [1, "The Creative", "乾 · Qián", "Sublime success comes through perseverance.", "Channel strong momentum into a few enduring abstractions rather than a scatter of features.", ["activity", "change", "craft"]],
  [2, "The Receptive", "坤 · Kūn", "The receptive field brings success through devoted perseverance.", "Treat this as a maintenance season: listen to small defects, user friction, and the work that supports everything else.", ["maintenance", "stability", "collaboration"]],
  [3, "Difficulty at the Beginning", "屯 · Zhūn", "Beginnings are difficult; gather support before pressing onward.", "New architecture needs scaffolding: choose a narrow path, add guardrails, and resist premature scale.", ["change", "risk", "collaboration"]],
  [4, "Youthful Folly", "蒙 · Méng", "The young learner seeks instruction; sincerity makes learning fruitful.", "Replace guesswork with examples, documentation, and feedback loops before complexity turns confusion into debt.", ["craft", "risk", "maintenance"]],
  [5, "Waiting", "需 · Xū", "Waiting with confidence brings success; cross only when conditions are ready.", "Do not force an integration or migration before dependencies, tests, and timing are genuinely prepared.", ["stability", "risk", "maintenance"]],
  [6, "Conflict", "訟 · Sòng", "In conflict, seek the great person and do not cross the great water alone.", "Surface competing technical goals early; use an explicit decision record instead of letting friction harden into architecture.", ["risk", "collaboration", "complexity"]],
  [7, "The Army", "師 · Shī", "A disciplined force needs a capable leader and shared purpose.", "Coordinate a large technical effort with clear ownership, scope, and a staged plan rather than parallel improvisation.", ["collaboration", "scale", "activity"]],
  [8, "Holding Together", "比 · Bǐ", "Seek union with what is true; those who come late meet difficulty.", "Strengthen the shared contracts and interfaces that let distributed contributors move as one system.", ["collaboration", "stability", "scale"]],
  [9, "Small Taming", "小畜 · Xiǎo Chù", "Small accumulations can restrain great force and prepare the way.", "Let incremental tests, refactors, and documentation quietly compound before attempting the major release.", ["testing", "craft", "maintenance"]],
  [10, "Treading", "履 · Lǚ", "Tread carefully near danger; conduct determines success.", "Change the sensitive path with deliberate review, narrow access, and a clear rollback plan.", ["risk", "testing", "stability"]],
  [11, "Peace", "泰 · Tài", "The small departs and the great approaches; harmony has room to grow.", "Use the calm period to simplify interfaces, strengthen documentation, and pay down quiet debt.", ["stability", "testing", "craft"]],
  [12, "Standstill", "否 · Pǐ", "Heaven and earth do not unite; preserve integrity during obstruction.", "When systems or teams are misaligned, protect core boundaries and avoid expanding the compromised path.", ["risk", "maintenance", "collaboration"]],
  [13, "Fellowship", "同人 · Tóng Rén", "Fellowship in the open brings success.", "Make collaboration visible through shared goals, transparent technical decisions, and inclusive code ownership.", ["collaboration", "activity", "scale"]],
  [14, "Great Possession", "大有 · Dà Yǒu", "Great possession succeeds through responsible conduct.", "A rich capability set needs stewardship: rationalize the surface area and keep the strongest assets coherent.", ["scale", "stability", "craft"]],
  [15, "Modesty", "謙 · Qiān", "Modesty creates success; the full is diminished and the humble is raised.", "Prefer the simplest adequate design and let evidence, not ego, determine the shape of the system.", ["craft", "maintenance", "stability"]],
  [16, "Enthusiasm", "豫 · Yù", "Enthusiasm furthers preparation and collective movement.", "Use excitement to align a bounded initiative, but turn energy into milestones before it diffuses.", ["activity", "collaboration", "change"]],
  [17, "Following", "隨 · Suí", "Following has supreme success when the direction is right.", "Adopt a useful standard or platform deliberately; retain enough agency to avoid blind dependency.", ["collaboration", "change", "stability"]],
  [18, "Work on What Has Been Spoiled", "蠱 · Gǔ", "Repairing what has decayed furthers crossing the great water.", "Audit inherited shortcuts, then renew the affected seams through visible, well-tested increments.", ["maintenance", "risk", "complexity"]],
  [19, "Approach", "臨 · Lín", "Approach brings success; prepare for the turn that follows.", "Move closer to the user, service, or fragile boundary you are changing; direct observation should shape the plan.", ["activity", "craft", "collaboration"]],
  [20, "Contemplation", "觀 · Guān", "Contemplation offers a view that inspires trust.", "Observe the whole architecture before optimizing a local symptom; trace flows, ownership, and actual usage.", ["craft", "maintenance", "complexity"]],
  [21, "Biting Through", "噬嗑 · Shì Kè", "A blockage must be bitten through for order to return.", "Identify the concrete policy, dependency, or failing boundary that is stopping progress and resolve it decisively.", ["risk", "complexity", "activity"]],
  [22, "Grace", "賁 · Bì", "Grace succeeds in small matters; form should reveal essence.", "Refine API design, naming, and interaction polish, but do not let surface beauty conceal an unresolved core problem.", ["craft", "stability", "collaboration"]],
  [23, "Splitting Apart", "剝 · Bō", "What is worn away should not be advanced blindly.", "Stop adding weight to the unstable area; preserve what is sound and plan the removal of what is failing.", ["risk", "maintenance", "complexity"]],
  [24, "Return", "復 · Fù", "Return comes after a small turning; the path is open again.", "Restore one dependable practice—tests, review, or a known-good boundary—and rebuild momentum from it.", ["maintenance", "stability", "change"]],
  [25, "Innocence", "無妄 · Wú Wàng", "Act without ulterior motive; the unexpected tests sincerity.", "Strip away speculative complexity and verify the real requirement before committing to another abstraction.", ["craft", "risk", "change"]],
  [26, "Great Taming", "大畜 · Dà Chù", "Great accumulation needs disciplined restraint and preparation.", "A powerful codebase benefits from guarded interfaces, clear ownership, and time reserved for strategic consolidation.", ["scale", "stability", "maintenance"]],
  [27, "Nourishment", "頤 · Yí", "Watch what you nourish and what nourishes you.", "Examine dependency health, contributor experience, and operational support; the system becomes what it repeatedly feeds.", ["maintenance", "craft", "collaboration"]],
  [28, "Great Preponderance", "大過 · Dà Guò", "The ridgepole bends; decisive movement is required.", "The load-bearing path is overextended. Reduce coupling and make a timely structural intervention.", ["complexity", "risk", "change"]],
  [29, "The Abysmal", "坎 · Kǎn", "Repeated depth can be crossed through sincerity and steady conduct.", "Shrink the blast radius, make failure paths explicit, and move one verified step at a time.", ["complexity", "risk", "testing"]],
  [30, "The Clinging", "離 · Lí", "Clarity depends on what it attaches to; keep the light sustained.", "Make the system observable and anchor important behavior in explicit contracts rather than intuition.", ["testing", "craft", "stability"]],
  [31, "Influence", "咸 · Xián", "Mutual influence succeeds when response is sensitive and sincere.", "Design interfaces that communicate intent clearly; small ergonomic choices can improve adoption and collaboration.", ["collaboration", "craft", "change"]],
  [32, "Duration", "恆 · Héng", "Duration succeeds through constancy, not rigidity.", "Choose sustainable conventions and automation that can endure beyond the current release cycle.", ["stability", "maintenance", "testing"]],
  [33, "Retreat", "遯 · Dùn", "Retreat is timely when the field no longer supports advance.", "De-scope the unsafe integration or brittle feature and protect the system’s ability to make a better move later.", ["risk", "maintenance", "change"]],
  [34, "Great Power", "大壯 · Dà Zhuàng", "Great power needs right action, not force for its own sake.", "Use available capacity responsibly: enforce constraints and avoid turning technical strength into avoidable churn.", ["activity", "scale", "risk"]],
  [35, "Progress", "晉 · Jìn", "Progress brings recognition when light moves outward.", "A clear, well-supported feature path can advance now; make outcomes visible and support adoption.", ["activity", "growth", "collaboration"]],
  [36, "Darkening of the Light", "明夷 · Míng Yí", "In a dark time, preserve the inner light.", "Protect essential quality practices when pressure rises; reduce exposure rather than abandoning the principles that keep the system safe.", ["risk", "maintenance", "stability"]],
  [37, "The Family", "家人 · Jiā Rén", "The household thrives through distinct roles and trustworthy conduct.", "Clarify team roles, code ownership, and the conventions that make cross-functional work dependable.", ["collaboration", "stability", "scale"]],
  [38, "Opposition", "睽 · Kuí", "Difference can reveal a necessary distinction.", "Do not erase competing needs too soon; design a boundary that lets both valid perspectives coexist.", ["collaboration", "complexity", "craft"]],
  [39, "Obstruction", "蹇 · Jiǎn", "When obstructed, turn inward and seek support.", "A hard dependency or design constraint needs a change of route; enlist expertise before forcing progress.", ["risk", "complexity", "collaboration"]],
  [40, "Deliverance", "解 · Xiè", "After tension, release brings relief and restores movement.", "Resolve the blocking incident, remove the temporary workaround, and simplify the system while the constraint is visible.", ["maintenance", "change", "risk"]],
  [41, "Decrease", "損 · Sǔn", "Decrease can bring success when it serves what matters.", "Prune scope, configuration, or dependency weight to make room for a more coherent core.", ["maintenance", "craft", "risk"]],
  [42, "Increase", "益 · Yì", "Increase furthers a great undertaking when value flows well.", "Invest where leverage is clearest: tests, automation, documentation, or a shared internal platform.", ["growth", "activity", "craft"]],
  [43, "Breakthrough", "夬 · Guài", "A decisive declaration clears what has become untenable.", "Make the difficult technical decision visible, gather support, and execute it with safeguards instead of delay.", ["change", "risk", "activity"]],
  [44, "Coming to Meet", "姤 · Gòu", "A powerful encounter should be recognized without surrendering direction.", "Evaluate the appealing new dependency or approach critically; integrate only where it aligns with the system’s long-term shape.", ["change", "risk", "craft"]],
  [45, "Gathering Together", "萃 · Cuì", "Gathering succeeds around a meaningful center.", "Bring related services, decisions, or contributors together around a clear platform boundary and shared purpose.", ["collaboration", "scale", "activity"]],
  [46, "Pushing Upward", "升 · Shēng", "Gradual ascent succeeds through modest, sustained effort.", "Compound small improvements, increase responsibility in measured steps, and let reliability grow before scale.", ["growth", "maintenance", "stability"]],
  [47, "Oppression", "困 · Kùn", "Constraint tests inner resourcefulness; words alone do not solve the pressure.", "Acknowledge the resource limit, reduce nonessential work, and protect the smallest viable path to recovery.", ["risk", "maintenance", "complexity"]],
  [48, "The Well", "井 · Jǐng", "The well is a shared source; renew its access and keep it clear.", "Maintain the foundational service, library, or documentation source that many teams rely on before polishing outer layers.", ["maintenance", "scale", "collaboration"]],
  [49, "Revolution", "革 · Gé", "Transformation succeeds when the time and case are clear.", "Make the migration case with evidence, sequence the cutover, and communicate what will change for every dependent system.", ["change", "risk", "activity"]],
  [50, "The Cauldron", "鼎 · Dǐng", "The vessel transforms raw material into something sustaining.", "Refine the platform or pipeline that turns isolated effort into reusable value for the wider organization.", ["craft", "scale", "collaboration"]],
  [51, "The Arousing", "震 · Zhèn", "Shock brings fear, then clarity, when composure returns.", "Treat the incident as a learning signal: stabilize first, then improve alerts, runbooks, and recovery boundaries.", ["risk", "testing", "maintenance"]],
  [52, "Keeping Still", "艮 · Gèn", "Stillness in the right place prevents needless motion.", "Freeze the unstable surface, document the current state, and choose one bounded change instead of many reactions.", ["stability", "maintenance", "risk"]],
  [53, "Development", "漸 · Jiàn", "Gradual development succeeds through patient sequence.", "Let adoption unfold through compatible steps, migration paths, and evidence rather than a forced leap.", ["growth", "change", "stability"]],
  [54, "The Marrying Maiden", "歸妹 · Guī Mèi", "A secondary position requires care with commitments.", "Treat the integration or extension as a guest in the system; define its limits and avoid granting premature authority.", ["change", "risk", "collaboration"]],
  [55, "Abundance", "豐 · Fēng", "At fullness, illuminate the center and act while conditions are clear.", "A high-output moment needs prioritization; concentrate attention on the core experience before complexity outruns visibility.", ["activity", "scale", "risk"]],
  [56, "The Wanderer", "旅 · Lǚ", "The traveler succeeds through modest conduct and attention to place.", "A portable module or new team member needs clear contracts, local conventions, and minimal assumptions about the host system.", ["change", "craft", "collaboration"]],
  [57, "The Gentle", "巽 · Xùn", "Gentle penetration works through repeated, respectful influence.", "Introduce the new pattern through tools, examples, and defaults that make adoption easier than resistance.", ["change", "collaboration", "craft"]],
  [58, "The Joyous", "兌 · Duì", "Open exchange brings joy when it remains sincere.", "Make feedback channels and developer experience genuinely useful; healthy dialogue exposes issues while they are still small.", ["collaboration", "craft", "stability"]],
  [59, "Dispersion", "渙 · Huàn", "What has congealed can be dispersed so that connection returns.", "Dissolve an unnecessary bottleneck, knowledge silo, or over-centralized decision path to restore flow.", ["collaboration", "change", "complexity"]],
  [60, "Limitation", "節 · Jié", "Limitation succeeds when bounds are measured, not excessive.", "Set useful rate limits, service boundaries, and scope constraints that protect quality without blocking necessary work.", ["stability", "risk", "scale"]],
  [61, "Inner Truth", "中孚 · Zhōng Fú", "Inner truth creates trust that can cross difficult water.", "Make promises verifiable through transparent metrics, reliable contracts, and communication that matches system behavior.", ["testing", "collaboration", "stability"]],
  [62, "Small Preponderance", "小過 · Xiǎo Guò", "Small matters may be undertaken; great ones should wait.", "Favor careful patch-level improvements and defer the larger redesign until evidence and capacity are aligned.", ["maintenance", "risk", "craft"]],
  [63, "After Completion", "既濟 · Jì Jì", "Completion contains the seeds of disorder; vigilance preserves success.", "A successful release now needs monitoring, documentation, and restraint so the completed path stays reliable.", ["testing", "stability", "maintenance"]],
  [64, "Before Completion", "未濟 · Wèi Jì", "Before completion, careful preparation prevents a final misstep.", "The system is close but not finished: verify edge cases, sequencing, and recovery before declaring the work done.", ["testing", "change", "risk"]],
];

export const I_CHING_HEXAGRAMS: HexagramEntry[] = hexRows.map(([number, name, chineseName, classicalText, developerInterpretation, affinities]) => ({
  number, name, chineseName, symbol: String.fromCodePoint(0x4dc0 + number - 1), classicalText, developerInterpretation, affinities,
}));

// Lines are ordered from the bottom (first) line to the top (sixth) line.
// 1 denotes yang and 0 denotes yin. This is the full King Wen mapping used to
// identify both the primary and relating hexagrams after a cast changes.
const KING_WEN_BY_PATTERN: Record<string, number> = {
  "111111": 1, "000000": 2, "100010": 3, "010001": 4, "111010": 5, "010111": 6, "010000": 7, "000010": 8,
  "111011": 9, "110111": 10, "111000": 11, "000111": 12, "101111": 13, "111101": 14, "001000": 15, "000100": 16,
  "100110": 17, "011001": 18, "110000": 19, "000011": 20, "100101": 21, "101001": 22, "000001": 23, "100000": 24,
  "100111": 25, "111001": 26, "100001": 27, "011110": 28, "010010": 29, "101101": 30, "001110": 31, "011100": 32,
  "001111": 33, "111100": 34, "000101": 35, "101000": 36, "101011": 37, "110101": 38, "001010": 39, "010100": 40,
  "110001": 41, "100011": 42, "111110": 43, "011111": 44, "000110": 45, "011000": 46, "010110": 47, "011010": 48,
  "101110": 49, "011101": 50, "100100": 51, "001001": 52, "001011": 53, "110100": 54, "101100": 55, "001101": 56,
  "011011": 57, "110110": 58, "010011": 59, "110010": 60, "110011": 61, "001100": 62, "101010": 63, "010101": 64,
};

const patternForHexagram = Object.fromEntries(Object.entries(KING_WEN_BY_PATTERN).map(([pattern, number]) => [number, pattern])) as Record<number, string>;
const linePositions = [
  ["First line", "entry conditions and the first available move"],
  ["Second line", "support, alignment, and early participation"],
  ["Third line", "friction, exposure, and the decision to cross a threshold"],
  ["Fourth line", "the boundary between inner work and the wider system"],
  ["Fifth line", "governance, leverage, and responsible stewardship"],
  ["Sixth line", "culmination, excess, completion, or release"],
] as const;

export function createSignalProfile(metrics: RepositoryMetrics): Profile {
  const architecture = metrics.architecture;
  const architectureComplexity = architecture && architecture.importEdges.length > 70 ? 0.16 : 0;
  const maintenancePressure = architecture ? Math.min(0.35, (architecture.maintenanceMarkers.todo + architecture.maintenanceMarkers.fixme + architecture.maintenanceMarkers.deprecated) / 45) : 0;
  const testCoverage = architecture ? Math.min(0.18, architecture.categoryCounts.test / Math.max(1, architecture.coverage.inspectedTextFiles)) : 0;
  return {
  activity: clamp(metrics.recentCommitCount / 24),
    growth: clamp((metrics.recentCommitCount / 26 + metrics.contributorCount / 18 + metrics.sourceFileCount / 600) / 3),
    change: clamp((metrics.recentCommitCount / 20 + metrics.complexityScore / 9) / 2),
    stability: clamp((metrics.testRatio * 1.4 + testCoverage + (metrics.complexityLevel === "low" ? 0.55 : metrics.complexityLevel === "moderate" ? 0.3 : 0.05)) / 2),
    testing: clamp(metrics.testRatio * 2.2 + testCoverage),
    complexity: clamp(metrics.complexityScore / 7 + architectureComplexity),
    risk: clamp((metrics.complexityScore / 7 + architectureComplexity + maintenancePressure + (metrics.testRatio < 0.08 ? 0.65 : 0.08)) / 2),
    collaboration: clamp(metrics.contributorCount / 16),
    scale: clamp((metrics.sourceFileCount / 500 + metrics.directoryDepth / 10) / 2),
    maintenance: clamp((1 - metrics.recentCommitCount / 30 + maintenancePressure + (metrics.testRatio < 0.12 ? 0.3 : 0.1)) / 2),
    craft: clamp((metrics.testRatio + (metrics.averageSourceFileSize < 9000 ? 0.6 : 0.2) + (metrics.directoryDepth < 6 ? 0.25 : 0)) / 2),
  };
}

function hash(value: string) { let output = 2166136261; for (let index = 0; index < value.length; index += 1) { output ^= value.charCodeAt(index); output = Math.imul(output, 16777619); } return output >>> 0; }
function relevance(affinities: SignalKey[], profile: Profile) { return affinities.reduce((score, affinity) => score + profile[affinity], 0) / affinities.length; }

function pickFrom<T extends { id?: string; number?: number; affinities: SignalKey[] }>(catalog: T[], profile: Profile, seed: string, excluded: Set<string> = new Set()): T {
  const ranked = catalog
    .filter(entry => !excluded.has(entry.id ?? String(entry.number)))
    .map(entry => ({ entry, score: relevance(entry.affinities, profile) }))
    .sort((first, second) => second.score - first.score || (entryKey(first.entry) > entryKey(second.entry) ? 1 : -1));
  const meaningfulPool = ranked.filter(item => item.score >= Math.max(ranked[0]?.score ?? 0, 0) - 0.18).slice(0, 18);
  return meaningfulPool[hash(seed) % meaningfulPool.length]?.entry ?? ranked[0].entry;
}
function entryKey(entry: { id?: string; number?: number }) { return entry.id ?? String(entry.number); }

function evidenceFor(position: string, metrics: RepositoryMetrics) {
  if (position === "Foundation") return `${metrics.contributorCount} contributor${metrics.contributorCount === 1 ? "" : "s"}, ${metrics.testFileCount} recognizable test file${metrics.testFileCount === 1 ? "" : "s"}, and ${metrics.complexityLevel} structural complexity form the foundation signal.`;
  if (position === "The Fracture") return metrics.complexitySignals.slice(0, 2).join(" ");
  return `${metrics.recentCommitCount} commits in the past 30 days and ${metrics.averageCommitsPerWeek} commits per week reveal the system’s current direction.`;
}

function drawOrientation(entry: TarotEntry, position: string, metrics: RepositoryMetrics): TarotCard["orientation"] {
  const profile = createSignalProfile(metrics);
  const pressure = profile.risk * .34 + profile.complexity * .2 + profile.maintenance * .12 + (1 - profile.testing) * .22 + (position === "The Fracture" ? .22 : position === "The Passage" ? .07 : -.08);
  const deterministicThreshold = hash(`${metrics.repositoryUrl}:${entry.id}:${position}:orientation`) % 100;
  return pressure >= .56 || deterministicThreshold < Math.round(pressure * 34) ? "reversed" : "upright";
}

function orientationEvidence(orientation: TarotCard["orientation"], position: string, metrics: RepositoryMetrics) {
  if (orientation === "upright") return `Upright: ${position.toLowerCase()} signals are expressing this archetype with sufficient support and clarity.`;
  if (position === "The Fracture") return `Reversed: high pressure is blocking the card’s healthy expression; complexity is ${metrics.complexityLevel} and the test signal is ${Math.round(metrics.testRatio * 100)}%.`;
  return `Reversed: the repository’s current risk, maintenance, and feedback signals indicate this archetype is constrained, excessive, or turned inward.`;
}

function toDraw(entry: TarotEntry, position: string, metrics: RepositoryMetrics): TarotCard {
  const orientation = drawOrientation(entry, position, metrics);
  const isReversed = orientation === "reversed";
  return {
    cardName: entry.cardName, cardNumber: entry.cardNumber, suit: entry.suit,
    mysticalInterpretation: isReversed ? entry.reversedInterpretation ?? entry.mysticalInterpretation : entry.mysticalInterpretation,
    technicalActionable: isReversed ? entry.reversedAction ?? entry.technicalActionable : entry.technicalActionable,
    position, metricTrigger: evidenceFor(position, metrics), orientation, orientationEvidence: orientationEvidence(orientation, position, metrics),
  };
}

export function drawCompleteTarot(metrics: RepositoryMetrics): TarotCard[] {
  const profile = createSignalProfile(metrics);
  const used = new Set<string>();
  const foundationEntry = metrics.contributorCount >= 8 ? TAROT_DECK.find(card => card.cardName === "The World")! : pickFrom(TAROT_DECK, profile, `${metrics.repositoryUrl}:foundation`);
  used.add(foundationEntry.id);
  const fractureEntry = metrics.complexityLevel === "high" ? TAROT_DECK.find(card => card.cardName === "The Tower")! : pickFrom(TAROT_DECK, { ...profile, complexity: Math.max(profile.complexity, .68), risk: Math.max(profile.risk, .62) }, `${metrics.repositoryUrl}:fracture`, used);
  used.add(fractureEntry.id);
  const passageEntry = pickFrom(TAROT_DECK, { ...profile, activity: Math.max(profile.activity, .48), change: Math.max(profile.change, .42) }, `${metrics.repositoryUrl}:passage`, used);
  return [toDraw(foundationEntry, "Foundation", metrics), toDraw(fractureEntry, "The Fracture", metrics), toDraw(passageEntry, "The Passage", metrics)];
}

export function selectCompleteHexagram(metrics: RepositoryMetrics): IChingReading {
  const profile = createSignalProfile(metrics);
  const pinned = metrics.complexityLevel === "high" && metrics.testRatio < 0.1 ? 29
    : metrics.recentCommitCount >= 14 ? 1
      : metrics.testRatio >= 0.18 && metrics.complexityLevel !== "high" ? 11
        : metrics.recentCommitCount <= 3 ? 2
          : undefined;
  const chosen = pinned ? I_CHING_HEXAGRAMS.find(hexagram => hexagram.number === pinned)! : pickFrom(I_CHING_HEXAGRAMS, profile, `${metrics.repositoryUrl}:hexagram`);
  return { number: chosen.number, name: chosen.name, chineseName: chosen.chineseName, symbol: chosen.symbol, classicalText: chosen.classicalText, developerInterpretation: chosen.developerInterpretation, trigger: `${chosen.name} was selected from the full 64-hexagram system using the repository’s activity, complexity, collaboration, test, scale, and maintenance signals.` };
}

function lineInterpretation(line: number, value: IChingLineValue, primary: HexagramEntry, relating: HexagramEntry | undefined) {
  const [positionName, domain] = linePositions[line - 1];
  const changing = value === 6 || value === 9;
  const polarity = value === 6 || value === 8 ? "yin" : "yang";
  if (!changing) return `${positionName} is stable ${polarity}. In ${primary.name}, this holds the theme of ${domain}; let the existing pattern do its work before introducing a larger intervention.`;
  const direction = value === 6 ? "receptivity becoming assertion" : "assertion becoming receptivity";
  const destination = relating ? ` It contributes to the relating hexagram, ${relating.number}. ${relating.name}.` : "";
  return `${positionName} is changing: ${polarity}, at an extreme, turns from ${direction}. In repository terms, ${domain} is the active hinge; make the transition intentionally rather than treating it as background noise.${destination}`;
}

export function castCompleteIChing(metrics: RepositoryMetrics, primaryReading = selectCompleteHexagram(metrics)): IChingReading {
  const primary = I_CHING_HEXAGRAMS.find(hexagram => hexagram.number === primaryReading.number)!;
  const primaryPattern = patternForHexagram[primary.number];
  const profile = createSignalProfile(metrics);
  const movementChance = Math.round((0.08 + profile.change * 0.16 + profile.risk * 0.16 + profile.maintenance * 0.06) * 100);
  const rawLines = primaryPattern.split("").map((bit, index) => {
    const isYang = bit === "1";
    const moves = hash(`${metrics.repositoryUrl}:${metrics.repositoryCreatedAt}:${primary.number}:line:${index + 1}`) % 100 < movementChance;
    return (moves ? (isYang ? 9 : 6) : (isYang ? 7 : 8)) as IChingLineValue;
  });
  const changedPattern = rawLines.map(value => value === 6 ? "1" : value === 9 ? "0" : value === 7 ? "1" : "0").join("");
  const changingLineNumbers = rawLines.flatMap((value, index) => value === 6 || value === 9 ? [index + 1] : []);
  const relatingNumber = KING_WEN_BY_PATTERN[changedPattern];
  const relating = changingLineNumbers.length ? I_CHING_HEXAGRAMS.find(hexagram => hexagram.number === relatingNumber) : undefined;
  const lines: IChingLine[] = rawLines.map((value, index) => ({
    position: index + 1,
    positionName: linePositions[index][0],
    value,
    polarity: value === 6 || value === 8 ? "yin" : "yang",
    changing: value === 6 || value === 9,
    interpretation: lineInterpretation(index + 1, value, primary, relating),
  }));
  const cast: IChingCast = {
    method: "deterministic repository casting",
    mode: changingLineNumbers.length ? "changing" : "static",
    lines,
    changingLineNumbers,
    relatingHexagram: relating ? { number: relating.number, name: relating.name, chineseName: relating.chineseName, symbol: relating.symbol, developerInterpretation: relating.developerInterpretation } : undefined,
    transformationSummary: changingLineNumbers.length
      ? `Lines ${changingLineNumbers.join(", ")} are active. ${primary.number}. ${primary.name} is changing toward ${relating!.number}. ${relating!.name}; read the primary as the present pattern and the relating hexagram as the direction shaped by the active lines.`
      : `All six lines are stable. ${primary.number}. ${primary.name} is a static reading: its present pattern is the primary counsel, without a relating hexagram taking precedence.`,
  };
  return { ...primaryReading, cast, trigger: `${primaryReading.trigger} ${cast.transformationSummary}` };
}
