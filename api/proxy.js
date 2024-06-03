import chrome from '@sparticuz/chrome-aws-lambda';
import puppeteer from 'puppeteer-core';

export default async (req, res) => {
  const targetUrl = req.query.url;

  console.log('Received request for URL:', targetUrl);

  if (!targetUrl) {
    console.log('Missing target URL');
    res.status(400).json({ error: 'Missing target URL' });
    return;
  }

  try {
    const executablePath = await chrome.executablePath;

    console.log('Chrome executable path:', executablePath);

    if (!executablePath) {
      console.log('Chrome executable path not found');
      res.status(500).json({ error: 'Chrome executable path not found' });
      return;
    }

    const browser = await puppeteer.launch({
      args: chrome.args,
      executablePath,
      headless: chrome.headless,
    });
    const page = await browser.newPage();

    console.log('Navigating to:', targetUrl);
    await page.goto(targetUrl, {
      waitUntil: 'networkidle2'
    });

    console.log('Page loaded, stripping security headers');
    await page.evaluate(() => {
      document.querySelectorAll('head > meta[http-equiv="Content-Security-Policy"]').forEach(meta => meta.remove());
    });

    const content = await page.content();
    console.log('Page content length:', content.length);
    await browser.close();

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(content);
  } catch (error) {
    console.error('Error fetching the target URL:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};
