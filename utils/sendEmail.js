const nodemailer = require('nodemailer')

const senderEmail = 'verify.quickjot@gmail.com'

const sendEmail = async (email,subject,body) =>{

    console.log(" Email : "+email)
    console.log(" Subject : "+subject)
    console.log(" Body : "+body)
    
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            port:465,
            host:'smtp.gmail.com',
            secure: true, // true for 465, false for other ports
            secureConnection: false,
            auth: {
                user: 'verify.quickjot@gmail.com', // generated ethereal user
                pass: 'jzsbhggfewcfkjup', // generated ethereal password
               
            },
            tls:{
                rejectUnAuthorized:true
            }
        })
        // console.log(transporter.options.host)
        transporter.verify((err, success) => {
            if (err) console.error(err);
            console.log('Your config is correct');
        });

        var info = await transporter.sendMail({
            from: senderEmail, // sender address
            to: 'gautambhagat.business@gmail.com', // list of receivers
            subject: subject, // Subject line
            text:  body
    });

        // console.log();
        // res.status(200).send("Email sent Sucessfully")
    } catch (error) {
        // res.status(500).send("Email not sent Sucessfully");
        console.log(error);
    }

}

module.exports = sendEmail