import { fetchUserDetailsByUserId, logoutUser } from "./user.js";

export function checkStudentRole(userId) {
    fetchUserDetailsByUserId(userId, (userDetails) => {
        if (!userDetails) {
            console.warn("Geen gegevens gevonden voor deze gebruiker. Uitloggen...");
            logoutUser();
            return;
        }

        //console.log(`Gebruikersdetails ontvangen: ${JSON.stringify(userDetails)}`); // Controleer ontvangen data

        // Controleer de rol
        if (Number(userDetails.role) === 0) {
            //console.log("Student rol bevestigd. Blijf op student-dashboard.");
        } else if (Number(userDetails.role) === 1) {
            console.warn("Admin rol gedetecteerd. Doorsturen naar admin-dashboard.");
            window.location.href = "dashboard-admin.html";
        } else {
            console.error("Onbekende rol. Doorsturen naar loginpagina.");
            logoutUser();
        }
    });
}

export function checkAdminRole(userId) {
    fetchUserDetailsByUserId(userId, (userDetails) => {
        if (!userDetails) {
            console.warn("Geen gegevens gevonden voor deze gebruiker. Uitloggen...");
            logoutUser();
            return;
        }

        console.log(`Gebruikersdetails ontvangen: ${JSON.stringify(userDetails)}`); // Controleer ontvangen data

        // Controleer de rol
        if (Number(userDetails.role) === 1) {
            console.log("Admin rol bevestigd. Blijf op admin-dashboard.");
        } else if (Number(userDetails.role) === 0) {
            console.warn("Student rol gedetecteerd. Doorsturen naar student-dashboard.");
            window.location.href = "dashboard-student.html";
        } else {
            console.error("Onbekende rol. Doorsturen naar loginpagina.");
            logoutUser();
        }
    });
}