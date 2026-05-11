export type PracticeProgressDrill = {
  duration?: number | null;
  name?: string;
  segment?: string;
};

export type PracticeProgressSegment = {
  startPercent: number;
  widthPercent: number;
  fillPercent: number;
  isActive: boolean;
  segment?: string;
  name?: string;
  duration: number;
};

type PracticeProgressParams<TDrill extends PracticeProgressDrill> = {
  drillSequence: TDrill[];
  elapsedPracticeMilliseconds: number;
  totalDurationMilliseconds: number;
  currentDrillIndex: number;
};

const clampPercent = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
};

const getSafeDurationMinutes = (duration: number | null | undefined) => {
  const safeDuration = Number(duration) || 0;
  return Math.max(0, safeDuration);
};

export const getPracticeProgressSegments = <TDrill extends PracticeProgressDrill>({
  drillSequence,
  elapsedPracticeMilliseconds,
  totalDurationMilliseconds,
  currentDrillIndex,
}: PracticeProgressParams<TDrill>): PracticeProgressSegment[] => {
  const safeElapsedMilliseconds = Math.max(0, Number(elapsedPracticeMilliseconds) || 0);
  const safeTotalDurationMilliseconds = Math.max(0, Number(totalDurationMilliseconds) || 0);
  let elapsedMillisecondsBeforeSegment = 0;

  return drillSequence.map((drill, index) => {
    const duration = getSafeDurationMinutes(drill.duration);
    const drillDurationMilliseconds = duration * 60 * 1000;
    const elapsedMillisecondsAtSegmentStart = elapsedMillisecondsBeforeSegment;
    const startPercent = safeTotalDurationMilliseconds > 0
      ? clampPercent((elapsedMillisecondsAtSegmentStart / safeTotalDurationMilliseconds) * 100)
      : 0;
    const elapsedMillisecondsInSegment = Math.max(
      0,
      Math.min(
        safeElapsedMilliseconds - elapsedMillisecondsAtSegmentStart,
        drillDurationMilliseconds
      )
    );

    elapsedMillisecondsBeforeSegment += drillDurationMilliseconds;

    return {
      startPercent,
      widthPercent: safeTotalDurationMilliseconds > 0
        ? clampPercent((drillDurationMilliseconds / safeTotalDurationMilliseconds) * 100)
        : 0,
      fillPercent: drillDurationMilliseconds > 0
        ? clampPercent((elapsedMillisecondsInSegment / drillDurationMilliseconds) * 100)
        : 0,
      isActive: index === currentDrillIndex,
      segment: drill.segment,
      name: drill.name,
      duration,
    };
  });
};
