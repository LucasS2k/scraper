import * as cheerio from "cheerio";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

const URL = "https://www.nanocell.com.ar";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*"); // O 'http://localhost:3000'
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    res.setHeader("Access-Control-Max-Age", "86400");
    return res.status(204).end(); // Responder 204 (No Content) y TERMINAR
  }

  // 🛑 2. APLICAR CORS A LA RESPUESTA GET
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
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
      timeout: 45000,
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
      console.warn(
        "No se encontraron productos. Devolviendo HTML para debugging."
      );
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET");
      res.status(200).send(htmlContent);

      return;
    }
    if (productos.length === 0) {
      console.warn(
        "No se encontraron productos. Devolviendo HTML para debugging."
      );

      res.status(200).send(htmlContent);

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
