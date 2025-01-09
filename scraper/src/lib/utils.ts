import { randomBytes } from 'crypto';
import axios from 'axios';
import sharp from 'sharp';
import phash from 'sharp-phash';
import supabase from './supabase';

export function isDevMode() {
  return process.env.NODE_ENV === 'development';
}

export function generateRandomString() {
  return randomBytes(16).toString('hex');
}

export function randomDelay(
  min: number = 5000,
  max: number = 10000
): Promise<void> {
  return new Promise((resolve) => {
    const delay = Math.random() * (max - min) + min;
    setTimeout(resolve, delay);
  });
}

export function extractDomainNameFromUrl(url: string): string {
  const hostname = new URL(url).hostname;

  const match = hostname.match(
    /([a-z0-9-]+)\.(?:[a-z]{2,}|[a-z]{2,}\.[a-z]{2,})$/i
  );

  return match ? match[1] : hostname;
}

export async function downloadImage(img: { src: string; alt: string }) {
  try {
    const response = await axios({
      method: 'GET',
      url: img.src,
      responseType: 'arraybuffer'
    });

    const contentType = response.headers['content-type'];
    let extension = '';
    if (contentType.includes('jpeg')) {
      extension = '.jpg';
    } else if (contentType.includes('jpg')) {
      extension = '.jpg';
    } else if (contentType.includes('png')) {
      extension = '.png';
    } else {
      console.log('[DOWNLOAD] Unsupported image type');
      return null;
    }

    const image = sharp(response.data);
    const metadata: any = await image.metadata();

    if (metadata.width > 200 && metadata.height > 200) {
      const fileName = `${generateRandomString()}${extension}`;

      const buffer = Buffer.from(response.data);

      const { data, error } = await supabase.storage
        .from('private_images')
        .upload(fileName, buffer, {
          cacheControl: '86400',
          upsert: true,
          contentType: contentType
        });

      if (error) {
        console.error('[DOWNLOAD] Storage upload error:', {
          cause: error.cause,
          message: error.message
        });
        return null;
      }

      if (!data) {
        console.error('[DOWNLOAD] No data returned from upload');
        return null;
      }

      console.log(
        '[DOWNLOAD] Image uploaded successfully:',
        data.path,
        'Full:',
        data.fullPath
      );

      const { data: urlData } = supabase.storage
        .from('private_images')
        .getPublicUrl(data.path);

      const hash = await phash(response.data);

      return { hash, src: urlData.publicUrl };
    } else {
      console.log('[DOWNLOAD] Image is too small, skipping');
    }
  } catch (error) {
    console.error('[DOWNLOAD] Error downloading the image:', error);
  }
}
