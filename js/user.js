    import { ws } from './websocket_client.js';

    // Haal de gebruikersnaam op op basis van de user_id
    export function fetchUsernameByUserId(userId) {
        const request = {
            type: "query",
            query_type: "read",
            table: "users",
            data: {
                filter: {
                    user_id: userId // Filter direct op user_id
                },
                fields: ["username", "user_id"] // Haal alleen benodigde velden op
            }
        };

        if (ws.readyState === WebSocket.CONNECTING) {
            console.log("WebSocket is aan het verbinden. Wachten...");
            ws.addEventListener("open", () => {
                console.log("Verzenden na verbinding:", request);
                ws.send(JSON.stringify(request));
            }, { once: true });
        } else if (ws.readyState === WebSocket.OPEN) {
            console.log("WebSocket is open, verzenden:", request);
            ws.send(JSON.stringify(request));
        } else {
            console.error("WebSocket is niet open. Controleer de verbinding.");
        }
    }

    // Haal alle gegevens op voor een gebruiker op basis van user_id
    export function fetchUserDetailsByUserId(userId, callback) {
        const request = {
            type: "query",
            query_type: "read",
            table: "users",
            data: {
                filter: { user_id: userId }, // Zoek specifiek op user_id
                fields: ["user_id", "username", "role", "email", "phone"], // Alle benodigde velden
            },
        };

        if (ws.readyState === WebSocket.CONNECTING) {
            //console.log("WebSocket is aan het verbinden. Wachten...");
            ws.addEventListener(
                "open",
                () => {
                    //console.log("Verzenden na verbinding:", request);
                    ws.send(JSON.stringify(request));
                },
                { once: true }
            );
        } else if (ws.readyState === WebSocket.OPEN) {
            console.log("WebSocket is open, verzenden:", request);
            ws.send(JSON.stringify(request));
        } else {
            console.error("WebSocket is niet open. Controleer de verbinding.");
        }

        // Luister naar het antwoord en verwerk het
        ws.addEventListener("message", function handleResponse(event) {
            const response = JSON.parse(event.data);

            // Controleer of de juiste context aanwezig is
            if (response.type === "data" && response.data && response.data.length > 0) {
                //console.log("Ontvangen gebruikersdetails:", response.data);
                const userDetails = response.data.find(
                    (user) => String(user.user_id) === String(userId) // Vergelijk op basis van user_id
                );

                if (userDetails) {
                    callback(userDetails); // Stuur de gevonden gebruiker door
                } else {
                    console.warn("Geen overeenkomende gebruiker gevonden in de database.");
                    callback(null);
                }

                ws.removeEventListener("message", handleResponse); // Stop met luisteren na reactie
            }
        });
    }

    // Uitlogfunctie
    export function logoutUser() {
        // Verwijder de user_id uit localStorage
        localStorage.removeItem("user_id");
        console.log("Uitgelogd: user_id verwijderd uit localStorage");

        // Stuur de gebruiker terug naar de loginpagina
        window.location.href = "login.html";
    }