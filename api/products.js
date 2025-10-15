import axios from "axios";

export default async function handler(req, res) {
  try {
    const { data } = await axios.get(
      "https://www.nanocell.com.ar/api/obtenerproductos.php"
    );

    const productosProcesados = data
      .map((producto, index) => {
        const nombre = producto.descripcion
          ? producto.descripcion.trim()
          : "Sin Nombre";
        const imagen = producto.imagen;
        const precioTexto = producto.precio ? producto.precio.toString() : "0";
        const precioBaseTextoLimpio = precioTexto
          .replace(".", "")
          .replace(",", ".");

        const precio = parseFloat(precioBaseTextoLimpio);
        if (nombre && !isNaN(precio) && precio > 0) {
          const ganancia = 0.25; // 25% de ganancia
          const precioFinal = (precio * (1 + ganancia)).toFixed(2);

          return {
            id: index + 1,
            nombre,
            precioBase: parseFloat(precio.toFixed(2)),
            precioFinal: parseFloat(precioFinal),
            imagen: imagen ? `https://www.nanocell.com.ar/${imagen}` : null,
          };
        }

        return null;
      })
      .filter((producto) => producto !== null);

    res.status(200).json(productosProcesados);
  } catch (error) {
    console.error("Error al obtener productos de la API:", error.message);
    res.status(500).json({ error: "Error obteniendo productos de la API" });
  }
}
