# Email Configuration Setup Guide

## Gmail SMTP Configuration Issue Fix

If you're getting the error "Username and Password not accepted" when starting the server, follow these steps:

### 1. Enable 2-Factor Authentication (Required)

- Go to your Google Account settings: https://myaccount.google.com/security
- Enable 2-Factor Authentication if not already enabled

### 2. Generate an App Password

- Visit: https://myaccount.google.com/apppasswords
- Select "Mail" as the app
- Generate a new App Password
- Copy the generated password (it will look like: `xxxx xxxx xxxx xxxx`)

### 3. Update Your .env File

Replace the `EMAIL_PASS` in your `.env` file with the App Password:

```env
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
```

### 4. Restart Your Server

```bash
npm run dev
```

### Alternative Email Providers

If you prefer not to use Gmail, you can configure other email providers:

#### Outlook/Hotmail

```javascript
service: "hotmail";
```

#### Yahoo

```javascript
service: "yahoo";
```

#### Custom SMTP

```javascript
host: 'your-smtp-host.com',
port: 587,
secure: false
```

### Troubleshooting

- Make sure the App Password doesn't contain spaces when copying
- Verify that 2FA is enabled on your Gmail account
- Check that "Less secure app access" is disabled (use App Password instead)
- If the problem persists, generate a new App Password

### Security Note

Never commit your `.env` file to version control. It's already added to `.gitignore`.
