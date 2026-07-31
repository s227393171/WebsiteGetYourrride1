const API_URL = '/api/coordinator/shuttle-assignments';
const STOPS_API_URL = '/api/coordinator/shuttle-assignments/stops';
const DRIVERS_API_URL = '/api/coordinator/drivers';
<<<<<<< HEAD
let fleetCache = [];
let driverCache = [];

document.addEventListener("DOMContentLoaded", () => {
    loadShuttleFleet();
    loadDriverOptions();

    safeBindListener("shuttleSearchInput", "keyup", searchShuttles);
=======

let assignmentCache = [];
let stopCache = [];
let driverCache = [];

document.addEventListener("DOMContentLoaded", () => {
    // 1. Initial data stream load
    loadAssignments();
    loadStopOptions();
    loadDriverOptions();

    // 2. Safe event binding for core interface triggers
    safeBindListener("scheduleSearchInput", "keyup", searchAssignments);
>>>>>>> 32f2232ae138a4fb55333747ba17065f714e0d19
    safeBindListener("btnOpenAddModal", "click", openAddModal);
    safeBindListener("btnCancelScheduleModal", "click", closeModal);
    safeBindListener("scheduleForm", "submit", saveScheduleForm);

    startLiveClock();
});

function safeBindListener(elementId, eventType, callback) {
    const element = document.getElementById(elementId);
    if (element) element.addEventListener(eventType, callback);
}

<<<<<<< HEAD
=======
// Populates "Select Route Path Corridor" (departure) dropdown from shuttle_stop
async function loadStopOptions() {
    const select = document.getElementById("formStop");
    if (!select) return;

    try {
        const response = await fetch(STOPS_API_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        stopCache = await response.json();

        select.innerHTML = '<option value="">Select a stop...</option>';
        (stopCache || []).forEach(stop => {
            const option = document.createElement("option");
            option.value = stop.stopId || stop.id;
            option.textContent = stop.stopName || stop.name || "Unknown Stop";
            select.appendChild(option);
        });
    } catch (err) {
        console.error("Error loading stop list:", err);
        select.innerHTML = '<option value="">Unable to load stops</option>';
    }
}

// Populates Drivers Dropdown (FIXED: Filters out student drivers and provides safe name fallbacks)
>>>>>>> 32f2232ae138a4fb55333747ba17065f714e0d19
async function loadDriverOptions() {
    const select = document.getElementById("formDriver");
    if (!select) return;

    try {
        const response = await fetch(DRIVERS_API_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
<<<<<<< HEAD
        driverCache = await response.json();
=======
        const rawDrivers = await response.json();

        // 🎯 FIX: Filter out student drivers using role and student email patterns
        driverCache = (rawDrivers || []).filter(d => {
            const role = (d.role || "").toUpperCase();
            const email = (d.email || "").toLowerCase();
            if (role === "STUDENT_DRIVER" || role === "STUDENT") return false;
            if (/^s\d+@/i.test(email) || email.endsWith("@mandela.ac.za")) return false;
            return true;
        });
>>>>>>> 32f2232ae138a4fb55333747ba17065f714e0d19

        select.innerHTML = '<option value="">Select a driver...</option>';
        driverCache.forEach(driver => {
            const option = document.createElement("option");
            option.value = driver.driverId || driver.id;
            option.textContent = driver.fullName || driver.driverName || driver.name || "Unknown Driver";
            select.appendChild(option);
        });
    } catch (err) {
        console.error("Error loading driver list:", err);
        select.innerHTML = '<option value="">Unable to load drivers</option>';
    }
}

async function loadAssignments() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        assignmentCache = await response.json();
        renderAssignmentTable(assignmentCache);
    } catch (err) {
        console.error("Error loading assignment array values:", err);
        const tableBody = document.getElementById("assignmentTableBody");
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:#ef4444;">⚠️ Unable to connect to backend server.</td></tr>`;
        }
    }
}

function renderAssignmentTable(assignments) {
    const tableBody = document.getElementById("assignmentTableBody");
    if (!tableBody) return;

    tableBody.innerHTML = "";

    if (!assignments || assignments.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:#64748b;">No routes scheduled.</td></tr>`;
        return;
    }

    assignments.forEach(a => {
        const assignmentId = a.assignmentId || a.id;
        const stopId = a.stopId;
        const stopName = a.stopName || "Unknown Stop";
        const destinationStop = a.destinationStop || "N/A";
        const driverId = a.driverId;
        const driverName = a.driverName || "Unassigned";

        const row = document.createElement("tr");
        row.innerHTML = `
            <td style="padding:12px; vertical-align:middle;"><strong>📍 ${stopName}</strong></td>
            <td style="padding:12px; vertical-align:middle;">${destinationStop}</td>
            <td style="padding:12px; vertical-align:middle;">👤 ${driverName}</td>
            <td style="padding:12px; vertical-align:middle;">
                <button class="action-btn-inline edit-trigger" style="background:none; border:none; cursor:pointer; font-size:1.1rem; margin-right:8px;" title="Edit">✏️</button>
                <button class="action-btn-inline delete-trigger" style="background:none; border:none; cursor:pointer; font-size:1.1rem;" title="Delete">🗑️</button>
            </td>
        `;

        row.querySelector(".edit-trigger").addEventListener("click", () => {
<<<<<<< HEAD
            openEditModal(bus.shuttleId, bus.shuttleName, bus.licensePlate, bus.capacity, bus.status, bus.driverId);
=======
            openEditModal(assignmentId, stopId, destinationStop, driverId);
>>>>>>> 32f2232ae138a4fb55333747ba17065f714e0d19
        });
        row.querySelector(".delete-trigger").addEventListener("click", () => {
            deleteAssignment(assignmentId);
        });

        tableBody.appendChild(row);
    });
}

function searchAssignments() {
    const searchInput = document.getElementById("scheduleSearchInput");
    if (!searchInput) return;

    const term = searchInput.value.toLowerCase();
    const filtered = assignmentCache.filter(a =>
        ((a.stopName || "").toLowerCase().includes(term)) ||
        ((a.destinationStop || "").toLowerCase().includes(term)) ||
        ((a.driverName || "").toLowerCase().includes(term))
    );
    renderAssignmentTable(filtered);
}

function openAddModal() {
    const form = document.getElementById("scheduleForm");
    if (form) form.reset();

    const formId = document.getElementById("formAssignmentId");
    if (formId) formId.value = "";

    const title = document.getElementById("modalTitle");
    if (title) title.textContent = "Create New Schedule";

<<<<<<< HEAD
    const modal = document.getElementById("shuttleModal");
    if (modal) modal.classList.add("show");
}

function openEditModal(id, name, plate, capacity, status, driverId) {
    if (document.getElementById("formShuttleId")) document.getElementById("formShuttleId").value = id;
    if (document.getElementById("formName")) document.getElementById("formName").value = name;
    if (document.getElementById("formPlate")) document.getElementById("formPlate").value = plate;
    if (document.getElementById("formCapacity")) document.getElementById("formCapacity").value = capacity;
    if (document.getElementById("formStatus")) document.getElementById("formStatus").value = status;
    if (document.getElementById("formDriver") && driverId) document.getElementById("formDriver").value = driverId;
=======
    const modal = document.getElementById("scheduleModal");
    if (modal) modal.classList.add("show");
}

function openEditModal(id, stopId, destinationStop, driverId) {
    if (document.getElementById("formAssignmentId")) document.getElementById("formAssignmentId").value = id || "";
    if (document.getElementById("formStop")) document.getElementById("formStop").value = stopId || "";
    if (document.getElementById("formDestination")) document.getElementById("formDestination").value = destinationStop || "";
    if (document.getElementById("formDriver")) document.getElementById("formDriver").value = driverId || "";
>>>>>>> 32f2232ae138a4fb55333747ba17065f714e0d19

    const title = document.getElementById("modalTitle");
    if (title) title.textContent = "Edit Scheduled Route";

<<<<<<< HEAD
    const modal = document.getElementById("shuttleModal");
=======
    const modal = document.getElementById("scheduleModal");
>>>>>>> 32f2232ae138a4fb55333747ba17065f714e0d19
    if (modal) modal.classList.add("show");
}

function closeModal() {
<<<<<<< HEAD
    const modal = document.getElementById("shuttleModal");
=======
    const modal = document.getElementById("scheduleModal");
>>>>>>> 32f2232ae138a4fb55333747ba17065f714e0d19
    if (modal) modal.classList.remove("show");
}

async function saveScheduleForm(e) {
    e.preventDefault();
    const id = document.getElementById("formAssignmentId").value;

<<<<<<< HEAD
    const driverSelect = document.getElementById("formDriver");
    const driverId = driverSelect && driverSelect.value ? parseInt(driverSelect.value) : null;

    const payload = {
        shuttleName: document.getElementById("formName").value,
        licensePlate: document.getElementById("formPlate").value,
        capacity: parseInt(document.getElementById("formCapacity").value),
        status: document.getElementById("formStatus").value,
        driverId: driverId
=======
    const payload = {
        stopId: parseInt(document.getElementById("formStop").value),
        destinationStop: document.getElementById("formDestination").value,
        driverId: parseInt(document.getElementById("formDriver").value)
>>>>>>> 32f2232ae138a4fb55333747ba17065f714e0d19
    };

    const method = id ? "PUT" : "POST";
    const url = id ? `${API_URL}/${id}` : API_URL;

    try {
        const response = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            closeModal();
<<<<<<< HEAD
            loadShuttleFleet();
=======
            loadAssignments();
>>>>>>> 32f2232ae138a4fb55333747ba17065f714e0d19
        } else {
            const errorText = await response.text();
            console.error("Save failed:", errorText);
            alert("Action dropped due to data verification issues.");
        }
    } catch (err) {
        console.error("Error saving form:", err);
    }
}

<<<<<<< HEAD
async function deleteShuttle(id) {
    if (!confirm("Permanently strip this vehicle asset record from core fleet logs?")) return;
=======
async function deleteAssignment(id) {
    if (!confirm("Permanently remove this scheduled route?")) return;
>>>>>>> 32f2232ae138a4fb55333747ba17065f714e0d19

    try {
        const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });

        if (response.ok) {
<<<<<<< HEAD
            loadShuttleFleet();
=======
            console.log(`Assignment ${id} deleted successfully.`);
            loadAssignments();
>>>>>>> 32f2232ae138a4fb55333747ba17065f714e0d19
        } else {
            const errorText = await response.text();
            alert(`Server refused deletion: ${errorText || response.statusText}`);
        }
    } catch (err) {
        console.error("Network or execution error running delete:", err);
        alert("Network error: Could not reach the backend server.");
    }
}

<<<<<<< HEAD
=======
// Sidebar Modal controls mapping directly to HTML onclick attributes
>>>>>>> 32f2232ae138a4fb55333747ba17065f714e0d19
function openSettingsModal() { document.getElementById("settingsModal")?.style.setProperty("display", "flex", "important"); }
function closeSettingsModal() { document.getElementById("settingsModal")?.style.setProperty("display", "none", "important"); }
function openSupportModal() { document.getElementById("supportModal")?.style.setProperty("display", "flex", "important"); }
function closeSupportModal() { document.getElementById("supportModal")?.style.setProperty("display", "none", "important"); }
function openProfileModal() { document.getElementById("profileModal")?.style.setProperty("display", "flex", "important"); }
function closeProfileModal() { document.getElementById("profileModal")?.style.setProperty("display", "none", "important"); }

function toggleProfileMenu() {
    const dropdown = document.getElementById("profileDropdown");
    if (dropdown) dropdown.classList.toggle("show");
}

function handleLogout() {
    if (confirm("Log out of Coordinator Session?")) window.location.href = "../Login.html";
}

function startLiveClock() {
    const clockEl = document.getElementById("liveClock");
    if (!clockEl) return;
    setInterval(() => {
        const now = new Date();
        clockEl.innerText = now.toTimeString().split(' ')[0];
    }, 1000);
}