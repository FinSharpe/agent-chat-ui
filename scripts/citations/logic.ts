import {
  buildCitationNumbering,
  buildCitationRegistry,
  resolveCitations,
  stripCitationMarkers,
  emptyCitationRegistry,
  getCitationsPayload,
  rectToHighlight,
  filingTypeLabel,
  citationMeta,
} from "@/lib/citations";

let failures = 0;
function eq(actual: unknown, expected: unknown, name: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    failures++;
    console.log(`FAIL ${name}\n  got:      ${a}\n  expected: ${e}`);
  } else {
    console.log(`ok   ${name}`);
  }
}

const entry = (cite: string, o: Record<string, unknown> = {}) => ({
  cite,
  chunk_id: `chunk-${cite}`,
  document_id: "doc-1",
  symbol: "INFY",
  compname: "Infosys Ltd",
  subcatname: "concall",
  news_dt_iso: "2026-04-22T00:00:00",
  attachment_name: "doc-1.pdf",
  page: 12,
  bboxes: [{ l: 0.1, t: 0.2, r: 0.9, b: 0.3 }],
  coord_origin: "TOP_LEFT",
  quote: "Management guided to 12% margins for FY26.",
  ...o,
});

const toolMsg = (entries: unknown[]) => ({
  type: "tool",
  additional_kwargs: { citations: entries },
});

// --- parsing
eq(getCitationsPayload(toolMsg([entry("a1b2c3d4e5")])).length, 1, "parse one");
eq(getCitationsPayload({ type: "tool" }).length, 0, "no sidecar");
eq(
  getCitationsPayload({ additional_kwargs: { citations: "not-a-list" } })
    .length,
  0,
  "malformed sidecar ignored",
);
eq(
  getCitationsPayload(
    toolMsg([{ document_id: "d" }, { cite: "   " }, entry("goodtag123")]),
  ).map((c) => c.cite),
  ["goodtag123"],
  "tagless entries dropped",
);
const optional = getCitationsPayload(
  toolMsg([{ cite: "nopagenorc", quote: "no page" }]),
)[0];
eq(
  [optional.page, optional.bboxes.length, optional.coordOrigin],
  [null, 0, null],
  "page/bboxes/origin independently optional",
);
eq(
  getCitationsPayload(toolMsg([entry("x", { coord_origin: "BOTTOMLEFT" })]))[0]
    .coordOrigin,
  "BOTTOM_LEFT",
  "un-underscored origin normalised",
);

// --- registry
const reg = buildCitationRegistry([
  toolMsg([
    entry("aaaaaaaaaa", { quote: "first passage" }),
    entry("bbbbbbbbbb", { document_id: "doc-2", compname: "TCS Ltd" }),
    entry("cccccccccc", { quote: "second passage" }),
  ]),
]);
eq(
  reg.documents.map((d) => d.documentId),
  ["doc-1", "doc-2"],
  "footer dedupes by document",
);
eq(
  reg.passagesOf("doc-1").map((c) => c.quote),
  ["first passage", "second passage"],
  "passagesOf",
);
eq(
  buildCitationRegistry([
    toolMsg([entry("aaaaaaaaaa", { quote: "first" })]),
    toolMsg([entry("aaaaaaaaaa", { quote: "second" })]),
  ]).get("aaaaaaaaaa")!.quote,
  "first",
  "first entry wins a duplicate tag",
);
eq(
  buildCitationRegistry([{ type: "ai" }]).isEmpty,
  true,
  "no filings call -> empty",
);

// --- numbering + stripping
const idx = (text: string, r = reg, n?: any) => resolveCitations(text, r, n);
eq(
  [
    idx("Margins held [[bbbbbbbbbb]] and orders grew [[aaaaaaaaaa]].").numberOf(
      "bbbbbbbbbb",
    ),
    idx("Margins held [[bbbbbbbbbb]] and orders grew [[aaaaaaaaaa]].").numberOf(
      "aaaaaaaaaa",
    ),
  ],
  [1, 2],
  "first-appearance order",
);
const repeated = idx(
  "A [[aaaaaaaaaa]]. B [[bbbbbbbbbb]]. A again [[aaaaaaaaaa]].",
);
eq(
  [repeated.numberOf("aaaaaaaaaa"), repeated.numberOf("bbbbbbbbbb")],
  [1, 2],
  "repeat reuses number",
);
eq(
  idx("Claim [[aaaaaaaaaa]].").text,
  "Claim[[aaaaaaaaaa]].",
  "resolvable kept, space eaten",
);
eq(
  idx("Claim [[deadbeef01]] stands.").text,
  "Claim stands.",
  "unknown tag stripped",
);
eq(
  idx("Claim [[not a tag!]] stands.").text,
  "Claim stands.",
  "malformed tag stripped",
);
eq(
  idx("One [[deadbeef01]] two [[deadbeef02]] three.").text,
  "One two three.",
  "no double space",
);
eq(
  idx("Margins held [[aaaaaaaaaa]] and orders grew [[bbbbb").text,
  "Margins held[[aaaaaaaaaa]] and orders grew",
  "streaming edge truncated",
);
eq(
  idx("Claim [[deadbeef01] stands.").text,
  "Claim stands.",
  "one closing bracket stripped",
);
eq(
  idx("Claim [[aaaaaaaaaa].").text,
  "Claim[[aaaaaaaaaa]].",
  "mangled resolvable normalised",
);
const plain = "A plain answer with a [link](https://x.dev) and `code`.";
eq(idx(plain).text, plain, "untagged answer untouched");
const codey =
  "The matrix is `[[1, 2], [3, 4]]` in numpy.\n\n```python\nweights = [[0.6], [0.4]]\n```";
eq(idx(codey).text, codey, "markers inside code left alone");
eq(
  idx("Here:\n\n```python\nw = [[0.6").text,
  "Here:\n\n```python\nw = [[0.6",
  "unterminated fence not a truncated marker",
);
eq(
  idx("Claim [[aaaaaaaaaa]] stands.", emptyCitationRegistry()).text,
  "Claim stands.",
  "empty registry strips all",
);

const shared = buildCitationNumbering(
  ["First point [[bbbbbbbbbb]].", "Then this [[aaaaaaaaaa]]."],
  reg,
);
eq(
  idx("Then this [[aaaaaaaaaa]].", reg, shared).numberOf("aaaaaaaaaa"),
  2,
  "turn numbering continues across answers",
);

eq(
  stripCitationMarkers("Claim [[aaaaaaaaaa]] stands."),
  "Claim stands.",
  "strip for copy",
);

// --- geometry
const round = (r: any) =>
  r &&
  Object.fromEntries(
    Object.entries(r).map(([k, v]) => [
      k,
      Math.round((v as number) * 1e6) / 1e6,
    ]),
  );
eq(
  round(
    rectToHighlight({ l: 0.1, t: 0.2, r: 0.9, b: 0.3 }, "TOP_LEFT", 100, 200),
  ),
  { left: 10, top: 40, width: 80, height: 20 },
  "TOP_LEFT rect",
);
eq(
  round(
    rectToHighlight(
      { l: 0.1, t: 0.8, r: 0.9, b: 0.7 },
      "BOTTOM_LEFT",
      100,
      200,
    ),
  ),
  { left: 10, top: 40, width: 80, height: 20 },
  "BOTTOM_LEFT rect flipped",
);
eq(
  rectToHighlight({ l: 0.1, t: 0.2, r: 0.1, b: 0.3 }, "TOP_LEFT", 100, 200),
  null,
  "zero-area rect dropped",
);

// --- labels
eq(
  filingTypeLabel("investor-presentation"),
  "Investor presentation",
  "type label",
);
eq(filingTypeLabel(""), "Filing", "empty type label");
eq(
  citationMeta(getCitationsPayload(toolMsg([entry("a1b2c3d4e5")]))[0]),
  "Concall · 22 Apr 2026 · Page 12",
  "meta line",
);
eq(
  citationMeta(
    getCitationsPayload(
      toolMsg([entry("a", { page: null, news_dt_iso: "" })]),
    )[0],
  ),
  "Concall",
  "meta line with no dangling separators",
);

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
