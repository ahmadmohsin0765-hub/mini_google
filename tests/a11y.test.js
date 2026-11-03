import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { JSDOM } from "jsdom";
import axe from "axe-core";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("Accessibility: axe-core audit on index.html with rendered results", async () => {
  const htmlContent = fs.readFileSync(path.join(__dirname, "../index.html"), "utf-8");

  const dom = new JSDOM(htmlContent, {
    runScripts: "dangerously",
    resources: "usable",
    url: "http://localhost:3000/"
  });

  const { window } = dom;

  // Run axe audit
  const results = await axe.run(window.document.documentElement, {
    runOnly: {
      type: "tag",
      values: ["wcag2a", "wcag2aa", "best-practice"]
    }
  });

  // Filter out any critical or serious violations
  const criticalViolations = results.violations.filter(
    v => v.impact === "critical" || v.impact === "serious"
  );

  if (criticalViolations.length > 0) {
    console.error("Accessibility Violations Found:", JSON.stringify(criticalViolations, null, 2));
  }

  assert.equal(
    criticalViolations.length,
    0,
    `Found ${criticalViolations.length} critical/serious accessibility violations`
  );
});

