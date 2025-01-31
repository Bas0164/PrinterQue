// login.js
import { ws } from './websocket_client.js';

export function sendLoginRequest(username, password) {
    if (!username || !password) {
        console.error("Gebruikersnaam of wachtwoord mag niet leeg zijn.");
        return;
    }

    // Stuur een login-request naar de server
    const loginRequest = {
        type: "login",
        username: username,
        password: password
    };

    if (ws.readyState === WebSocket.CONNECTING) {
        console.log("WebSocket is aan het verbinden. Wachten...");
        ws.addEventListener("open", () => {
            ws.send(JSON.stringify(loginRequest));
        }, { once: true });
    } else if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(loginRequest));
    } else {
        console.error("WebSocket is niet open. Controleer de verbinding.");
    }
}
