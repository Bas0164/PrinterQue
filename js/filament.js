import { ws } from './websocket_client.js';

export function setupFilamentHandlers() {
    // Controleer of de WebSocket open is voordat je de waarde ophaalt
    if (ws.readyState === WebSocket.OPEN) {
        console.log("WebSocket is open, ophalen van filamentwaarde...");
        getFilamentValue();
    } else {
        ws.addEventListener(
            "open",
            () => {
                //console.log("WebSocket is nu open, ophalen van filamentwaarde...");
                getFilamentValue();
            },
            { once: true }
        );
    }

    // "+" knop logica
    document.getElementById('increase-btn').addEventListener('click', () => {
        const inputValue = parseInt(document.getElementById('filament-input').value) || 0;
        const amount = -inputValue * 1100; // Negatieve waarde voor aftrekken
        console.log(`Verwerken van "-" knop: input=${inputValue}, amount=${amount}`);
        sendFilamentUpdate(amount);
    });

    // "-" knop logica
    document.getElementById('decrease-btn').addEventListener('click', () => {
        const inputValue = parseInt(document.getElementById('filament-input').value) || 0;
        const amount = inputValue * 1100; // Positieve waarde voor toevoegen
        console.log(`Verwerken van "+" knop: input=${inputValue}, amount=${amount}`);
        sendFilamentUpdate(amount);
    });
}

function getFilamentValue() {
    const request = {
        type: "query",
        query_type: "read",
        table: "supplies",
        data: {
            filament_id: 1
        }
    };

    //console.log("Verzenden naar WebSocket voor ophalen filamentwaarde:", request);
    ws.send(JSON.stringify(request));
}

function sendFilamentUpdate(amount) {
    const request = {
        type: "query",
        query_type: "update",
        table: "supplies",
        data: {
            amount_used: amount, // Positief of negatief, afhankelijk van de knop
            filament_id: 1
        }
    };

    //console.log("Verzenden naar WebSocket:", request);
    ws.send(JSON.stringify(request));

    // Refresh de pagina na versturen van het verzoek
    ws.addEventListener('message', (event) => {
        const response = JSON.parse(event.data);
        if (response.type === "success") {
            console.log("Pagina wordt vernieuwd...");
            location.reload(); // Refresh de pagina
        }
    }, { once: true }); // Zorg ervoor dat de event listener maar één keer reageert
}

