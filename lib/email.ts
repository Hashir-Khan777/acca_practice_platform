import nodemailer from 'nodemailer';
import { connectDB } from './db';
import { SentEmail } from './models';

const smtpHost = process.env.SMTP_HOST;
const smtpPort = parseInt(process.env.SMTP_PORT || '587');
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || '"Accountly" <info@theaccountly.com>';

export async function sendEmail({ to, subject, body }: { to: string; subject: string; body: string }) {
  await connectDB();

  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error('SMTP configuration is missing. Please configure SMTP_HOST, SMTP_USER, and SMTP_PASS in environment variables.');
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });

  const mailOptions = {
    from: smtpFrom,
    to,
    subject,
    text: body,
    html: body.replace(/\n/g, '<br />')
  };

  const info = await transporter.sendMail(mailOptions);

  const emailLog = new SentEmail({
    to,
    subject,
    body,
    sentAt: new Date()
  });
  await emailLog.save();

  return { 
    success: true, 
    id: emailLog._id.toString(),
    messageId: info.messageId
  };
}
