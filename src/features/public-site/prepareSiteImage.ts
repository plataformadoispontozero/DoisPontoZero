export const MAX_SITE_IMAGE_SOURCE_BYTES = 50 * 1024 * 1024;
export const MAX_SITE_IMAGE_UPLOAD_BYTES = 2 * 1024 * 1024;
const supported = ['image/jpeg', 'image/png', 'image/webp'];
function dimensions(bytes: Uint8Array): [number, number] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length > 24 && bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71) return [view.getUint32(16), view.getUint32(20)];
  if (bytes[0] === 255 && bytes[1] === 216) {
    let position = 2;
    while (position + 9 < bytes.length) {
      if (bytes[position++] !== 255) continue;
      const marker = bytes[position++];
      if (marker === 255) { position--; continue; }
      if (marker === 0 || marker === 216 || marker === 217 || marker >= 208 && marker <= 215) continue;
      const length = view.getUint16(position);
      if (length < 2) break;
      if ([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)) return [view.getUint16(position + 5), view.getUint16(position + 3)];
      position += length;
    }
  }
  if (bytes.length > 30 && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') {
    const type = String.fromCharCode(...bytes.slice(12, 16));
    if (type === 'VP8X') return [1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16), 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16)];
    if (type === 'VP8 ') return [view.getUint16(26, true) & 16383, view.getUint16(28, true) & 16383];
    if (type === 'VP8L') { const bits = view.getUint32(21, true); return [(bits & 16383) + 1, ((bits >>> 14) & 16383) + 1]; }
  }
  throw Error('Não foi possível ler as dimensões desta imagem. Exporte novamente como PNG, JPG ou WebP.');
}
function encode(canvas: HTMLCanvasElement, quality: number) { return new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(Error('Não foi possível preparar a imagem.')), 'image/webp', quality)); }
export async function prepareSiteImage(file: File): Promise<Blob> {
  if (!supported.includes(file.type)) throw Error('Use PNG, JPG ou WebP.');
  if (file.size > MAX_SITE_IMAGE_SOURCE_BYTES) throw Error('Cada imagem pode ter até 50 MiB antes do processamento.');
  const [width, height] = dimensions(new Uint8Array(await file.slice(0, 1024 * 1024).arrayBuffer()));
  if (!width || !height || width > 16000 || height > 16000 || width * height > 60000000) throw Error('Use imagens de até 60 megapixels e no máximo 16.000 pixels por lado.');
  const ratio = Math.min(1, 2560 / Math.max(width, height));
  const bitmap = await createImageBitmap(file, { resizeWidth: Math.max(1, Math.round(width * ratio)), resizeHeight: Math.max(1, Math.round(height * ratio)), resizeQuality: 'high' });
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width; canvas.height = bitmap.height;
  try {
    const context = canvas.getContext('2d');
    if (!context) throw Error('Seu navegador não disponibilizou o processamento de imagens.');
    context.drawImage(bitmap, 0, 0);
    let blob = await encode(canvas, .86);
    if (blob.type !== 'image/webp') throw Error('Seu navegador não conseguiu converter a imagem para WebP.');
    for (const quality of [.72, .58, .42]) { if (blob.size <= MAX_SITE_IMAGE_UPLOAD_BYTES) break; blob = await encode(canvas, quality); }
    if (blob.size > MAX_SITE_IMAGE_UPLOAD_BYTES) throw Error('Não foi possível reduzir esta imagem para o limite de armazenamento de 2 MiB. Use uma versão mais simples.');
    return blob;
  } finally { bitmap.close(); canvas.width = 0; canvas.height = 0; }
}
