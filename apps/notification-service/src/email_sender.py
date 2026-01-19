import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

class EmailSender:
    def __init__(self):
        # Conection SMTP configuration
        self.smtp_host = os.getenv("SMTP_HOST", "mailhog")
        self.smtp_port = int(os.getenv("SMTP_PORT", 1025))

    def send_booking_confirmation(self, to_email: str, booking_id: str, status: str):
        try:
            msg = MIMEMultipart()
            msg['From'] = "sistema-reservas@uce.edu.ec"
            msg['To'] = to_email
            msg['Subject'] = f"Confirmación de Reserva: {booking_id}"

            body = f"""
            <h1>¡Reserva Confirmada!</h1>
            <p>Tu reserva con ID <strong>{booking_id}</strong> ha sido procesada exitosamente.</p>
            <p>Estado actual: {status}</p>
            <hr>
            <p>Universidad Central del Ecuador</p>
            """
            
            msg.attach(MIMEText(body, 'html'))

            # Send email
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.send_message(msg)
                
            print(f"Email enviado a {to_email} para reserva {booking_id}")
            return True
        except Exception as e:
            print(f"Error enviando email: {e}")
            return False