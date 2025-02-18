const mongoose = require('mongoose')
const env = require('dotenv').config()

const connectDB = async function(){
    try {
      await  mongoose.connect(process.env.MONGODB_URL)
      console.log('databse connected');
    } catch (error) {
        console.log("databse connection error",error);
        process.exit(1)
    }
}

module.exports = connectDB