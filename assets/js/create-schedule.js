document.addEventListener("DOMContentLoaded", async () => {
    const apiBaseUrl = "/api/coordinator";

    const routeSelect = document.getElementById("ddlRouteAsset");
    const shuttleSelect = document.getElementById("ddlShuttleAsset");
    const driverSelect = document.getElementById("ddlDriverAsset");
    const scheduleForm = document.getElementById("frmCreateSchedule");
<<<<<<< HEAD

    await populateDropdowns();

    async function populateDropdowns() {
        try {
            const [stopsRes, shuttlesRes, driversRes] = await Promise.all([
                fetch(`${apiBaseUrl}/stops`),
=======
    await populateDropdowns();
    async function populateDropdowns() {
        try {
            const [stopsRes, shuttlesRes, driversRes] = await Promise.all([
                fetch(`${apiBaseUrl}/stops`),      // FIX: routes -> stops (shuttle_stop table, not old trip text)
>>>>>>> 32f2232ae138a4fb55333747ba17065f714e0d19
                fetch(`${apiBaseUrl}/shuttles`),
                fetch(`${apiBaseUrl}/drivers`)
            ]);

            const stops = await stopsRes.json();
            const shuttles = await shuttlesRes.json();
            const drivers = await driversRes.json();

<<<<<<< HEAD
=======
            // FIX: Build "From ➔ To" combinations from shuttle_stop names client-side.
            // Backend /schedules endpoint already splits RouteName on ➔, so no API change needed.
>>>>>>> 32f2232ae138a4fb55333747ba17065f714e0d19
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

<<<<<<< HEAD
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
=======
        // Split "From ➔ To" back into two separate values to match the updated DTO
        const [fromStop, toStop] = routeSelect.value.split(" ➔ ");

        const payload = {
            FromStop: document.getElementById("routeFrom").value,     // e.g. "North Campus"
            ToStop: document.getElementById("routeTo").value,         // e.g. "South Campus"
            ScheduleDate: document.getElementById("runDate").value,   // "yyyy-MM-dd"
            DepartureTime: document.getElementById("clockTime").value,// "HH:mm"
            ShuttleID: parseInt(document.getElementById("shuttleSelect").value),
            DriverID: parseInt(document.getElementById("driverSelect").value)
>>>>>>> 32f2232ae138a4fb55333747ba17065f714e0d19
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