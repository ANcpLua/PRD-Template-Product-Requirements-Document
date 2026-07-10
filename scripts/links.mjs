#!/usr/bin/env node
/**
 * The external links this project points readers at, in one place.
 *
 * The list is *derived* from `src/data/prd.ts` and the repo docs rather than
 * maintained by hand — a hand-kept copy drifts the first time someone edits a
 * tip, and a stale link registry is worse than none.
 *
 *   node scripts/links.mjs list     print what is referenced, and from where
 *   node scripts/links.mjs write    regenerate LINKS.md
 *   node scripts/links.mjs verify   fail if LINKS.md is stale (offline)
 *   node scripts/links.mjs check    fail if a link is dead (network)
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = join(ROOT, "LINKS.md");
const DOCS = ["README.md", "AGENTS.md"];

/** Not references: namespaces, tool schemas, dev servers, boilerplate. */
const NOT_A_REFERENCE = [
  /^http:\/\/www\.w3\.org\//,
  /^https:\/\/coderabbit\.ai\/integrations\//,
  /^https:\/\/help\.github\.com\/articles\/ignoring-files/,
  /^https?:\/\/(localhost|127\.0\.0\.1)/,
  /\$\{/, // template literals in config
];

const isReference = (url) => !NOT_A_REFERENCE.some((re) => re.test(url));

/** Collect every link the rendered document shows a reader. */
async function fromDocument() {
  const { prd } = await import(join(ROOT, "src/data/prd.ts"));
  const found = [];
  const add = (label, href, where) => found.push({ label, href, where });

  add(prd.meta.source.label, prd.meta.source.href, "Intro");
  add(prd.footer.source.label, prd.footer.source.href, "Footer");

  const walk = (blocks, where) => {
    for (const block of blocks ?? []) {
      if (block.type !== "tip") continue;
      for (const link of block.links ?? []) add(link.label, link.href, where);
    }
  };

  for (const section of prd.sections) {
    const where = `${section.number}. ${section.title}`;
    walk(section.blocks, where);
    for (const sub of section.subsections ?? []) {
      walk(sub.blocks, `${sub.number} ${sub.title}`);
    }
  }
  return found.filter((entry) => isReference(entry.href));
}

/**
 * Product-management jargon the document uses. A reader who does not already
 * know these has nothing to click unless the tip carries a reference. Add a
 * term here when the template starts using it.
 */
const TERMS = [
  "Value Curve",
  "Opportunity Solution Tree",
  "Opportunity Score",
  // Matching treats "-" and " " alike, so this covers "Jobs-to-be-Done" too.
  "Jobs to be Done",
  "Product-Market Fit",
  "OKR",
  "SMART",
];

/** Where each term is used, and whether that spot offers a reference. */
async function termCoverage() {
  const { prd } = await import(join(ROOT, "src/data/prd.ts"));
  const uses = [];

  const seen = new Set();
  const scan = (block, where) => {
    const text =
      block.type === "list" ? block.items.join(" ") : (block.text ?? "");
    const linked = block.type === "tip" && Boolean(block.links?.length);
    for (const term of TERMS) {
      const pattern = new RegExp(
        `\\b${term.replace(/[-\s]/g, "[-\\s]")}s?\\b`,
        "i"
      );
      if (!pattern.test(text)) continue;
      // One row per term per place, however many times it is written there.
      const key = `${term}@${where}`;
      if (seen.has(key)) continue;
      seen.add(key);
      uses.push({ term, where, linked });
    }
  };

  const walk = (blocks, where) => {
    for (const block of blocks ?? []) scan(block, where);
  };

  for (const section of prd.sections) {
    walk(section.blocks, `${section.number}. ${section.title}`);
    for (const sub of section.subsections ?? []) {
      walk(sub.blocks, `${sub.number} ${sub.title}`);
    }
  }

  return uses.sort(
    (a, b) => a.term.localeCompare(b.term) || a.where.localeCompare(b.where)
  );
}

/** Bare URLs mentioned in the repo's own documentation. */
async function fromDocs() {
  const found = [];
  for (const name of DOCS) {
    const text = await readFile(join(ROOT, name), "utf8");
    const urls = text.match(/https?:\/\/[^\s"'`)<>\]]+/g) ?? [];
    for (const raw of urls) {
      const href = raw.replace(/[.,;:]+$/, "");
      if (isReference(href)) found.push({ href, where: name });
    }
  }
  return found;
}

function dedupe(entries) {
  const byHref = new Map();
  for (const entry of entries) {
    const existing = byHref.get(entry.href);
    if (existing) {
      if (!existing.where.includes(entry.where))
        existing.where.push(entry.where);
    } else {
      byHref.set(entry.href, {
        href: entry.href,
        label: entry.label,
        where: [entry.where],
      });
    }
  }
  return [...byHref.values()].sort((a, b) => a.href.localeCompare(b.href));
}

async function collect() {
  const document = dedupe(await fromDocument());
  const docs = dedupe(await fromDocs()).filter(
    (entry) => !document.some((d) => d.href === entry.href)
  );
  return { document, docs, terms: await termCoverage() };
}

function render({ document, docs, terms }) {
  const lines = [];
  lines.push("# External links");
  lines.push("");
  lines.push(
    "Every URL this project points a reader at. **Generated — do not edit by hand.**",
    "Run `npm run links:write` after changing `src/data/prd.ts` or the docs.",
    "",
    "`npm run links:check` fetches each one and fails on a 404, so link rot",
    "surfaces here rather than in front of a reader.",
    ""
  );

  lines.push("## Shown in the document");
  lines.push("");
  lines.push("| Link | Where | URL |");
  lines.push("| --- | --- | --- |");
  for (const entry of document) {
    lines.push(
      `| ${entry.label ?? "—"} | ${entry.where.join(", ")} | <${entry.href}> |`
    );
  }
  lines.push("");

  lines.push("## Referenced from the repo's docs");
  lines.push("");
  lines.push("| Where | URL |");
  lines.push("| --- | --- |");
  for (const entry of docs) {
    lines.push(`| ${entry.where.join(", ")} | <${entry.href}> |`);
  }
  lines.push("");

  lines.push("## Jargon, and whether the reader can look it up");
  lines.push("");
  if (terms.length === 0) {
    lines.push("The document uses none of the tracked terms.");
  } else {
    const unlinked = terms.filter((t) => !t.linked);
    lines.push(
      "Terms a first-time reader may not know. A term is *covered* where the tip",
      "that uses it carries a reference link; otherwise there is nothing to click.",
      "",
      "| Term | Used in | Reference there? |",
      "| --- | --- | --- |"
    );
    for (const use of terms) {
      lines.push(
        `| ${use.term} | ${use.where} | ${use.linked ? "yes" : "**no**"} |`
      );
    }
    lines.push("");
    lines.push(
      `${unlinked.length} of ${terms.length} uses give the reader nowhere to go.`,
      "Add a `links:` entry to that tip in `src/data/prd.ts` to close the gap."
    );
  }
  lines.push("");
  return lines.join("\n");
}

// ── network check ──────────────────────────────────────────────────────────

const TIMEOUT_MS = 20_000;

async function probe(href) {
  const attempt = async (method) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(href, {
        method,
        redirect: "follow",
        signal: controller.signal,
        headers: { "user-agent": "prd-template-link-check (+github actions)" },
      });
      return { status: res.status, finalUrl: res.url };
    } finally {
      clearTimeout(timer);
    }
  };

  try {
    let res = await attempt("HEAD");
    // Plenty of hosts refuse HEAD but serve GET perfectly well.
    if (res.status === 405 || res.status === 403 || res.status === 501) {
      res = await attempt("GET");
    }
    return res;
  } catch (error) {
    // A name that does not resolve is dead; anything else may be transient.
    const code = error?.cause?.code ?? "";
    return { status: 0, error: error.message, dns: code === "ENOTFOUND" };
  }
}

/** 404/410 and a dead hostname fail. Blocked or flaky hosts only warn. */
function classify(result) {
  if (result.status >= 200 && result.status < 300) return "ok";
  if (result.status === 404 || result.status === 410) return "dead";
  if (result.status === 0) return result.dns ? "dead" : "unreachable";
  if ([401, 403, 405, 429].includes(result.status)) return "blocked";
  return "unreachable";
}

async function check(entries) {
  const results = [];
  const queue = [...entries];
  const worker = async () => {
    for (let entry = queue.shift(); entry; entry = queue.shift()) {
      const result = await probe(entry.href);
      results.push({ ...entry, ...result, verdict: classify(result) });
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));

  results.sort((a, b) => a.href.localeCompare(b.href));
  const icon = {
    ok: "OK  ",
    dead: "DEAD",
    blocked: "WARN",
    unreachable: "WARN",
  };
  for (const r of results) {
    const detail =
      r.verdict === "ok" && r.finalUrl && r.finalUrl !== r.href
        ? ` → ${r.finalUrl}`
        : r.status
          ? ` (${r.status})`
          : ` (${r.error})`;
    console.log(`${icon[r.verdict]}  ${r.href}${detail}`);
  }

  const dead = results.filter((r) => r.verdict === "dead");
  const warned = results.filter(
    (r) => r.verdict === "blocked" || r.verdict === "unreachable"
  );
  console.log(
    `\n${results.length - dead.length - warned.length} ok, ${warned.length} unverifiable, ${dead.length} dead`
  );
  if (warned.length > 0) {
    console.log("Unverifiable links are not failures — the host blocked us.");
  }
  return dead;
}

// ── entry point ────────────────────────────────────────────────────────────

const command = process.argv[2] ?? "list";
const data = await collect();
const all = [...data.document, ...data.docs];

if (command === "list") {
  for (const entry of all)
    console.log(`${entry.href}\n    ${entry.where.join(", ")}`);
  console.log(
    `\n${all.length} links, ${data.terms.filter((t) => !t.linked).length} jargon uses with no reference`
  );
} else if (command === "write") {
  await writeFile(OUTPUT, render(data));
  console.log(`wrote LINKS.md — ${all.length} links`);
} else if (command === "verify") {
  const expected = render(data);
  const actual = await readFile(OUTPUT, "utf8").catch(() => "");
  if (expected !== actual) {
    console.error("LINKS.md is out of date. Run `npm run links:write`.");
    process.exit(1);
  }
  console.log(`LINKS.md is up to date — ${all.length} links`);
} else if (command === "check") {
  const dead = await check(all);
  if (dead.length > 0) {
    console.error(`\n${dead.length} dead link(s):`);
    for (const r of dead) console.error(`  ${r.href}  (${r.where.join(", ")})`);
    process.exit(1);
  }
} else {
  console.error(`unknown command: ${command}`);
  process.exit(2);
}
