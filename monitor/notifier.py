import os
import smtplib
from email.message import EmailMessage
from datetime import datetime

def send_email_notification(url):
    """Invia una notifica email quando viene rilevato un aggiornamento rilevante"""
    try:
        # Recupera le variabili d'ambiente
        email_from = os.environ.get('EMAIL_FROM')
        email_to = os.environ.get('EMAIL_TO')
        password = os.environ.get('EMAIL_PASSWORD')
        smtp_server = os.environ.get('SMTP_SERVER')
        smtp_port = int(os.environ.get('SMTP_PORT', 465))
        
        # Verifica che tutte le variabili necessarie siano presenti
        if not all([email_from, email_to, password, smtp_server]):
            print("Errore: Mancano alcune variabili d'ambiente necessarie per l'invio dell'email")
            return False
        
        # Crea il messaggio
        msg = EmailMessage()
        msg['Subject'] = 'Aggiornamento bandi'
        msg['From'] = email_from
        msg['To'] = email_to
        
        # Costruisci il corpo del messaggio
        body = f"""
        È stato rilevato un aggiornamento rilevante nella seguente pagina:
        
        {url}
        
        Data e ora del rilevamento: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}
        
        Questo messaggio è stato inviato automaticamente dal tuo sistema di monitoraggio pagine web.
        """
        
        msg.set_content(body)
        
        # Invia l'email
        with smtplib.SMTP_SSL(smtp_server, smtp_port) as server:
            server.login(email_from, password)
            server.send_message(msg)
            
        print(f"Email di notifica inviata con successo a {email_to}")
        return True
    
    except Exception as e:
        print(f"Errore nell'invio dell'email di notifica: {e}")
        return False
