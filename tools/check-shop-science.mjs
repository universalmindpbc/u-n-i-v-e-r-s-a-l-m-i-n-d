import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const shop = read("i  a m/shop.html");
const sciencePage = read("i  a m/shop-science.html");
const scienceSource = read("i  a m/shop-science-data-v1.js");
const scienceScript = read("i  a m/shop-science.js");
const scienceStyle = read("i  a m/shop-science.css");
const globalNavigation = read("i  a m/global-navigation.js");
const htaccess = read(".htaccess");
const stagingDeploy = read("deploy-panthurlive.sh");
const styleToken = createHash("sha256").update(scienceStyle).digest("hex").slice(0, 12);
const dataToken = createHash("sha256").update(scienceSource).digest("hex").slice(0, 12);
const scriptToken = createHash("sha256").update(scienceScript).digest("hex").slice(0, 12);

const context = { window: {} };
vm.runInNewContext(scienceSource, context, { filename: "shop-science-data-v1.js" });
const data = context.window.IAMShopScienceData;

const mobileRetainedPageMatch = htaccess.match(
  /^RewriteCond %\{REQUEST_URI\} !\^\/vogue\/iam\/\(([^)]+)\)\\\.html\$ \[NC\]$/m,
);
const smartphoneGate = [
  "RewriteCond %{HTTP_USER_AGENT} !(iPad|Macintosh.*Mobile) [NC]",
  "RewriteCond %{HTTP_USER_AGENT} \"(Mobile|iPhone|iPod|IEMobile|Opera Mini|BlackBerry|webOS)\" [NC]",
  "RewriteCond %{QUERY_STRING} !(^|&)full=1(&|$) [NC]",
].join("\n");

assert.equal(
  htaccess.split(smartphoneGate).length - 1,
  3,
  "All smartphone redirects must retain the full=1 escape hatch and iPad/Macintosh-mobile exclusions",
);
assert.ok(
  htaccess.includes(`${smartphoneGate}\nRewriteRule ^shop/?$ /vogue/iam/shop.html [R=302,L,NE]`),
  "The direct Shop smartphone redirect must remain unchanged",
);
assert.ok(
  htaccess.includes(`${smartphoneGate}\nRewriteCond %{QUERY_STRING} (^|&)shop=1(&|$) [NC]\nRewriteRule ^vogue/iam/index\\.html$ /vogue/iam/shop.html [R=302,L,NE]`),
  "The shop=1 smartphone redirect must remain unchanged",
);
assert.ok(mobileRetainedPageMatch, "The smartphone retained-page allowlist must remain explicit");
assert.deepEqual(
  mobileRetainedPageMatch[1].split("|"),
  ["induction", "about", "science", "research", "privacy-first", "business-model", "traction", "impact", "our-team", "shop", "shop-science"],
  "Mobile must preserve the current stakeholder routes and dedicated Shop SCIENCE page",
);
assert.ok(
  stagingDeploy.includes(
    "RewriteCond %{REQUEST_URI} !^/vogue/iam/(induction|about|science|research|privacy-first|business-model|traction|impact|our-team|shop|shop-science)\\.html$ [NC]",
  ),
  "The Panthur deployer must reproduce the current smartphone retained-page allowlist",
);
assert.match(
  htaccess,
  /^RewriteRule \^vogue\/iam\/\.\*\\\.html\$ \/vogue\/iam\/induction\.html\?mobile=1 \[R=302,L,NE\]$/m,
  "Other smartphone HTML routes must continue to redirect to the mobile induction page",
);

assert.ok(data, "Shop SCIENCE data projection must be available");
assert.equal(data.evidenceVersion, "JB-SCIENCE-2026-08-12-v1", "SCIENCE evidence version must remain explicit");
assert.equal(
  data.hypothesis,
  "In consenting adults, wearing a self-selected, well-fitting James Bondage [ health ] intimate garment designed for tactile comfort, adjustability and personally meaningful self-expression will produce short-term improvements in state body appreciation, perceived agency, comfort and positive affect, compared with a materially and fit-matched neutral garment.",
  "The approved testable hypothesis must remain verbatim",
);

const expectedStudyUrls = [
  "https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2024.1297663/full",
  "https://journals.aom.org/doi/10.5465/amj.2021.1358",
  "https://www.sciencedirect.com/science/article/abs/pii/S1740144513000363",
  "https://doi.org/10.1007/s11199-024-01494-x",
  "https://journals.sagepub.com/doi/10.1177/17455057261443139",
  "https://www.sciencedirect.com/science/article/abs/pii/S1740144519300853",
  "https://doi.org/10.1016/j.bodyim.2025.101955",
  "https://www.frontiersin.org/journals/human-neuroscience/articles/10.3389/fnhum.2014.00893/full",
  "https://onlinelibrary.wiley.com/doi/10.1111/srt.12288",
  "https://pubmed.ncbi.nlm.nih.gov/30668509/",
  "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0241378",
  "https://www.nature.com/articles/s41598-020-68034-x",
  "https://www.nature.com/articles/s41598-021-96044-w",
  "https://pubmed.ncbi.nlm.nih.gov/36497840/",
  "https://pmc.ncbi.nlm.nih.gov/articles/PMC9838756/",
];

assert.equal(data.studies.length, 15, "The frozen public evidence spine must contain all 15 studies");
assert.deepEqual(Array.from(data.studies, (study) => study.order), Array.from({ length: 15 }, (_, index) => index + 1), "Study order must remain frozen from 1 through 15");
assert.deepEqual(Array.from(data.studies, (study) => study.url), expectedStudyUrls, "Frozen study URLs and ordering must not be substituted");
assert.equal(new Set(Array.from(data.studies, (study) => study.strand)).size, 3, "The evidence spine must retain its three approved strands");
assert.ok(data.studies.every((study) => study.authors && study.journal && study.year && study.studyType && study.finding && study.supports && study.doi), "Every study must expose complete customer-facing metadata");

const expectedBrandRatings = new Map([
  ["adidas", [5, 5, "Published PFAS controls"]],
  ["Annie’s Ibiza", [4, 4, "No PFAS-type finish indicated"]],
  ["Bordelle", [5, 5, "Strong chemical controls"]],
  ["Calvin Klein", [5, 5, "Published PFAS controls"]],
  ["ERES", [4, 4, "No PFAS-type finish indicated"]],
  ["Emilio Cavallini", [3, 4, "No PFAS-type finish indicated"]],
  ["Fleur of England", [4, 4, "No PFAS-type finish indicated"]],
  ["Free People", [5, 4, "Published PFAS controls"]],
  ["Iris van Herpen", [4, 4, "Assessed individually"]],
  ["KARLA ŠPETIĆ", [3, 3, "No PFAS-type finish indicated"]],
  ["KIINI", [3, 3, "No PFAS-type finish indicated"]],
  ["La Perla", [4, 3, "No PFAS-type finish indicated"]],
  ["Lisa Marie Fernandez", [4, 3, "No PFAS-type finish indicated"]],
  ["Lucas Hugh", [5, 4, "Recognised material standards"]],
  ["Mugler", [3, 3, "No PFAS-type finish indicated"]],
  ["NAGNATA", [5, 5, "GOTS assurance on applicable products"]],
  ["Nike", [5, 5, "Published PFAS controls"]],
  ["P.E Nation", [4, 4, "No PFAS-type finish indicated"]],
  ["PUCCI", [4, 4, "Group chemical controls"]],
  ["Rashi World", [4, 4, "No PFAS-type finish indicated"]],
  ["Saint Laurent", [5, 4, "Published PFAS controls"]],
  ["SIR.", [4, 4, "No PFAS-type finish indicated"]],
  ["SKIMS", [3, 4, "No PFAS-type finish indicated"]],
  ["The Upside", [5, 4, "Recognised material standards"]],
  ["Triangl", [3, 3, "No PFAS-type finish indicated"]],
  ["WARDROBE.NYC", [4, 3, "No PFAS-type finish indicated"]],
  ["Wolford", [5, 5, "Strong chemical controls"]],
]);

assert.equal(data.brands.length, 27, "The public table must contain the 27 assessed fashion labels");
assert.equal(new Set(Array.from(data.brands, (brand) => brand.brand)).size, 27, "Brand assessments must be unique");
for (const brand of data.brands) {
  assert.deepEqual(Array.from([brand.material, brand.making, brand.pfas]), expectedBrandRatings.get(brand.brand), `Frozen rating mismatch for ${brand.brand}`);
  assert.ok(brand.material >= 3 && brand.material <= 5, `${brand.brand} Material Intelligence must use the approved strong-to-exceptional 3–5 scale`);
  assert.ok(brand.making >= 3 && brand.making <= 5, `${brand.brand} Responsible Making must use the approved strong-to-exceptional 3–5 scale`);
  assert.ok(brand.summary && brand.evidence && brand.notes, `${brand.brand} must explain its assessment and unknowns`);
  assert.ok(brand.sources.length >= 1 && brand.sources.every((source) => source.startsWith("https://")), `${brand.brand} must retain direct evidence links`);
}

assert.match(shop, /href="#sex-ed">sex ed<\/a>\s*<a href="shop-science\.html" target="_blank" rel="noopener"[^>]*>science<\/a>/, "SCIENCE must sit immediately after SEX ED and open a dedicated new tab");
assert.doesNotMatch(globalNavigation, /href="shop\.html#science"/, "The Shop SCIENCE anchor must not be added to the global site navigation");
assert.doesNotMatch(shop, /data-shop-science|shop-science\.css|shop-science-data-v1\.js|shop-science\.js/, "The normal Shop flow must not carry the heavy SCIENCE content or assets");
assert.match(sciencePage, /id="shop-science-title"[\s\S]*THE SCIENCE<br>OF FEELING<br>LIKE YOURSELF/, "The dedicated page must include the approved public SCIENCE heading");
assert.match(sciencePage, /Self-selected clothing can support how we feel in our bodies\./, "The dedicated page must include the frozen concise public claim");
assert.match(
  sciencePage,
  /<section class="shop-science__vogue-vision"[\s\S]*Proposed research for publication with Vogue\.[\s\S]*Vogue logo - large - higher res\.png" alt="VOGUE"[\s\S]*proposed partnership - not yet confirmed/,
  "The Vogue publication vision must retain the proposed, not-yet-confirmed boundary",
);
assert.ok(
  fs.existsSync(path.join(root, "i  a m/a s s e t s/Vogue logo - large - higher res.png")),
  "The Vogue publication vision must use the established high-resolution logo asset",
);
assert.match(sciencePage, /15 gold-standard studies/i, "Research expander must identify the complete 15-study spine");
assert.match(sciencePage, /No PFAS-type finish indicated[\s\S]*not a laboratory-tested PFAS-free claim/, "PFAS wording must distinguish absence of an indicated finish from a laboratory-tested claim");
assert.match(sciencePage, /Nylon is a synthetic fibre[\s\S]*One does not prove the other/, "Material primer must distinguish nylon from PFAS");
assert.match(sciencePage, /PFAS ARE NOT MICROPLASTICS/, "Material primer must keep PFAS and microplastics distinct");
assert.match(sciencePage, /Stars distinguish strong from exceptional practice[\s\S]*not pass\/fail safety grades/, "Customer rubric must explain the positive 3–5 star scale");
assert.match(sciencePage, /Champagne Bohemia, Inner Planes and Accessories \| Health[\s\S]*outside this rating table/, "Unassessed Shop edits and umbrellas must remain explicit unknowns rather than receiving invented ratings");
assert.doesNotMatch(sciencePage, /what survives scrutiny/i, "The rejected scrutiny table language must not return");
assert.ok(sciencePage.includes(`shop-science.css?v=${styleToken}`), "Dedicated SCIENCE page must cache-bust its visual system from exact bytes");
assert.ok(sciencePage.includes(`shop-science-data-v1.js?v=${dataToken}`), "Dedicated SCIENCE page must cache-bust its data projection from exact bytes");
assert.ok(sciencePage.includes(`shop-science.js?v=${scriptToken}`), "Dedicated SCIENCE page must cache-bust its renderer from exact bytes");
assert.ok((sciencePage.match(/<img /g) || []).length >= 10, "Editorial SCIENCE needs meaningful photography and Universal Mind flower cues");
assert.match(sciencePage, /<video data-science-silent-video[\s\S]*iris-van-herpen\/sonic-starquakes-hero-1280x576-v2\.mp4/, "Editorial SCIENCE must include the approved silent fashion film");

assert.match(scienceScript, /data-science-research[\s\S]*addEventListener\("toggle"/, "Research expansion must expose its open state");
assert.match(scienceScript, /aria-expanded[\s\S]*aria-controls[\s\S]*detail\.hidden/, "Desktop brand evidence rows must be accessible and expandable");
assert.match(scienceScript, /element\("details", "shop-material__card"\)/, "Mobile assessments must render as native accessible disclosure cards");
assert.match(scienceScript, /data-science-silent-video[\s\S]*video\.muted = true[\s\S]*IntersectionObserver/, "Editorial film must be explicitly muted and viewport-managed");
assert.match(scienceStyle, /@media \(max-width: 780px\)[\s\S]*\.shop-material__table-wrap[\s\S]*display:\s*none[\s\S]*\.shop-material__cards[\s\S]*display:\s*grid/, "Mobile must switch the wide evidence table to readable colour disclosure cards");
assert.match(scienceStyle, /prefers-reduced-motion:\s*reduce/, "SCIENCE interactions must respect reduced-motion preferences");

console.log("Shop SCIENCE checks passed: dedicated new-tab editorial page, exact cache tokens, photography/film/flower cues, 15 frozen studies, 27 colour-coded brand assessments, and explicit PFAS boundaries.");
