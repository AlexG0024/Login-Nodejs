const {Schema, model} = require("mongoose")
const UserSchema = Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    image: {
        type: String,
        default: "default.png"
    },
})
module.exports = model("User", UserSchema, "users")
                                // Colección: users
