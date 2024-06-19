const puppeteer = require("puppeteer");
const fs = require('fs');

const scrapeProducts = async () => {
    const url = 'https://www.pccomponentes.com/portatiles';

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
    });

    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36");

    try {
        await page.goto(url, { timeout: 90000 });
    } catch (error) {
        console.error('Error during navigation:', error);
        await browser.close();
        return;
    }

    try {
        await page.waitForSelector("#cn_banner_form_alta_footer", { timeout: 30000 });
    } catch (error) {
        console.warn('Pagination footer not found:', error);
    }

    try {
        await page.click("#cookiesrejectAll");
    } catch (error) {
        console.warn('Cookies reject button not found or could not be clicked:', error);
    }

    let hasNextPage = true;
    let allProducts = [];
    let pageNumber = 1;

    while (hasNextPage) {

        console.log(`Scraping page ${pageNumber}...`);

        // Esperar a que los productos se carguen en la página
        await page.waitForSelector(".product-card div.product-card__content h3.product-card__title", { timeout: 30000 });

        const title = await page.$$eval(".product-card div.product-card__content h3.product-card__title", (nodes) => 
            nodes.map((n) => n.innerText)
        );

        const price = await page.$$eval(".product-card__price-container span", (nodes) => 
            nodes.map((n) => n.innerText)
        );

        const img = await page.$$eval(".product-card__img-container img", (nodes) => 
            nodes.map((n) => n.getAttribute("src"))
        );

        const pccomponentesPortatiles = title.map((value, index) => {
            return {
                title: title[index],
                price: price[index],
                img: img[index]
            };
        });

        allProducts = allProducts.concat(pccomponentesPortatiles);

        const nextPageButton = await page.$('[aria-label="Página siguiente"]');
        
        if (nextPageButton) {
            console.log("Haciendo clic para ir a la siguiente página...");
            await Promise.all([
                nextPageButton.click(),
                page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 90000 })
            ]);

            // Esperar a que los productos de la nueva página se carguen
            await page.waitForSelector(".product-card div.product-card__content h3.product-card__title", { timeout: 30000 });

            console.log(`Página ${pageNumber + 1} cargada correctamente.`);
            pageNumber++;
        } else {
            hasNextPage = false;
        }
    }

    await browser.close();

    fs.writeFileSync('products.json', JSON.stringify(allProducts, null, 2), 'utf-8');
    console.log(`Se han guardado ${allProducts.length} productos en products.json`);
};

scrapeProducts();
