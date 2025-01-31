import { ws } from './websocket_client.js';
import { fetchLatestProject } from './recommendedPrinter.js';
// Function to fetch events for the selected printer
export function fetchEvents(printerId, fetchInfo, successCallback, failureCallback) {
    const request = {
        type: "query",
        query_type: "read",
        table: "schedule",
        data: {
            fields: ["schedule_id", "start_time", "end_time", "printer_id", "project_id"],
            filter: { printer_id: printerId } // Filter schedules by printer_id
        }
    };

    ws.onopen = function () {
        console.log("WebSocket connection established.");
        ws.send(JSON.stringify(request)); // Now safe to send
    };

    // Handle the server's response
    const handleResponse = (event) => {
        const response = JSON.parse(event.data);

        if (response.type === "data") {
            // Map the server's response to FullCalendar events
            const events = response.data.map(event => ({
                id: event.schedule_id,
                title: `Printer ${event.printer_id} - Project ${event.project_id}`,
                start: event.start_time,
                end: event.end_time
            }));

            // Pass the events to FullCalendar
            successCallback(events);
        } else {
            failureCallback(response.message);
        }

        // Remove the event listener after handling the response
        ws.removeEventListener('message', handleResponse);
    };

    ws.addEventListener('message', handleResponse);
}


// Function to handle event creation with fetched latest project and modal
export async function handleCreateEvent(printerId, selectInfo, calendar) {
    try {
        // Fetch the latest project for the user
        const latestProject = await fetchLatestProject();

        if (!latestProject) {
            alert("No project found to schedule.");
            return;
        }

        const startTime = selectInfo.startStr;

        // Convert the start time to a Date object
        const startDate = new Date(startTime);

        // Calculate the end time by adding the estimated time (in seconds)
        const estimatedTimeInSeconds = latestProject.estimated_time; // Assuming estimated_time is in seconds
        const endDate = new Date(startDate.getTime() + estimatedTimeInSeconds * 1000); // Convert seconds to milliseconds
        const endTime = endDate.toISOString(); // Convert endDate to ISO string

        // Format the start and end times for display in the modal
        const startTimeLocal = startDate.toLocaleString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        const endTimeLocal = endDate.toLocaleString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Show the modal for confirmation
        const modal = new bootstrap.Modal(document.getElementById('timeRangeModal'));
        const selectedTimeRangeElement = document.getElementById('selectedTimeRange');
        selectedTimeRangeElement.textContent = `Do you want to schedule the project "${latestProject.project_name}" on printer ${printerId} from ${startTimeLocal} to ${endTimeLocal}?`;
        modal.show();

        // Remove any existing event listeners to avoid duplicates
        const confirmButton = document.getElementById('saveTimeRange');
        confirmButton.onclick = null; // Clear previous listeners

        // Handle the "Confirm" button click in the modal
        confirmButton.onclick = async () => {
            // Prepare the schedule data with the project info
            const request = {
                type: "query",
                query_type: "create",
                table: "schedule",
                data: {
                    schedule: {  // Wrap the data in a `schedule` key
                        start_time: startTime,
                        end_time: endTime,
                        printer_id: printerId,
                        project_id: latestProject.project_id
                    }
                }
            };

            // Log the request for debugging
            console.log("Sending request:", JSON.stringify(request, null, 2));

            // Send the request to create the event
            ws.send(JSON.stringify(request));

            // Handle the server's response
            const handleResponse = (event) => {
                const response = JSON.parse(event.data);

                // Log the server response for debugging
                console.log("Server response:", response);

                if (response.type === "success") {
                    // Refresh the calendar to show the new event
                    calendar.refetchEvents();
                    alert("Schedule created successfully.");
                } else {
                    alert("Error creating event: " + response.message);
                }

                // Remove the event listener after handling the response
                ws.removeEventListener('message', handleResponse);
            };

            // Add the WebSocket message listener
            ws.addEventListener('message', handleResponse);

            // Hide the modal after confirmation
            modal.hide();
        };

    } catch (error) {
        console.error("Error creating event:", error);
        alert("An error occurred while scheduling.");
    }
}


// Function to handle event updates (dragging/resizing)
export function handleEventUpdate(eventInfo) {
    const request = {
        type: "query",
        query_type: "update",
        table: "schedule",
        data: {
            schedules: [{
                schedule_id: eventInfo.event.id,
                start_time: eventInfo.event.startStr,
                end_time: eventInfo.event.endStr
            }]
        }
    };

    // Send the request to the server
    ws.send(JSON.stringify(request));

    // Handle the server's response
    const handleResponse = (event) => {
        const response = JSON.parse(event.data);

        if (response.type !== "success") {
            alert("Error updating event: " + response.message);
        }

        // Remove the event listener after handling the response
        ws.removeEventListener('message', handleResponse);
    };

    ws.addEventListener('message', handleResponse);
}

// Function to handle event deletion
export function handleEventClick(clickInfo) {
    if (confirm("Are you sure you want to delete this event?")) {
        const request = {
            type: "query",
            query_type: "delete",
            table: "schedule",
            data: {
                schedule_ids: [clickInfo.event.id]
            }
        };

        // Send the request to the server
        ws.send(JSON.stringify(request));

        // Handle the server's response
        const handleResponse = (event) => {
            const response = JSON.parse(event.data);

            if (response.type === "success") {
                // Remove the event from the calendar
                clickInfo.event.remove();
            } else {
                alert("Error deleting event: " + response.message);
            }

            // Remove the event listener after handling the response
            ws.removeEventListener('message', handleResponse);
        };

        ws.addEventListener('message', handleResponse);
    }
}