import { ws } from './websocket_client.js';

// Function to fetch the latest project for the user
export function fetchLatestProject() {
    return new Promise((resolve) => {
        const localUserId = localStorage.getItem("user_id");

        if (!localUserId) {
            console.error("No user_id found in local storage.");
            resolve(null); // Return null if user_id is not found
            return;
        }

        const request = {
            type: "query",
            query_type: "read",
            table: "projects",
            data: {
                filter: { user_id: localUserId }, // Use the user_id from local storage
                fields: ["user_id","project_id","project_name", "weight", "length", "width", "height", "estimated_time"],
                order_by: { created_at: "DESC" },
                limit: 1
            },
            user_id: localUserId // Add user_id to the request for server-side use
        };

        // Send the request after ensuring the WebSocket is open
        const sendRequest = () => {
            ws.send(JSON.stringify(request));
        };

        if (ws.readyState === WebSocket.CONNECTING) {
            ws.addEventListener("open", sendRequest, { once: true });
        } else if (ws.readyState === WebSocket.OPEN) {
            sendRequest();
        } else {
            console.error("WebSocket is not open. Check the connection.");
            resolve(null);
            return;
        }

        // Handle the response for the project
        const handleResponse = (event) => {
            const response = JSON.parse(event.data);
            console.log("Project Response:", response); // Debug log

            if (response.type === "data" && response.data && response.data.length > 0) {
                resolve(response.data[0]); // Return the first project
            } else {
                resolve(null); // No project found
            }

            // Remove the event listener after handling the response
            ws.removeEventListener("message", handleResponse);
        };

        ws.addEventListener("message", handleResponse);
    });
}

// Function to fetch printers
function fetchPrinters() {
    return new Promise((resolve) => {
        const request = {
            type: "query",
            query_type: "read",
            table: "printers",
            data: {
                fields: ["printer_id","name", "speed", "weight_capacity", "max_length", "max_width", "max_height"]
            },
        };

        // Send the request after ensuring the WebSocket is open
        const sendRequest = () => {
            ws.send(JSON.stringify(request));
        };

        if (ws.readyState === WebSocket.CONNECTING) {
            ws.addEventListener("open", sendRequest, { once: true });
        } else if (ws.readyState === WebSocket.OPEN) {
            sendRequest();
        } else {
            console.error("WebSocket is not open. Check the connection.");
            resolve([]); // Return an empty array if the connection is not open
            return;
        }

        // Handle the response for the printers
        const handleResponse = (event) => {
            const response = JSON.parse(event.data);
            console.log("Printers Response:", response); // Debug log

            if (response.type === "data" && response.data) {
                resolve(response.data); // Return the list of printers
            } else {
                resolve([]); // No printers found
            }

            // Remove the event listener after handling the response
            ws.removeEventListener("message", handleResponse);
        };

        ws.addEventListener("message", handleResponse);
    });
}

// Main function to load recommendations
export async function loadRecommendations() {
    try {
        const project = await fetchLatestProject();
        console.log("Fetched Project:", project); // Debug log

        if (!project) {
            alert('No project found. Please submit a project first.');
            return;
        }

        const printers = await fetchPrinters();
        console.log("Fetched Printers:", printers); // Debug log

        // Score and rank printers based on the project
        const scoredPrinters = scorePrinters(printers, project);

        // Display the printers
        displayRecommendations(scoredPrinters);
    } catch (error) {
        console.error("Error loading recommendations:", error);
    }
}

// Function to score printers based on the project
function scorePrinters(printers, project) {
    return printers.map((printer) => {
        let score = 0;

        // Convert project weight from grams to kilograms
        const projectWeightKg = project.weight / 1000;

        // 1. Weight Capacity
        if (printer.weight_capacity >= projectWeightKg) {
            score += 2; // Base score for meeting weight requirement
        } else {
            return { ...printer, score: 0 }; // Disqualify printer
        }

        // 2. Dimensions
        if (
            printer.max_length >= project.length &&
            printer.max_width >= project.width &&
            printer.max_height >= project.height
        ) {
            score += 3; // Base score for meeting dimension requirements
        } else {
            return { ...printer, score: 0 }; // Disqualify printer
        }

        // 3. Speed
        score += printer.speed / 20; // Normalize speed to a smaller range

        // 4. Estimated Time
        const estimatedTime =
            (project.length * project.width * project.height) / printer.speed;
        score += 50 / estimatedTime; // Reduce the impact of estimated time

        // 5. Dimension Closeness (Increased Weight)
        const lengthDifference = printer.max_length - project.length;
        const widthDifference = printer.max_width - project.width;
        const heightDifference = printer.max_height - project.height;

        // Total dimension difference
        const totalDifference = lengthDifference + widthDifference + heightDifference;

        // Normalize the difference (smaller difference = higher score)
        const dimensionClosenessScore = 20 / (1 + totalDifference / 50); // Increased weight and adjusted divisor
        score += dimensionClosenessScore;

        return { ...printer, score };
    }).filter((printer) => printer.score > 0) // Remove disqualified printers
      .sort((a, b) => b.score - a.score); // Sort by score in descending order
}

// Function to display recommendations
function displayRecommendations(printers) {
    const container = document.getElementById("recommendedprinter");
    if (!container) {
        console.error("Container element not found.");
        return;
    }

    container.innerHTML = ""; // Clear existing content

    if (!printers || printers.length === 0) {
        console.error("No printers found.");
        container.innerHTML = "<p>No printers available.</p>";
        return;
    }

    printers.forEach((printer, index) => {
        const printerElement = document.createElement("div");
        printerElement.classList.add("row");

        // Highlight the top-scoring printer
        const isTopScorer = index === 0;
        const link = `../pages/project-schedule.html?printer_id=${printer.printer_id}&printer_name=${encodeURIComponent(printer.name)}`;

        console.log("Printer Object:", printer); // Debug log

        printerElement.innerHTML = `
        <a href="${link}" class="printer-link">
            <div class="recommended-printer ${isTopScorer ? 'top-scorer' : ''}">
                <div class="col-sm col-left">
                    <img src="../images/3dprinter.png" alt="Printer Image">
                </div>
                <div class="col-sm col-middle align-self-center">
                    <p>${printer.name}</p>
                    <p>Score: ${printer.score.toFixed(2)}</p>
                </div>
                <div class="col-sm col-right">
                    ${isTopScorer ? '<img src="../images/bookmark.png" alt="Bookmark">' : ""}
                </div>
            </div>
        </a>
    `;

        container.appendChild(printerElement);
    });
}

// Initialize when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", function () {
    loadRecommendations();
});