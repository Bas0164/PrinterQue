import { ws } from './websocket_client.js';

// Haal alle geplande prints op via WebSocket
export function fetchSchedule(callback) {
    const request = {
        type: "query",
        query_type: "read",
        table: "schedule",
        data: {
            fields: ["schedule_id", "timeStarted", "timeEnd"]
        }
    };

    console.log("Verstuur WebSocket-query:", request);

    if (ws.readyState === WebSocket.CONNECTING) {
        ws.addEventListener("open", () => {
            console.log("WebSocket verbonden. Verzenden van query:", request);
            ws.send(JSON.stringify(request));
        }, { once: true });
    } else if (ws.readyState === WebSocket.OPEN) {
        console.log("WebSocket is open. Verzenden van query:", request);
        ws.send(JSON.stringify(request));
    } else {
        console.error("WebSocket is niet verbonden.");
        return;
    }

    ws.addEventListener("message", function handleResponse(event) {
        const response = JSON.parse(event.data);
        console.log("Ontvangen response van WebSocket:", response);

        if (response.type === "data" && response.data && response.data.length > 0) {
            console.log("Planning ontvangen:", response.data);

            const events = response.data.map(item => ({
                id: item.schedule_id,
                start: item.timeStarted,
                end: item.timeEnd,
            }));

            callback(events);
        } else {
            console.warn("Geen planning ontvangen of response is leeg:", response);
            callback([]);
        }

        ws.removeEventListener("message", handleResponse);
    });
}

