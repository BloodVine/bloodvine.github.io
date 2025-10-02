import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  private async compileTemplate(templateName: string, data: any): Promise<string> {
    const templatePath = path.join(__dirname, '../templates/email', `${templateName}.hbs`);
    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    const template = handlebars.compile(templateSource);
    return template(data);
  }

  async sendWelcomeEmail(user: { email: string; firstName: string; lastName: string }) {
    const html = await this.compileTemplate('welcome', {
      name: `${user.firstName} ${user.lastName}`,
      year: new Date().getFullYear()
    });

    await this.transporter.sendMail({
      from: `"Complex App" <${process.env.SMTP_FROM}>`,
      to: user.email,
      subject: 'Welcome to Complex App!',
      html
    });
  }

  async sendPasswordResetEmail(user: { email: string; firstName: string }, resetToken: string) {
    const html = await this.compileTemplate('password-reset', {
      name: user.firstName,
      resetUrl: `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`,
      year: new Date().getFullYear()
    });

    await this.transporter.sendMail({
      from: `"Complex App" <${process.env.SMTP_FROM}>`,
      to: user.email,
      subject: 'Reset Your Password',
      html
    });
  }
}

export default new EmailService();
