import { CrawlerResponse } from '@/index';
import supabase from '@/lib/supabase';
import { downloadImage } from '@/lib/utils';
import { faker } from '@faker-js/faker';

async function saveToDatabase(data: CrawlerResponse) {
  console.log('[DATABASE] Starting save to database:', data.url);

  data.images.forEach(async (img) => {
    const result = await downloadImage(img);
    if (!result) {
      console.error('Failed to download and process the image');
      return;
    }

    const { hash, src } = result;

    const random = faker.internet;

    const filtered_data = {
      url: data.url,
      title: faker.lorem.words({ min: 2, max: 4 }),
      author: faker.person.fullName(),
      website_name: random.displayName(),
      domain: random.domainName(),
      emails: ['amanchand012@gmail.com'],
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

    console.log(dbData);
  });
}

export default saveToDatabase;
