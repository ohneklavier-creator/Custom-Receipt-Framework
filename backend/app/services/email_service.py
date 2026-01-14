import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from app.core.config import settings


class EmailService:
    @staticmethod
    async def send_registration_notification(email: str, username: str) -> bool:
        """Send email notification to admin when someone registers"""

        # Skip if email is not configured
        if not settings.smtp_user or not settings.smtp_password:
            print(f"Email not configured. Would have sent notification about registration: {email} ({username})")
            return False

        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = f'Nueva Solicitud de Registro - {username}'
            msg['From'] = f"{settings.from_name} <{settings.from_email or settings.smtp_user}>"
            msg['To'] = settings.admin_email

            # Create HTML body
            html = f"""
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #2563eb;">Nueva Solicitud de Registro</h2>
                    <p>Alguien ha intentado registrarse en el sistema de recibos:</p>

                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Usuario:</strong> {username}</p>
                        <p style="margin: 5px 0;"><strong>Email:</strong> {email}</p>
                    </div>

                    <p style="color: #6b7280; font-size: 14px;">
                        Esta es una notificación automática del sistema Custom Receipt Framework.
                    </p>
                </body>
            </html>
            """

            # Attach HTML content
            msg.attach(MIMEText(html, 'html'))

            # Send email
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
                server.starttls()
                server.login(settings.smtp_user, settings.smtp_password)
                server.send_message(msg)

            print(f"Registration notification sent to {settings.admin_email} for {email}")
            return True

        except Exception as e:
            print(f"Failed to send registration notification: {str(e)}")
            return False


email_service = EmailService()
