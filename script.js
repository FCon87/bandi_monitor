document.addEventListener('DOMContentLoaded', function() {
    // Imposta l'anno corrente nel footer
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    // Carica gli URL esistenti
    loadUrls();
    
    // Gestisce l'aggiunta di un nuovo URL
    document.getElementById('add-url-btn').addEventListener('click', addNewUrl);
    
    // Gestisce il caricamento del file Excel
    document.getElementById('upload-excel-btn').addEventListener('click', uploadExcelFile);
});

// Funzione per caricare gli URL dal file JSON
async function loadUrls() {
    try {
        const response = await fetch('data/urls.json');
        
        if (!response.ok) {
            throw new Error('File non trovato o errore di caricamento');
        }
        
        const urlsData = await response.json();
        displayUrls(urlsData);
    } catch (error) {
        console.error('Errore nel caricamento degli URL:', error);
        document.getElementById('no-urls-msg').classList.remove('hidden');
    }
}

// Funzione per visualizzare gli URL nella tabella
function displayUrls(urlsData) {
    const urlListElement = document.getElementById('url-list');
    const noUrlsMsg = document.getElementById('no-urls-msg');
    
    // Pulisce la tabella
    urlListElement.innerHTML = '';
    
    if (urlsData.length === 0) {
        noUrlsMsg.classList.remove('hidden');
        return;
    }
    
    noUrlsMsg.classList.add('hidden');
    
    // Aggiungi ogni URL alla tabella
    urlsData.forEach(urlInfo => {
        const row = document.createElement('tr');
        
        // Colonna URL
        const urlCell = document.createElement('td');
        const urlLink = document.createElement('a');
        urlLink.href = urlInfo.url;
        urlLink.textContent = urlInfo.url;
        urlLink.target = '_blank';
        urlCell.appendChild(urlLink);
        row.appendChild(urlCell);
        
        // Colonna parole chiave
        const keywordsCell = document.createElement('td');
        if (urlInfo.keywords && urlInfo.keywords.length > 0) {
            urlInfo.keywords.forEach(keyword => {
                const keywordSpan = document.createElement('span');
                keywordSpan.className = 'keywords-tag';
                keywordSpan.textContent = keyword;
                keywordsCell.appendChild(keywordSpan);
            });
        } else {
            keywordsCell.textContent = 'Nessuna parola chiave';
        }
        row.appendChild(keywordsCell);
        
        // Colonna ultimo controllo
        const lastCheckCell = document.createElement('td');
        if (urlInfo.last_check) {
            const date = new Date(urlInfo.last_check);
            lastCheckCell.innerHTML = `<span class="timestamp">${date.toLocaleDateString()} ${date.toLocaleTimeString()}</span>`;
        } else {
            lastCheckCell.textContent = 'Mai controllato';
        }
        row.appendChild(lastCheckCell);
        
        // Colonna azioni
        const actionsCell = document.createElement('td');
        actionsCell.className = 'action-btns';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'secondary-btn';
        editBtn.textContent = 'Modifica';
        editBtn.addEventListener('click', () => editUrl(urlInfo));
        actionsCell.appendChild(editBtn);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'danger-btn';
        deleteBtn.textContent = 'Elimina';
        deleteBtn.addEventListener('click', () => deleteUrl(urlInfo.url));
        actionsCell.appendChild(deleteBtn);
        
        row.appendChild(actionsCell);
        
        // Aggiungi la riga alla tabella
        urlListElement.appendChild(row);
    });
}

// Funzione per aggiungere un nuovo URL
async function addNewUrl() {
    const urlInput = document.getElementById('url-input');
    const keywordsInput = document.getElementById('keywords-input');
    
    const url = urlInput.value.trim();
    
    if (!url) {
        alert('Inserisci un URL valido');
        return;
    }
    
    if (!isValidUrl(url)) {
        alert('L\'URL inserito non è valido');
        return;
    }
    
    // Prepara i dati del nuovo URL
    const keywords = keywordsInput.value
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);
    
    const newUrlInfo = {
        url: url,
        keywords: keywords,
        added_date: new Date().toISOString(),
        last_check: null,
        last_hash: null
    };
    
    try {
        // Carica gli URL esistenti
        let urlsData = [];
        
        try {
            const response = await fetch('data/urls.json');
            if (response.ok) {
                urlsData = await response.json();
            }
        } catch (error) {
            console.log('Nessun file urls.json esistente, ne verrà creato uno nuovo');
        }
        
        // Controlla se l'URL esiste già
        const existingIndex = urlsData.findIndex(item => item.url === url);
        
        if (existingIndex >= 0) {
            if (confirm('Questo URL è già presente nella lista. Vuoi aggiornare le sue parole chiave?')) {
                urlsData[existingIndex].keywords = keywords;
            } else {
                return;
            }
        } else {
            // Aggiungi il nuovo URL
            urlsData.push(newUrlInfo);
        }
        
        // Visualizza gli URL aggiornati
        displayUrls(urlsData);
        
        // Pulisci il form
        urlInput.value = '';
        keywordsInput.value = '';
        
        // Notifica l'utente
        alert('URL aggiunto con successo! I cambiamenti saranno sincronizzati al prossimo controllo programmato o esecuzione manuale.');
        
    } catch (error) {
        console.error('Errore durante l\'aggiunta dell\'URL:', error);
        alert('Si è verificato un errore durante l\'aggiunta dell\'URL.');
    }
}

// Funzione per modificare un URL esistente
function editUrl(urlInfo) {
    document.getElementById('url-input').value = urlInfo.url;
    document.getElementById('keywords-input').value = urlInfo.keywords.join(', ');
    
    // Scorrere la pagina fino al form
    document.querySelector('.add-url-section').scrollIntoView({ behavior: 'smooth' });
}

// Funzione per eliminare un URL
async function deleteUrl(url) {
    if (!confirm(`Sei sicuro di voler eliminare questo URL dalla lista di monitoraggio?\n${url}`)) {
        return;
    }
    
    try {
        // Carica gli URL esistenti
        const response = await fetch('data/urls.json');
        
        if (!response.ok) {
            throw new Error('File non trovato o errore di caricamento');
        }
        
        const urlsData = await response.json();
        
        // Filtra l'URL da eliminare
        const newUrlsData = urlsData.filter(item => item.url !== url);
        
        // Visualizza gli URL aggiornati
        displayUrls(newUrlsData);
        
        // Notifica l'utente
        alert('URL eliminato con successo! I cambiamenti saranno sincronizzati al prossimo controllo programmato o esecuzione manuale.');
        
    } catch (error) {
        console.error('Errore durante l\'eliminazione dell\'URL:', error);
        alert('Si è verificato un errore durante l\'eliminazione dell\'URL.');
    }
}

// Funzione per caricare un file Excel
function uploadExcelFile() {
    const fileInput = document.getElementById('excel-file');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Seleziona un file Excel');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = async function(e) {
        try {
            const data = e.target.result;
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Prendi il primo foglio
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            
            // Converti il foglio in JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            if (jsonData.length === 0) {
                alert('Il file Excel è vuoto');
                return;
            }
