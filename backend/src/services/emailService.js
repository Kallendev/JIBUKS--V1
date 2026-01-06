import nodemailer from 'nodemailer';

// Create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER || 'lexisouders64@gmail.com',
        pass: process.env.SMTP_PASS || 'fdmw puxl ugcq fsev',
    },
    tls: {
        rejectUnauthorized: false // Accept self-signed certificates
    }
});

// Verify transporter configuration
transporter.verify(function (error, success) {
    if (error) {
        console.error('❌ Email transporter error:', error);
    } else {
        console.log('✅ Email server is ready to send messages');
    }
});

/**
 * Send invitation email to new family member
 */
export async function sendInvitationEmail(toEmail, tempPassword, inviterName, familyName) {
    try {
        const info = await transporter.sendMail({
            from: '"JIBUKS Family" <lexisouders64@gmail.com>', // sender address
            to: toEmail, // list of receivers
            subject: `You've been invited to join the ${familyName} family on JIBUKS`, // Subject line
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e3a8a;">Welcome to JIBUKS!</h2>
          <p>Hello,</p>
          <p>${inviterName} has invited you to join their family space <strong>"${familyName}"</strong> on JIBUKS.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin-top: 0;">Here are your temporary login credentials:</p>
            <p><strong>Email:</strong> ${toEmail}</p>
            <p><strong>Password:</strong> ${tempPassword}</p>
          </div>

          <p>Please download the app and login to get started. You will be asked to change your password upon first login.</p>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Best regards,<br>
            The JIBUKS Team
          </p>
        </div>
      `,
        });

        console.log("Message sent: %s", info.messageId);
        // Preview only available when sending through an Ethereal account
        if (process.env.NODE_ENV !== 'production' && !process.env.SMTP_HOST) {
            console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        }
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
}
