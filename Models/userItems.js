require("dotenv").config();
const mongoose = require("mongoose");
const connection = require("./User");
mongoose.set("useFindAndModify", false);

const User = connection.models.User; 

const userItemSchema = new mongoose.Schema ({
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    cart: [
        {
            itemName: String,
            size: String,
            quantity: Number,
            price: Number
        }
    ],  
    pendingOrders: [  
        {
            totalPrice: Number,
            orderNo: Number,
            orderDate: String,
            orderedItems: [
                {
                    itemName: String,
                    size: String,
                    quantity: Number,
                    price: Number
                }
            ]
        }
    ],
    orderHistory: [
        {
            totalPrice: Number,
            status: String,
            orderNo: Number,
            orderDate: String,
            orderedItems: [
                {
                    itemName: String,
                    size: String,
                    quantity: Number,
                    price: Number
                }
            ]
        }
    ]
});

const UserItem = connection.model('UserItem', userItemSchema);

module.exports = UserItem;