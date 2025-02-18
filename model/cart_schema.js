const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId

const CartItemSchema = new mongoose.Schema({
    product: {
      type: ObjectId,
      ref: 'products',
      required: true
    },
    quantity: {
      type: Number,
      default:1,
      min: 1,
      max: 5
    },
    price: {
      type: Number,
      required: true
    },
    regularPrice : {
      type: Number,
      required: true
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
    }
    
  }, {
    timestamps: true
  });

  const cartSchema = new mongoose.Schema({

    user: {
      type: ObjectId,
      ref: 'users',
      required: true
    },
    items: [CartItemSchema],
    summary:{
      subtotal:{
        type:Number,
        required:false
      },
      deliveryCharges:{
        type:Number,
        required:true,
        default:0
      },
      offerDiscount:{
        type:Number,
        required:true,
        default:0
      },
      total:{
        type:Number,
        required:false
      },
      couponDiscount:{
        type:Number,
        required:false, 
        default:0
      }
    },
    
  }, {
    timestamps: true
  });

module.exports = mongoose.model('carts', cartSchema);
