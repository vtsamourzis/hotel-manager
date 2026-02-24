import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, '..', 'public');

const svgContent = (size) => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.12)}" fill="hsl(198, 72%, 24%)"/>
  <text x="50%" y="50%" font-family="Arial,Helvetica,sans-serif" font-size="${Math.round(size * 0.5)}" font-weight="bold"
        fill="white" text-anchor="middle" dominant-baseline="central">H</text>
</svg>`;

await sharp(Buffer.from(svgContent(192)))
  .png()
  .toFile(join(publicDir, 'icon-192x192.png'));
console.log('Generated: public/icon-192x192.png');

await sharp(Buffer.from(svgContent(512)))
  .png()
  .toFile(join(publicDir, 'icon-512x512.png'));
console.log('Generated: public/icon-512x512.png');
