import { assertScore } from "../domain/units";

/**
 * Somebody the company knows by role and record rather than as a headcount.
 * A key person is the same person for decades: the receptionist hired in 1991
 * can be running the house in 2004, and the history says how they got there.
 *
 * There is no display name here. Staff are identified by `staffId`; what the
 * player reads is resolved at the presentation edge.
 */
export interface KeyPerson {
  id: string;
  staffId: string;
  role: string;
  /** 0-100, earned by doing the job. */
  experience: number;
  /** 0-100, what a promotion actually needs. */
  leadership: number;
  /** Months in the current role; the reason experience moves at all. */
  monthsInRole: number;
  /**
   * Whether they are still on the payroll. Somebody who leaves keeps their
   * record: a career is what the company remembers, not who is rostered today.
   */
  active: boolean;
  careerHistory: Array<{ role: string; dateKey: string }>;
}

const LADDER: Record<
  string,
  { next: string; experience: number; leadership: number }
> = {
  receptionist: {
    next: "front-office-manager",
    experience: 70,
    leadership: 60,
  },
  "front-office-manager": {
    next: "hotel-director",
    experience: 85,
    leadership: 75,
  },
};

export function eligiblePromotions(
  person: Pick<KeyPerson, "role" | "experience" | "leadership">,
): string[] {
  assertScore(person.experience, "experience");
  assertScore(person.leadership, "leadership");
  const step = LADDER[person.role];
  if (!step) return [];
  return person.experience >= step.experience &&
    person.leadership >= step.leadership
    ? [step.next]
    : [];
}

export function promote(
  person: KeyPerson,
  role: string,
  dateKey: string,
): KeyPerson {
  if (!eligiblePromotions(person).includes(role))
    throw new Error("promotion requirements not met");
  return {
    ...person,
    role,
    monthsInRole: 0,
    careerHistory: [...person.careerHistory, { role, dateKey }],
  };
}
