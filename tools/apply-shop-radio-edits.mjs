#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const iam = path.join(root, "i  a m");
const kernelPath = path.join(iam, "shop-product-kernel-v1.json");
const editsPath = path.join(iam, "shop-radio-edits-v1.json");
const today = "2026-08-02";

const champagneIds = [
  "JB-0398", "JB-0399", "JB-0400", "JB-0401", "JB-0033", "JB-0034", "JB-0402", "JB-0037",
  "JB-0152", "JB-0153", "JB-0156", "JB-0087", "JB-0403", "JB-0404", "JB-0405", "JB-0337",
  "JB-0336", "JB-0335", "JB-0339", "JB-0340", "JB-0333", "JB-0334", "JB-0332", "JB-0349",
  "JB-0350", "JB-0348", "JB-0346", "JB-0347", "JB-0345", "JB-0342", "JB-0344", "JB-0343",
  "JB-0341", "JB-0352", "JB-0357", "JB-0351", "JB-0358", "JB-0361", "JB-0362", "JB-0364",
  "JB-0363", "JB-0319", "JB-0317", "JB-0316", "JB-0320", "JB-0318", "JB-0315", "JB-0324",
  "JB-0322", "JB-0330", "JB-0323", "JB-0327", "JB-0130", "JB-0131", "JB-0132", "JB-0199",
  "JB-0200", "JB-0201", "JB-0202", "JB-0203", "JB-0204", "JB-0205", "JB-0206", "JB-0207",
  "JB-0208", "JB-0209", "JB-0210", "JB-0211", "JB-0212", "JB-0213", "JB-0214", "JB-0215",
  "JB-0216", "JB-0217", "JB-0218", "JB-0219", "JB-0220", "JB-0221", "JB-0222", "JB-0223",
  "JB-0224", "JB-0225", "JB-0226", "JB-0227", "JB-0228", "JB-0229", "JB-0230", "JB-0231",
  "JB-0232", "JB-0233", "JB-0234", "JB-0235", "JB-0236", "JB-0237", "JB-0238", "JB-0239",
  "JB-0240",
];

const innerPlanesIds = [
  "JB-0111", "JB-0406", "JB-0407", "JB-0408", "JB-0409", "JB-0410", "JB-0112", "JB-0114",
  "JB-0411", "JB-0412", "JB-0413", "JB-0117", "JB-0118", "JB-0414", "JB-0415", "JB-0416",
  "JB-0417",
];

const notionPageIds = new Map([
  ["JB-0398", "3b07b9c9-9c56-81eb-b3d2-d162197609a3"],
  ["JB-0399", "3b07b9c9-9c56-8123-9631-cc6a6bd400d0"],
  ["JB-0400", "3b07b9c9-9c56-8161-94cd-f0f7cbb7a88e"],
  ["JB-0401", "3b07b9c9-9c56-8128-9696-f6bc3537c5ee"],
  ["JB-0402", "3b07b9c9-9c56-81aa-b1a2-cbb7dee026bc"],
  ["JB-0403", "3b07b9c9-9c56-818e-a950-d05eb74c7c4c"],
  ["JB-0404", "3b07b9c9-9c56-8123-ab14-e88995dd884d"],
  ["JB-0405", "3b07b9c9-9c56-8168-829b-c1bcb72591ae"],
  ["JB-0406", "3b07b9c9-9c56-81d4-924b-ecca45a3b627"],
  ["JB-0407", "3b07b9c9-9c56-81eb-ba0d-c6a12dad7e4f"],
  ["JB-0408", "3b07b9c9-9c56-81c8-bb04-ea116b5fc586"],
  ["JB-0409", "3b07b9c9-9c56-81cd-b4ac-f62456e4a612"],
  ["JB-0410", "3b07b9c9-9c56-811e-8543-f1f3ae9b2a14"],
  ["JB-0411", "3b07b9c9-9c56-812c-84c5-fba6235fbd6b"],
  ["JB-0412", "3b07b9c9-9c56-81c2-8141-d377eb80eeca"],
  ["JB-0413", "3b07b9c9-9c56-818c-9e06-fd5fd5c5d133"],
  ["JB-0414", "3b07b9c9-9c56-81ac-b09e-f1027a9d2687"],
  ["JB-0415", "3b07b9c9-9c56-81dc-b5fd-db579b98e720"],
  ["JB-0416", "3b07b9c9-9c56-8110-9123-d857215ed4fa"],
  ["JB-0417", "3b07b9c9-9c56-81a4-97ce-e26c1d665290"],
]);

const common = ({ id, brand, name, productType, forms, retailer, retailerUrl, canonicalUrl = retailerUrl,
  shopRoute, slug, color, description, priceValue, image, imageAlt, imageSource, sourceImageUrl,
  sourceImageIndex = 0, subjectPresent = true, forwardFacing = true, colourFamilies, shopTypes,
  sourceBrandHeading, sourceTitle = `${name} | ${brand}`, reviewNotes = "", material = "" }) => ({
  id,
  brand,
  sourceBrandHeading,
  sourceTitle,
  name,
  productType,
  forms,
  retailer,
  retailerUrl,
  canonicalUrl,
  sourceOccurrences: 1,
  metadataStatus: "Metadata ready",
  listedOnShop: true,
  shopRoute,
  slug,
  color,
  description,
  material,
  image,
  imageAlt,
  imageSource,
  sourcePageUrl: retailerUrl,
  sourceImageUrl,
  sourceImageIndex,
  retrievedAt: today,
  price: `AU$ ${Number(priceValue).toLocaleString("en-AU", { minimumFractionDigits: priceValue % 1 ? 2 : 0, maximumFractionDigits: 2 })}`,
  priceValue,
  currency: "AUD",
  subjectPresent,
  forwardFacing,
  ...(reviewNotes ? { reviewNotes } : {}),
  colourFamilies,
  colourEvidenceStatus: "Verified",
  colourEvidenceText: color,
  colourSourceUrl: retailerUrl,
  colourSourceType: "Retailer page",
  colourCheckedAt: today,
  colourTaxonomyVersion: "jb-colour-taxonomy-v1",
  shopTypes,
});

const whiteShirt = {
  productType: "Shirt",
  forms: ["ready to wear"],
  shopRoute: "#catalogue/champagne-bohemia",
  colourFamilies: ["white"],
  shopTypes: ["ready-to-wear-all"],
  sourceBrandHeading: "Champagne Bohemia",
};

const additions = [
  common({
    ...whiteShirt,
    id: "JB-0398",
    brand: "Fleur du Mal",
    name: "Juliet Lace Button Down",
    sourceTitle: "Ivory Juliet Lace Button Down | Fleur du Mal",
    retailer: "Fleur du Mal",
    retailerUrl: "https://fleurdumal.com/products/juliet-lace-button-down-ivory",
    slug: "juliet-lace-button-down-ivory",
    color: "Ivory",
    description: "Our Juliet Lace Button Down, featuring cotton placket, collar and cuffs with front button closure. Unisex with a relaxed fit. Unlined. Looks chic layered over the Juliet Lace Bebe Bra and Juliet Lace Short.",
    material: "Lace with cotton placket, collar and cuffs",
    priceValue: 690,
    image: "a s s e t s/shop-mockup/product-catalogue/champagne-bohemia/jb-0398-fleur-du-mal-juliet-lace-button-down.jpg",
    imageAlt: "Fleur du Mal Juliet Lace Button Down in ivory on a forward-facing model",
    imageSource: "retailer_first_hero",
    sourceImageUrl: "https://fleurdumal.com/cdn/shop/files/FDM_050225_0088_full.jpg?v=1773176392",
  }),
  common({
    ...whiteShirt,
    id: "JB-0399",
    brand: "Saint Laurent",
    name: "Oversized Shirt in Cotton Poplin",
    sourceTitle: "oversized shirt in cotton poplin in White | Saint Laurent | YSL AU",
    retailer: "Saint Laurent",
    retailerUrl: "https://www.ysl.com/en-au/pr/oversized-shirt-in-cotton-poplin-865303Y1H489000.html",
    shopRoute: "#catalogue/saint-laurent",
    slug: "oversized-shirt-cotton-poplin-865303y1h489000",
    color: "Blanc",
    description: "Oversized buttoned shirt featuring a pointed collar, exaggerated shoulders, and French cuffs.",
    material: "Cotton poplin",
    priceValue: 2785,
    image: "a s s e t s/shop-mockup/product-catalogue/champagne-bohemia/jb-0399-saint-laurent-oversized-shirt.jpg",
    imageAlt: "Saint Laurent oversized cotton-poplin shirt in Blanc, official front product view",
    imageSource: "retailer_first_hero_product_only",
    sourceImageUrl: "https://saint-laurent.dam.kering.com/asset/1317005d-5805-42c6-8e6f-c9343733a8b0/Large/865303Y1H489000_A.jpg?v=2",
    subjectPresent: false,
    forwardFacing: false,
  }),
  common({
    ...whiteShirt,
    id: "JB-0400",
    brand: "Nili Lotan",
    name: "Yorke Shirt",
    sourceTitle: "Yorke Shirt | Women's Oversized Cotton Shirt | Nili Lotan",
    retailer: "Nili Lotan",
    retailerUrl: "https://www.nililotan.com/products/yorke-oversized-cotton-button-down-shirt?variant=40070804602998",
    canonicalUrl: "https://www.nililotan.com/products/yorke-oversized-cotton-button-down-shirt",
    slug: "yorke-oversized-cotton-button-down-shirt-white",
    color: "White",
    description: "Oversized button down shirt in Italian cotton poplin. Buttoned center front placket and sleeve cuff. Exaggerated shirt-tail hem & body length.",
    material: "100% cotton. Garment-dyed and washed in the USA.",
    priceValue: 590,
    image: "a s s e t s/shop-mockup/product-catalogue/champagne-bohemia/jb-0400-nili-lotan-yorke-shirt.jpg",
    imageAlt: "Nili Lotan Yorke Shirt in white on a forward-facing model",
    imageSource: "retailer_gallery_human_selected",
    sourceImageUrl: "https://www.nililotan.com/cdn/shop/files/NILI_LOTAN_PDP_Reshoot_LOOK_59_20190_c9924659-bd6b-46c4-b276-4c7d6b12e8fa_1800x.jpg?v=1770649945",
    sourceImageIndex: 2,
  }),
  common({
    ...whiteShirt,
    id: "JB-0401",
    brand: "Ioana Ciolacu",
    name: "Split-cuffs Cotton Shirt",
    sourceTitle: "Ioana Ciolacu split-cuffs Cotton Shirt | White | FARFETCH AU",
    retailer: "FARFETCH",
    retailerUrl: "https://www.farfetch.com/au/shopping/women/ioana-ciolacu-split-cuffs-cotton-shirt-item-20211145.aspx",
    slug: "ioana-ciolacu-split-cuffs-cotton-shirt-20211145",
    color: "Off-white",
    description: "Off-white cotton shirt with an oversized pointed collar, front button fastening, long sleeves, split cuffs and a curved hem.",
    material: "Cotton 100%. Machine wash.",
    priceValue: 477,
    image: "a s s e t s/shop-mockup/product-catalogue/champagne-bohemia/jb-0401-ioana-ciolacu-split-cuffs-shirt.webp",
    imageAlt: "Ioana Ciolacu off-white split-cuffs cotton shirt on a forward-facing model",
    imageSource: "retailer_gallery_human_selected",
    sourceImageUrl: "https://cdn-images.farfetch-contents.com/20/21/11/45/20211145_50235445_1000.jpg?ov=true",
    sourceImageIndex: 1,
    reviewNotes: "Current sale price AU$477; retailer also showed AU$711 before discount on 2026-08-02.",
  }),
  common({
    id: "JB-0402",
    brand: "ERES",
    sourceBrandHeading: "Champagne Bohemia",
    sourceTitle: "Aquarelle - Menthe givrée in Peau Douce Naturelle · Luxury Swim | ERES",
    name: "Aquarelle",
    productType: "Swimsuit",
    forms: ["swim"],
    retailer: "ERES",
    retailerUrl: "https://www.eresparis.com/eu/en/swimwear/011402-01618.html",
    shopRoute: "#catalogue/eres",
    slug: "aquarelle-011402-01618",
    color: "Menthe givrée",
    description: "An iconic ERES style loved for its clean lines, this one-piece swimsuit features a straight neckline framed by delicate straps. It shows off all body types.",
    material: "Peau Douce Naturelle: 84% polyamide and 16% spandex.",
    priceValue: 690,
    image: "a s s e t s/shop-mockup/product-catalogue/champagne-bohemia/jb-0402-eres-aquarelle-menthe-givree.jpg",
    imageAlt: "ERES Aquarelle Menthe givrée one-piece swimsuit on a forward-facing model",
    imageSource: "retailer_first_hero",
    sourceImageUrl: "https://www.eresparis.com/on/demandware.static/-/Sites-master/default/dw20c60a79/images/011402_01618_PDP_M_1.jpg",
    colourFamilies: ["green"],
    shopTypes: ["swimwear-all", "swimsuit"],
  }),
  common({
    id: "JB-0403",
    brand: "PUCCI",
    sourceBrandHeading: "Champagne Bohemia",
    sourceTitle: "Vivara Print Bikini Bottom – PUCCI",
    name: "Vivara Print Bikini Bottom",
    productType: "Bikini Bottom",
    forms: ["swim"],
    retailer: "PUCCI",
    retailerUrl: "https://www.pucci.com/en-au/products/vivara-print-bikini-bottom-6hmx126h895p20?xse_prod_code=9022991302811&xse=sm_el_pdp_ymal",
    canonicalUrl: "https://www.pucci.com/en-au/products/vivara-print-bikini-bottom-6hmx126h895p20",
    shopRoute: "#catalogue/pucci",
    slug: "vivara-print-bikini-bottom-6hmx126h895p20",
    color: "Turquoise and Blue",
    description: "A minimalist design that showcases the Vivara print with a balance of graphics and lightness. The low waist and thin adjustable side ties allow for a personalized fit, following naturally the body. Stretch Lycra ensures comfort and freedom of movement, while the Vivara print in shades of turquoise and blue introduces a bold and contemporary visual rhythm. A style designed to complete your bikini with character.\n\nTo offer you a unique Pucci garment, we use an all-over print that makes the product unrepeatable. Therefore, the pattern print may vary from the one displayed in the photo.\n\nMain material: 80% polyamide, 20% elastane. Stretch Lycra. Low waist. Adjustable side ties. Hand wash. Made in Italy. ID: 6HMX126H895P20.",
    material: "80% polyamide, 20% elastane",
    priceValue: 290,
    image: "a s s e t s/shop-mockup/product-catalogue/champagne-bohemia/jb-0403-pucci-vivara-bikini-bottom-turquoise.jpg",
    imageAlt: "PUCCI Vivara Print Bikini Bottom in turquoise and blue, official front product view",
    imageSource: "retailer_first_hero_product_only",
    sourceImageUrl: "https://www.pucci.com/cdn/shop/files/6HMX126H895P20_V1_51a3a8af-e9a4-4bb0-a239-441eb09d092c.jpg?v=1777543597&width=2048",
    subjectPresent: false,
    forwardFacing: false,
    colourFamilies: ["blue"],
    shopTypes: ["swimwear-all", "brief", "bikini"],
  }),
  common({
    id: "JB-0404",
    brand: "PUCCI",
    sourceBrandHeading: "Champagne Bohemia",
    sourceTitle: "Vivara Print Triangle Bikini Top – PUCCI",
    name: "Vivara Print Triangle Bikini Top",
    productType: "Bikini Top",
    forms: ["swim"],
    retailer: "PUCCI",
    retailerUrl: "https://www.pucci.com/en-au/products/vivara-print-triangle-bikini-top-6hmx046h895p19?xse_prod_code=8944551100571&xse=sm_el_pdp_ymal",
    canonicalUrl: "https://www.pucci.com/en-au/products/vivara-print-triangle-bikini-top-6hmx046h895p19",
    shopRoute: "#catalogue/pucci",
    slug: "vivara-print-triangle-bikini-top-6hmx046h895p19",
    color: "Orange and Black",
    description: "A triangle bikini top with a simple, feminine silhouette, enlivened by the graphic energy of the orange and black Vivara print. The thin, adjustable straps at the back allow you to customize the fit, offering comfort and support with a light, contemporary look. Made from Lycra and finished with an inner lining, this is an iconic and versatile style, perfect for pairing with matching briefs for a bold beachwear look.\n\nTo offer you a unique Pucci garment, we use an all-over print that makes the product unrepeatable. Therefore, the pattern print may vary from the one displayed in the photo.\n\nMain material: 80% polyamide, 20% elastane. Lining: 84% polyamide, 16% elastane. Triangle style. Thin adjustable straps at the back. Hand wash. Made in Italy. ID: 6HMX046H895P19.",
    material: "Main: 80% polyamide, 20% elastane. Lining: 84% polyamide, 16% elastane.",
    priceValue: 340,
    image: "a s s e t s/shop-mockup/product-catalogue/champagne-bohemia/jb-0404-pucci-vivara-triangle-bikini-top-orange.jpg",
    imageAlt: "PUCCI Vivara Print Triangle Bikini Top in orange and black, official front product view",
    imageSource: "retailer_first_hero_product_only",
    sourceImageUrl: "https://www.pucci.com/cdn/shop/files/6HMX046H895P19_V1_e71f1d04-667e-413e-a4c3-3b1211450a98.jpg?v=1773673153&width=2048",
    subjectPresent: false,
    forwardFacing: false,
    colourFamilies: ["orange", "black"],
    shopTypes: ["swimwear-all", "bikini"],
  }),
  common({
    id: "JB-0405",
    brand: "PUCCI",
    sourceBrandHeading: "Champagne Bohemia",
    sourceTitle: "Vivara Print Bikini Bottom – PUCCI",
    name: "Vivara Print Bikini Bottom",
    productType: "Bikini Bottom",
    forms: ["swim"],
    retailer: "PUCCI",
    retailerUrl: "https://www.pucci.com/en-au/products/vivara-print-bikini-bottom-6hmx076h895p19?xse_prod_code=8944551133339&xse=sm_el_pdp_ymal",
    canonicalUrl: "https://www.pucci.com/en-au/products/vivara-print-bikini-bottom-6hmx076h895p19",
    shopRoute: "#catalogue/pucci",
    slug: "vivara-print-bikini-bottom-6hmx076h895p19",
    color: "Orange and Black",
    description: "Low-rise bikini bottoms with a minimalist cut, designed for a simple, contemporary look. The thin ties at the hips add a light, feminine detail, allowing you to adjust the fit naturally. The orange and black Vivara print adds energy and character, transforming this style into a statement piece perfect for bold, iconic beachwear.\n\nTo offer you a unique Pucci garment, we use an all-over print that makes the product unrepeatable. Therefore, the pattern print may vary from the one displayed in the photo.\n\nMain material: 80% polyamide, 20% elastane. Low waist. Minimalist cut. Thin ties at the hips. Hand wash. Made in Italy. ID: 6HMX076H895P19.",
    material: "80% polyamide, 20% elastane",
    priceValue: 290,
    image: "a s s e t s/shop-mockup/product-catalogue/champagne-bohemia/jb-0405-pucci-vivara-bikini-bottom-orange.jpg",
    imageAlt: "PUCCI Vivara Print Bikini Bottom in orange and black, official front product view",
    imageSource: "retailer_first_hero_product_only",
    sourceImageUrl: "https://www.pucci.com/cdn/shop/files/6HMX076H895P19_V1_f117238d-1b5b-4f7d-adbd-03090ceabe44.jpg?v=1773673167&width=2048",
    subjectPresent: false,
    forwardFacing: false,
    colourFamilies: ["orange", "black"],
    shopTypes: ["swimwear-all", "brief", "bikini"],
  }),
];

const ckBase = {
  brand: "Calvin Klein",
  sourceBrandHeading: "Inner Planes",
  forms: ["lingerie"],
  retailer: "Calvin Klein",
  shopRoute: "#catalogue/calvin-klein",
  material: "53% cotton, 35% modal, 12% elastane. Machine wash.",
  colourSourceType: "Retailer page",
};

const ckProducts = [
  ["JB-0406", "Icon Cotton Modal Thong", "Thong", "QF8518", "White", 34.95, "icon-cotton-modal-thong-white-qf8518100", "jb-0406-icon-cotton-modal-thong-white.jpg", "QF8518_100_main.jpg", "A Calvin Klein icon. Made with super soft cotton stretch blended with silky modal for a flexible fit and feel. Designed with our new Infinity Bond stitch-free band for seamless, ultimate comfort.\n\nThong cut with minimal back coverage. High leg line. Stitch-free Infinity Bond band. 100% cotton gusset."],
  ["JB-0407", "Icon Cotton Modal Bikini Brief", "Briefs", "QF8520", "White", 34.95, "icon-cotton-modal-bikini-brief-white-qf8520100", "jb-0407-icon-cotton-modal-bikini-brief-white.jpg", "QF8520_100_main.jpg", "A Calvin Klein icon. Made with super soft cotton stretch blended with silky modal for a flexible fit and feel. Designed with our new Infinity Bond stitch-free band for seamless, ultimate comfort.\n\nBikini cut with full back coverage. Stitch-free Infinity Bond band. 100% cotton gusset."],
  ["JB-0408", "Icon Cotton Modal Boyshort", "Briefs", "QF8527", "White", 34.95, "icon-cotton-modal-boyshort-white-qf8527100", "jb-0408-icon-cotton-modal-boyshort-white.jpg", "QF8527_100_main.jpg", "A Calvin Klein icon. Made with super soft cotton stretch blended with silky modal for a flexible fit and feel. Designed with our new Infinity Bond stitch-free band for seamless, ultimate comfort.\n\nBoyshort cut with a low rise waist. Stitch-free Infinity Bond band. 100% cotton gusset."],
  ["JB-0409", "Icon Cotton Modal Long Sleeve Tee Bralette", "Bra", "QF8600", "White", 44.95, "icon-cotton-modal-long-sleeve-tee-bralette-white-qf8600100", "jb-0409-icon-cotton-modal-long-sleeve-tee-bralette-white.jpg", "QF8600_100_main.jpg", "A Calvin Klein icon. Made with super soft cotton stretch blended with silky modal for a flexible fit and feel. Designed with our new Infinity Bond stitch-free band for seamless, ultimate comfort.\n\nPadded cups, crewneck and long sleeves. Hardware-free. For more coverage and a relaxed fit, size up."],
  ["JB-0410", "Icon Cotton Modal Unlined Bralette", "Bra", "QF8493", "White", 49.95, "icon-cotton-modal-unlined-bralette-white-qf8493100", "jb-0410-icon-cotton-modal-unlined-bralette-white.jpg", "QF8493_100_main.jpg", "A Calvin Klein icon. Made with super soft cotton stretch blended with silky modal for a flexible fit and feel. Designed with our new Infinity Bond stitch-free band for seamless, ultimate comfort.\n\nUnlined cups and an easy pullover racerback silhouette. Hardware-free. For more coverage and a relaxed fit, size up."],
  ["JB-0411", "Icon Cotton Modal Metallic Thong", "Briefs", "QF8826", "Black", 34.95, "icon-cotton-modal-metallic-thong-black-qf8826ub1", "jb-0411-icon-cotton-modal-metallic-thong-black.jpg", "QF8826_UB1_main.jpg", "A Calvin Klein icon. Made with a super soft cotton stretch modal blend. Designed with a metallic logo band for lasting comfort.\n\nThong cut with minimal back coverage. Mid rise waist. 100% cotton gusset."],
  ["JB-0412", "Icon Cotton Modal Metallic Triangle Bralette", "Bra", "QF8816", "Black", 69.95, "icon-cotton-modal-metallic-triangle-bralette-black-qf8816ub1", "jb-0412-icon-cotton-modal-metallic-triangle-bralette-black.jpg", "QF8816_UB1_main.jpg", "A Calvin Klein icon. Made with super soft cotton stretch blended with silky modal for a flexible fit and feel. Designed with a metallic logo band for lasting comfort.\n\nLightly lined triangle cups with removable padding, adjustable straps and wirefree support."],
  ["JB-0413", "Icon Cotton Modal Metallic Bikini Briefs", "Briefs", "QF8827", "Black", 34.95, "icon-cotton-modal-metallic-bikini-briefs-black-qf8827ub1", "jb-0413-icon-cotton-modal-metallic-bikini-briefs-black.jpg", "QF8827_UB1_main.jpg", "A Calvin Klein icon. Made with a super soft cotton stretch modal blend. Designed with a metallic logo band for lasting comfort.\n\nBikini cut with full back coverage. Mid rise waist. 100% cotton gusset."],
  ["JB-0414", "Icon Cotton Modal Thong", "Briefs", "QF8518", "Cradle Pink", 34.95, "icon-cotton-modal-thong-cradle-pink-qf85188z6", "jb-0414-icon-cotton-modal-thong-cradle-pink.jpg", "QF8518_8Z6_main.jpg", "A Calvin Klein icon. Made with super soft cotton stretch blended with silky modal for a flexible fit and feel. Designed with our new Infinity Bond stitch-free band for seamless, ultimate comfort.\n\nThong cut with minimal back coverage. High leg line. Stitch-free Infinity Bond band. 100% cotton gusset."],
  ["JB-0415", "Icon Cotton Modal Bikini Brief", "Briefs", "QF8520", "Cradle Pink", 34.95, "icon-cotton-modal-bikini-brief-cradle-pink-qf85208z6", "jb-0415-icon-cotton-modal-bikini-brief-cradle-pink.jpg", "QF8520_8Z6_main.jpg", "A Calvin Klein icon. Made with super soft cotton stretch blended with silky modal for a flexible fit and feel. Designed with our new Infinity Bond stitch-free band for seamless, ultimate comfort.\n\nBikini cut with full back coverage. Stitch-free Infinity Bond band. 100% cotton gusset."],
  ["JB-0416", "Icon Cotton Modal Boyshort", "Briefs", "QF8527", "Cradle Pink", 34.95, "icon-cotton-modal-boyshort-cradle-pink-qf85278z6", "jb-0416-icon-cotton-modal-boyshort-cradle-pink.jpg", "QF8527_8Z6_main.jpg", "A Calvin Klein icon. Made with super soft cotton stretch blended with silky modal for a flexible fit and feel. Designed with our new Infinity Bond stitch-free band for seamless, ultimate comfort.\n\nBoyshort cut with a low rise waist. Stitch-free Infinity Bond band. 100% cotton gusset."],
  ["JB-0417", "Icon Cotton Modal Unlined Bralette", "Bra", "QF8493", "Cradle Pink", 49.95, "icon-cotton-modal-unlined-bralette-cradle-pink-qf84938z6", "jb-0417-icon-cotton-modal-unlined-bralette-cradle-pink.jpg", "QF8493_8Z6_main.jpg", "A Calvin Klein icon. Made with super soft cotton stretch blended with silky modal for a flexible fit and feel. Designed with our new Infinity Bond stitch-free band for seamless, ultimate comfort.\n\nUnlined cups and an easy pullover racerback silhouette. Hardware-free. For more coverage and a relaxed fit, size up."],
].map(([id, name, productType, style, color, priceValue, urlSlug, imageFile, imageFileSource, description]) => common({
  ...ckBase,
  id,
  name,
  sourceTitle: `${name} | Calvin Klein`,
  productType,
  retailerUrl: `https://www.calvinklein.com.au/${urlSlug}`,
  slug: urlSlug,
  color,
  description,
  priceValue,
  image: `a s s e t s/shop-mockup/product-catalogue/calvin-klein/${imageFile}`,
  imageAlt: `Calvin Klein ${name} in ${color} on a forward-facing model`,
  imageSource: "retailer_first_hero",
  sourceImageUrl: `https://pvh-brands.imgix.net/catalog/product/media/${imageFileSource}?w=700&h=933&crop=top&fit=crop&auto=compress&auto=format`,
  colourFamilies: color === "White" ? ["white"] : color === "Black" ? ["black"] : ["pink"],
  shopTypes: ["lingerie-all", productType === "Bra" ? "bra" : "brief"],
}));

additions.push(...ckProducts);
for (const product of additions) product.notionPageId = notionPageIds.get(product.id);

assert.equal(champagneIds.length, 97);
assert.equal(new Set(champagneIds).size, 97);
assert.equal(innerPlanesIds.length, 17);
assert.equal(new Set(innerPlanesIds).size, 17);
assert.equal(additions.length, 20);
assert.equal(new Set(additions.map((product) => product.id)).size, 20);
assert.ok(additions.every((product) => product.notionPageId), "Every new product must retain its live Notion tensor record");

const kernel = JSON.parse(fs.readFileSync(kernelPath, "utf8"));
const additionsById = new Map(additions.map((product) => [product.id, product]));
const existingAdditionCount = kernel.products.filter((product) => additionsById.has(product.id)).length;
kernel.products = kernel.products.filter((product) => !additionsById.has(product.id));
kernel.products.push(...additions);
kernel.products.sort((a, b) => Number(a.id.slice(3)) - Number(b.id.slice(3)));

const editRanks = new Map([
  ...champagneIds.map((id, index) => [id, ["Champagne Bohemia", index + 1]]),
  ...innerPlanesIds.map((id, index) => [id, ["Inner Planes", index + 1]]),
]);
for (const product of kernel.products) {
  const edit = editRanks.get(product.id);
  if (!edit) continue;
  product.shopEdits = [edit[0]];
  product.editRanks = { [edit[0]]: edit[1] };
}

const brandCounts = new Map(kernel.brandOrder.map((brand) => [brand, 0]));
for (const product of kernel.products) {
  if (product.listedOnShop && brandCounts.has(product.brand)) brandCounts.set(product.brand, brandCounts.get(product.brand) + 1);
}
kernel.brandCounts = kernel.brandOrder.map((brand) => ({
  brand,
  count: brandCounts.get(brand),
  ready: kernel.products.filter((product) => product.brand === brand && product.metadataStatus === "Metadata ready").length,
  route: `#catalogue/${String(brand).normalize("NFKD").replace(/[^\w\s-]/g, "").trim().toLowerCase().replace(/\s+/g, "-").replace(/-+/g, "-")}`,
}));
kernel.generatedAt = today;
kernel.counts = {
  ...kernel.counts,
  sourceReferences: Number(kernel.counts.sourceReferences || 0) + (20 - existingAdditionCount),
  canonicalRecords: Number(kernel.counts.canonicalRecords || 0) + (20 - existingAdditionCount),
  products: kernel.products.length,
  brands: kernel.brandOrder.length,
  metadataReady: kernel.products.filter((product) => product.metadataStatus === "Metadata ready").length,
  imageReady: kernel.products.filter((product) => product.image).length,
  listedOnShop: kernel.products.filter((product) => product.listedOnShop).length,
};
kernel.editorialEditAuthority = {
  version: "jb-radio-edits-v1",
  manifest: "shop-radio-edits-v1.json",
  membershipField: "shopEdits",
};

const edits = {
  version: 1,
  generatedAt: today,
  authority: "Ben-supplied exact retailer URLs reconciled to the Notion Fashion Tensor and canonical Shop product kernel",
  sourceReference: "c b - n e w  a d d i t i o n s.md supplied 2026-08-02",
  catalogues: [
    {
      brand: "Champagne Bohemia",
      slug: "champagne-bohemia",
      route: "#catalogue/champagne-bohemia",
      placementAfter: "WARDROBE.NYC",
      formLabel: "swim / ready to wear / movement",
      suppliedCount: 97,
      uniqueCount: 97,
      productIds: champagneIds,
    },
    {
      brand: "Inner Planes",
      slug: "inner-planes",
      route: "#catalogue/inner-planes",
      placementAfter: "Champagne Bohemia",
      formLabel: "Calvin Klein / lingerie",
      suppliedCount: 18,
      uniqueCount: 17,
      duplicateProductIds: ["JB-0117"],
      productIds: innerPlanesIds,
    },
  ],
};

const allIds = new Set(kernel.products.map((product) => product.id));
for (const catalogue of edits.catalogues) {
  for (const id of catalogue.productIds) assert.ok(allIds.has(id), `${catalogue.brand} references missing product ${id}`);
}
assert.equal(kernel.products.length, 383);
assert.equal(new Set(kernel.products.map((product) => product.id)).size, 383);
assert.equal(new Set(kernel.products.map((product) => product.canonicalUrl)).size, 383);
assert.equal(kernel.products.filter((product) => product.brand === "Calvin Klein").length, 21);
assert.ok(!kernel.brandOrder.includes("Fleur du Mal"));
assert.ok(!kernel.brandOrder.includes("Nili Lotan"));
assert.ok(!kernel.brandOrder.includes("Ioana Ciolacu"));

fs.writeFileSync(kernelPath, `${JSON.stringify(kernel, null, 2)}\n`);
fs.writeFileSync(editsPath, `${JSON.stringify(edits, null, 2)}\n`);

console.log(`Applied ${additions.length} new products, ${champagneIds.length} Champagne Bohemia placements and ${innerPlanesIds.length} unique Inner Planes placements.`);
