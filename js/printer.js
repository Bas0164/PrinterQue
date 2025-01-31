import { ws } from "./websocket_client.js";

// Vraag alleen de status van Printer MK4-1 op
export function fetchPrinterStatus() {
    const printerId = 1; // Alleen printer 1 ophalen
    const request = {
        type: "query",
        query_type: "status",
        table: "printers",
        data: { printer_id: printerId },
    };

    if (ws.readyState === WebSocket.CONNECTING) {
        ws.addEventListener(
            "open",
            () => {
                //console.log(`WebSocket verbonden. Verzenden van query voor printer ${printerId}:`, request);
                ws.send(JSON.stringify(request));
            },
            { once: true }
        );
    } else if (ws.readyState === WebSocket.OPEN) {
        //console.log(`WebSocket is open. Verzenden van query voor printer ${printerId}:`, request);
        ws.send(JSON.stringify(request));
    } else {
        console.error("WebSocket is niet verbonden. Kan de printerstatus niet opvragen.");
    }
}

// Update de kaart van Printer MK4-1 op het dashboard
function updatePrinterCard(statusData) {
    const printerCard = document.getElementById("printer-mk4-1");

    if (!printerCard) return;

    const statusElement = printerCard.querySelector(".printer-status");
    const progressBar = printerCard.querySelector("#printer-progress-bar");
    const timeRemainingElement = printerCard.querySelector("#printer-time-remaining");

    if (statusElement && progressBar && timeRemainingElement) {
        const printerState = statusData?.printer?.state || "Unknown";
        const jobProgress = statusData?.job?.progress || 0;
        const timeRemaining = statusData?.job?.time_remaining || 0;

        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        const formattedTime = `${minutes} min ${seconds} sec`;

        statusElement.textContent = `Status: ${printerState}`;
        timeRemainingElement.textContent = `Resterende tijd: ${formattedTime}`;

        // **Update de progressiebalk**
        progressBar.style.width = `${jobProgress}%`;
        progressBar.textContent = `${jobProgress}%`;

        // **Voeg de groene kleur toe**
        progressBar.classList.add("progress-bar-green");
    } else {
        console.error("Kan de status of progressiebalk niet updaten.");
    }
}



// Update de printerdetailpagina
function updatePrinterDetails(statusData) {
    const statusElement = document.getElementById("printer-state");
    const tempElement = document.getElementById("printer-temp");
    const tempNozzle = document.getElementById("printer-temp-nozzle");
    const progressElement = document.getElementById("printer-progress");
    const timeRemainingElement = document.getElementById("printer-time-remaining");

    if (statusElement && tempElement && tempNozzle && progressElement && timeRemainingElement) {
        const printerState = statusData?.printer?.state || "Niet bekend";
        const printerTempBed = statusData?.printer?.temp_bed || "N/A";
        const printerTempNozzle = statusData?.printer?.temp_nozzle || "N/A";
        const jobProgress = statusData?.job?.progress || 0;
        
        // Bereken de resterende tijd in minuten
        const timeRemaining = statusData?.job?.time_remaining || 0;
        const minutes = Math.ceil(timeRemaining / 60); // Afronden naar boven, zodat 61 sec → 2 min wordt

        // Update de elementen met de juiste data
        statusElement.textContent = `Status: ${printerState}`;
        tempElement.textContent = `Bed Temperatuur: ${printerTempBed}°C`;
        tempNozzle.textContent = `Nozzle Temperatuur: ${printerTempNozzle}°C`;
        progressElement.textContent = `Progressie: ${jobProgress}%`;
        timeRemainingElement.textContent = `Resterende tijd: ${minutes} min`;
    } else {
        //console.error("Niet alle HTML-elementen gevonden voor de printerstatus update.");
    }
}

// Luister naar WebSocket-antwoorden en update de juiste pagina
ws.addEventListener("message", (event) => {
    try {
        const response = JSON.parse(event.data);

        if (response.type === "printer_status") {
            //console.log("Printer Status Data ontvangen:", response.data);

            // Alleen printer MK4-1 wordt bijgewerkt
            updatePrinterCard(response.data);
            updatePrinterDetails(response.data);
        } else if (response.type === "error") {
            console.error("Error ontvangen van server:", response.message);
        }
    } catch (error) {
        console.error("Fout bij het parsen van WebSocket-bericht:", error);
    }
});

// Functie om elke 5 seconden de status van Printer MK4-1 op te vragen
setInterval(() => {
    //console.log("Opnieuw printerstatus ophalen voor MK4-1...");
    fetchPrinterStatus();
}, 5000);

// Op detailpagina: Haal printer_id op uit de URL en laad de gegevens
document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const printerId = urlParams.get("printer_id");

    if (printerId == 1) {
        console.log(`Printerdetails ophalen voor printer ${printerId}...`);
        fetchPrinterStatus();
    }
});
