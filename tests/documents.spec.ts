import { expect, test } from "@playwright/test";
import {
  confirmDeleteDocument,
  DOC_PREFIX,
  docKeyCount,
  docSelect,
  docTitles,
  expectPersisted,
  LEGACY_KEY,
  LIBRARY_KEY,
  newPrdButton,
  productField,
  seedLegacyDraft,
  summaryField,
} from "./helpers";

test.describe("document library", () => {
  test("a draft saved before the library existed is adopted, not lost", async ({
    page,
  }) => {
    // Seeded before the app's first script runs; migration happens on load.
    await seedLegacyDraft(page, "Legacy Product");
    await page.goto("/");

    await expect(productField(page)).toHaveValue("Legacy Product");
    expect(await docTitles(page)).toEqual(["Legacy Product"]);
    expect(await docKeyCount(page)).toBe(1);

    // The old shared key is retired only once the new copy exists.
    const [legacy, library] = await page.evaluate(
      ([legacyKey, libraryKey]) =>
        [
          localStorage.getItem(legacyKey),
          localStorage.getItem(libraryKey),
        ] as const,
      [LEGACY_KEY, LIBRARY_KEY] as const
    );
    expect(legacy).toBeNull();
    expect(library).not.toBeNull();

    // The migrated content survives a reload, and is not migrated twice.
    await page.reload();
    await expect(productField(page)).toHaveValue("Legacy Product");
    expect(await docKeyCount(page)).toBe(1);
  });

  test("starting a second PRD leaves the first one intact", async ({
    page,
  }) => {
    await page.goto("/");

    await productField(page).fill("Product Alpha");
    await summaryField(page).fill("ALPHA-SUMMARY-TEXT");
    await expectPersisted(page, "ALPHA-SUMMARY-TEXT");

    await newPrdButton(page).click();

    // A new document must not inherit the previous one's content.
    await expect(summaryField(page)).toHaveValue("");
    await expect(productField(page)).toHaveValue("");

    await productField(page).fill("Product Beta");
    await summaryField(page).fill("BETA-SUMMARY-TEXT");
    await expectPersisted(page, "BETA-SUMMARY-TEXT");

    await expect
      .poll(() => docTitles(page))
      .toEqual(expect.arrayContaining(["Product Alpha", "Product Beta"]));

    // Switching back is the assertion the original bug would have failed.
    await docSelect(page).selectOption({ label: "Product Alpha" });
    await expect(summaryField(page)).toHaveValue("ALPHA-SUMMARY-TEXT");

    await docSelect(page).selectOption({ label: "Product Beta" });
    await expect(summaryField(page)).toHaveValue("BETA-SUMMARY-TEXT");

    // And the document you were editing is the one you come back to.
    await page.reload();
    await expect(summaryField(page)).toHaveValue("BETA-SUMMARY-TEXT");
  });

  test("a document is named by its product field", async ({ page }) => {
    await page.goto("/");
    expect(await docTitles(page)).toEqual(["Untitled PRD"]);

    await productField(page).fill("Renamed Live");
    await expect.poll(() => docTitles(page)).toEqual(["Renamed Live"]);
  });

  test("importing a .json adds a document instead of overwriting the open one", async ({
    page,
  }) => {
    await page.goto("/");
    await productField(page).fill("Keep Me");
    await expectPersisted(page, "Keep Me");

    await page.locator('input[type="file"]').setInputFiles({
      name: "imported.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({
          version: 1,
          meta: {
            product: "Imported Doc",
            author: "",
            date: "",
            status: "Draft",
          },
          answers: {},
          contacts: [{ name: "", role: "", comment: "" }],
        })
      ),
    });

    await expect
      .poll(() => docTitles(page))
      .toEqual(expect.arrayContaining(["Keep Me", "Imported Doc"]));
    await expect.poll(() => docKeyCount(page)).toBe(2);
  });

  test("deleting a document removes only that document", async ({ page }) => {
    await page.goto("/");
    await productField(page).fill("Doc One");
    await expectPersisted(page, "Doc One");

    await newPrdButton(page).click();
    await productField(page).fill("Doc Two");
    await expectPersisted(page, "Doc Two");

    await confirmDeleteDocument(page);

    await expect.poll(() => docTitles(page)).toEqual(["Doc One"]);
    await expect.poll(() => docKeyCount(page)).toBe(1);
  });

  test("deleting the only document leaves a usable blank, not a broken page", async ({
    page,
  }) => {
    await page.goto("/");
    await productField(page).fill("Only Doc");
    await expectPersisted(page, "Only Doc");

    await confirmDeleteDocument(page);

    await expect.poll(() => docTitles(page)).toEqual(["Untitled PRD"]);
    await expect(summaryField(page)).toBeVisible();
    await expect(summaryField(page)).toHaveValue("");

    // Nothing may be stored under an empty document id.
    const keys: string[] = await page.evaluate(() => Object.keys(localStorage));
    expect(keys).not.toContain(DOC_PREFIX);
  });
});
