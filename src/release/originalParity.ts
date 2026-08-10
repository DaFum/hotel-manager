export const VERIFIED_ORIGINAL_TERMS = [
  "STELLEN",
  "SERVICE",
  "BANK",
  "WERBUNG",
  "HOTELS",
  "PREISE",
  "VERSICHERUNG",
  "VERTRAG",
  "ZEITUNG",
  "RENOV",
  "BANKROTT",
  "POOL",
] as const;

export type VerifiedOriginalTerm = (typeof VERIFIED_ORIGINAL_TERMS)[number];

export function isVerifiedOriginalTerm(
  value: string,
): value is VerifiedOriginalTerm {
  return (VERIFIED_ORIGINAL_TERMS as readonly string[]).includes(value);
}
