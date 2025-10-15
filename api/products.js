import * as cheerio from "cheerio";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

const URL = "https://www.nanocell.com.ar";

export default async function handler(req, res) {
  let browser = null;
  try {
    browser = await puppeteer.launch({
      args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: true,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
    );

    await page.goto(URL, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    const htmlContent = await page.content();

    const $ = cheerio.load(htmlContent);
    const selector = "div.col-lg-3.caja_producto";
    const productos = [];

    $(selector).each((i, el) => {
      const nombre = $(el).find(".descrip h1").text().trim();
      const imagen = $(el).find(".foto .miniatura_imagen img").attr("src");

      const precioTexto = $(el).find(".datos strong").text().trim();

      const precioLimpio = precioTexto
        .replace("$", "")
        .replace(".", "")
        .replace(",", ".");
      const precio = parseFloat(precioLimpio);

      if (nombre && !isNaN(precio) && precio > 0) {
        const ganancia = 0.25;
        const precioFinal = (precio * (1 + ganancia)).toFixed(2);
        productos.push({
          id: i + 1,
          nombre,
          precioBase: parseFloat(precio.toFixed(2)),
          precioFinal: parseFloat(precioFinal),
          imagen: imagen ? `https://www.nanocell.com.ar/${imagen}` : null,
        });
      }
    });
    if (productos.length === 0) {
      // ⚠️ CAMBIAR ESTO: Devolvemos el HTML en lugar del error
      console.warn(
        "No se encontraron productos. Devolviendo HTML para debugging."
      );

      // Devolvemos el HTML como texto para que lo veas en el navegador/cliente
      res.status(200).send(htmlContent);

      // Asegurate de salir de la función
      return;
    }
    if (productos.length === 0) {
      // ⚠️ CAMBIAR ESTO: Devolvemos el HTML en lugar del error
      console.warn(
        "No se encontraron productos. Devolviendo HTML para debugging."
      );

      // Devolvemos el HTML como texto para que lo veas en el navegador/cliente
      res.status(200).send(htmlContent);

      // Asegurate de salir de la función
      return;
    }

    res.status(200).json(productos);
  } catch (error) {
    console.error("Error al scrapear con Puppeteer:", error.message);

    res
      .status(500)
      .json({ error: `Error obteniendo productos: ${error.message}` });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
