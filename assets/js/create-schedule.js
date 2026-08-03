document.addEventListener("DOMContentLoaded", async () => {
    const apiBaseUrl = "/api/coordinator";

    const routeSelect = document.getElementById("ddlRouteAsset");
    const shuttleSelect = document.getElementById("ddlShuttleAsset");
    const driverSelect = document.getElementById("ddlDriverAsset");
    const scheduleForm = document.getElementById("frmCreateSchedule");

    await populateDropdowns();

    async function populateDropdowns() {
        try {
            // Stops come from the shuttle_stop table via /api/coordinator/stops
            const [stopsRes, shuttlesRes, driversRes] = await Promise.all([
                fetch(`${apiBaseUrl}/stops`),
                fetch(`${apiBaseUrl}/shuttles`),
                fetch(`${apiBaseUrl}/drivers`)
            ]);

            const stops = await stopsRes.json();
            const shuttles = await shuttlesRes.json();
            const drivers = await driversRes.json();

            // Build every "From ➔ To" stop pairing client-side; the option label is later
            // split back into FromStop/ToStop for the POST payload, so no API change is needed.
            const routeOptions = [];
            stops.forEach(from => {
                stops.forEach(to => {
                    if (from.stopId !== to.stopId) {
                        const label = `${from.stopName} ➔ ${to.stopName}`;
                        routeOptions.push(`<option value="${label}">${label}</option>`);
                    }
                });
            });
            routeSelect.innerHTML = routeOptions.join('');

            shuttleSelect.innerHTML = shuttles.map(s =>
                `<option value="${s.shuttleId}">${s.shuttleName} (${s.licensePlate})</option>`
            ).join('');

            driverSelect.innerHTML = drivers.map(d =>
                `<option value="${d.driverId}">${d.fullName}</option>`
            ).join('');

        } catch (error) {
            console.error("Failed to load form dropdown assets from server:", error);
            alert("Error communicating with database server. Please check your backend connection.");
        }
    }

    scheduleForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!routeSelect.value || !shuttleSelect.value || !driverSelect.value) {
            alert("Please ensure all dropdown fields are populated before saving.");
            return;
        }

        // Split the "From ➔ To" option label back into two values to match ScheduleDirectDto
        const [fromStop, toStop] = routeSelect.value.split(" ➔ ");

        console.log("routeSelect:", routeSelect);
        console.log("shuttleSelect:", shuttleSelect);
        console.log("driverSelect:", driverSelect);
        console.log("dateField:", document.getElementById("txtScheduleDate"));
        console.log("timeField:", document.getElementById("txtDepartureTime"));

        const payload = {
            FromStop: fromStop,
            ToStop: toStop,
            ScheduleDate: document.getElementById("txtScheduleDate").value,
            DepartureTime: document.getElementById("txtDepartureTime").value,
            ShuttleID: parseInt(shuttleSelect.value, 10),
            DriverID: parseInt(driverSelect.value, 10)
        };

        try {
            const response = await fetch(`${apiBaseUrl}/schedules`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                alert("🎉 Fleet route dispatch successfully created!");
                window.location.href = "schedule-shuttles.html";
            } else {
                alert(`Failed to save dispatch allocation: ${result.message || "Unknown error occurred."}`);
            }
        } catch (error) {
            console.error("Network communication drop:", error);
            alert("Could not process submit packet. Confirm backend server connectivity.");
        }
    });
});