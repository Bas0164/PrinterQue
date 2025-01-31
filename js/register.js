import { ws } from './websocket_client.js';

export function sendRegisterRequest(username, email, phone, password) {
  if (!username || !email || !phone || !password) {
    console.error("Alle velden moeten ingevuld zijn.");
    return;
  }

  // Bouw het registratieverzoek in het juiste formaat
  const registerRequest = {
    type: "query",
    query_type: "create",
    table: "users",
    data: {
      user: {
        username: username,
        password: password,
        email: email,
        phone: phone,
        role: "0"
      }
    }
  };

  console.log("Verzenden naar WebSocket:", registerRequest); // Log het verzonden verzoek

  // Stuur het verzoek naar de WebSocket-server
  if (ws.readyState === WebSocket.CONNECTING) {
    console.log("WebSocket is aan het verbinden. Wachten...");
    ws.addEventListener(
      "open",
      () => {
        ws.send(JSON.stringify(registerRequest));
        console.log("Bericht verzonden via WebSocket na verbinding.");
      },
      { once: true }
    );
  } else if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(registerRequest));
    console.log("Bericht verzonden via WebSocket.");
  } else {
    console.error("WebSocket is niet open. Controleer de verbinding.");
  }
}
