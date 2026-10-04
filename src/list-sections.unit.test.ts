import { describe, expect, it } from "vitest";
import { sectionOf } from "./list-sections";

const lists = { include: ["inc", "both"], exclude: ["exc", "both"] };
const open = new Set(["inc", "exc", "win"]);

describe("sectionOf", () => {
  it("puts excluded applications in Excluded, open or not", () => {
    expect(sectionOf("exc", lists, open)).toBe("Excluded");
  });

  it("puts included applications in Included, open or not", () => {
    expect(sectionOf("inc", lists, open)).toBe("Included");
    expect(sectionOf("inc", lists, new Set())).toBe("Included");
  });

  it("lets exclude win when an application is on both lists", () => {
    expect(sectionOf("both", lists, open)).toBe("Excluded");
  });

  it("puts an unlisted application with a window in Open Now", () => {
    expect(sectionOf("win", lists, open)).toBe("Open Now");
  });

  it("puts any other application in Other", () => {
    expect(sectionOf("idle", lists, open)).toBe("Other");
  });
});
