const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId  = Schema.Types.ObjectId

const coupon =  new Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    discountPercentage:{
        type:Number,
        required:true
    },
    maxAmount: {
        type: Number,
        required: true
    },
    minAmount: {
        type: Number,
        required: true,
        default:0
    },
    expirationDate: {
        type: Date,
        required: false
    },
    usageLimit: {
        type: Number,
        required: false,
        default: Infinity
    },
    usedBy: [{
        type: ObjectId,
        ref: 'users'
    }],
    isActive:{
        type:Boolean,
        required:true,
        default:true
    }
},{timestamps:true})

module.exports = mongoose.model('coupons',coupon)