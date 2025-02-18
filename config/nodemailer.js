const nodemailer = require('nodemailer')

const sendmail = async (email,content,otp)=>{
    try {
const transport = nodemailer.createTransport({
host:"smtp.gmail.com",
port:587,
secure:false,
auth:{
user:process.env.NODEMAILER_EMAIL,
pass:process.env.NODEMAILER_PASSWORD
}
})

const info = await transport.sendMail({
from:process.env.NODEMAILER_EMAIL,
to:email,
subject:"confirmation mail",
html:content
})
console.log('message sent:',info.messageId);
return true;
    } catch (error) {
        console.log(error.message);
      return   req.status(500).send('error sending mail : nodemailer')        
    }
}


module.exports = sendmail