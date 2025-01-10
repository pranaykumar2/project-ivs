const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;

class MailService {
    constructor() {
        this.sendEmail = this.sendEmail.bind(this);
        this.sendVerificationEmail = this.sendVerificationEmail.bind(this);
        this.getEmailTemplate = this.getEmailTemplate.bind(this);
        this.getDefaultVerificationTemplate = this.getDefaultVerificationTemplate.bind(this);

        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: process.env.EMAIL_PORT === '465',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        this.initializeEmailTemplates();
    }

    getDefaultVerificationTemplate() {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                .email-container {
                    max-width: 600px;
                    margin: 0 auto;
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    padding: 20px;
                }
                .button {
                    background-color: #4CAF50;
                    border: none;
                    color: white;
                    padding: 15px 32px;
                    text-align: center;
                    text-decoration: none;
                    display: inline-block;
                    font-size: 16px;
                    margin: 4px 2px;
                    cursor: pointer;
                    border-radius: 4px;
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <h2>Welcome to IVS Platform!</h2>
                <p>Hello,</p>
                <p>Thank you for registering with IVS. Please verify your email address by clicking the button below:</p>
                <p>
                    <a href="{{verificationLink}}" class="button">Verify Email Address</a>
                </p>
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p>{{verificationLink}}</p>
                <p>This link will expire in 24 hours.</p>
                <p>If you didn't create an account with IVS, please ignore this email.</p>
            </div>
        </body>
        </html>`;
    }

    async initializeEmailTemplates() {
        try {
            const templatesDir = path.join(process.cwd(), 'templates/emails');
            const verificationTemplatePath = path.join(templatesDir, 'verification.html');

            await fs.mkdir(templatesDir, { recursive: true });

            try {
                await fs.access(verificationTemplatePath);
            } catch {
                const defaultTemplate = this.getDefaultVerificationTemplate();
                await fs.writeFile(verificationTemplatePath, defaultTemplate);
            }
        } catch (error) {
            console.error('Error initializing email templates:', error);
        }
    }

    async sendEmail(to, subject, html) {
        try {
            if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
                console.log('Email configuration missing, logging email instead:');
                console.log('To:', to);
                console.log('Subject:', subject);
                console.log('Content:', html);
                return true;
            }

            const mailOptions = {
                from: process.env.EMAIL_FROM || 'noreply@ivs.com',
                to,
                subject,
                html
            };

            await this.transporter.sendMail(mailOptions);
            return true;
        } catch (error) {
            console.error('Email sending failed:', error);
            throw error;
        }
    }

    async sendVerificationEmail(email, token) {
        try {
            const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/auth/verify-email?token=${token}`;

            let template = this.getDefaultVerificationTemplate();

            try {
                const fileTemplate = await this.getEmailTemplate('verification');
                template = fileTemplate;
            } catch (error) {
                console.log('Using default template');
            }

            const html = template
                .replace(/{{verificationLink}}/g, verificationUrl)
                .replace(/{{email}}/g, email);

            return await this.sendEmail(
                email,
                'Verify Your Email - IVS Platform',
                html
            );
        } catch (error) {
            console.error('Error sending verification email:', error);
            throw error;
        }
    }

    async getEmailTemplate(templateName) {
        try {
            const templatePath = path.join(process.cwd(), 'templates/emails', `${templateName}.html`);
            return await fs.readFile(templatePath, 'utf8');
        } catch (error) {
            console.error(`Failed to load email template: ${templateName}`, error);
            throw error;
        }
    }

    async sendPasswordResetEmail(email, token) {
        try {
            const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/auth/reset-password?token=${token}`;

            let template = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                .email-container {
                    max-width: 600px;
                    margin: 0 auto;
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    padding: 20px;
                }
                .button {
                    background-color: #4CAF50;
                    border: none;
                    color: white;
                    padding: 15px 32px;
                    text-align: center;
                    text-decoration: none;
                    display: inline-block;
                    font-size: 16px;
                    margin: 4px 2px;
                    cursor: pointer;
                    border-radius: 4px;
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <h2>Reset Your Password</h2>
                <p>Hello,</p>
                <p>You have requested to reset your password. Click the button below to set a new password:</p>
                <p>
                    <a href="{{resetLink}}" class="button">Reset Password</a>
                </p>
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p>{{resetLink}}</p>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request a password reset, please ignore this email.</p>
            </div>
        </body>
        </html>`;

            try {
                const fileTemplate = await this.getEmailTemplate('reset-password');
                template = fileTemplate;
            } catch (error) {
                console.log('Using default password reset template');
            }

            const html = template
                .replace(/{{resetLink}}/g, resetUrl)
                .replace(/{{email}}/g, email);

            return await this.sendEmail(
                email,
                'Reset Your Password - IVS Platform',
                html
            );
        } catch (error) {
            console.error('Error sending password reset email:', error);
            throw error;
        }
    }
}

const mailService = new MailService();
module.exports = mailService;