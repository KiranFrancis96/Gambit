const Razorpay = require('razorpay');
require('dotenv').config();
const crypto = require('crypto');


const razorpay = new Razorpay({
  key_id: process.env.RZP_key_ID,
  key_secret: process.env.RZP_key_Secret,
});

const createOrder = async (amount, receipt) => {
  try {
    const options = {
      amount: amount * 100, 
      currency: 'INR',
      receipt: receipt,
    };

    const order = await razorpay.orders.create(options);
    console.log(order)
    return order;
  } catch (error) {
    console.error('Error creating Razorpay order:', error.message);
    throw new Error(error.message);
  }
};


const verifyPaymentSignature = (orderId, paymentId, signature) => {
  try {
    const generatedSignature = crypto.createHmac('sha256', process.env.RZP_key_Secret)
                                    .update(`${orderId}|${paymentId}`)
                                    .digest('hex')

    return generatedSignature === signature;
  } catch (error) {
    console.error('Error verifying Razorpay payment signature:', error.message);
    return false;
  }
};

module.exports = {
  createOrder,
  verifyPaymentSignature,
};
