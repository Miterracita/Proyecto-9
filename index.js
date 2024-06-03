const puppeteer = require("puppeteer");
const fs = require('fs');

const scrapeProducts = async () => {
    const url= 'https://www.pccomponentes.com/portatiles';

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
    })

    //abrimos una ventana del navegador con la url indicada
    const page = await browser.newPage();
    // Aumentar el timeout para la navegación para que no de error de timeout
    await page.goto(url, { timeout: 90000 });

    //hacemos click en botón rechazar cookies para cerrar la ventana
    await page.click("#cookiesrejectAll");

    // Intentar cerrar el elemento modal que aparece después de hacer scroll
    await page.waitForSelector('[class^="cn_content_close-"] a');
    await page.click('[class^="cn_content_close-"] a');
    
    //esperamos que carge la paginación final página para empezar a extraer datos
    // await page.waitForSelector("#category-list-paginator");
    await page.waitForSelector("#cn_banner_form_alta_footer");


    //extraer datos que nos interesan
    let hasNextPage = true;
    let allProducts = [];

    while (hasNextPage) {

        const title = await page.$$eval(".product-card div.product-card__content h3.product-card__title", (nodes) => 
            nodes.map((n)=> n.innerText)
        );

        const price = await page.$$eval(".product-card__price-container span", (nodes) => 
            nodes.map((n)=> n.innerText)
        );

        const img = await page.$$eval(".product-card__img-container img", (nodes) => 
            nodes.map((n)=> n.getAttribute("src"))
        );

        const pccomponentesPortatiles = title.map((value, index) =>{
            return {
                title: title[index],
                price: price[index],
                img: img[index]
            };
        });

        allProducts = allProducts.concat(pccomponentesPortatiles);

        //navegar y capturar los datos por todas las páginas disponibles desde la paginación
        const nextPage = await page.$('[aria-label="Página siguiente"]');
        
        if (nextPage) {
            await Promise.all([
                nextPage.click(),
                page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 90000 }), 
                // Esperar hasta que la navegación esté completa
            ]);
        } else {
            hasNextPage = false;
        }

    }

    //cerrar navegador
    await browser.close();

    // Guardar los datos en un archivo JSON
    fs.writeFileSync('products.json', JSON.stringify(allProducts, null, 2), 'utf-8');
    console.log(`Se han guardado ${allProducts.length} productos en products.json`);

}

scrapeProducts();
