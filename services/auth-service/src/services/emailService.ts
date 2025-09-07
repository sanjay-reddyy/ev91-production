import nodemailer from "nodemailer";

export class EmailService {
  private static transporter = nodemailer.createTransport({
    // For development, use Ethereal Email (fake SMTP service)
    // In production, replace with your actual SMTP settings
    host: "smtp.ethereal.email",
    port: 587,
    auth: {
      user: "ethereal.user@ethereal.email",
      pass: "ethereal.pass",
    },
  });

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    firstName: string
  ): Promise<void> {
    try {
      const resetUrl = `${
        process.env.FRONTEND_URL || "http://localhost:3001"
      }/reset-password?token=${resetToken}`;

      const mailOptions = {
        from: process.env.FROM_EMAIL || "noreply@ev91.com",
        to: email,
        subject: "EV91 Platform - Password Reset Request",
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 28px;">EV91 Platform</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Password Reset Request</p>
            </div>

            <div style="padding: 30px; background: #f9f9f9;">
              <h2 style="color: #333; margin-top: 0;">Hi ${firstName},</h2>

              <p style="color: #666; line-height: 1.6;">
                We received a request to reset your password for your EV91 Platform account.
                Click the button below to create a new password:
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}"
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                          color: white;
                          padding: 12px 30px;
                          text-decoration: none;
                          border-radius: 5px;
                          display: inline-block;
                          font-weight: bold;">
                  Reset My Password
                </a>
              </div>

              <p style="color: #666; line-height: 1.6; font-size: 14px;">
                This link will expire in 1 hour for security reasons.
              </p>

              <p style="color: #666; line-height: 1.6; font-size: 14px;">
                If you didn't request this password reset, please ignore this email.
                Your password will remain unchanged.
              </p>

              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                  If the button doesn't work, copy and paste this link into your browser:<br>
                  <span style="word-break: break-all;">${resetUrl}</span>
                </p>
              </div>
            </div>

            <div style="background: #333; color: #999; padding: 20px; text-align: center; font-size: 12px;">
              <p style="margin: 0;">© 2025 EV91 Platform. All rights reserved.</p>
              <p style="margin: 5px 0 0 0;">This is an automated message, please do not reply.</p>
            </div>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Password reset email sent to: ${email}`);
    } catch (error) {
      console.error("Failed to send password reset email:", error);
      throw new Error("Failed to send password reset email");
    }
  }

  /**
   * Send email verification email
   */
  static async sendEmailVerificationEmail(
    email: string,
    verificationToken: string,
    firstName: string
  ): Promise<void> {
    try {
      const verificationUrl = `${
        process.env.FRONTEND_URL || "http://localhost:3001"
      }/verify-email?token=${verificationToken}`;

      const mailOptions = {
        from: process.env.FROM_EMAIL || "noreply@ev91.com",
        to: email,
        subject: "EV91 Platform - Verify Your Email Address",
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 28px;">EV91 Platform</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Welcome to EV91!</p>
            </div>

            <div style="padding: 30px; background: #f9f9f9;">
              <h2 style="color: #333; margin-top: 0;">Hi ${firstName},</h2>

              <p style="color: #666; line-height: 1.6;">
                Welcome to EV91 Platform! To complete your registration and secure your account,
                please verify your email address by clicking the button below:
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}"
                   style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                          color: white;
                          padding: 12px 30px;
                          text-decoration: none;
                          border-radius: 5px;
                          display: inline-block;
                          font-weight: bold;">
                  Verify My Email
                </a>
              </div>

              <p style="color: #666; line-height: 1.6; font-size: 14px;">
                This verification link will expire in 24 hours.
              </p>

              <p style="color: #666; line-height: 1.6; font-size: 14px;">
                Once verified, you'll be able to access all features of the EV91 Platform.
              </p>

              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                  If the button doesn't work, copy and paste this link into your browser:<br>
                  <span style="word-break: break-all;">${verificationUrl}</span>
                </p>
              </div>
            </div>

            <div style="background: #333; color: #999; padding: 20px; text-align: center; font-size: 12px;">
              <p style="margin: 0;">© 2025 EV91 Platform. All rights reserved.</p>
              <p style="margin: 5px 0 0 0;">This is an automated message, please do not reply.</p>
            </div>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Email verification sent to: ${email}`);
    } catch (error) {
      console.error("Failed to send email verification:", error);
      throw new Error("Failed to send email verification");
    }
  }

  /**
   * Send welcome email after successful registration
   */
  static async sendWelcomeEmail(
    email: string,
    firstName: string
  ): Promise<void> {
    try {
      const loginUrl = `${
        process.env.FRONTEND_URL || "http://localhost:3001"
      }/login`;

      const mailOptions = {
        from: process.env.FROM_EMAIL || "noreply@ev91.com",
        to: email,
        subject: "Welcome to EV91 Platform!",
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 28px;">🎉 Welcome to EV91!</h1>
            </div>

            <div style="padding: 30px; background: #f9f9f9;">
              <h2 style="color: #333; margin-top: 0;">Hi ${firstName},</h2>

              <p style="color: #666; line-height: 1.6;">
                Congratulations! Your EV91 Platform account has been successfully created and verified.
              </p>

              <p style="color: #666; line-height: 1.6;">
                You can now access all the features of our platform, including:
              </p>

              <ul style="color: #666; line-height: 1.8;">
                <li>Vehicle management and tracking</li>
                <li>User and team administration</li>
                <li>Real-time dashboard and analytics</li>
                <li>Role-based access control</li>
              </ul>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${loginUrl}"
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                          color: white;
                          padding: 12px 30px;
                          text-decoration: none;
                          border-radius: 5px;
                          display: inline-block;
                          font-weight: bold;">
                  Go to Dashboard
                </a>
              </div>

              <p style="color: #666; line-height: 1.6; font-size: 14px;">
                If you have any questions or need assistance, please don't hesitate to contact our support team.
              </p>
            </div>

            <div style="background: #333; color: #999; padding: 20px; text-align: center; font-size: 12px;">
              <p style="margin: 0;">© 2025 EV91 Platform. All rights reserved.</p>
            </div>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Welcome email sent to: ${email}`);
    } catch (error) {
      console.error("Failed to send welcome email:", error);
      // Don't throw error for welcome email - it's not critical
    }
  }

  /**
   * Send employee welcome email with temporary credentials
   */
  async sendEmployeeWelcomeEmail(
    email: string,
    temporaryPassword: string,
    employeeId: string
  ): Promise<void> {
    try {
      const loginUrl = `${
        process.env.FRONTEND_URL || "http://localhost:3001"
      }/employee-login`;

      const mailOptions = {
        from: process.env.FROM_EMAIL || "noreply@ev91.com",
        to: email,
        subject: "Welcome to EV91 Platform - Your Employee Account",
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 28px;">EV91 Platform</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Welcome to the Team!</p>
            </div>

            <div style="padding: 30px; background: #f9f9f9;">
              <h2 style="color: #333; margin-top: 0;">Welcome!</h2>

              <p style="color: #666; line-height: 1.6;">
                Your employee account has been created for the EV91 Platform. Below are your login credentials:
              </p>

              <div style="background: #fff; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea;">
                <p style="margin: 0 0 10px 0; color: #333;"><strong>Employee ID:</strong> ${employeeId}</p>
                <p style="margin: 0 0 10px 0; color: #333;"><strong>Email:</strong> ${email}</p>
                <p style="margin: 0; color: #333;"><strong>Temporary Password:</strong> <code style="background: #f1f1f1; padding: 2px 4px; border-radius: 3px;">${temporaryPassword}</code></p>
              </div>

              <div style="background: #fff3cd; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #ffeaa7;">
                <p style="margin: 0; font-size: 14px;">
                  <strong>Important:</strong> Please change your password after your first login for security purposes.
                </p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${loginUrl}"
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                          color: white;
                          padding: 12px 30px;
                          text-decoration: none;
                          border-radius: 5px;
                          display: inline-block;
                          font-weight: bold;">
                  Login to Platform
                </a>
              </div>

              <p style="color: #666; line-height: 1.6; font-size: 14px;">
                If you have any questions or need assistance, please contact your system administrator.
              </p>
            </div>

            <div style="background: #333; color: #999; padding: 20px; text-align: center; font-size: 12px;">
              <p style="margin: 0;">© 2025 EV91 Platform. All rights reserved.</p>
            </div>
          </div>
        `,
      };

      await EmailService.transporter.sendMail(mailOptions);
      console.log(`Employee welcome email sent to: ${email}`);
    } catch (error) {
      console.error("Failed to send employee welcome email:", error);
      // Don't throw error for welcome email - it's not critical
    }
  }
}
