export type ArchitectureObservationIdentity = {
  module: string;
  summary: string;
};

/**
 * Gives repeated module summaries distinct React identities while remaining
 * stable for the same ordered architecture-analysis result.
 */
export function getArchitectureObservationKey(
  observation: ArchitectureObservationIdentity,
  index: number,
) {
  return `${observation.module}-${observation.summary}-${index}`;
}
