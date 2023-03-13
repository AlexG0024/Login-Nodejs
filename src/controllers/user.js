// Importar dependencias y módulos
const bcrypt = require("bcrypt")
const Pagination = require("mongoose-pagination")
const fs = require("fs")
const path = require("path")

// Importar modelos
const User = require("../models/user")

// Importar servicios
const jwt = require("../services/jwt")
const validate = require("../helpers/validate")

// Registrar de usuarios
const register = (req, res) => {
  // Recoger datos de la petición
  let params = req.body

  // Comprobar que me llegan bien (+ validación)
  if (!params.name || !params.email || !params.password) {
    return res.status(400).json({
      status: "error",
      message: "Faltan datos por enviar",
    })
  }
  //trasformar el texto en minúscula
  params.email = params.email.toLowerCase()
  params.name = params.name.toLowerCase()

  // Validación avanzada
  
    try{
        validate(params)
    }catch(error){
        return res.status(400).json({
            status: "error",
            message: "Validación no superada",
        })
    }
    
  // Control usuarios duplicados
  User.find({
    $or: [{ email: params.email }],
  }).exec(async (error, users) => {
    if (error) {
      return res.status(500).json({
        status: "error",
        message: "Error en la consulta de usuarios",
      })
    }

    if (users && users.length >= 1) {
      return res.status(200).send({
        status: "success",
        message: "El usuario ya existe",
      })
    }

    // Cifrar la contraseña
    let pwd = await bcrypt.hash(params.password, 10)
    params.password = pwd
    // Crear objeto de usuario
    let NewUser = new User(params)

    // Guardar usuario en la Base de Datos
    NewUser.save((error, userStored) => {
      if (error || !userStored)
        return res.status(500).send({
          status: "error",
          message: "Error al guardar el usuario",
        })

      // Eliminar password de la petición
      userStored.toObject()
      delete userStored.password

      // Devolver resultado
      return res.status(200).json({
        status: "success",
        message: "Usuario registrado correctamente",
        user: userStored,
      })
    })
  })
} //fin del register

// Login de usuarios
const login = (req, res) => {
  // Recoger datos de la petición
  let params = req.body

  // verificar que me llegan email y password
  if (!params.email || !params.password) {
    return res.status(400).send({
      status: "error",
      message: "Faltan datos por enviar",
    })
  }

  //trasformar el texto en minúscula
  params.email = params.email.toLowerCase()

  // Buscar en la Base de Datos si existe
  User.findOne({ email: params.email })
    //.select({ password: 0 })
    .exec((error, user) => {
      if (error || !user)
        return res
          .status(404)
          .send({ status: "error", message: "No existe el usuario" })

      // Comprobar contraseña
      const pwd = bcrypt.compareSync(params.password, user.password)

      if (!pwd) {
        return res.status(400).send({
          status: "error",
          message: "No te has identificado correctamente",
        })
      }

      // Conseguir Token
      const token = jwt.createToken(user)

      // Devolver Datos del usuario
      return res.status(200).send({
        status: "success",
        message: "Te has identificado correctamente",
        user: {
          id: user._id,
          name: user.name,
          nick: user.nick,
        },
        token,
      })
    })
} //fin del login

// perfil de usuario
const profile = (req, res) => {
  // Recibir el parámetro del id de usuario por la url
  const id = req.params.id

  // Consulta para sacar los datos del usuario
  User.findById(id)
    .select({ password: 0 })
    .exec(async (error, userProfile) => {
      if (error || !userProfile) {
        return res.status(404).send({
          status: "error",
          message: "El usuario no existe o hay un error",
        })
      }

      // Devolver el resultado
      return res.status(200).send({
        status: "success",
        user: userProfile,
      })
    })
} // fin de perfil de usuario

// Listar Usuarios
const list = (req, res) => {
  // Controlar en que pagina estamos
  let page = 1
  if (req.params.page) {
    page = req.params.page
  }
  page = parseInt(page)

  // Consulta con mongoose paginate
  let itemsPerPage = 5

  User.find()
    .select("-password -email -__v")
    .sort("_id")
    .paginate(page, itemsPerPage, async (error, users, total) => {
      if (error || !users) {
        return res.status(404).send({
          status: "error",
          message: "No hay usuarios disponibles",
          error,
        })
      }
      // Devolver el resultado (posteriormente info follow)
      return res.status(200).send({
        status: "success",
        users,
        page,
        itemsPerPage,
        total,
        pages: Math.ceil(total / itemsPerPage),
      })
    })
} //fin list

// Actualizar usuario
const update = (req, res) => {
  // Recoger info del usuario a actualizar
  let userIdentity = req.user
  let params = req.body

  //trasformar el texto en minúscula
  if (params.email) params.email = params.email.toLowerCase()
  if (params.name) params.name = params.name.toLowerCase()

  //console.log('params = ',params)
  console.log("userIdentity = ", userIdentity)

  // Eliminar campos sobrantes
  delete params.iat
  delete params.exp
  delete params.image

  // Comprobar si el usuario ya existe
  User.find({
    $or: [{ email: params.email.toLowerCase() }],
  }).exec(async (error, users) => {
    if (error)
      return res.status(500).json({
        status: "error",
        message: "Error en la consulta de usuarios",
      })
    // comprobar si es el usuario en el Json Web Token
    users.forEach((user) => {
      if (user && user._id != userIdentity.id) {
        return res.status(200).send({
          status: "success",
          message: "El usuario ya existe",
        })
      }
    })

    // Cifrar la contraseña
    if (params.password) {
      let pwd = await bcrypt.hash(params.password, 10)
      params.password = pwd
    } else {
      delete params.password
    }

    // Buscar y actualizar
    try {
      let userUpdated = await User.findByIdAndUpdate(
        { _id: userIdentity.id },
        params,
        { new: true }
      )

      if (!userUpdated) {
        return res
          .status(400)
          .json({ status: "error", message: "Error al actualizar" })
      }

      // Devolver respuesta
      return res.status(200).send({
        status: "success",
        message: "Usuario actualizado correctamente",
        user: userUpdated,
      })
    } catch (error) {
      return res.status(500).send({
        status: "error",
        message: "Error al actualizar",
      })
    }
  })
} // fin de update

// Subir Imágenes
const upload = (req, res) => {
  // Recoger el fichero de imagen y comprobar que existe
  if (!req.file) {
    return res.status(404).send({
      status: "error",
      message: "Petición no incluye la imagen",
    })
  }

  // Conseguir el nombre del archivo
  let image = req.file.originalname

  // Sacar la extension del archivo
  const imageSplit = image.split(".")
  const extension = imageSplit[1]

  // Comprobar extension
  if (
    extension != "png" &&
    extension != "jpg" &&
    extension != "jpeg" &&
    extension != "gif"
  ) {
    // Borrar archivo subido
    const filePath = req.file.path
    const fileDeleted = fs.unlinkSync(filePath)

    // Devolver respuesta negativa
    return res.status(400).send({
      status: "error",
      message: "Extensión del fichero invalida",
    })
  }

  // Si si es correcta, guardar imagen en Base de Datos
  User.findOneAndUpdate(
    { _id: req.user.id },
    { image: req.file.filename },
    { new: true },
    (error, userUpdated) => {
      if (error || !userUpdated) {
        return res.status(500).send({
          status: "error",
          message: "Error en la subida del avatar",
        })
      }

      // Devolver respuesta
      return res.status(200).send({
        status: "success",
        user: userUpdated,
        file: req.file,
      })
    }
  )
} //fin de upload

// sacar el avatar
const avatar = (req, res) => {
  // Sacar el parámetro de la url
  const file = req.params.file

  // Montar el path real de la imagen
  const filePath = "./src/img/user/" + file

  // Comprobar que existe
  fs.stat(filePath, (error, exists) => {
    if (!exists) {
      return res.status(404).send({
        status: "error",
        message: "No existe la imagen",
      })
    }

    // Devolver un file
    return res.sendFile(path.resolve(filePath))
  })
} //Fin de avatar

module.exports = {
  register,
  login,
  profile,
  list,
  update,
  upload,
  avatar,
}

/**
 * Importar dependencias y módulos
 * @param {bcrypt} hashing de passwords
 *
 * @param {Pagination} contenedor de página
 *
 * @param {fs} permite interactuar con los archivos del sistema.
 *
 * @param {path} path nos permite poder manejar las rutas tanto
 * relativas como absolutas de nuestra PC y de nuestro proyecto
 *
 */

/**
 * Importar Modelo
 * @param {User} Modelo de user
 */

/**
 * Importar servicios
 * @param {jwt} servicio Json Web Token
 * @param {validate} validación de los dato que llegan 
 */

/**
 * funciones
 * @returns {register} devuelve el nuevo usuario registrado en la Basa de Datos.
 * @returns {login} devuelve el usuario que hace login y genera un Json Web Token.
 * @returns {profile} devuelve el perfil de un usuario, según el paramentó que se le da por la URL.
 * @returns {list} devuelve la lista de todos los usuarios registrados en la Basa de Datos.
 * @returns {update} devuelve el usuario actualizado en la Basa de Datos.
 * @returns {upload} devuelve la imagen registrada del usuario actualizado en la Basa de Datos
 * @returns {avatar} devuelve la imagen del usuario actualizado en la Basa de Datos
 */
