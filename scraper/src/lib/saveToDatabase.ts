import { CrawlerResponse } from '@/index';
import supabase from '@/lib/supabase';
import { downloadImage } from '@/lib/utils';

async function saveToDatabase(data: CrawlerResponse) {
  console.log('[DATABASE] Starting save to database:', data.url);

  data.images.forEach(async (img) => {
    const result = await downloadImage(img);
    if (!result) {
      console.error('Failed to download and process the image');
      return;
    }

    const { hash, src } = result;

    const filtered_data = {
      url: data.url,
      title: data.title,
      author: data.author,
      website_name: data.website_name,
      domain: data.domain,
      emails: data.emails,
      image_hash: hash,
      image_url: src
    };

    const { data: dbData, error } = await supabase
      .from('hashed_images')
      .insert(filtered_data)
      .select();

    if (error) {
      console.error('[DATABASE] Error saving to database:', error);
      return;
    }

    console.log('SAVED:', dbData);
  });
}

export default saveToDatabase;
