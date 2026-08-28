import { expect, it } from "vitest";
import { freshState } from "../test/fixtures";
import { orderForPosition } from "./reorder";

it("computes one-target ranks for adjacent and boundary moves", () => {
  const state = freshState();
  expect(orderForPosition(state, "headline", "earlier")).toBe(-1);
  expect(orderForPosition(state, "headline", "later")).toBe(2.5);
  expect(orderForPosition(state, "headline", "first")).toBe(-1);
  expect(orderForPosition(state, "headline", "last")).toBe(5);
});

it("returns null at sibling boundaries and for the root", () => {
  const state = freshState();
  expect(orderForPosition(state, "eyebrow", "earlier")).toBeNull();
  expect(orderForPosition(state, "services", "later")).toBeNull();
  expect(orderForPosition(state, "page", "first")).toBeNull();
});
