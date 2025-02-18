const mongoose = require('mongoose');

const addressModel = new mongoose.Schema({
    fullname:{
        type:String,
        required:true
    },
    mobile: { 
        type: String,
         required: true 
        },
    pincode: {
         type: String,
          required: true
         },
    altMobile: { 
        type: String, 
        required: false 
    },
    state: { 
        type: String, 
        required: true 
    },
    primary: { 
        type: Boolean,
         default: false 
        },
    city: { 
        type: String, 
        required: true
     },
     Address:{
        type:String,
        required:true
     }
})





module.exports = mongoose.model('addresses',addressModel)