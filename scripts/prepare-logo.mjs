import sharp from "sharp";

const [source, destination, iconDestination] = process.argv.slice(2);

if (!source || !destination || !iconDestination) {
  throw new Error("Usage: node scripts/prepare-logo.mjs <source> <destination> <icon>");
}

const { data, info } = await sharp(source)
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height, channels } = info;
const pixels = new Uint8Array(width * height * 4);
const background = new Uint8Array(width * height);
const queue = new Int32Array(width * height);
let head = 0;
let tail = 0;

function isBackgroundCandidate(index) {
  const offset = index * channels;
  return data[offset] > 242 && data[offset + 1] > 242 && data[offset + 2] > 242;
}

function enqueue(index) {
  if (background[index] || !isBackgroundCandidate(index)) return;
  background[index] = 1;
  queue[tail++] = index;
}

for (let x = 0; x < width; x += 1) {
  enqueue(x);
  enqueue((height - 1) * width + x);
}

for (let y = 0; y < height; y += 1) {
  enqueue(y * width);
  enqueue(y * width + width - 1);
}

while (head < tail) {
  const index = queue[head++];
  const x = index % width;
  const y = Math.floor(index / width);
  if (x > 0) enqueue(index - 1);
  if (x + 1 < width) enqueue(index + 1);
  if (y > 0) enqueue(index - width);
  if (y + 1 < height) enqueue(index + width);
}

for (let index = 0; index < width * height; index += 1) {
  const sourceOffset = index * channels;
  const targetOffset = index * 4;
  pixels[targetOffset] = data[sourceOffset];
  pixels[targetOffset + 1] = data[sourceOffset + 1];
  pixels[targetOffset + 2] = data[sourceOffset + 2];
  pixels[targetOffset + 3] = background[index] ? 0 : 255;
}

const transparentLogo = sharp(pixels, {
  raw: { width, height, channels: 4 },
}).trim({ background: { r: 255, g: 255, b: 255, alpha: 0 } });

await transparentLogo.clone().resize(768, 768, { fit: "inside" }).png().toFile(destination);
await transparentLogo.clone().resize(192, 192, { fit: "contain" }).png().toFile(iconDestination);

