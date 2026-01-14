# Email Notification Setup

The system sends email notifications to `admin@genesisone.app` when someone attempts to register.

## Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Create an App Password**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "Custom Receipt Framework"
   - Copy the 16-character password

3. **Create a `.env` file** in the project root:
   ```bash
   cp .env.example .env
   ```

4. **Edit the `.env` file** and add your email credentials:
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-16-char-app-password
   ADMIN_EMAIL=admin@genesisone.app
   FROM_EMAIL=your-email@gmail.com
   FROM_NAME=Custom Receipt Framework
   ```

5. **Restart the backend**:
   ```bash
   docker compose restart backend
   ```

## Email Notification Content

When someone registers, you'll receive an email with:
- **Subject**: "Nueva Solicitud de Registro - [username]"
- **Body**: Contains the username and email of the person who registered

## Testing

To test if email is working:

1. Register a new user at http://localhost:3001
2. Check the backend logs: `docker compose logs backend --tail=50`
3. Check your admin email inbox

## Without Email Configuration

If you don't configure email (leave SMTP_USER and SMTP_PASSWORD empty), the system will:
- Still allow registrations
- Print notification messages to the backend console logs
- Not send actual emails

Check the logs with:
```bash
docker compose logs backend -f
```

## Other Email Providers

### Outlook/Hotmail
```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
```

### SendGrid
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

### Custom SMTP Server
```bash
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASSWORD=your-password
```
