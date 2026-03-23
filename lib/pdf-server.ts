import puppeteer from 'puppeteer-core';

export async function generateAnalysisPDF(analysisId: string, origin?: string) {
  let browser;
  try {
    const executablePath = process.env.CHROMIUM_PATH || '/usr/bin/chromium';
    
  browser = await puppeteer.launch({
  executablePath,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--no-zygote',
    '--single-process',
    '--disable-extensions',
    '--disable-crash-reporter',
    '--crash-dumps-dir=/tmp',
  ],
  headless: 'shell',
});

    const page = await browser.newPage();
    
    const port = process.env.PORT || 3000;
    const url = origin ? `${origin}/analyses/${analysisId}/export` : `http://127.0.0.1:${port}/analyses/${analysisId}/export`;
    
    console.log(`Puppeteer visiting: ${url}`);
    
    page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', (err: any) => console.log('PAGE ERROR:', err.message));
    page.on('response', (response) => console.log('PAGE RESPONSE:', response.url(), response.status()));
    page.on('requestfailed', request => console.log('PAGE REQUEST FAILED:', request.url(), request.failure()?.errorText));

    await page.goto(url, {
  waitUntil: 'networkidle0',  // ← change from networkidle2 to networkidle0
  timeout: 30000,
});

// Wait for render-complete signal
await page.waitForSelector('#render-complete', { timeout: 15000 });

// Add extra wait for fonts and dynamic content to fully render
await new Promise(resolve => setTimeout(resolve, 2000)); // ← add this

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm',
      },
    });

    return pdfBuffer;
  } catch (error) {
    console.error('Error generating PDF with Puppeteer:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}