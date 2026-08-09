export interface KeyPerson {
  id: string;
  name: string;
  role: string;
  experience: number;
  leadership: number;
  careerHistory: Array<{ role: string; dateKey: string }>;
}
export function eligiblePromotions(
  person: Pick<KeyPerson, "role" | "experience" | "leadership">,
): string[] {
  const out: string[] = [];
  if (
    person.role === "receptionist" &&
    person.experience >= 70 &&
    person.leadership >= 60
  )
    out.push("front-office-manager");
  if (
    person.role === "front-office-manager" &&
    person.experience >= 85 &&
    person.leadership >= 75
  )
    out.push("hotel-director");
  return out;
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
    careerHistory: [...person.careerHistory, { role, dateKey }],
  };
}
