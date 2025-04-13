import os
import json
import hashlib
import requests
from bs4 import BeautifulSoup
from datetime import datetime
from .notifier import send_email_notification
from .storage import load_urls, save_urls, save_history

def get_page_content(url):
    """Recupera il contenuto di una pagina web"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        return response.text
    except Exception as e:
        print(f"Errore nel recupero di {url}: {e}")
        return None

def compute_hash(content):
    """Calcola l'hash MD5 del contenuto"""
    if content:
        return hashlib.md5(content.encode()).hexdigest()
    return None

def check_for_keywords(content, keywords):
    """Verifica se il contenuto contiene le parole chiave specificate"""
    if not content or not keywords:
        return False
    
    soup = BeautifulSoup(content, 'html.parser')
    text = soup.get_text().lower()
    
    return any(keyword.lower() in text for keyword in keywords)

def main():
    print(f"Avvio controllo siti web: {datetime.now()}")
    
    # Carica gli URL da monitorare
    urls_data = load_urls()
    
    # Verifica ciascun URL
    for url_info in urls_data:
        url = url_info.get('url')
        last_hash = url_info.get('last_hash')
        keywords = url_info.get('keywords', [])
        
        print(f"Controllo: {url}")
        
        # Recupera il contenuto attuale
        content = get_page_content(url)
        if not content:
            print(f"Non è stato possibile recuperare il contenuto di {url}")
            continue
        
        # Calcola il nuovo hash
        current_hash = compute_hash(content)
        
        # Se è la prima volta che controlliamo questo URL
        if not last_hash:
            url_info['last_hash'] = current_hash
            url_info['last_check'] = datetime.now().isoformat()
            continue
        
        # Verifica se ci sono stati cambiamenti
        if current_hash != last_hash:
            print(f"Rilevati cambiamenti in {url}")
            
            # Verifica se i cambiamenti contengono le parole chiave
            if check_for_keywords(content, keywords):
                print(f"Trovate parole chiave in {url}! Invio notifica...")
                
                # Salva la storia dei cambiamenti
                save_history(url, content, keywords)
                
                # Invia la notifica
                send_email_notification(url)
            else:
                print(f"Cambiamenti rilevati ma nessuna parola chiave trovata in {url}")
            
            # Aggiorna l'hash
            url_info['last_hash'] = current_hash
        
        # Aggiorna la data dell'ultimo controllo
        url_info['last_check'] = datetime.now().isoformat()
    
    # Salva gli URL aggiornati
    save_urls(urls_data)
    
    print(f"Controllo completato: {datetime.now()}")

if __name__ == "__main__":
    main()
