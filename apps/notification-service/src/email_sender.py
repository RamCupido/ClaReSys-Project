import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


def _require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def _to_bool(value: str | None) -> bool:
    if value is None:
        return False
    return value.strip().lower() in {"1", "true", "yes", "y", "on"}


class EmailSender:
    def __init__(self):
        self.smtp_host = _require_env("SMTP_HOST")
        self.smtp_port = int(_require_env("SMTP_PORT"))

        self.smtp_user = _require_env("SMTP_USER")
        self.smtp_password = _require_env("SMTP_PASSWORD")

        self.smtp_use_tls = _to_bool(os.getenv("SMTP_USE_TLS"))
        self.smtp_use_ssl = _to_bool(os.getenv("SMTP_USE_SSL"))

        # Sensible defaults by port if neither flag is set
        if not os.getenv("SMTP_USE_TLS") and not os.getenv("SMTP_USE_SSL"):
            self.smtp_use_ssl = self.smtp_port == 465
            self.smtp_use_tls = self.smtp_port == 587

        self.from_email = _require_env("FROM_EMAIL")
        self.from_name = os.getenv("FROM_NAME", "ClaReSys")

    def send_booking_confirmation(self, to_email: str, booking_id: str, status: str) -> bool:
        try:
            msg = MIMEMultipart()
            msg["From"] = f"{self.from_name} <{self.from_email}>"
            msg["To"] = to_email
            msg["Subject"] = f"Confirmación de Reserva: {booking_id}"

            body = f"""
            <h1>¡Reserva Confirmada!</h1>
            <p>Tu reserva con ID <strong>{booking_id}</strong> ha sido procesada exitosamente.</p>
            <p>Estado actual: <strong>{status}</strong></p>
            <hr>
            <p>ClaReSys - Sistema de Gestión y Reserva de Aulas</p>
            """

            msg.attach(MIMEText(body, "html"))

            # Connect
            if self.smtp_use_ssl:
                server = smtplib.SMTP_SSL(self.smtp_host, self.smtp_port, timeout=20)
            else:
                server = smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=20)

            try:
                server.ehlo()
                if self.smtp_use_tls:
                    server.starttls()
                    server.ehlo()

                server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)
            finally:
                try:
                    server.quit()
                except Exception:
                    pass

            print(f"Email enviado a {to_email} para reserva {booking_id}")
            return True
        except Exception as e:
            print(f"Error enviando email: {e}")
            return False
