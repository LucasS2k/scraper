import axios from "axios";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const { data } = await axios.get(
      "https://www.nanocell.com.ar/catalogo2024.php",
      {
        headers: {
          // Copiado de los headers de tu navegador para simularlo
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "Accept-Encoding": "gzip, deflate, br, zstd",
          "Accept-Language": "es-US,es;q=0.9,en;q=0.8,en;q=0.7",
          Connection: "keep-alive",
          // El User-Agent es crucial para que el servidor piense que es Chrome
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36", // Usar un User-Agent reciente
        },
      }
    );
    const $ = cheerio.load(data);

    const productos = [];

    $(".caja_producto").each((i, el) => {
      const nombre = $(el).find(".descrp h1").text().trim();
      const imagen = $(el).find(".miniatura_imagen img").attr("src");
      const precioTexto = $(el).find(".datos strong").text().trim();

      const precio = parseFloat(
        precioTexto.replace("$", "").replace(".", "").replace(",", ".")
      );

      if (nombre && !isNaN(precio)) {
        const ganancia = 0.25; // 25% de ganancia
        const precioFinal = (precio * (1 + ganancia)).toFixed(2);

        productos.push({
          id: i + 1,
          nombre,
          precioBase: precio,
          precioFinal,
          imagen: imagen ? `https://www.nanocell.com.ar/${imagen}` : null,
        });
      }
    });

    res.status(200).json(productos);
  } catch (error) {
    console.error("Error al scrapear:", error.message);
    res.status(500).json({ error: "Error obteniendo productos" });
  }
}
