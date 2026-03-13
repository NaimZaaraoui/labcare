import puppeteer from 'puppeteer-core';

export async function generateAnalysisPDF(analysisId: string) {
  let browser;
  try {
    // Determine the Chromium path. 
    // In Docker (Debian/Ubuntu), it's usually at /usr/bin/chromium
    const executablePath = process.env.CHROMIUM_PATH || '/usr/bin/chromium';
    
    browser = await puppeteer.launch({
      executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
      headless: true,
    });

    const page = await browser.newPage();
    
    // Visit the export page
    // We use localhost since the PDF generation happens inside the same Docker container
    const port = process.env.PORT || 3000;
    const url = `http://localhost:${port}/analyses/${analysisId}/export`;
    
    console.log(`Puppeteer visiting: ${url}`);
    
    await page.goto(url, {
      waitUntil: 'networkidle2', // Wait for network requests to finish
    });

    // Wait for our manual "render-complete" signal if needed, 
    // but networkidle2 is usually enough for simple React apps.
    await page.waitForSelector('#render-complete', { timeout: 10000 });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true, // Crucial for Tailwind colors/bg
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
