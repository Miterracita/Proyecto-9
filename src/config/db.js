const mongoose = require("mongoose");

// creamos una función asíncrona para conectar a la bbdd
const connectDB = async () => {
    // creamos un bloque trycatch ya que algo podría fallar y así lo controlamos
    try {
        await mongoose.connect(process.env.DB_URL);
        console.log("Conectado con éxito a la BBDD");
    } catch (error) {
        console.log("Error en la conexión de la BBDD");
    }
}

// exportamos la función para poder usarla en el index.js
module.exports = { connectDB };