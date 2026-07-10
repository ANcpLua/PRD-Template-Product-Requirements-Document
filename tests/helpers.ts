import { expect, type Page } from "@playwright/test";

/** Keys the app writes. Asserted on directly, so name them once. */
export const LEGACY_KEY = "prd-draft-v1";
export const LIBRARY_KEY = "prd-library-v1";
export const DOC_PREFIX = "prd-doc-v1:";

/**
 * Queried by role and accessible name wherever possible: a test that breaks
 * when the label changes is telling you something a class-name selector would
 * have hidden.
 */
export const productField = (page: Page) =>
  page.getByRole("textbox", { name: "Product / feature" });
export const summaryField = (page: Page) =>
  page.getByRole("textbox", { name: "Summary — your content" });
export const docSelect = (page: Page) =>
  page.getByRole("combobox", { name: "Document" });
export const newPrdButton = (page: Page) =>
  page.getByRole("button", { name: "+ New PRD" });
export const deleteDocButton = (page: Page) =>
  page.getByRole("button", { name: /Delete document|Click again to delete/ });
export const saveState = (page: Page) => page.locator(".prd-save-state");

/**
 * Wait until the text is actually on disk. The "All changes saved" label only
 * lingers ~1.6s before reverting to idle, so asserting on it races; the whole
 * point of these tests is what survives a reload anyway.
 */
export async function expectPersisted(page: Page, text: string): Promise<void> {
  await expect.poll(() => storedDocText(page)).toContain(text);
}

/** The document names shown in the switcher, in display order. */
export async function docTitles(page: Page): Promise<string[]> {
  return page.locator(".prd-select option").allTextContents();
}

/** Every per-document key's contents, concatenated. */
export async function storedDocText(page: Page): Promise<string> {
  return page.evaluate((prefix) => {
    return Object.keys(localStorage)
      .filter((key) => key.startsWith(prefix))
      .map((key) => localStorage.getItem(key) ?? "")
      .join("");
  }, DOC_PREFIX);
}

export async function docKeyCount(page: Page): Promise<number> {
  return page.evaluate(
    (prefix) =>
      Object.keys(localStorage).filter((k) => k.startsWith(prefix)).length,
    DOC_PREFIX
  );
}

/** Delete is a two-click confirm, the same as "Clear fields". */
export async function confirmDeleteDocument(page: Page): Promise<void> {
  await deleteDocButton(page).click();
  await page.getByRole("button", { name: "Click again to delete" }).click();
}

/**
 * Background the tab. `visibilityState` is read-only, so override it before
 * firing the event the app actually listens for.
 */
export async function hideTab(page: Page): Promise<void> {
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      value: "hidden",
      configurable: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
}

/** Count writes to storage from this point on. */
export async function countStorageWrites(page: Page): Promise<void> {
  await page.evaluate(() => {
    (window as unknown as { __writes: number }).__writes = 0;
    const proto = Object.getPrototypeOf(window.localStorage) as Storage;
    const original = proto.setItem;
    proto.setItem = function (key: string, value: string) {
      (window as unknown as { __writes: number }).__writes++;
      return original.call(this, key, value);
    };
  });
}

export async function storageWrites(page: Page): Promise<number> {
  return page.evaluate(
    () => (window as unknown as { __writes: number }).__writes
  );
}

/** Make every future write fail, as a full quota or private mode would. */
export async function breakStorageWrites(page: Page): Promise<void> {
  await page.evaluate(() => {
    const proto = Object.getPrototypeOf(window.localStorage) as Storage;
    proto.setItem = function () {
      throw new DOMException("QuotaExceededError", "QuotaExceededError");
    };
  });
}

/**
 * Seed a draft in the pre-library format, as the shipped app used to leave it.
 *
 * This must land *before* the app's first script runs — migration only happens
 * when no library exists, so seeding after a `goto` would be a no-op and the
 * test would silently prove nothing. Idempotent, because init scripts re-run on
 * every navigation and must not resurrect the key after it has been retired.
 */
export async function seedLegacyDraft(
  page: Page,
  product: string
): Promise<void> {
  await page.addInitScript(
    ([legacyKey, libraryKey, name]) => {
      if (localStorage.getItem(libraryKey)) return;
      if (localStorage.getItem(legacyKey)) return;
      localStorage.setItem(
        legacyKey,
        JSON.stringify({
          version: 1,
          meta: { product: name, author: "Alex", date: "", status: "Draft" },
          answers: {},
          contacts: [{ name: "A", role: "PM", comment: "" }],
        })
      );
    },
    [LEGACY_KEY, LIBRARY_KEY, product] as const
  );
}
