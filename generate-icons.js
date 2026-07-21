const fs = require('fs');
const path = require('path');

function createPNG(width, height) {
  const size = width * height * 4;
  const headerSize = 122;

  function crc32(buf) {
    let c, table = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      table[n] = c;
    }
    c = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  function writeUint32BE(buf, val, offset) {
    buf[offset] = (val >>> 24) & 0xFF;
    buf[offset + 1] = (val >>> 16) & 0xFF;
    buf[offset + 2] = (val >>> 8) & 0xFF;
    buf[offset + 3] = val & 0xFF;
  }

  function writeUint16LE(buf, val, offset) {
    buf[offset] = val & 0xFF;
    buf[offset + 1] = (val >>> 8) & 0xFF;
  }

  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    for (let x = 0; x < width; x++) {
      const offset = y * (width * 4 + 1) + 1 + x * 4;
      const cx = x - width / 2;
      const cy = y - height / 2;
      const dist = Math.sqrt(cx * cx + cy * cy);
      const radius = width / 2 - 4;

      if (dist < radius) {
        raw[offset] = 26;
        raw[offset + 1] = 35;
        raw[offset + 2] = 126;
        raw[offset + 3] = 255;

        const letterX = (x - width * 0.3) / (width * 0.12);
        const letterY = (y - height * 0.5) / (height * 0.2);
        const letterX2 = (x - width * 0.7) / (width * 0.12);
        const inO = Math.abs(letterX) < 1 && Math.abs(letterY) < 1 && !(Math.abs(letterX) < 0.6 && Math.abs(letterY) < 0.6);
        const inS1 = letterX2 > -0.8 && letterX2 < 0.8 && letterY > -1 && letterY < -0.3 && Math.abs(letterY + 0.3) > 0.15;
        const inS2 = letterX2 > -0.8 && letterX2 < 0.8 && letterY > -0.3 && letterY < 0.4;
        const inS3 = letterX2 > -0.8 && letterX2 < 0.8 && letterY > 0.4 && letterY < 1 && Math.abs(letterY - 0.4) > 0.15;

        if (inO || inS1 || inS2 || inS3) {
          raw[offset] = 255;
          raw[offset + 1] = 255;
          raw[offset + 2] = 255;
          raw[offset + 3] = 255;
        }
      } else {
        raw[offset] = 0;
        raw[offset + 1] = 0;
        raw[offset + 2] = 0;
        raw[offset + 3] = 0;
      }
    }
  }

  const zlib = require('zlib');
  const compressed = zlib.deflateSync(raw);

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  writeUint32BE(ihdrData, width, 0);
  writeUint32BE(ihdrData, height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  function makeChunk(type, data) {
    const typeBuffer = Buffer.from(type);
    const lenBuffer = Buffer.alloc(4);
    writeUint32BE(lenBuffer, data.length, 0);
    const crcData = Buffer.concat([typeBuffer, data]);
    const crcBuffer = Buffer.alloc(4);
    writeUint32BE(crcBuffer, crc32(crcData), 0);
    return Buffer.concat([lenBuffer, typeBuffer, data, crcBuffer]);
  }

  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), createPNG(192, 192));
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), createPNG(512, 512));

console.log('Icons created!');
