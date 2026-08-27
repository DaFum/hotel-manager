import { expect, it } from "vitest";
import { adoptionCostMinor, advanceTechnologyProject } from "./adoption";
it("makes mature technology cheaper and completes implementation", () => {
  expect(adoptionCostMinor(10_000_000, 8000)).toBeLessThan(
    adoptionCostMinor(10_000_000, 1000),
  );
  expect(
    advanceTechnologyProject({
      id: "p",
      technologyId: "t",
      status: "implementing",
      remainingMonths: 1,
      costMinor: 1,
    }).status,
  ).toBe("complete");

  expect(() =>
    advanceTechnologyProject({
      id: "bad",
      technologyId: "internet",
      status: "implementing",
      remainingMonths: -1,
      costMinor: 1,
    }),
  ).toThrow(/remaining project months/);
});

it("keeps neutral project progress and completes sooner at higher speed", () => {
  const project = {
    id: "p",
    technologyId: "t",
    status: "implementing" as const,
    remainingMonths: 2,
    costMinor: 1,
  };
  expect(advanceTechnologyProject(project, 10_000)).toEqual(
    advanceTechnologyProject(project),
  );
  expect(advanceTechnologyProject(project, 20_000).status).toBe("complete");
  expect(advanceTechnologyProject(project, 5_000).remainingMonths).toBe(2);
});
