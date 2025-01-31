import { ws } from './websocket_client.js';

// Function to parse G-code and extract X, Y, Z values
function parseGCode(gcode) {
    const lines = gcode.split('\n');
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    let estimatedTime = 0;
    let weight = 0;

    // console.log("Total lines in G-code:", lines.length);

    lines.forEach((line, index) => {
        // Log the current line for debugging
        // console.log(`Line ${index + 1}:`, line);

        // Extract estimated printing time from comments
        if (line.startsWith('; estimated printing time')) {
            const timeMatch = line.match(/; estimated printing time \(.*?\)\s*=\s*(?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:(\d+)s)?/);
            if (timeMatch) {
                const hours = parseInt(timeMatch[1] || '0');
                const minutes = parseInt(timeMatch[2] || '0');
                const seconds = parseInt(timeMatch[3] || '0');
                estimatedTime = hours * 3600 + minutes * 60 + seconds;
                console.log("Estimated time extracted:", estimatedTime);
            } else {
                console.log("No estimated time found in line:", line);
            }
        }

        // Extract filament used in grams from comments
        if (line.startsWith('; total filament used')) {
            const weightMatch = line.match(/; total filament used \[g\]\s*=\s*([\d.]+)/);
            if (weightMatch) {
                weight = parseFloat(weightMatch[1]);
                console.log("Weight extracted:", weight);
            } else {
                console.log("No weight found in line:", line);
            }
        }

        // Extract dimensions from movement commands
        const regex = /G[01]\s+.*?(?:X([\d.-]+))?\s*(?:Y([\d.-]+))?\s*(?:Z([\d.-]+))?\s*(?:;.*)?/;
        const match = line.match(regex);
        if (match) {
            const x = match[1] ? parseFloat(match[1]) : null;
            const y = match[2] ? parseFloat(match[2]) : null;
            const z = match[3] ? parseFloat(match[3]) : null;

            // console.log(`Parsed values - X: ${x}, Y: ${y}, Z: ${z}`);

            if (x !== null) {
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
            }
            if (y !== null) {
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
            }
            if (z !== null) {
                minZ = Math.min(minZ, z);
                maxZ = Math.max(maxZ, z);
            }
        } else {
            // console.log("No movement command found in line:", line);
        }
    });

    // console.log("Final min/max values:", { minX, maxX, minY, maxY, minZ, maxZ });

    return {
        width: maxX - minX,     // Width (X-axis)
        length: maxY - minY,    // Length (Y-axis)
        height: maxZ - minZ,    // Height (Z-axis)
        estimatedTime,
        weight,
    };
}

function calculateProjectDetails(gcode) {
    const dimensions = parseGCode(gcode);

    if (!dimensions) {
        console.error("Invalid G-code. Cannot calculate dimensions.");
        return null;
    }

    // Handle missing metadata
    if (dimensions.weight === undefined || dimensions.estimatedTime === undefined) {
        console.warn("G-code is missing required metadata (weight or estimated time). Using default values.");
        dimensions.weight = dimensions.weight || 0; // Default weight
        dimensions.estimatedTime = dimensions.estimatedTime || 0; // Default time
    }

    return {
        weight: dimensions.weight.toFixed(2),
        length: dimensions.length.toFixed(2),
        width: dimensions.width.toFixed(2),
        height: dimensions.height.toFixed(2),
        estimated_time: dimensions.estimatedTime.toFixed(2),
    };
}

export async function submitProject(projectData) {
    const user_id = localStorage.getItem('user_id'); // Get user_id from localStorage
    if (!user_id) {
        console.error("Geen gebruikers-ID gevonden. Zorg ervoor dat de gebruiker is ingelogd.");
        return;
    }

    // Add user_id to projectData
    projectData.user_id = user_id;

    console.log("Final projectData with user_id:", projectData); // Debug statement

    // Check if required fields are filled
    if (!projectData.project_name || !projectData.private || !projectData.discussed || !projectData.description || !projectData.gcode) {
        console.error("Alle velden moeten ingevuld zijn.");
        return;
    }

    // Calculate weight, length, height, and estimated time from G-code
    const projectDetails = calculateProjectDetails(projectData.gcode);
    if (!projectDetails) {
        console.error("Kon projectdetails niet berekenen.");
        return;
    }

    // Add calculated fields to projectData
    projectData.weight = projectDetails.weight;
    projectData.width = projectDetails.width;
    projectData.length = projectDetails.length;
    projectData.height = projectDetails.height;
    projectData.estimated_time = projectDetails.estimated_time;

    const createProjectRequest = {
        type: "query",
        query_type: "create",
        table: "projects",
        data: {
            project: {
                project_name: projectData.project_name,
                private: projectData.private,
                discussed: projectData.discussed,
                description: projectData.description,
                weight: projectData.weight,
                width: projectData.width,
                length: projectData.length,
                height: projectData.height,
                estimated_time: projectData.estimated_time,
                user_id: projectData.user_id,
            },
            user_id: projectData.user_id, // Move user_id to the root level
        }
    };

    console.log("Verzenden naar WebSocket:", createProjectRequest); // Log the request

    // Send the request via WebSocket
    if (ws.readyState === WebSocket.CONNECTING) {
        console.log("WebSocket is aan het verbinden. Wachten...");
        ws.addEventListener(
            "open",
            () => {
                ws.send(JSON.stringify(createProjectRequest));
                console.log("Bericht verzonden via WebSocket na verbinding.");
            },
            { once: true }
        );
    } else if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(createProjectRequest));
        console.log("Bericht verzonden via WebSocket.");
    } else {
        console.error("WebSocket is niet open. Controleer de verbinding.");
    }
}
  
// Haal alle projecten op zonder filter
export function fetchAllProjects(callback) {
    const request = {
        type: "query",
        query_type: "read",
        table: "projects",
        data: {
            fields: ["project_id", "project_name", "project_status", "user_id", "weight", "estimated_time"],
        },
    };    

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

    // Ontvang de data en stuur deze door naar de callback
    ws.addEventListener("message", function handleResponse(event) {
        const response = JSON.parse(event.data);

        if (response.type === "data" && response.data && response.data.length > 0) {
            console.log("Alle projecten ontvangen:", response.data);
            callback(response.data); // Stuur alle projecten door naar de callback
        } else {
            console.warn("Geen projecten ontvangen of response is leeg:", response);
            callback([]);
        }

        ws.removeEventListener("message", handleResponse); // Stop met luisteren na reactie
    });
}

export function deleteProject(projectId) {
    if (!confirm("Weet je zeker dat je dit project wilt verwijderen?")) {
        return;
    }

    console.log(`Verwijderen van project met ID: ${projectId}`);

    const deleteProjectRequest = {
        type: "query",
        query_type: "delete",
        table: "projects",
        data: {
            project_ids: [projectId] 
        }
    };

    console.log("Verzenden naar WebSocket:", deleteProjectRequest);

    if (ws.readyState === WebSocket.CONNECTING) {
        console.log("WebSocket is aan het verbinden. Wachten...");
        ws.addEventListener(
            "open",
            () => {
                ws.send(JSON.stringify(deleteProjectRequest));
                console.log(`Project ${projectId} verwijderd via WebSocket.`);
            },
            { once: true }
        );
    } else if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(deleteProjectRequest));
        console.log(`Project ${projectId} verwijderd via WebSocket.`);
    } else {
        console.error("WebSocket is niet open. Kan het project niet verwijderen.");
    }

    // Verwijder het project uit de UI
    document.querySelector(`button[data-id="${projectId}"]`).closest("tr").remove();
}

