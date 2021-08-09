require("dotenv").config();
const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
mongoose.set("useFindAndModify", false);

const conn = 'mongodb+srv://' + process.env.DATABASE_USER + ':' + process.env.DATABASE_PASSWORD + 
'@cluster0.lwfr8.mongodb.net/' + process.env.DATABASE_NAME + '?retryWrites=true';

const connection = mongoose.createConnection(conn, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
});

mongoose.set("useCreateIndex", true);

// Creates simple schema for a User.  The hash and salt are derived from the user's given password when they register
const userSchema = new mongoose.Schema ({
    username: String,
    password: String,
    fullName: String,
    phone: Number,
    admin: Boolean,
    resetPasswordToken: String,
    resetPasswordExpires: Date
});

userSchema.plugin(passportLocalMongoose);

const User = connection.model("User", userSchema);

// Expose the connection
module.exports = connection;

