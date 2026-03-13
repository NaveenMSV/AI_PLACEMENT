const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Create a transporter
    // For production, you should use real credentials in .env
    // Here we use Ethereal Email for testing if no credentials found
    
    let transporter;

    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
        });
    } else {
        // Fallback to Ethereal (Development/Test)
        // Note: In a real app, you'd want to log the Ethereal link
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
        
        console.log('--- ETHEREAL EMAIL FALLBACK ---');
        console.log('User:', testAccount.user);
        console.log('Pass:', testAccount.pass);
        console.log('-------------------------------');
    }

    const message = {
        from: `${process.env.FROM_NAME || 'Campus Placement Simulator'} <${process.env.FROM_EMAIL || 'no-reply@simulator.com'}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html
    };

    const info = await transporter.sendMail(message);

    console.log('Message sent: %s', info.messageId);
    if (!process.env.SMTP_HOST) {
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
};

module.exports = sendEmail;
