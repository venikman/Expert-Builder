import { test, expect } from "bun:test"
import { cn } from "./utils"

test("cn filters falsy inputs", () => {
  expect(cn("a", false && "b", undefined, null, "c")).toBe("a c")
})

test("cn merges conflicting Tailwind classes", () => {
  expect(cn("p-2", "p-3")).toBe("p-3")
})
