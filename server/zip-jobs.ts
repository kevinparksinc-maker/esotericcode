import { randomUUID } from "node:crypto";
import { extractUploadedZipMetrics } from "./esoteric";
import { createDivination } from "./esoteric";
import { enhanceDivinationNarrative } from "./gemini-synthesis";
import { ZIP_UPLOAD_LIMIT } from "./repository-analysis";

type Job = { state: "queued" | "running" | "completed" | "failed"; createdAt: number; updatedAt: number; message: string; result?: unknown; error?: string };
const jobs = new Map<string, Job>();
const MAX_ACTIVE_JOBS = 1;
let active = 0;
const queue: Array<{ id: string; name: string; archive: Buffer }> = [];
function cleanup() {
  jobs.forEach((job, id) => { if (Date.now() - job.updatedAt > 2 * 60 * 60 * 1000) jobs.delete(id); });
}
function drain() {
  while (active < MAX_ACTIVE_JOBS && queue.length) {
    const next = queue.shift()!;
    const job = jobs.get(next.id);
    if (!job) continue;
    active++;
    job.state = "running"; job.updatedAt = Date.now(); job.message = "Inspecting repository files locally (no Gemini calls).";
    void (async () => {
      try {
        const metrics = await extractUploadedZipMetrics(next.name, next.archive);
        job.message = "Local scan complete. Gemini is interpreting the evidence for the final reading.";
        const divination = await enhanceDivinationNarrative(metrics, createDivination(metrics));
        job.result = { id: 0, createdAt: new Date(), isShared: false, shareSlug: "", metrics, tarot: divination.tarot, iching: divination.iching, narrative: divination.narrative };
        job.state = "completed"; job.message = "Reading complete.";
      } catch (error) {
        job.state = "failed";
        job.error = error instanceof Error ? error.message : "Unknown analysis error.";
        job.message = "Reading failed.";
      } finally { job.updatedAt = Date.now(); active--; drain(); }
    })();
  }
}
export function startZipJob(fileName: string, archiveBase64: string) {
  cleanup();
  const archive = Buffer.from(archiveBase64, "base64");
  if (!archive.length || archive.length > ZIP_UPLOAD_LIMIT || archive[0] !== 0x50 || archive[1] !== 0x4b) throw new Error("Upload a valid ZIP file no larger than 12 MB.");
  if (queue.length >= 3) throw new Error("The analysis queue is full. Please try again later.");
  const id = randomUUID();
  jobs.set(id, { state: "queued", createdAt: Date.now(), updatedAt: Date.now(), message: "Queued for full source-code analysis." });
  queue.push({ id, name: fileName.replace(/[^A-Za-z0-9._-]/g, "_"), archive });
  drain();
  return { jobId: id };
}
export function getZipJob(id: string) {
  cleanup();
  const job = jobs.get(id);
  if (!job) throw new Error("Analysis job expired or the server restarted. Please submit the ZIP again.");
  return { state: job.state, message: job.message, result: job.result, error: job.error };
}
