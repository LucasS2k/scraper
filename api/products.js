import axios from "axios";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const { data } = await axios.get(
      "https://www.nanocell.com.ar/catalogo2024.php"
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
