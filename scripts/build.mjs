import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { minify as minifyHtml } from "html-minifier-terser";
import { transform as minifyCss } from "lightningcss";
import sharp from "sharp";
import { optimize as optimizeSvg } from "svgo";
import { minify as minifyJs } from "terser";

const rootDir = process.cwd();
const distDir = path.join(rootDir, "dist");
const distAssetsDir = path.join(distDir, "assets");

function hashContent(content) {
  return createHash("sha256").update(content).digest("hex").slice(0, 10);
}

function hashedName(name, content) {
  const parsed = path.parse(name);
  return `${parsed.name}.${hashContent(content)}${parsed.ext}`;
}

async function writeHashedFile(directory, name, content) {
  const outputName = hashedName(name, content);
  await writeFile(path.join(directory, outputName), content);
  return outputName;
}

async function buildStyles() {
  const source = await readFile(path.join(rootDir, "styles.css"));
  const result = minifyCss({
    code: source,
    filename: "styles.css",
    minify: true,
    targets: {
      chrome: 107 << 16,
      firefox: 104 << 16,
      safari: 16 << 16,
    },
  });

  return writeHashedFile(distDir, "styles.css", result.code);
}

async function buildScript() {
  const source = await readFile(path.join(rootDir, "script.js"), "utf8");
  const result = await minifyJs(source, {
    compress: {
      passes: 2,
    },
    format: {
      comments: false,
    },
    mangle: true,
    module: true,
  });

  if (!result.code) {
    throw new Error("Terser did not return compiled JavaScript.");
  }

  return writeHashedFile(distDir, "script.js", result.code);
}

async function buildSvg() {
  const source = await readFile(path.join(rootDir, "assets", "favicon.svg"), "utf8");
  const result = optimizeSvg(source, {
    multipass: true,
    path: "assets/favicon.svg",
  });

  if ("error" in result) {
    throw new Error(result.error);
  }

  return writeHashedFile(distAssetsDir, "favicon.svg", result.data);
}

async function buildScreenshot() {
  const sourcePath = path.join(rootDir, "assets", "standup-tracker-ui.png");
  const variants = [];

  for (const width of [352, 704]) {
    const image = sharp(sourcePath).resize({ width, withoutEnlargement: true });
    const avif = await image.clone().avif({ effort: 9, quality: 58 }).toBuffer();
    const webp = await image.clone().webp({ effort: 6, quality: 78 }).toBuffer();
    const png = await image
      .clone()
      .png({ adaptiveFiltering: true, compressionLevel: 9, palette: true, quality: 92 })
      .toBuffer();

    variants.push({
      width,
      avif: await writeHashedFile(distAssetsDir, `standup-tracker-ui-${width}.avif`, avif),
      webp: await writeHashedFile(distAssetsDir, `standup-tracker-ui-${width}.webp`, webp),
      png: await writeHashedFile(distAssetsDir, `standup-tracker-ui-${width}.png`, png),
    });
  }

  return variants;
}

function sourceSet(variants, key) {
  return variants.map((variant) => `assets/${variant[key]} ${variant.width}w`).join(", ");
}

function buildPictureMarkup(variants) {
  const full = variants.find((variant) => variant.width === 704) ?? variants.at(-1);

  return `<picture>
          <source
            type="image/avif"
            srcset="${sourceSet(variants, "avif")}"
            sizes="(width <= 700px) calc(100vw - 3.4rem), 704px"
          >
          <source
            type="image/webp"
            srcset="${sourceSet(variants, "webp")}"
            sizes="(width <= 700px) calc(100vw - 3.4rem), 704px"
          >
          <img
            src="assets/${full.png}"
            srcset="${sourceSet(variants, "png")}"
            sizes="(width <= 700px) calc(100vw - 3.4rem), 704px"
            alt="standup_tracker controls inside the Google Meet People panel"
            width="704"
            height="662"
            loading="lazy"
            decoding="async"
          >
        </picture>`;
}

async function buildHtml({ cssFile, scriptFile, faviconFile, screenshotVariants }) {
  const source = await readFile(path.join(rootDir, "index.html"), "utf8");
  const pictureMarkup = buildPictureMarkup(screenshotVariants);
  const html = source
    .replace('href="assets/favicon.svg"', `href="assets/${faviconFile}"`)
    .replace('href="styles.css"', `href="${cssFile}"`)
    .replace('src="script.js"', `src="${scriptFile}"`)
    .replace(
      /<img\s+src="assets\/standup-tracker-ui\.png"[\s\S]*?width="704"[\s\S]*?height="662"\s*>/,
      pictureMarkup,
    );

  const minified = await minifyHtml(html, {
    collapseBooleanAttributes: true,
    collapseWhitespace: true,
    decodeEntities: true,
    minifyCSS: false,
    minifyJS: false,
    removeAttributeQuotes: false,
    removeComments: true,
    sortAttributes: true,
    sortClassName: false,
  });

  await writeFile(path.join(distDir, "index.html"), minified);
}

async function writeHeaders() {
  await writeFile(
    path.join(distDir, "_headers"),
    `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

/*.html
  Cache-Control: public, max-age=0, must-revalidate

/
  Cache-Control: public, max-age=0, must-revalidate

/*.css
  Cache-Control: public, max-age=31536000, immutable

/*.js
  Cache-Control: public, max-age=31536000, immutable

/assets/*
  Cache-Control: public, max-age=31536000, immutable
`,
  );
}

async function main() {
  await rm(distDir, { force: true, recursive: true });
  await mkdir(distAssetsDir, { recursive: true });

  const [cssFile, scriptFile, faviconFile, screenshotVariants] = await Promise.all([
    buildStyles(),
    buildScript(),
    buildSvg(),
    buildScreenshot(),
  ]);

  await buildHtml({ cssFile, scriptFile, faviconFile, screenshotVariants });
  await writeHeaders();

  console.log(`Built dist/ with ${screenshotVariants.length * 3} responsive screenshot assets.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
