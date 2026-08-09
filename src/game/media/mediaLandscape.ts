export interface MediaLandscape {
  localPress: number;
  travelGuides: number;
  television: number;
  wordOfMouth: number;
  reviewSites: number;
  socialMedia: number;
}
export function incidentReach(
  media: Partial<MediaLandscape>,
  severity: number,
): number {
  const multiplier =
    (media.localPress ?? 0) +
    (media.travelGuides ?? 0) +
    (media.television ?? 0) +
    (media.wordOfMouth ?? 0) +
    Math.trunc((media.reviewSites ?? 0) * 1.5) +
    Math.trunc((media.socialMedia ?? 0) * 2);
  return Math.trunc((Math.max(0, severity) * multiplier) / 10_000);
}
export function mediaFromAdoption(
  reviewSites: number,
  socialMedia: number,
): MediaLandscape {
  return {
    localPress: 6000,
    travelGuides: 4000,
    television: 5000,
    wordOfMouth: 7000,
    reviewSites: clamp(reviewSites),
    socialMedia: clamp(socialMedia),
  };
}
const clamp = (n: number) => Math.max(0, Math.min(10_000, n));
