const {Schema,model} = require('mongoose');
const ObjectId = Schema.Types.ObjectId

const returnProductSchema = new Schema({
    order:{
        type:ObjectId,
        required:true,
        ref:"orders"
    },
    product:{
        type:ObjectId,
        required:true,
        ref:'products'
    },
    orderItemId:{
        type:ObjectId,
        required:true
    },
    returnProductStatus: {
        type: String,
        enum: ["returnInitiated","returnApproved","returnRejected"],
        default:"returnInitiated",
        required:true
      },
    productRefundAmount:{
        type:Number,
        min: 0,
        default:0,
        required:true
    },
    productReturnDate:{
        type:Date,
        default: Date.now(),
        required:true
    },
    productReturnReason:{
        type:String,
        required:true
    },
}, { timestamps: true });


module.exports = model('returnproducts', returnProductSchema);
