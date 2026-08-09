import { assertCount } from "../domain/units";

/**
 * How far news about the hotel travels. In 1991 that is the local paper and
 * word of mouth; once review sites and social media exist the same incident
 * reaches far more people, which is why a mistake gets more expensive over the
 * decades without the mistake itself changing.
 *
 * Every channel is a 0..10_000 basis-point reach.
 */
export interface MediaLandscape {
  localPress: number;
  travelGuides: number;
  television: number;
  wordOfMouth: number;
  reviewSites: number;
  socialMedia: number;
}

export const MEDIA_CHANNELS = [
  "localPress",
  "travelGuides",
  "television",
  "wordOfMouth",
  "reviewSites",
  "socialMedia",
] as const;

/** Digital channels carry the same story further than print ever did. */
const AMPLIFICATION: Record<keyof MediaLandscape, number> = {
  localPress: 10,
  travelGuides: 10,
  television: 10,
  wordOfMouth: 10,
  reviewSites: 15,
  socialMedia: 20,
};

export function incidentReach(
  media: Partial<MediaLandscape>,
  severity: number,
): number {
  assertCount(severity, "incident severity");
  let multiplier = 0;
  for (const channel of MEDIA_CHANNELS)
    multiplier += Math.trunc(
      (channelReach(media[channel] ?? 0, channel) * AMPLIFICATION[channel]) /
        10,
    );
  return Math.trunc((severity * multiplier) / 10_000);
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
    reviewSites: channelReach(reviewSites, "reviewSites"),
    socialMedia: channelReach(socialMedia, "socialMedia"),
  };
}

/**
 * Normalises one channel into range. A fractional or non-finite reach is a
 * corrupt input rather than a quiet zero, so it is refused here instead of
 * turning the whole multiplier into NaN further down.
 */
function channelReach(value: number, label: string): number {
  if (!Number.isSafeInteger(value))
    throw new Error(`invalid media reach for ${label}`);
  return Math.max(0, Math.min(10_000, value));
}
