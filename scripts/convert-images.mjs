import sharp from "sharp";
import { mkdir } from "fs/promises";
import { join } from "path";

const ROOT = "C:/Users/steephenresu/Desktop/AutoDev";
const OUT = join(ROOT, "noel-agritv/public/images");

const products = [
  { src: "From Drive/Product Images/Plant Booster/IMG_4714.PNG", name: "bio-plant-booster" },
  { src: "From Drive/Product Images/Bio Enzyme/IMG_4708.PNG", name: "bio-enzyme" },
  { src: "From Drive/Product Images/Jasmine Seeds/IMG_4719.PNG", name: "jasmine-479-rice-seeds" },
  { src: "From Drive/Product Images/Mayumi Seeds/IMG_4717.PNG", name: "mayumi-rice-seeds" },
];

await mkdir(join(OUT, "products"), { recursive: true });
await mkdir(join(OUT, "categories"), { recursive: true });

// Convert product images — catalog size (500x625) and PDP large (1000x1250)
for (const p of products) {
  const input = join(ROOT, p.src);
  console.log(`Processing ${p.name}...`);

  // Catalog card size
  await sharp(input)
    .resize(500, 625, { fit: "cover" })
    .webp({ quality: 75 })
    .toFile(join(OUT, `products/${p.name}.webp`));

  // PDP hero size
  await sharp(input)
    .resize(1000, 1250, { fit: "cover" })
    .webp({ quality: 80 })
    .toFile(join(OUT, `products/${p.name}-lg.webp`));
}

// Category images — use product photos as category representatives
// Crop Care = Bio Plant Booster photo, Seeds = Jasmine Seeds photo
await sharp(join(ROOT, "From Drive/Product Images/Plant Booster/IMG_4714.PNG"))
  .resize(600, 300, { fit: "cover" })
  .webp({ quality: 75 })
  .toFile(join(OUT, "categories/crop-care.webp"));

await sharp(join(ROOT, "From Drive/Product Images/Jasmine Seeds/IMG_4719.PNG"))
  .resize(600, 300, { fit: "cover" })
  .webp({ quality: 75 })
  .toFile(join(OUT, "categories/seeds.webp"));

// Logo
await sharp(join(ROOT, "From Drive/Logo/IMG_4704.PNG"))
  .resize(96, 96, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .webp({ quality: 90 })
  .toFile(join(OUT, "logo.webp"));

// OG default — create from logo on brand background
await sharp({
  create: { width: 1200, height: 630, channels: 3, background: { r: 23, g: 38, b: 33 } }
})
  .webp({ quality: 80 })
  .toFile(join(OUT, "og-default.webp"));

console.log("Done! All images converted.");
