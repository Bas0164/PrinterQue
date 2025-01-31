const wsUri = "ws://145.49.146.40:5678";
export const ws = new WebSocket(wsUri);

ws.onopen = function (event) {
    console.log("Verbinding met WebSocket geopend:", event);
};

ws.onmessage = function (event) {
    const message = event.data;
    console.log("Server response:", message); // Log the full response

    try {
        const response = JSON.parse(message);

        if (response.type === "success") {
            if (response.message.includes("authenticated")) {
                console.log(`User authenticated. User ID: ${response.user_id}`);
                localStorage.setItem("user_id", response.user_id);
                window.location.href = "dashboard-student.html";
            } else if (response.message.includes("User created")) {
                alert('Registratie succesvol! Je kunt nu inloggen.');
                window.location.href = "login.html";
            } else if (response.message.includes("Project created")) {
                alert('Project created successfully!');
                // Optionally, update the UI or redirect
            }
            
        } else if (response.type === "data" && response.data && response.data.length > 0) {
            // Handle data responses (e.g., user data, filament data)
            if (response.data[0].hasOwnProperty("username") && response.data[0].hasOwnProperty("user_id")) {
                const userId = localStorage.getItem("user_id");
                const userData = response.data.find(user => String(user.user_id) === userId);

                if (userData) {
                    const welcomeMessageElement = document.getElementById("welcome-message");
                    if (welcomeMessageElement) {
                        welcomeMessageElement.textContent = `Welkom, ${userData.username}`;
                    } else {
                        console.error("Element met ID 'welcome-message' niet gevonden.");
                    }
                } else {
                    console.warn(`Geen data gevonden voor user_id: ${userId}`);
                }
            }

            if (response.data[0].hasOwnProperty("filament_id") && response.data[0].hasOwnProperty("stock")) {
                const filamentData = response.data[0];
                const totalGram = filamentData.stock;
                const rolls = Math.floor(totalGram / 1100);
                const filamentValueElement = document.getElementById('filament-value');
                if (filamentValueElement) {
                    filamentValueElement.textContent = `${rolls} rollen`;
                } else {
                    console.warn("Element met ID 'filament-value' niet gevonden.");
                }
            }
        } else if (response.type === "error") {
            alert('Error: ' + response.message);
        } else {
            return
        }
    } catch (error) {
        console.error("Fout bij het parsen van het bericht:", error);
    }
};


ws.onclose = function (event) {
    console.log("WebSocket verbinding gesloten:", event);
};

ws.onerror = function (event) {
    console.error("WebSocket fout:", event);
};
    