const validator = require("validator")

const validate = (params) => {
    let name = !validator.isEmpty(params.name) &&
        validator.isLength(params.name, { min: 3, max: undefined }) &&
        validator.matches(params.name, /^[a-zA-Z\s]+$/)


    let email = !validator.isEmpty(params.email) &&
        validator.isEmail(params.email)

    let password = !validator.isEmpty(params.password)   

    if (!name  || !email || !password) {
        throw new Error("No se ha superado la validación")
    } else {
        console.log("validación superada")
    }
}

module.exports = validate

/**
 * @params {Validator} es un módulo de Node.js que proporciona una 
 * amplia gama de funciones de validación de entrada de datos. 
 * Con Validator, puedes verificar fácilmente si una cadena de
 * entrada cumple con ciertas condiciones
 */
