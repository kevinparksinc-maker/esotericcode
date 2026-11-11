import type { IChingReading, RepositoryMetrics, TarotCard } from "@shared/esoteric";

/** Gemini synthesizes the computed evidence; it never changes the cards or metrics. */
export async function synthesizeReadingWithGemini(
  metrics: RepositoryMetrics,
  tarot: TarotCard[],
  iching: IChingReading,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim();
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured on the server.");

  const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash-lite";
  if (!/^[a-zA-Z0-9._-]+$/.test(model)) throw new Error("Invalid GEMINI_MODEL.");

  const evidence = {
    repository: { name: metrics.name, owner: metrics.owner, description: metrics.description,
      languages: metrics.languages, files: metrics.fileCount, sourceFiles: metrics.sourceFileCount,
      tests: metrics.testFileCount, testRatio: metrics.testRatio,
      complexity: metrics.complexityLevel, complexitySignals: metrics.complexitySignals,
      commitsLast30Days: metrics.recentCommitCount, contributors: metrics.contributorCount },
    architecture: metrics.architecture ? {
      summary: metrics.architecture.unifiedSummary,
      coverage: metrics.architecture.coverage,
      modules: metrics.architecture.moduleSummaries,
      entryPoints: metrics.architecture.entryPoints,
      maintenance: metrics.architecture.maintenanceMarkers
    } : null,
    tarot: tarot.map(card => ({
      position: card.position, card: card.cardName, orientation: card.orientation,
      trigger: card.metricTrigger, meaning: card.mysticalInterpretation,
      action: card.technicalActionable
    })),
    iching: { number: iching.number, name: iching.name, meaning: iching.developerInterpretation,
      trigger: iching.trigger, changingLines: iching.cast?.changingLineNumbers },
    kp: metrics.kpChart ? {
      house: metrics.kpChart.activeHouse, nakshatra: metrics.kpChart.nakshatra,
      starLord: metrics.kpChart.starLord, subLord: metrics.kpChart.subLord,
      significators: metrics.kpChart.significators, synthesis: metrics.kpChart.synthesis
    } : null
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text:
            "You are EsotericCode's repository reading synthesizer. Explain observed software engineering evidence through the explicitly supplied Tarot, I Ching and KP symbolic correspondences. Address the developer in second person. Be incisive, practical, specific and readable. Treat the symbolic interpretations as metaphor, never a scientific measurement. Do not invent files, problems, performance data, or astrological facts. Respect all methods and reconcile them into one cohesive reading. Give concrete recommendations grounded in evidence; distinguish observations from symbolic analogy. Return 2-4 substantial paragraphs only." }] },
          contents: [{ role: "user", parts: [{ text: JSON.stringify(evidence) }] }],
          generationConfig: { maxOutputTokens: 950, temperature: 0.55 }
        })
      }
    );
    if (!response.ok) throw new Error(`Gemini HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);
    const json = await response.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    };
    const narrative = json.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("").trim();
    if (!narrative) throw new Error("Gemini returned no readable narrative.");
    return narrative;
  } finally {
    clearTimeout(timeout);
  }
}

/** Keep deterministic reading available if the provider is unconfigured or fails. */
export async function enhanceDivinationNarrative(
  metrics: RepositoryMetrics,
  divination: { tarot: TarotCard[]; iching: IChingReading; narrative: string },
): Promise<typeof divination> {
  if (!process.env.GEMINI_API_KEY?.trim() && !process.env.GOOGLE_API_KEY?.trim()) {
    console.warn("Gemini not configured: using computed repository reading.");
    return divination;
  }
  try {
    const narrative = await synthesizeReadingWithGemini(metrics, divination.tarot, divination.iching);
    return { ...divination, narrative };
  } catch (error) {
    console.error("Gemini synthesis failed; retaining computed reading:", error instanceof Error ? error.message : String(error));
    return divination;
  }
}


/** One small private startup probe; never logs credentials or model output. */
export async function verifyGeminiOnStartup(): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim();
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash-lite";
  if (!apiKey) {
    console.error("[Gemini verification] FAILED: GEMINI_API_KEY missing");
    return;
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(model)) {
    console.error("[Gemini verification] FAILED: invalid model identifier");
    return;
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    let response: Response;
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "Reply with OK." }] }], generationConfig: { maxOutputTokens: 30 } }),
          signal: controller.signal,
        },
      );
    } finally {
      clearTimeout(timeout);
    }
    if (!response.ok) {
      console.error(`[Gemini verification] FAILED: HTTP ${response.status} model=${model}`);
      await response.body?.cancel();
      return;
    }
    const parsed = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const hasText = Boolean(parsed.candidates?.[0]?.content?.parts?.some(p => typeof p.text === "string" && p.text.trim()));
    console.info(`[Gemini verification] ${hasText ? "SUCCESS" : "FAILED: no text"} model=${model}`);
  } catch (error) {
    console.error(`[Gemini verification] FAILED: ${error instanceof Error && error.name === "AbortError" ? "timeout" : "network error"}`);
  }
}
