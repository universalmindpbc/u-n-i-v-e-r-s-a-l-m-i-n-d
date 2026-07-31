(function (root, factory) {
  "use strict";

  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.IAMShopCatalogueFilter = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const COLOUR_OPTIONS = Object.freeze([
    { value: "black", label: "black" },
    { value: "white", label: "white" },
    { value: "nude-neutral", label: "nude / neutral" },
    { value: "brown", label: "brown" },
    { value: "grey", label: "grey" },
    { value: "red", label: "red" },
    { value: "orange", label: "orange" },
    { value: "yellow", label: "yellow" },
    { value: "green", label: "green" },
    { value: "blue", label: "blue" },
    { value: "cobalt", label: "cobalt" },
    { value: "purple", label: "purple" },
    { value: "pink", label: "pink" },
    { value: "silver", label: "silver" },
    { value: "gold", label: "gold" },
    { value: "multi-print", label: "multi-colour / print" },
  ]);

  const COLOUR_LABELS = new Map(COLOUR_OPTIONS.map((entry) => [entry.value, entry.label]));
  const COLOUR_ALIASES = new Map(COLOUR_OPTIONS.flatMap((entry) => [
    [entry.value, entry.value],
    [normalise(entry.label), entry.value],
  ]));
  const COLOUR_PATTERNS = Object.freeze([
    ["black", /\b(black|noir|nero|obsidian|onix|ultra)\b/],
    ["white", /\b(white|blanc|bianco|lys|panama)\b/],
    ["nude-neutral", /\b(nude|neutral|beige|cream|ecru|ivory|taupe|bone|sand|oyster|caramel|coquille|talc|natural|make up|panama)\b/],
    ["brown", /\b(brown|chocolate|espresso|mocha)\b/],
    ["grey", /\b(grey|gray|ash|charcoal)\b/],
    ["red", /\b(red|rouge|marsala|port)\b/],
    ["orange", /\b(orange|rouille|rust)\b/],
    ["yellow", /\b(yellow|lemon|butter)\b/],
    ["green", /\b(green|olive|jade|mint|menthe|seafoam|vert|scarabee|palmeraie|alligator)\b/],
    ["cobalt", /\bcobalt\b/],
    ["blue", /\b(blue|navy|marine|sky|turquoise)\b/],
    ["purple", /\b(purple|lilac|lilas|mulberry)\b/],
    ["pink", /\b(pink|rose|bonbon|blossom|lassi|guimauve)\b/],
    ["silver", /\b(silver|argent)\b/],
    ["gold", /\b(gold|aurous|24k)\b/],
    ["multi-print", /\b(multi|multicolor|multicolour|multi color|multi colour|print|printed|imprime|stripe|striped|polka|colorblock|colourblock)\b/],
  ]);

  function normalise(value) {
    return String(value ?? "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .replace(/\s+/g, " ");
  }

  function normaliseFamily(value) {
    const candidate = normalise(value);
    return COLOUR_ALIASES.get(candidate) || COLOUR_ALIASES.get(candidate.replace(/\s+/g, "-")) || "";
  }

  function colourFamilies(product = {}) {
    const projectedFamilies = Array.isArray(product.colourFamilies)
      ? product.colourFamilies
      : Array.isArray(product.colorFamilies)
        ? product.colorFamilies
        : [];
    const approvedProjectedFamilies = projectedFamilies
      .map(normaliseFamily)
      .filter((family, index, families) => family && families.indexOf(family) === index);
    if (approvedProjectedFamilies.length) return approvedProjectedFamilies;

    const rawColour = normalise(product.color || product.colour);
    if (!rawColour) return [];

    const families = COLOUR_PATTERNS
      .filter(([, pattern]) => pattern.test(rawColour))
      .map(([family]) => family);

    return families.filter((family, index) => families.indexOf(family) === index);
  }

  function searchText(product = {}) {
    const familyLabels = colourFamilies(product).map((family) => COLOUR_LABELS.get(family) || "");
    const fields = [
      product.brand,
      product.name,
      product.description,
      product.color,
      product.colour,
      product.material,
      product.materials,
      product.collection,
      product.collections,
      familyLabels,
    ];
    return normalise(fields.flat(Infinity).filter(Boolean).join(" "));
  }

  function matchesSearch(product, query) {
    const tokens = normalise(query).split(" ").filter(Boolean);
    if (!tokens.length) return true;
    const haystack = product?._catalogueSearchText || searchText(product);
    return tokens.every((token) => haystack.includes(token));
  }

  function matchesColour(product, colour) {
    if (!colour || colour === "all") return true;
    return colourFamilies(product).includes(colour);
  }

  function prepareProduct(product) {
    return {
      ...product,
      _catalogueSearchText: searchText(product),
    };
  }

  return Object.freeze({
    COLOUR_OPTIONS,
    colourFamilies,
    matchesColour,
    matchesSearch,
    normalise,
    prepareProduct,
    searchText,
  });
});
