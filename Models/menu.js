require("dotenv").config();
const mongoose = require("mongoose");
const connection = require("./User");
mongoose.set("useFindAndModify", false);

const menuSchema = new mongoose.Schema ({
    menuCategory: String,
    sizes: [],
    menuItems: [
        {
            dishName: String,
            price: Number,
            size: String
        }   
    ] 
});

const Menu = connection.model("Menu", menuSchema);

module.exports = Menu; 