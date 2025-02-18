const mongoose = require("mongoose");

const user_schema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
    },
    mobile:{
        type:String,
        required:false,
        default:null
    },
    password:{
        type:String,
        required:false
    },
    block:{
        type:Boolean,
        default:false
    },
    googleId:{
        type:String,
    },
    address:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'addresses'
    }],
    // Review:{
    //     type:mongoose.Schema.Types.ObjectId,
    //     ref:'reviews',
    //     required:true
    // },
    isVerified:{
        type:Boolean,
        default:false
    },
    // otp:{
    //  type:String
    // }
    //     ,
    // otpexp:{
    //     type:Date
        
    // },
 
},{timestamps:true})


module.exports = mongoose.model('users',user_schema)