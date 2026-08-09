import { expect, it } from "vitest";
import {
  conferenceEffect,
  delayedEffect,
  FEEDBACK_DELAY_MONTHS,
} from "./feedback";

it("has diminishing returns", () => {
  expect(conferenceEffect(1000) - conferenceEffect(500)).toBeLessThan(
    conferenceEffect(500),
  );
});

it("saturates rather than growing without bound", () => {
  expect(conferenceEffect(0)).toBe(0);
  expect(conferenceEffect(1_000_000)).toBeLessThanOrEqual(1000);
  expect(conferenceEffect(-500)).toBe(0);
});

it("makes the city feel a new capacity only after the delay", () => {
  const pipeline = Array(FEEDBACK_DELAY_MONTHS).fill(0);
  const { applied, pipeline: next } = delayedEffect(pipeline, 900);
  // The month it is built, the city has felt nothing yet.
  expect(applied).toBe(0);
  let carried = next;
  let last = 0;
  for (let month = 1; month <= FEEDBACK_DELAY_MONTHS; month++) {
    const step = delayedEffect(carried, 0);
    carried = step.pipeline;
    last = step.applied;
  }
  expect(last).toBe(900);
});

it("keeps the pipeline the same length so it cannot grow forever", () => {
  let pipeline = Array(FEEDBACK_DELAY_MONTHS).fill(0);
  for (let month = 0; month < 200; month++)
    pipeline = delayedEffect(pipeline, month).pipeline;
  expect(pipeline.length).toBe(FEEDBACK_DELAY_MONTHS);
});

it("rejects an effect that is not a finite number", () => {
  expect(() =>
    delayedEffect(Array(FEEDBACK_DELAY_MONTHS).fill(0), Number.NaN),
  ).toThrow(/effect/);
});
