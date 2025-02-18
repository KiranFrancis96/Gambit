const mongoose = require('mongoose');
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

const orderItemsModel = new Schema({
    product:{
        type:ObjectId,
        ref:'products',
        required:true
    },
    productName:{
        type:String,
        required:true
    },
    brandName:{
        type:String,
        required:true
    },
    category:{
        type:ObjectId,
        ref:'categories',
        required:true
    },
    categoryName:{
        type:String,
        required:true
    },
    quantity:{
        type:Number,
        required:true,
        min:1
    },
    price:{
        type:Number,
        required:true
    },
    regularPrice:{
        type:Number,
        required:true,
    },
    images:{
        type:Array,
        required:true
    },
    itemOrderStatus:{
        type:String,
        required:true,
        enum:['pending','confirmed','shipped','delivered','cancelled','returnInitiated','returnApproved','returnRejected'],
        default:'pending'
    },
    deliveredDate:{
        type:Date
    },
    itemOffer:{
        name:{type:String},
        discountPercentage:{type:Number},
        startDate:{type:Date},
        expiryDate:{type:Date},
        offerAmount:{type:Number},
        offerType:{
          type:String,
          enum:['product','category']
        }
      },
    itemCouponPropotion:{
        type:Number,
        default:0
    }
},{timestamps:true})

const orderModel = Schema({
    onlinePaymentId:{
        type:String
    },
    items:[orderItemsModel],
    user:{
        type:ObjectId,
        ref:'users',
        required:true
    },
    totalItems:{
        type:Number,
        required:true,
        default:1
    },
    subTotalAmount:{
        type:Number,
        required:true,
        default:0
    },
    deliveryCharges:{
        type:Number,
        required:false,
        default:0
    },
    couponDiscount:{
        type:Number,
        required:false,
        default:0
    },
    offerDiscount:{
        type:Number,
        required:false,
        default:0
    },
    totalAmount:{
        type:Number,
        required:true,
        default:0
    },
    orderDate:{
        type:Date,
        required:false,
        default:Date.now()
    },
    orderStatus:{
        type:String,
        required:false,
        enum:['pending','confirmed','shipped','delivered','cancelled','returned'],
        default:'pending'
    },
    paymentMethod:{
        type:String,
        required:true,
        enum:['COD','razorpay','wallet'],
        default:'COD'
    },
    paymentStatus:{
        type:String,
        required:false,
        default:'pending',
        enum: ['pending', 'completed', 'failed', 'refunded']
    },
    shippingAddress:{
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
             default: true
            },
        city: { 
            type: String, 
            required: true
         },
         Address:{
            type:String,
            required:true
         },
        
    }
},{timestamps:true})

module.exports = mongoose.model('orders',orderModel)