/** Export an actual cropped social image; external crawlers cannot use CSS framing. */
import {parseMediaFrame} from './media-framing.mjs';

export function socialCropRect(width, height, frame, targetWidth = 1200, targetHeight = 630) {
  const cover = Math.max(targetWidth / width, targetHeight / height);
  const cropWidth = targetWidth / (cover * frame.zoom);
  const cropHeight = targetHeight / (cover * frame.zoom);
  return {x: (width - cropWidth) * frame.x / 100, y: (height - cropHeight) * frame.y / 100, width: cropWidth, height: cropHeight};
}

export async function exportSocialImageFrame(src, value) {
  const frame = parseMediaFrame(value, src);
  if (!frame) throw Error('Paylaşım görselinin kadrajı geçersiz.');
  const image = new Image();
  image.crossOrigin = 'anonymous';
  await new Promise((resolve, reject) => {
    const finish = error => {clearTimeout(timer);image.onload = null;image.onerror = null;error ? reject(error) : resolve();};
    const timer = setTimeout(() => {image.src = '';finish(Error('Görsel yüklenemedi. Dosyayı medya arşivine yükleyip yeniden deneyin.'));}, 15000);
    image.onload = () => finish();
    image.onerror = () => finish(Error('Bu kaynaktan görsel alınamıyor. Dosyayı medya arşivine yükleyip yeniden deneyin.'));
    image.src = src;
  });
  if (!image.naturalWidth || !image.naturalHeight) throw Error('Görsel boyutları okunamadı.');
  const area = socialCropRect(image.naturalWidth, image.naturalHeight, frame.desktop);
  const canvas = document.createElement('canvas');
  canvas.width = 1200; canvas.height = 630;
  const context = canvas.getContext('2d');
  if (!context) throw Error('Bu tarayıcı görsel oluşturmayı desteklemiyor.');
  context.fillStyle = '#111c33';context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height);
  try {
    const blob = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(Error('Görsel oluşturulamadı.')), 'image/jpeg', .94));
    return new File([blob], 'paylasim-kadraj-1200x630.jpg', {type: 'image/jpeg'});
  } catch (error) {
    if (error.name === 'SecurityError') throw Error('Bu dış kaynak kırpmaya izin vermiyor. Görseli medya arşivine yükleyip yeniden deneyin.');
    throw error;
  }
}
