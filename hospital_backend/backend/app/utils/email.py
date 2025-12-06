import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings
from typing import List

def send_email(
    to_emails: List[str],
    subject: str,
    body: str,
    html_body: str = None
):
    """
    Send email
    """
    if not settings.SMTP_HOST:
        return False
    
    msg = MIMEMultipart("alternative")
    msg["From"] = settings.SMTP_USER
    msg["To"] = ", ".join(to_emails)
    msg["Subject"] = subject
    
    # Add plain text part
    msg.attach(MIMEText(body, "plain"))
    
    # Add HTML part if provided
    if html_body:
        msg.attach(MIMEText(html_body, "html"))
    
    try:
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False

def send_appointment_confirmation_email(patient_email: str, appointment_details: dict):
    """
    Send appointment confirmation email
    """
    subject = "Appointment Confirmation"
    body = f"""
    Dear {appointment_details['patient_name']},
    
    Your appointment has been confirmed.
    
    Details:
    Doctor: {appointment_details['doctor_name']}
    Date & Time: {appointment_details['date']}
    Type: {appointment_details['type']}
    
    Please arrive 10 minutes before your scheduled time.
    
    Thank you!
    """
    
    return send_email([patient_email], subject, body)