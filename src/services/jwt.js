// Importar dependencias
const jwt = require("jwt-simple")
const moment = require("moment")

// Clave secreta
const secret = "CLAVE_SEcRETA_del_proyecto_DE_Login_241456"

// Crear una función para generar tokens
const createToken = (user) => {
    const payload = {
        id: user._id,
        name: user.name,       
        email: user.email,       
        image: user.image,
        iat: moment().unix(),
        exp: moment().add(400, "days").unix()
    }

    // Devolver Json Web Token codificado
    return jwt.encode(payload, secret)
}


module.exports = {
    secret,
    createToken
}
