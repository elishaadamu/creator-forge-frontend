import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function removeBackground() {
  const inputPath = '/Users/mac/Documents/creator-forge/frontend/public/images/hero_astronaut_rocket.jpg';
  const outputPath = '/Users/mac/Documents/creator-forge/frontend/public/images/hero_astronaut_rocket.png';

  const image = sharp(inputPath);
  const metadata = await image.metadata();
  const { width, height } = metadata;

  // Extract raw RGBA buffer
  const rawBuffer = await image.ensureAlpha().raw().toBuffer();

  // Find background color from corner samples
  // Sample (5, 5)
  const getPixel = (x, y) => {
    const idx = (y * width + x) * 4;
    return [rawBuffer[idx], rawBuffer[idx + 1], rawBuffer[idx + 2], rawBuffer[idx + 3]];
  };

  const c1 = getPixel(10, 10);
  const c2 = getPixel(width - 10, 10);
  const c3 = getPixel(10, height - 10);
  const c4 = getPixel(width - 10, height - 10);

  const bgR = Math.round((c1[0] + c2[0] + c3[0] + c4[0]) / 4);
  const bgG = Math.round((c1[1] + c2[1] + c3[1] + c4[1]) / 4);
  const bgB = Math.round((c1[2] + c2[2] + c3[2] + c4[2]) / 4);

  console.log(`Background sampled RGB: ${bgR}, ${bgG}, ${bgB}`);

  // Create a visited 2D grid for flood-fill from border
  // Only flood from the borders to prevent removing white/cream inside the astronaut or rocket!
  const isVisited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;

  const colorDist = (r, g, b) => {
    const dr = r - bgR;
    const dg = g - bgG;
    const db = b - bgB;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  };

  // Thresholds for solid background vs feathered edge
  const solidThreshold = 22; // Completely transparent
  const featherThreshold = 42; // Soft feathered anti-aliasing

  // Push all 4 borders into flood queue
  for (let x = 0; x < width; x++) {
    // Top border
    queue[tail++] = (0 * width) + x;
    isVisited[(0 * width) + x] = 1;
    // Bottom border
    queue[tail++] = ((height - 1) * width) + x;
    isVisited[((height - 1) * width) + x] = 1;
  }
  for (let y = 1; y < height - 1; y++) {
    // Left border
    queue[tail++] = (y * width) + 0;
    isVisited[(y * width) + 0] = 1;
    // Right border
    queue[tail++] = (y * width) + (width - 1);
    isVisited[(y * width) + (width - 1)] = 1;
  }

  // BFS Flood Fill from edges
  while (head < tail) {
    const p = queue[head++];
    const px = p % width;
    const py = Math.floor(p / width);
    const idx = p * 4;

    const r = rawBuffer[idx];
    const g = rawBuffer[idx + 1];
    const b = rawBuffer[idx + 2];

    const dist = colorDist(r, g, b);

    if (dist < solidThreshold) {
      rawBuffer[idx + 3] = 0; // 100% transparent
    } else if (dist < featherThreshold) {
      const alphaFactor = (dist - solidThreshold) / (featherThreshold - solidThreshold);
      rawBuffer[idx + 3] = Math.round(alphaFactor * 255);
    } else {
      // Reached foreground boundary, don't expand further
      continue;
    }

    // Neighbors (4-way)
    const neighbors = [
      px > 0 ? p - 1 : -1,
      px < width - 1 ? p + 1 : -1,
      py > 0 ? p - width : -1,
      py < height - 1 ? p + width : -1
    ];

    for (const n of neighbors) {
      if (n !== -1 && !isVisited[n]) {
        isVisited[n] = 1;
        queue[tail++] = n;
      }
    }
  }

  // Write out transparent PNG
  await sharp(rawBuffer, {
    raw: {
      width,
      height,
      channels: 4
    }
  })
  .png({ compressionLevel: 9 })
  .toFile(outputPath);

  console.log(`Saved transparent hero astronaut PNG to ${outputPath}`);
}

removeBackground().catch(err => {
  console.error(err);
  process.exit(1);
});
