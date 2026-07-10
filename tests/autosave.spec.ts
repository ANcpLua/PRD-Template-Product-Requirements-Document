import { expect, test } from "@playwright/test";
import {
  breakStorageWrites,
  countStorageWrites,
  expectPersisted,
  hideTab,
  productField,
  saveState,
  storageWrites,
  storedDocText,
  summaryField,
} from "./helpers";

test.describe("autosave", () => {
  test("work reaches storage even while typing without ever pausing", async ({
    page,
  }) => {
    test.setTimeout(45_000);
    await page.goto("/");
    await summaryField(page).click();
    await countStorageWrites(page);

    // A plain debounce resets on every keystroke and would never fire here.
    // The max-wait cap must force a write partway through.
    await page.keyboard.type("a".repeat(125), { delay: 60 });

    expect(await storageWrites(page)).toBeGreaterThan(0);
  });

  test("work is flushed when the tab is hidden, inside the debounce window", async ({
    page,
  }) => {
    await page.goto("/");
    await summaryField(page).fill("hidden-flush-probe");

    // Hide immediately: far sooner than the debounce would have written.
    await hideTab(page);

    await expect
      .poll(() => storedDocText(page))
      .toContain("hidden-flush-probe");
  });

  test("a failed save is surfaced rather than reported as success", async ({
    page,
  }) => {
    await page.goto("/");
    await breakStorageWrites(page);
    await summaryField(page).fill("quota-probe");

    // Never "Saving…" forever, and never a false "All changes saved".
    await expect(saveState(page)).toHaveAttribute("data-state", "error");
    await expect(saveState(page)).toContainText("Couldn’t save");
    await expect(
      page.getByRole("button", { name: "Save failed" })
    ).toBeVisible();
  });

  test("a reload restores what was typed", async ({ page }) => {
    await page.goto("/");
    await summaryField(page).fill("round-trip-probe");
    await expectPersisted(page, "round-trip-probe");

    await page.reload();
    await expect(summaryField(page)).toHaveValue("round-trip-probe");
  });

  test("a passive second tab never overwrites the first tab's newer work", async ({
    context,
  }) => {
    const tabA = await context.newPage();
    await tabA.goto("/");
    await summaryField(tabA).fill("TAB-A-ORIGINAL");
    await expectPersisted(tabA, "TAB-A-ORIGINAL");

    // Tab B opens and reads that draft. It never edits anything.
    const tabB = await context.newPage();
    await tabB.goto("/");
    await expect(summaryField(tabB)).toHaveValue("TAB-A-ORIGINAL");

    // Tab A keeps working; its newer text reaches storage.
    await tabA.bringToFront();
    await summaryField(tabA).fill("TAB-A-ORIGINAL-PLUS-NEWER-WORK");
    await expectPersisted(tabA, "PLUS-NEWER-WORK");

    // Backgrounding tab B must not flush its stale in-memory copy.
    await hideTab(tabB);

    await expect.poll(() => storedDocText(tabA)).toContain("PLUS-NEWER-WORK");
  });

  test("the page still renders when localStorage access itself throws", async ({
    page,
  }) => {
    // Some hardened privacy modes throw on *access*, not just on write. The
    // library and the theme are both read during the first render.
    await page.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        configurable: true,
        get() {
          throw new DOMException("blocked", "SecurityError");
        },
      });
    });

    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await page.goto("/");

    await expect(summaryField(page)).toBeVisible();
    await expect(productField(page)).toBeVisible();
    expect(pageErrors).toEqual([]);
  });
});
