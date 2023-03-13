const express = require('express')
const router = express.Router()
const multer = require("multer")
const UserController = require('../controllers/user')
const check = require('../middleware/auth.js')

// configuración de subida
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./src/img/user/")
    },
    filename: (req, file, cb) => {
        cb(null, "avatar-"+Date.now()+"-"+file.originalname)
    }
})

const uploads = multer({storage})


router.post('/register', UserController.register)
router.post("/login", UserController.login)
router.get("/profile/:id",check.auth, UserController.profile)
router.get("/list/:page?", UserController.list)
router.put("/update", check.auth, UserController.update)
// IMG
router.post("/upload", [check.auth, uploads.single("IMG")], UserController.upload)
router.get("/avatar/:file", UserController.avatar)
module.exports = router