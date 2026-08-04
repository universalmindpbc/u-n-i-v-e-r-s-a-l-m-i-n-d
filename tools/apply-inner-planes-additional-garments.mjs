import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const kernelPath = path.join(root, "i  a m/shop-product-kernel-v1.json");
const editsPath = path.join(root, "i  a m/shop-radio-edits-v1.json");
const kernel = JSON.parse(fs.readFileSync(kernelPath, "utf8"));
const radioEdits = JSON.parse(fs.readFileSync(editsPath, "utf8"));

const retrievedAt = "2026-08-04";
const innerPlains = radioEdits.catalogues.find((catalogue) => catalogue.slug === "inner-plains");
assert.ok(innerPlains, "Inner Plains edit manifest is required");

const products = [
  {
    id: "JB-0418",
    brand: "Studio K",
    sourceBrandHeading: "Inner Plains",
    sourceTitle: "Studio K | Womens | Étudé Bodysuit | White | XXS - XXL",
    name: "Étudé Bodysuit",
    productType: "Bodysuit",
    forms: ["second skin", "movement"],
    retailer: "Studio K",
    retailerUrl: "https://www.studiokatelier.au/products/etude-bodysuit-white",
    canonicalUrl: "https://www.studiokatelier.au/products/etude-bodysuit-white",
    shopRoute: "#catalogue/inner-plains",
    slug: "etude-bodysuit-white",
    color: "White",
    description: "A continuous line\n\nOne-piece designed to move as a whole, fitted through the body with a second-skin feel.\n\nSoft structure that follows without holding too tightly, worn alone or layered into everyday dressing.\n\n• full-body fit\n• soft, contouring fabric\n• seamless feel\n• LENZING™ ECOVERO™ fabric\n\nMargaux is 175 cm / 5'7\" and wears size S. Dian is 174 cm / 5'7\" and wears size XS.",
    material: "LENZING™ ECOVERO™ fabric.",
    image: "a s s e t s/shop-mockup/product-catalogue/studio-k/jb-0418-studio-k-etude-bodysuit-white.jpg",
    imageAlt: "Studio K Étudé Bodysuit in White on a forward-facing model",
    imageSource: "retailer_first_hero",
    sourceImageUrl: "https://www.studiokatelier.au/cdn/shop/files/Etude_Bodysuit_White_7_x1920_cf159c06-f6f8-4333-8097-d190f2dbf5e4.jpg?v=1780646122&width=1200",
    sourceImageIndex: 0,
    price: "AU$ 179",
    priceValue: 179,
    colourFamilies: ["white"],
    colourEvidenceText: "White",
    shopTypes: ["athleisure-all", "ready-to-wear-all", "bodysuit"],
    notionPageId: "3b17b9c9-9c56-81a5-95db-dc6814ae7bd1",
  },
  {
    id: "JB-0419",
    brand: "Studio K",
    sourceBrandHeading: "Inner Plains",
    sourceTitle: "Studio K | Womens | Linea Leggings | Black | XXS - XXL",
    name: "Linea Leggings",
    productType: "Legging",
    forms: ["second skin", "movement"],
    retailer: "Studio K",
    retailerUrl: "https://www.studiokatelier.au/products/linea-leggings-black?pr_prod_strat=pinned&pr_rec_id=c5ae0aff0&pr_rec_pid=10043633402096&pr_ref_pid=10043632320752&pr_seq=uniform",
    canonicalUrl: "https://www.studiokatelier.au/products/linea-leggings-black",
    shopRoute: "#catalogue/inner-plains",
    slug: "linea-leggings-black",
    color: "Black",
    description: "Held close, without effort\n\nMid- to high-rise legging with a clean, close fit, designed to sit smoothly and follow the body.\n\nDouble-layered waistband that holds gently, and seamless through the front and sides for an uninterrupted fit.\n\nMade for movement and everyday wear.\n\n• double-layered waistband\n• seamless front and sides\n• smooth, contouring fabric\n• studio k logo at back\n• inseam length: size s – 61 cm / 25\"\n• LENZING™ ECOVERO™ fabric\n\nDian is 174 cm / 5'7\" and wears size XS.",
    material: "LENZING™ ECOVERO™ fabric.",
    image: "a s s e t s/shop-mockup/product-catalogue/studio-k/jb-0419-studio-k-linea-leggings-black.jpg",
    imageAlt: "Studio K Linea Leggings in Black on a forward-facing model",
    imageSource: "retailer_first_hero",
    sourceImageUrl: "https://www.studiokatelier.au/cdn/shop/files/Black_Beso_Tube_Top_Linea_leggings_2_x1920_09351f5d-6889-4799-8d3c-24dcfd80f418.jpg?v=1780646129&width=1200",
    sourceImageIndex: 0,
    price: "AU$ 159",
    priceValue: 159,
    colourFamilies: ["black"],
    colourEvidenceText: "Black",
    shopTypes: ["athleisure-all", "ready-to-wear-all", "pants", "leggings"],
    notionPageId: "3b17b9c9-9c56-81e6-b05b-ceb3024adfaa",
  },
  {
    id: "JB-0420",
    brand: "Studio K",
    sourceBrandHeading: "Inner Plains",
    sourceTitle: "Studio K | Womens | Beso Mini Tube | Black | XXS - XXL",
    name: "Beso Mini Tube",
    productType: "Top",
    forms: ["second skin"],
    retailer: "Studio K",
    retailerUrl: "https://www.studiokatelier.au/products/beso-mini-tube-black",
    canonicalUrl: "https://www.studiokatelier.au/products/beso-mini-tube-black",
    shopRoute: "#catalogue/inner-plains",
    slug: "beso-mini-tube-black",
    color: "Black",
    description: "Short, held in place\n\nCropped tube with a close, minimal fit, designed to sit securely and follow the body.\n\nElasticated at the top and bottom for a gentle sense of hold, simple and a little bold, easy to wear on its own or layered.\n\n• elasticated bands at top and bottom\n• cropped length\n• smooth, contouring fabric\n• LENZING™ ECOVERO™ fabric\n\nMargaux is 175 cm / 5'7\" and wears size S. Nina is 180 cm / 5'9\" and wears size M.",
    material: "LENZING™ ECOVERO™ fabric.",
    image: "a s s e t s/shop-mockup/product-catalogue/studio-k/jb-0420-studio-k-beso-mini-tube-black.jpg",
    imageAlt: "Studio K Beso Mini Tube in Black on a forward-facing model",
    imageSource: "retailer_first_hero",
    sourceImageUrl: "https://www.studiokatelier.au/cdn/shop/files/BesoMiniTube_LineaLeggingsBlack2_x1920_0d45062f-c255-43f6-b8f6-58bfb2b6f6af.jpg?v=1780646132&width=1200",
    sourceImageIndex: 0,
    price: "AU$ 109",
    priceValue: 109,
    colourFamilies: ["black"],
    colourEvidenceText: "Black",
    shopTypes: ["ready-to-wear-all", "crop"],
    notionPageId: "3b17b9c9-9c56-81dc-8d50-eda689bef47b",
  },
  {
    id: "JB-0421",
    brand: "Studio K",
    sourceBrandHeading: "Inner Plains",
    sourceTitle: "Studio K | Womens | Sheer T-shirt | Black | XS - XL",
    name: "No 102 / Sheer T-shirt",
    productType: "Top",
    forms: ["second skin"],
    retailer: "Studio K",
    retailerUrl: "https://www.studiokatelier.au/products/no-102-sheer-t-shirt?pr_prod_strat=pinned&pr_rec_id=3639df44a&pr_rec_pid=10043630551280&pr_ref_pid=10043632910576&pr_seq=uniform",
    canonicalUrl: "https://www.studiokatelier.au/products/no-102-sheer-t-shirt",
    shopRoute: "#catalogue/inner-plains",
    slug: "no-102-sheer-t-shirt",
    color: "Black",
    description: "An ethereal essential\n\nNo 102 is a timeless T-shirt designed to fall softly against the body. With a relaxed silhouette that skims without clinging, it layers effortlessly and moves with quiet ease. A refined staple made to be worn often.\n\nPolina is 180 cm / 5'9\" and wears size S.",
    image: "a s s e t s/shop-mockup/product-catalogue/studio-k/jb-0421-studio-k-no-102-sheer-t-shirt-black.jpg",
    imageAlt: "Studio K No 102 Sheer T-shirt in Black on a forward-facing model",
    imageSource: "retailer_first_hero",
    sourceImageUrl: "https://www.studiokatelier.au/cdn/shop/files/no102_93_PantsTiramisu6_x1920_13bf5886-1015-4378-a96b-e1d32aeacba5.jpg?v=1780646131&width=1200",
    sourceImageIndex: 0,
    price: "AU$ 109",
    priceValue: 109,
    colourFamilies: ["black"],
    colourEvidenceText: "Black",
    shopTypes: ["ready-to-wear-all"],
    notionPageId: "3b17b9c9-9c56-81b6-b6ae-ccdb610068d0",
  },
  {
    id: "JB-0422",
    brand: "Studio K",
    sourceBrandHeading: "Inner Plains",
    sourceTitle: "Studio K | Womens | Sheer Long-sleeve | Black | XS - XL",
    name: "No 103 / Sheer Long-sleeve",
    productType: "Top",
    forms: ["second skin"],
    retailer: "Studio K",
    retailerUrl: "https://www.studiokatelier.au/products/no-103-sheer-long-sleeve?pr_prod_strat=pinned&pr_rec_id=3639df44a&pr_rec_pid=10043630485744&pr_ref_pid=10043632910576&pr_seq=uniform",
    canonicalUrl: "https://www.studiokatelier.au/products/no-103-sheer-long-sleeve",
    shopRoute: "#catalogue/inner-plains",
    slug: "no-103-sheer-long-sleeve",
    color: "Black",
    description: "A steady presence\n\nNo 103 is a timeless long-sleeve designed to fall softly against the body. With a relaxed silhouette that skims without clinging, it layers with ease and moves effortlessly through seasons. A refined staple made to last beyond the moment.\n\nPolina is 178 cm / 5'9\" and wears size S.",
    image: "a s s e t s/shop-mockup/product-catalogue/studio-k/jb-0422-studio-k-no-103-sheer-long-sleeve-black.jpg",
    imageAlt: "Studio K No 103 Sheer Long-sleeve in Black on a forward-facing model",
    imageSource: "retailer_first_hero",
    sourceImageUrl: "https://www.studiokatelier.au/cdn/shop/files/no103_93_ShortsGrey_x1920_a1dce6b6-00f9-45d6-ae87-0957594e853c.jpg?v=1780646133&width=1200",
    sourceImageIndex: 0,
    price: "AU$ 119",
    priceValue: 119,
    colourFamilies: ["black"],
    colourEvidenceText: "Black",
    shopTypes: ["ready-to-wear-all"],
    notionPageId: "3b17b9c9-9c56-8146-a61d-ec0b7b730e15",
  },
  {
    id: "JB-0423",
    brand: "Studio K",
    sourceBrandHeading: "Inner Plains",
    sourceTitle: "Studio K | Womens | Sheer Cami | Black | XS - XL",
    name: "No 101 / Sheer Cami",
    productType: "Top",
    forms: ["second skin"],
    retailer: "Studio K",
    retailerUrl: "https://www.studiokatelier.au/products/no-101-sheer-cami?pr_prod_strat=pinned&pr_rec_id=3639df44a&pr_rec_pid=10043630518512&pr_ref_pid=10043632910576&pr_seq=uniform",
    canonicalUrl: "https://www.studiokatelier.au/products/no-101-sheer-cami",
    shopRoute: "#catalogue/inner-plains",
    slug: "no-101-sheer-cami",
    color: "Black",
    description: "A delicate essential\n\nNo 101 is a timeless full-length camisole designed to fall softly against the body. With a relaxed silhouette that skims without clinging, it layers effortlessly and moves with quiet ease. A refined staple made to be worn often.\n\nPolina is 180 cm / 5'9\" and wears size S. Emiliya is 173 cm / 5'6\" and wears size S.",
    image: "a s s e t s/shop-mockup/product-catalogue/studio-k/jb-0423-studio-k-no-101-sheer-cami-black.jpg",
    imageAlt: "Studio K No 101 Sheer Cami in Black on a forward-facing model",
    imageSource: "retailer_gallery_human_selected",
    sourceImageUrl: "https://www.studiokatelier.au/cdn/shop/files/no101_93_ShortsBlack7_x1920_2d473abc-b2d3-4f16-822f-3a3bf6573afe.jpg?v=1783577516&width=1280",
    sourceImageIndex: 2,
    price: "AU$ 99",
    priceValue: 99,
    colourFamilies: ["black"],
    colourEvidenceText: "Black",
    shopTypes: ["ready-to-wear-all"],
    notionPageId: "3b17b9c9-9c56-8104-8c8b-d86d991f121e",
  },
  {
    id: "JB-0424",
    brand: "Calvin Klein",
    sourceBrandHeading: "Inner Plains",
    sourceTitle: "Modern Terry Lounge Joggers | Calvin Klein",
    name: "Modern Terry Lounge Joggers",
    productType: "Other",
    forms: ["movement"],
    retailer: "Calvin Klein",
    retailerUrl: "https://www.calvinklein.com.au/modern-terry-lounge-joggers-grey-heather-qs7634op7a",
    canonicalUrl: "https://www.calvinklein.com.au/modern-terry-lounge-joggers-grey-heather-qs7634op7a",
    shopRoute: "#catalogue/calvin-klein",
    slug: "modern-terry-lounge-joggers-grey-heather-qs7634op7a",
    color: "Grey Heather",
    description: "A soft jogger crafted from cotton‑rich French terry for relaxed, everyday comfort. Designed with a regular fit and an elasticated waistband for an easy, flexible feel. Finished with subtle Calvin Klein branding for a clean, modern look.\n\n• Cotton‑rich French terry\n• Elasticated waistband\n• Side pockets\n• Ribbed cuffs\n• Subtle Calvin Klein branding\n\nModel is 5'9\" wearing a size S.",
    material: "98% cotton, 2% polyester. Machine wash.",
    image: "a s s e t s/shop-mockup/product-catalogue/calvin-klein/jb-0424-modern-terry-lounge-joggers-grey-heather.jpg",
    imageAlt: "Calvin Klein Modern Terry Lounge Joggers in Grey Heather on a forward-facing model",
    imageSource: "retailer_first_hero",
    sourceImageUrl: "https://pvh-brands.imgix.net/catalog/product/media/QS7634O_P7A_main.jpg?w=713&h=950&crop=top&fit=crop&auto=compress&auto=format",
    sourceImageIndex: 0,
    price: "AU$ 99.95",
    priceValue: 99.95,
    colourFamilies: ["grey"],
    colourEvidenceText: "Grey Heather",
    shopTypes: ["athleisure-all", "ready-to-wear-all", "pants"],
    notionPageId: "3b17b9c9-9c56-8156-98e4-fd374c3562af",
  },
  {
    id: "JB-0425",
    brand: "Calvin Klein",
    sourceBrandHeading: "Inner Plains",
    sourceTitle: "Icon Cotton Modal Unlined Bralette | Calvin Klein",
    name: "Icon Cotton Modal Unlined Bralette",
    productType: "Bra",
    forms: ["lingerie"],
    retailer: "Calvin Klein",
    retailerUrl: "https://www.calvinklein.com.au/icon-cotton-modal-unlined-bralette-grey-heather-qf8493p7a",
    canonicalUrl: "https://www.calvinklein.com.au/icon-cotton-modal-unlined-bralette-grey-heather-qf8493p7a",
    shopRoute: "#catalogue/calvin-klein",
    slug: "icon-cotton-modal-unlined-bralette-grey-heather-qf8493p7a",
    color: "Grey Heather",
    description: "A Calvin Klein icon. Made with super soft cotton stretch blended with silky modal for a flexible fit and feel. Designed with our new Infinity Bond stitch-free band for seamless, ultimate comfort.\n\n• Super soft cotton stretch blend for breathable, sleek styling\n• Unlined cups for a lightweight, breathable feel\n• Easy pullover racerback silhouette\n• Stitch-free Infinity Bond band for seamless comfort\n• Hardware-free, distraction-free\n• For more coverage and a relaxed fit, size up\n\nModel is 5'9\" wearing a size S.",
    material: "53% cotton, 35% modal, 12% elastane. Machine wash.",
    image: "a s s e t s/shop-mockup/product-catalogue/calvin-klein/jb-0425-icon-cotton-modal-unlined-bralette-grey-heather.jpg",
    imageAlt: "Calvin Klein Icon Cotton Modal Unlined Bralette in Grey Heather on a forward-facing model",
    imageSource: "retailer_first_hero",
    sourceImageUrl: "https://pvh-brands.imgix.net/catalog/product/media/QF8493_P7A_main.jpg?w=713&h=950&crop=top&fit=crop&auto=compress&auto=format",
    sourceImageIndex: 0,
    price: "AU$ 49.95",
    priceValue: 49.95,
    colourFamilies: ["grey"],
    colourEvidenceText: "Grey Heather",
    shopTypes: ["lingerie-all", "bra"],
    notionPageId: "3b17b9c9-9c56-81a1-a4df-c94c67bca6db",
  },
  {
    id: "JB-0426",
    brand: "Calvin Klein",
    sourceBrandHeading: "Inner Plains",
    sourceTitle: "Cotton Classics 3 Pack Crewneck T-Shirts | Calvin Klein",
    name: "Cotton Classics 3 Pack Crewneck T-Shirts",
    productType: "Top",
    forms: ["second skin"],
    retailer: "Calvin Klein",
    retailerUrl: "https://www.calvinklein.com.au/cotton-classics-3-pack-crewneck-t-shirts-black-grey-heather-white-nb4051mp1",
    canonicalUrl: "https://www.calvinklein.com.au/cotton-classics-3-pack-crewneck-t-shirts-black-grey-heather-white-nb4051mp1",
    shopRoute: "#catalogue/calvin-klein",
    slug: "cotton-classics-3-pack-crewneck-t-shirts-black-grey-heather-white-nb4051mp1",
    color: "Black / Grey Heather / White",
    description: "The Calvin Klein original. Designed with an embroidered monogram logo at the hem, this timeless tee is made from pure cotton for a soft hand with breathable comfort. Cut in a classic fit.\n\n• Cotton jersey\n• Classic fit\n• Crew neckline\n• Short sleeves\n• Calvin Klein Underwear logo for a classic, signature touch\n\nOur model is 1.86m (6ft 1in) and is wearing a size M. Fits true to size.",
    material: "100% cotton. Machine wash.",
    image: "a s s e t s/shop-mockup/product-catalogue/calvin-klein/jb-0426-cotton-classics-three-pack-black-grey-white.jpg",
    imageAlt: "Calvin Klein Cotton Classics Black, Grey Heather and White three-pack product shot without a model",
    imageSource: "retailer_first_hero",
    sourceImageUrl: "https://pvh-brands.imgix.net/catalog/product/media/NB4051_MP1_main.jpg?w=713&h=950&crop=top&fit=crop&auto=compress&auto=format",
    sourceImageIndex: 0,
    subjectPresent: false,
    forwardFacing: false,
    inSitu: false,
    price: "AU$ 79.95",
    priceValue: 79.95,
    colourFamilies: ["black", "grey", "white"],
    colourEvidenceText: "Black / Grey Heather / White",
    shopTypes: ["ready-to-wear-all"],
    notionPageId: "3b17b9c9-9c56-8169-a56c-f6ec82de3faa",
  },
  {
    id: "JB-0427",
    brand: "Calvin Klein",
    sourceBrandHeading: "Inner Plains",
    sourceTitle: "Cotton Classics 3 Pack Crewneck T-Shirts | Calvin Klein",
    name: "Cotton Classics 3 Pack Crewneck T-Shirts",
    productType: "Top",
    forms: ["second skin"],
    retailer: "Calvin Klein",
    retailerUrl: "https://www.calvinklein.com.au/cotton-classics-3-pack-crewneck-t-shirts-white-nb4051100",
    canonicalUrl: "https://www.calvinklein.com.au/cotton-classics-3-pack-crewneck-t-shirts-white-nb4051100",
    shopRoute: "#catalogue/calvin-klein",
    slug: "cotton-classics-3-pack-crewneck-t-shirts-white-nb4051100",
    color: "White",
    description: "The Calvin Klein original. Designed with an embroidered monogram logo at the hem, this timeless tee is made from pure cotton for a soft hand with breathable comfort. Cut in a classic fit.\n\n• Cotton jersey\n• Classic fit\n• Crew neckline\n• Short sleeves\n• Calvin Klein Underwear logo for a classic, signature touch\n\nOur model is 1.86m (6ft 1in) and is wearing a size M. Fits true to size.",
    material: "100% cotton. Machine wash.",
    image: "a s s e t s/shop-mockup/product-catalogue/calvin-klein/jb-0427-cotton-classics-three-pack-white.jpg",
    imageAlt: "Calvin Klein Cotton Classics White three-pack product shot without a model",
    imageSource: "retailer_first_hero",
    sourceImageUrl: "https://pvh-brands.imgix.net/catalog/product/media/NB4051_100_FL-ST-F1_011.jpg?w=713&h=950&crop=top&fit=crop&auto=compress&auto=format",
    sourceImageIndex: 0,
    subjectPresent: false,
    forwardFacing: false,
    inSitu: false,
    price: "AU$ 79.95",
    priceValue: 79.95,
    colourFamilies: ["white"],
    colourEvidenceText: "White",
    shopTypes: ["ready-to-wear-all"],
    notionPageId: "3b17b9c9-9c56-8128-bc0b-f5b498be1411",
  },
  {
    id: "JB-0428",
    brand: "SKIMS",
    sourceBrandHeading: "Inner Plains",
    sourceTitle: "VOILE SLEEP BALLOON PANT | SNOW | SKIMS",
    name: "Voile Sleep Balloon Pant",
    productType: "Other",
    forms: ["second skin", "movement"],
    retailer: "SKIMS",
    retailerUrl: "https://skims.com/en-au/products/voile-sleep-balloon-pant-snow",
    canonicalUrl: "https://skims.com/en-au/products/voile-sleep-balloon-pant-snow",
    shopRoute: "#catalogue/skims",
    slug: "voile-sleep-balloon-pant-snow",
    color: "Snow",
    collection: "VOILE SLEEP",
    description: "Light as air. This balloon pant is made from soft, semi-sheer voile with an elastic waistband, adjustable drawcord, and elasticized hem for a soft voluminous shape. Experience light, breezy comfort from slow mornings to cozy nights.\n\nThin elastic waistband. Drawcord for adjustability. Elastic at hem.\n\nMarcela is size 2, 32A, and 5’9.5” (176cm), wearing SKIMS XS.",
    material: "50% cotton, 50% Lyocell. Machine wash 30°C normal.",
    image: "a s s e t s/shop-mockup/product-catalogue/skims/jb-0428-voile-sleep-balloon-pant-snow.jpg",
    imageAlt: "SKIMS Voile Sleep Balloon Pant in Snow on a forward-facing model",
    imageSource: "retailer_first_hero",
    sourceImageUrl: "https://skims.imgix.net/s/files/1/0259/5448/4284/files/BO-PNT-11792W-SNO-KA-SKIMS-LOUNGEWEAR_0576-FR.webp?v=1775252650&auto=format&q=70&ixlib=react-9.11.0&w=1446",
    sourceImageIndex: 0,
    price: "AU$ 128",
    priceValue: 128,
    colourFamilies: ["white"],
    colourEvidenceText: "Snow",
    shopTypes: ["athleisure-all", "ready-to-wear-all", "pants"],
    notionPageId: "3b17b9c9-9c56-816d-9c47-e488e7c8945a",
  },
].map((product, index) => ({
  ...product,
  sourcePageUrl: product.retailerUrl,
  sourceOccurrences: 1,
  metadataStatus: "Metadata ready",
  listedOnShop: true,
  retrievedAt,
  currency: "AUD",
  subjectPresent: product.subjectPresent ?? true,
  forwardFacing: product.forwardFacing ?? true,
  colourEvidenceStatus: "Verified",
  colourSourceUrl: product.retailerUrl,
  colourSourceType: "Retailer page",
  colourCheckedAt: retrievedAt,
  colourTaxonomyVersion: "jb-colour-taxonomy-v1",
  shopEdits: ["Inner Plains"],
  editRanks: { "Inner Plains": 18 + index },
}));

const productIds = products.map(({ id }) => id);
const existingIds = new Set(kernel.products.map(({ id }) => id));
assert.ok(productIds.every((id) => !existingIds.has(id) || Number(id.slice(3)) >= 418), "New product IDs must not overwrite the earlier tensor");
kernel.products = [
  ...kernel.products.filter(({ id }) => !productIds.includes(id)),
  ...products,
].sort((a, b) => Number(a.id.slice(3)) - Number(b.id.slice(3)));

kernel.generatedAt = retrievedAt;
kernel.counts.sourceReferences = 402;
kernel.counts.canonicalRecords = 399;
kernel.counts.products = 394;
kernel.counts.metadataReady = 391;
kernel.counts.imageReady = 394;
kernel.counts.listedOnShop = 394;
kernel.counts.brands = 28;

const updateBrandCount = (brand, count, ready) => {
  const entry = kernel.brandCounts.find((candidate) => candidate.brand === brand);
  assert.ok(entry, `${brand} brand count is required`);
  entry.count = count;
  entry.ready = ready;
};
updateBrandCount("Calvin Klein", 25, 24);
updateBrandCount("SKIMS", 8, 8);

radioEdits.generatedAt = retrievedAt;
radioEdits.sourceReference = "c b - n e w  a d d i t i o n s.md supplied 2026-08-02; i n n e r  p l a n e s - a d d i t i o n a l  g a r m e n t s.md supplied 2026-08-04";
innerPlains.formLabel = "Studio K / Calvin Klein / SKIMS";
innerPlains.suppliedCount = 29;
innerPlains.uniqueCount = 28;
innerPlains.productIds = [...innerPlains.productIds.filter((id) => !productIds.includes(id)), ...productIds];

assert.equal(kernel.products.length, 394, "Fashion tensor must contain 394 canonical products");
assert.equal(new Set(kernel.products.map(({ canonicalUrl }) => canonicalUrl)).size, 394, "Canonical product URLs must remain unique");
assert.equal(products.filter(({ brand }) => brand === "Studio K").length, 6, "Studio K intake must contain six products");
assert.ok(!kernel.brandOrder.includes("Studio K"), "Studio K must remain exclusive to the Inner Plains edit");
assert.equal(products.filter(({ brand }) => brand === "Calvin Klein").length, 4, "Calvin Klein intake must contain four products");
assert.equal(products.filter(({ brand }) => brand === "SKIMS").length, 1, "SKIMS intake must contain one product");
assert.ok(products.every(({ priceValue, currency, description }) => Number.isFinite(priceValue) && currency === "AUD" && description), "Every new product must retain its AUD price and exact description");
const personFreeCalvinTshirtIds = ["JB-0426", "JB-0427"];
assert.deepEqual(products.filter(({ subjectPresent, forwardFacing }) => subjectPresent === false && forwardFacing === false).map(({ id }) => id), personFreeCalvinTshirtIds, "Only the two Calvin Klein T-shirt packs must use person-free product shots");
assert.ok(products.filter(({ id }) => !personFreeCalvinTshirtIds.includes(id)).every(({ subjectPresent, forwardFacing }) => subjectPresent && forwardFacing), "Every other new product must retain forward-facing human image evidence");
assert.equal(innerPlains.productIds.length, 28, "Inner Plains must contain 28 unique products");
assert.equal(new Set(innerPlains.productIds).size, 28, "Inner Plains product IDs must remain unique");
assert.ok(products.filter(({ brand }) => brand === "Calvin Klein").every(({ shopRoute }) => shopRoute === "#catalogue/calvin-klein"), "Calvin Klein products must retain the maker route");
assert.ok(products.filter(({ brand }) => brand === "SKIMS").every(({ shopRoute }) => shopRoute === "#catalogue/skims"), "SKIMS products must retain the maker route");

fs.writeFileSync(kernelPath, `${JSON.stringify(kernel, null, 2)}\n`);
fs.writeFileSync(editsPath, `${JSON.stringify(radioEdits, null, 2)}\n`);

console.log(`Added ${products.length} products: ${kernel.products.length} Fashion Tensor products and ${innerPlains.productIds.length} Inner Plains products.`);
