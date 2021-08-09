require("dotenv").config();
const mongoose = require("mongoose");
const connection = require("./User"); 
mongoose.set("useFindAndModify", false);

const orderSchema = new mongoose.Schema ({
    orderID: Number,
    user: {
        userID: mongoose.Schema.Types.ObjectId,
        email: String,
        phone: Number,
        fullName: String
    },
    status: String, 
    total: Number,
    date: String,
    item:  [ 
        {
            itemName: String,
            size: String,
            quantity: Number,
            price: Number
        }
    ]    
});

const Order = connection.model('Order', orderSchema);

module.exports = Order;