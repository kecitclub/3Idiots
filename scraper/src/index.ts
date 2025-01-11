import 'dotenv/config';
import { PlaywrightCrawler, RequestQueue } from 'crawlee';
import {
  randomDelay,
  generateRandomString,
  extractDomainNameFromUrl
} from '@/lib/utils';
import saveToDatabase from '@/lib/saveToDatabase';

type CrawleeRequest = {
  url: string;
  label: string;
  uniqueKey: string;
  userData?: Object;
};

export type CrawlerResponse = {
  url: string;
  title: string;
  website_name: string;
  author: string;
  domain: string;
  images: { src: string; alt: string }[];
  emails: string[];
};

async function mainScraper() {
  const urls: string[] = ['https://pictures-galleryy.netlify.app/'];

  const START_URLS: CrawleeRequest[] = [];
  for (const url of urls) {
    START_URLS.push({
      url,
      label: 'START',
      uniqueKey: generateRandomString()
    });
  }

  const requestQueue = await RequestQueue.open(`QUEUE-${Date.now()}`);

  const crawler = new PlaywrightCrawler({
    requestQueue,
    minConcurrency: 1,
    maxConcurrency: 5,
    maxRequestRetries: 3,
    launchContext: {
      launchOptions: {
        headless: false
      }
    }
    // proxyConfiguration: new ProxyConfiguration({
    //   proxyUrls: ['']
    // }),
    // preNavigationHooks: [
    //   async (crawlingContext) => {
    //     const { page } = crawlingContext;
    //     await page.context().addCookies();
    //   }
    // ]
  });

  crawler.router.addHandler('START', async ({ request, page }) => {
    console.log(`[START] Extracting URLS from: ${request.url}`);

    await page.waitForLoadState('domcontentloaded');
    randomDelay(250, 750);

    const urls: CrawleeRequest[] = [];
    const domainName = extractDomainNameFromUrl(request.url);

    let prevHeight = -1;
    const maxScrolls = 3;
    let scrollCount = 0;

    while (scrollCount < maxScrolls) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
      const newHeight = await page.evaluate(() => document.body.scrollHeight);
      if (newHeight === prevHeight) {
        break;
      }
      prevHeight = newHeight;
      scrollCount++;
    }

    const links = await page
      .locator('a[href]:not([href=""])')
      .evaluateAll((elements: HTMLAnchorElement[]) => {
        return elements
          .map((link) => {
            try {
              const href = link.href;
              if (!href) return null;
              return new URL(href, window.location.origin).href;
            } catch {
              return null;
            }
          })
          .filter((href): href is string => {
            if (!href) return false;
            try {
              const url = new URL(href);
              return url.protocol === 'http:' || url.protocol === 'https:';
            } catch {
              return false;
            }
          });
      });

    const uniqueLinks = [...new Set(links)];

    for (const link of uniqueLinks) {
      const url = new URL(link).href;

      const nonNavigableExtensions = [
        'pdf',
        'doc',
        'docx',
        'xls',
        'xlsx',
        'ppt',
        'pptx',
        'odt',
        'jpg',
        'jpeg',
        'png',
        'gif',
        'bmp',
        'tiff',
        'webp',
        'ico',
        'svg',
        'mp3',
        'wav',
        'aac',
        'ogg',
        'm4a',
        'mp4',
        'avi',
        'mkv',
        'mov',
        'wmv',
        'flv',
        'webm',
        'zip',
        'rar',
        '7z',
        'tar',
        'gz',
        'iso',
        'exe',
        'msi',
        'bat',
        'sh',
        'bin',
        'run',
        'apk',
        'dll',
        'so',
        'bin',
        'dat',
        'dmg'
      ];

      if (nonNavigableExtensions.some((ext) => url.endsWith(`.${ext}`))) {
        continue;
      }

      if (url.includes(domainName)) {
        urls.push({
          url: link,
          label: 'DETAIL',
          uniqueKey: generateRandomString()
        });
      }
    }

    console.log(`Found ${urls.length} urls:`, urls);

    if (urls.length === 0) {
      urls.push({
        url: request.url,
        label: 'DETAIL',
        uniqueKey: generateRandomString()
      });
    }

    await crawler.addRequests(urls);
  });

  crawler.router.addHandler('DETAIL', async ({ request, page }) => {
    console.log(`[DETAIL] Extracting DATA from: ${request.url}`);

    await page.waitForLoadState('domcontentloaded');
    randomDelay(250, 750);

    const domainName = extractDomainNameFromUrl(request.url);

    let prevHeight = -1;
    const maxScrolls = 3;
    let scrollCount = 0;

    while (scrollCount < maxScrolls) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
      const newHeight = await page.evaluate(() => document.body.scrollHeight);
      if (newHeight === prevHeight) {
        break;
      }
      prevHeight = newHeight;
      scrollCount++;
    }

    try {
      await page.waitForSelector('img', { timeout: 5000 });
    } catch (error) {
      console.error(`[DETAIL] Timeout waiting for image selector: ${error}`);
      return;
    }

    const metaAuthor = await page
      .$eval(
        'meta[name="author"]',
        (meta: HTMLMetaElement) => meta?.content || null
      )
      .catch(() => null);

    const ogAuthor = await page
      .$eval(
        'meta[property="og:author"]',
        (meta: HTMLMetaElement) => meta?.content || null
      )
      .catch(() => null);

    const structuredAuthor = await page
      .$eval('script[type="application/ld+json"]', (script) => {
        try {
          // @ts-ignore
          const jsonData = JSON.parse(script.innerText);
          if (jsonData.author) {
            return jsonData.author.name || jsonData.author;
          }
        } catch (error) {
          console.log('Error parsing JSON-LD:', error);
        }
        return null;
      })
      .catch(() => null);

    const raw_images = await page.$$eval('img', (imgs) => {
      return imgs.map((img) => ({
        src: img.src,
        alt: img.alt || ''
      }));
    });

    const images: {
      src: string;
      alt: string;
    }[] = [
      ...new Map(
        raw_images
          .filter(
            (img) =>
              !img.src.endsWith('.svg') &&
              !img.src.includes('logo') &&
              !img.src.includes('favicon')
          )
          .map((img) => [img.src, img])
      ).values()
    ];

    const pageContent = await page.content();
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
    const raw_emails = pageContent.match(emailRegex) || [];
    const processed_emails: string[] = raw_emails
      .map((email) => {
        if (
          email.includes('contact') ||
          email.includes('mailto') ||
          email.includes('info') ||
          email.includes(domainName) ||
          email.includes('aman')
        ) {
          return email;
        }
        return null;
      })
      .filter((email) => email !== null);

    const emails: string[] = [...new Set(processed_emails)];

    const data: CrawlerResponse = {
      url: request.url,
      title: (await page.title()) || '',
      website_name: domainName,
      author: metaAuthor || ogAuthor || structuredAuthor || domainName,
      domain: new URL(request.url).hostname,
      images: images,
      emails: emails || ['']
    };

    if (data.images.length > 0) {
      await saveToDatabase(data);
    }
  });

  try {
    await crawler.run(START_URLS);
  } finally {
    await requestQueue.drop();
  }
}

mainScraper();
