// ==========================================================================
// COORDINATOR — SHUTTLE FLEET MANAGEMENT (manage-shuttles.html)
//
// This file drives the vehicle/fleet CRUD screen. Every endpoint below is an
// existing route in Program.cs:
//   GET    /api/coordinator/shuttles        -> fleet list
//   POST   /api/coordinator/shuttles        -> create (ShuttleDto)
//   PUT    /api/coordinator/shuttles/{id}   -> update (ShuttleDto)
//   DELETE /api/coordinator/shuttles/{id}   -> remove
//   GET    /api/coordinator/drivers         -> driver dropdown
// ==========================================================================
const API_URL = '/api/coordinator/shuttles';
const DRIVERS_API_URL = '/api/coordinator/drivers';

let fleetCache = [];
let driverCache = [];

document.addEventListener("DOMContentLoaded", () => {
    // 1. Initial data stream load
    loadShuttleFleet();
    loadDriverOptions();

    // 2. Safe event binding for core interface triggers
    safeBindListener("shuttleSearchInput", "keyup", searchShuttles);
    safeBindListener("btnOpenAddModal", "click", openAddModal);
    safeBindListener("btnCancelShuttleModal", "click", closeModal);
    safeBindListener("shuttleForm", "submit", saveShuttleForm);

    startLiveClock();
});

// Binds only when the element is present, so one script can be shared by pages
// that don't contain every control.
function safeBindListener(elementId, eventType, callback) {
    const element = document.getElementById(elementId);
    if (element) element.addEventListener(eventType, callback);
}

// Populates the "Assigned Driver" dropdown
async function loadDriverOptions() {
    const select = document.getElementById("formDriver");
    if (!select) return;

    try {
        const response = await fetch(DRIVERS_API_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        driverCache = await response.json();

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

// ==========================================================================
// FLEET TABLE
// ==========================================================================
async function loadShuttleFleet() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        fleetCache = await response.json();
        renderShuttleTable(fleetCache);
    } catch (err) {
        console.error("Error loading shuttle fleet values:", err);
        const tableBody = document.getElementById("shuttleTableBody");
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:#ef4444;">⚠️ Unable to connect to backend server.</td></tr>`;
        }
    }
}

function renderShuttleTable(shuttles) {
    const tableBody = document.getElementById("shuttleTableBody");
    if (!tableBody) return;

    tableBody.innerHTML = "";

    if (!shuttles || shuttles.length === 0) {
        console.log("Fleet list returned zero vehicles — rendering empty state.");
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:#64748b;">No shuttles registered.</td></tr>`;
        return;
    }

    shuttles.forEach(bus => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td style="padding:12px; vertical-align:middle;"><strong>🚌 ${bus.shuttleName || 'Unnamed'}</strong></td>
            <td style="padding:12px; vertical-align:middle;">${bus.licensePlate || 'N/A'}</td>
            <td style="padding:12px; vertical-align:middle;">${bus.capacity ?? '—'}</td>
            <td style="padding:12px; vertical-align:middle;">${bus.status || 'Unknown'}</td>
            <td style="padding:12px; vertical-align:middle;">
                <button class="action-btn-inline edit-trigger" style="background:none; border:none; cursor:pointer; font-size:1.1rem; margin-right:8px;" title="Edit">✏️</button>
                <button class="action-btn-inline delete-trigger" style="background:none; border:none; cursor:pointer; font-size:1.1rem;" title="Delete">🗑️</button>
            </td>
        `;

        // Listeners are attached per-row rather than via inline onclick so the
        // vehicle values can be passed straight through without re-escaping.
        row.querySelector(".edit-trigger").addEventListener("click", () => {
            openEditModal(bus.shuttleId, bus.shuttleName, bus.licensePlate, bus.capacity, bus.status, bus.driverId);
        });
        row.querySelector(".delete-trigger").addEventListener("click", () => {
            deleteShuttle(bus.shuttleId);
        });

        tableBody.appendChild(row);
    });
}

function searchShuttles() {
    const searchInput = document.getElementById("shuttleSearchInput");
    if (!searchInput) return;

    const term = searchInput.value.toLowerCase();
    const filtered = fleetCache.filter(bus =>
        ((bus.shuttleName || "").toLowerCase().includes(term)) ||
        ((bus.licensePlate || "").toLowerCase().includes(term)) ||
        ((bus.status || "").toLowerCase().includes(term)) ||
        ((bus.driverName || "").toLowerCase().includes(term))
    );
    renderShuttleTable(filtered);
}

// ==========================================================================
// MODAL CONTROLS
// ==========================================================================
function openAddModal() {
    const form = document.getElementById("shuttleForm");
    if (form) form.reset();

    const formId = document.getElementById("formShuttleId");
    if (formId) formId.value = "";

    const title = document.getElementById("modalTitle");
    if (title) title.textContent = "Register New Shuttle";

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

    const title = document.getElementById("modalTitle");
    if (title) title.textContent = "Edit Shuttle Details";

    const modal = document.getElementById("shuttleModal");
    if (modal) modal.classList.add("show");
}

function closeModal() {
    const modal = document.getElementById("shuttleModal");
    if (modal) modal.classList.remove("show");
}

// ==========================================================================
// CREATE / UPDATE
// ==========================================================================
async function saveShuttleForm(e) {
    e.preventDefault();
    const id = document.getElementById("formShuttleId").value;

    const driverSelect = document.getElementById("formDriver");
    const driverId = driverSelect && driverSelect.value ? parseInt(driverSelect.value) : null;

    // Field names match the ShuttleDto record in Program.cs
    const payload = {
        shuttleName: document.getElementById("formName").value,
        licensePlate: document.getElementById("formPlate").value,
        capacity: parseInt(document.getElementById("formCapacity").value),
        status: document.getElementById("formStatus").value,
        driverId: driverId
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
            console.log(`Shuttle ${id || '(new)'} saved successfully via ${method}.`);
            closeModal();
            loadShuttleFleet();
        } else {
            const errorText = await response.text();
            console.error("Save failed:", errorText);
            alert("Action dropped due to data verification issues.");
        }
    } catch (err) {
        console.error("Error saving form:", err);
    }
}

// ==========================================================================
// DELETE
// ==========================================================================
async function deleteShuttle(id) {
    if (!confirm("Permanently strip this vehicle asset record from core fleet logs?")) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });

        if (response.ok) {
            console.log(`Shuttle ${id} deleted successfully.`);
            loadShuttleFleet();
        } else {
            const errorText = await response.text();
            alert(`Server refused deletion: ${errorText || response.statusText}`);
        }
    } catch (err) {
        console.error("Network or execution error running delete:", err);
        alert("Network error: Could not reach the backend server.");
    }
}

// Sidebar Modal controls mapping directly to HTML onclick attributes
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
