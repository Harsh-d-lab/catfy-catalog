# Gmail SMTP Setup Guide

This guide will help you configure Gmail SMTP for sending team invitation emails.

## Step 1: Enable 2-Factor Authentication

1. Go to your [Google Account settings](https://myaccount.google.com/)
2. Navigate to **Security** → **2-Step Verification**
3. Follow the instructions to enable 2FA if not already enabled

## Step 2: Generate App Password

1. In your Google Account settings, go to **Security**
2. Under "2-Step Verification", click on **App passwords**
3. Select **Mail** as the app and **Other** as the device
4. Enter "Catfy App" as the device name
5. Click **Generate** and copy the 16-character password

## Step 3: Update Environment Variables

Update your `.env.local` file with your Gmail credentials:

```env
# Gmail SMTP Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-gmail@gmail.com"          # Replace with your Gmail address
SMTP_PASS="your-16-char-app-password"     # Replace with the app password from Step 2
SMTP_FROM="your-gmail@gmail.com"          # Replace with your Gmail address
```

## Step 4: Test the Configuration

1. Restart your development server: `npm run dev`
2. Try sending a team invitation from the application
3. Check that the email is sent successfully

## Troubleshooting

- **"Invalid login"**: Make sure you're using the app password, not your regular Gmail password
- **"Less secure app access"**: This is not needed when using app passwords with 2FA
- **"Authentication failed"**: Double-check your Gmail address and app password

## Security Notes

- Never commit your actual Gmail credentials to version control
- The app password is specific to this application
- You can revoke the app password anytime from your Google Account settings
- Consider using a dedicated Gmail account for sending application emails