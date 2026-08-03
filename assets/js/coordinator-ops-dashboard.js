/* ==========================================================================
   COORDINATOR — OPERATIONS DASHBOARD (LIVE DATA)
   Feeds coordinator/dashboard.html from the existing coordinator API. No new
   endpoints and no Program.cs changes: every call below already exists.

     GET /api/coordinator/schedules  -> tripId, routeName ("A > B"),
                                        departureTime, scheduleDate,
                                        shuttleName, driverName, status
     GET /api/coordinator/shuttles   -> shuttleId, shuttleName, licensePlate,
                                        capacity, status, driverId, driverName
     GET /api/coordinator/drivers    -> driverId, fullName, role, ...

   Wrapped in an IIFE: coordinator-schedules.js already declares
   COORDINATOR_PROFILE_API_URL at global scope, and a second global `const`
   with that name would be a redeclaration SyntaxError.

   DATA GAPS - deliberately rendered as a dash rather than invented. Each logs
   once so the missing feed is visible in the console:
     - Total bookings today  (no coordinator bookings endpoint exists)
     - Seats booked / capacity per trip (the /schedules query projects
       neither available_seats nor capacity)
     - Estimated / delayed / arrived departure notes (no ETA field anywhere)
     - The four stat-card comparison pills (no historical or duty data)
   ========================================================================== */

(function () {
    "use strict";

    const API = {
        schedules: "/api/coordinator/schedules",
        shuttles: "/api/coordinator/shuttles",
        drivers: "/api/coordinator/drivers"
    };

    const ROWS_PER_PAGE = 4; // matches "Showing 4 of N" in the reference
    const REFRESH_MS = 30000;

    // Full dataset plus the plate lookup built from the shuttles endpoint.
    let scheduleRows = [];
    let plateByShuttleName = new Map();
    let currentPage = 1;
    let refreshTimer = null;

    // Guard so a missing feed is reported once, not once per render.
    const warned = { eta: false };

    const SHUTTLE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 17h16M4 17V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v11"/><path d="M4 11h16"/><circle cx="7.5" cy="17" r="1.5"/><circle cx="16.5" cy="17" r="1.5"/></svg>';

    function escapeHtml(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function todayIso() {
        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        return `${now.getFullYear()}-${month}-${day}`;
    }

    // "Live overview of campus transportation systems for Wednesday, Oct 25."
    function renderDateLine() {
        const el = document.getElementById("opsDateLine");
        if (!el) return;
        const formatted = new Date().toLocaleDateString(undefined, {
            weekday: "long", month: "short", day: "numeric"
        });
        el.textContent = `Live overview of campus transportation systems for ${formatted}.`;
    }

    // Converts "14:30" into "02:30 PM" to match the reference formatting.
    function to12Hour(time24) {
        if (!time24 || typeof time24 !== "string" || time24.indexOf(":") === -1) {
            return time24 || "\u2014";
        }
        const parts = time24.split(":");
        let hours = parseInt(parts[0], 10);
        const minutes = parts[1];
        if (isNaN(hours)) return time24;
        const suffix = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12;
        return `${String(hours).padStart(2, "0")}:${minutes} ${suffix}`;
    }

    function initials(fullName) {
        const clean = String(fullName || "").trim();
        if (!clean || clean.toLowerCase() === "unassigned") return "?";
        return clean.split(/\s+/).slice(0, 2).map(part => part[0].toUpperCase()).join("");
    }

    // Maps whatever the DB stores onto the badge vocabulary in the reference.
    // Unrecognised values fall through to the neutral grey and are logged, so a
    // new status token surfaces in the console rather than rendering unstyled.
    function statusToBadge(rawStatus) {
        const key = String(rawStatus || "").trim().toUpperCase();
        switch (key) {
            // trip.status is enum('SCHEDULED','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED')
            case "ACTIVE":
            case "IN_PROGRESS":
            case "CONFIRMED":
            case "BOARDING":
                return { cls: "at-badge--active", label: "Active" };
            case "PENDING":
            case "SCHEDULED":
                return { cls: "at-badge--pending", label: "Pending" };
            case "COMPLETED":
            case "ARRIVED":
                return { cls: "at-badge--completed", label: "Completed" };
            case "CANCELLED":
            case "CANCELED":
                return { cls: "at-badge--cancelled", label: "Cancelled" };
            default:
                console.warn(`[ops-dashboard] Unmapped trip status "${rawStatus}" - rendering as grey.`);
                return { cls: "at-badge--completed", label: rawStatus || "Unknown" };
        }
    }

    function setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    // Renders the "34 / 40" meter. bookedSeats is a live COUNT over trip_booking
    // (excluding Cancelled) and capacity comes from the joined vehicle row, so a
    // capacity of 0 means no vehicle is matched rather than a full bus.
    function seatsCell(row) {
        const capacity = Number(row.capacity) || 0;
        const booked = Number(row.bookedSeats) || 0;

        if (capacity <= 0) {
            return `
                <div class="ops-seats__track" role="img" aria-label="Capacity unknown">
                    <div class="ops-seats__fill" style="width:0%"></div>
                </div>
                <span class="ops-seats__count ops-unavailable"
                      title="No vehicle capacity is recorded for this trip.">&mdash;</span>`;
        }

        const pct = Math.min(100, Math.round((booked / capacity) * 100));
        const isFull = booked >= capacity;
        const isClosed = String(row.status || "").toUpperCase() === "COMPLETED";

        // Grey once the trip is closed, orange when full, Navy otherwise.
        let fillClass = "";
        if (isClosed) fillClass = " ops-seats__fill--done";
        else if (isFull) fillClass = " ops-seats__fill--warn";

        return `
            <div class="ops-seats__track" role="img"
                 aria-label="${booked} of ${capacity} seats booked">
                <div class="ops-seats__fill${fillClass}" style="width:${pct}%"></div>
            </div>
            <span class="ops-seats__count">${booked} / ${capacity}${isFull ? " (Full)" : ""}</span>`;
    }

    // ----------------------------------------------------------------------
    // STAT CARDS
    // ----------------------------------------------------------------------
    // A failed feed must not be reported as 0 - that reads as real data. Show a
    // dash instead so a broken endpoint is visually distinct from a true zero.
    function renderStats(shuttleCount, todayCount, driverCount, bookingsToday) {
        setText("statTotalShuttles", shuttleCount === null ? "\u2014" : shuttleCount);
        setText("statActiveSchedules", todayCount === null ? "\u2014" : todayCount);
        setText("statDriversOnDuty", driverCount === null ? "\u2014" : driverCount);
        setText("statTotalBookings", bookingsToday === null ? "\u2014" : bookingsToday.toLocaleString());
    }

    // Occupancy across today's trips, shown in the bookings tile's pill.
    function renderCapacityPill(todayRows) {
        const totals = todayRows.reduce((acc, row) => {
            acc.booked += Number(row.bookedSeats) || 0;
            acc.capacity += Number(row.capacity) || 0;
            return acc;
        }, { booked: 0, capacity: 0 });

        setText(
            "statCapacityPill",
            totals.capacity > 0
                ? `${Math.round((totals.booked / totals.capacity) * 100)}% Capacity`
                : "No capacity data"
        );
    }

    // ----------------------------------------------------------------------
    // OPERATIONS TABLE
    // ----------------------------------------------------------------------
    function renderStateRow(message, isError) {
        const body = document.getElementById("opsTableBody");
        if (!body) return;
        body.innerHTML = `
            <tr class="ops-state-row${isError ? " ops-state-row--error" : ""}">
                <td colspan="6">${escapeHtml(message)}</td>
            </tr>`;
    }

    function renderTable() {
        const body = document.getElementById("opsTableBody");
        if (!body) return;

        if (scheduleRows.length === 0) {
            console.log("[ops-dashboard] Schedules feed returned zero rows - rendering empty state.");
            renderStateRow("No active transit routes logged.", false);
            renderFooter(0, 0, 0);
            return;
        }

        const totalPages = Math.max(1, Math.ceil(scheduleRows.length / ROWS_PER_PAGE));
        if (currentPage > totalPages) currentPage = totalPages;

        const start = (currentPage - 1) * ROWS_PER_PAGE;
        const pageRows = scheduleRows.slice(start, start + ROWS_PER_PAGE);

        if (!warned.eta) {
            warned.eta = true;
            console.warn(
                "[ops-dashboard] Estimated/delayed departure notes are unavailable: no ETA " +
                "field exists on the trip record."
            );
        }

        body.innerHTML = pageRows.map(row => {
            const badge = statusToBadge(row.status);

            // routeName arrives pre-joined by the API; split it for the
            // two-line presentation the reference uses.
            const routeParts = String(row.routeName || "").split("\u2794").map(p => p.trim());
            const routeHtml = routeParts.length > 1
                ? `${escapeHtml(routeParts[0])} <span class="ops-route__arrow">&harr;</span> ${escapeHtml(routeParts[1])}`
                : escapeHtml(row.routeName || "\u2014");

            // The plate now comes straight off the schedules payload; the
            // name-based lookup remains only as a fallback for older responses.
            const plate = row.licensePlate || plateByShuttleName.get(row.shuttleName) || "";

            return `
                <tr>
                    <td>
                        <div class="ops-shuttle">
                            <span class="ops-shuttle__icon">${SHUTTLE_ICON}</span>
                            <span>
                                <span class="ops-shuttle__name">${escapeHtml(row.shuttleName || "Unassigned")}</span>
                                ${plate ? `<span class="ops-shuttle__plate">${escapeHtml(plate)}</span>` : ""}
                            </span>
                        </div>
                    </td>
                    <td><span class="ops-route">${routeHtml}</span></td>
                    <td>
                        <span class="ops-departure__time">${escapeHtml(to12Hour(row.departureTime))}</span>
                        <span class="ops-departure__note">${escapeHtml(row.scheduleDate || "")}</span>
                    </td>
                    <td>
                        <div class="ops-driver">
                            <span class="ops-driver__avatar" aria-hidden="true">${escapeHtml(initials(row.driverName))}</span>
                            <span class="ops-driver__name">${escapeHtml(row.driverName || "Unassigned")}</span>
                        </div>
                    </td>
                    <td>${seatsCell(row)}</td>
                    <td><span class="at-badge ${badge.cls}">${escapeHtml(badge.label)}</span></td>
                </tr>`;
        }).join("");

        renderFooter(pageRows.length, scheduleRows.length, totalPages);
    }

    function renderFooter(shown, total, totalPages) {
        setText("opsCount", `Showing ${shown} of ${total} active schedules`);

        const pager = document.getElementById("opsPager");
        if (!pager) return;

        if (totalPages <= 1) {
            pager.innerHTML = "";
            return;
        }

        let html = `<button class="ops-pager__btn" type="button" data-page="prev"
                        aria-label="Previous page" ${currentPage === 1 ? "disabled" : ""}>&lsaquo;</button>`;

        for (let page = 1; page <= totalPages; page++) {
            html += `<button class="ops-pager__btn${page === currentPage ? " is-current" : ""}"
                         type="button" data-page="${page}"
                         ${page === currentPage ? 'aria-current="page"' : ""}>${page}</button>`;
        }

        html += `<button class="ops-pager__btn" type="button" data-page="next"
                     aria-label="Next page" ${currentPage === totalPages ? "disabled" : ""}>&rsaquo;</button>`;

        pager.innerHTML = html;

        pager.querySelectorAll("[data-page]").forEach(btn => {
            btn.addEventListener("click", () => {
                const target = btn.getAttribute("data-page");
                if (target === "prev") currentPage = Math.max(1, currentPage - 1);
                else if (target === "next") currentPage = Math.min(totalPages, currentPage + 1);
                else currentPage = parseInt(target, 10);
                renderTable();
            });
        });
    }

    // ----------------------------------------------------------------------
    // DATA LOAD
    // ----------------------------------------------------------------------
    async function loadDashboard() {
        try {
            // Three independent reads, so fetch them together.
            const [schedulesRes, shuttlesRes, driversRes] = await Promise.all([
                fetch(API.schedules),
                fetch(API.shuttles),
                fetch(API.drivers)
            ]);

            if (!schedulesRes.ok) throw new Error(`Schedules HTTP ${schedulesRes.status}`);

            const schedules = await schedulesRes.json();

            // These two are non-fatal: the table still renders without them, but
            // a failure is reported rather than silently counted as zero.
            let shuttles = null;
            if (shuttlesRes.ok) {
                shuttles = await shuttlesRes.json();
            } else {
                console.error(
                    `[ops-dashboard] /api/coordinator/shuttles returned HTTP ${shuttlesRes.status}. ` +
                    "Total Shuttles and the plate sub-line will show as unavailable."
                );
            }

            let drivers = null;
            if (driversRes.ok) {
                drivers = await driversRes.json();
            } else {
                console.error(
                    `[ops-dashboard] /api/coordinator/drivers returned HTTP ${driversRes.status}. ` +
                    "Driver count will show as unavailable."
                );
            }

            // Plate isn't on the schedules payload, so map it from the fleet by
            // shuttle name. Best-effort: duplicate names would collide.
            plateByShuttleName = new Map();
            (shuttles || []).forEach(bus => {
                if (bus.shuttleName) plateByShuttleName.set(bus.shuttleName, bus.licensePlate);
            });

            scheduleRows = Array.isArray(schedules) ? schedules : [];

            const today = todayIso();
            const todayRows = scheduleRows.filter(row => row.scheduleDate === today);
            const todayCount = todayRows.length;

            // Total bookings today = live booking count summed across the shuttle
            // trips running today. Each trip carries its own route and vehicle, so
            // this only counts bookings on shuttles active on that date.
            const bookingsToday = todayRows.reduce(
                (sum, row) => sum + (Number(row.bookedSeats) || 0), 0
            );

            renderStats(
                shuttles ? shuttles.length : null,
                todayCount,
                drivers ? drivers.length : null,
                bookingsToday
            );
            renderCapacityPill(todayRows);
            renderTable();

            console.log(
                `[ops-dashboard] Loaded ${scheduleRows.length} schedules, ` +
                `${shuttles ? shuttles.length : "unavailable"} shuttles, ` +
                `${drivers ? drivers.length : "unavailable"} drivers ` +
                `(${todayCount} scheduled today, ${bookingsToday} bookings today).`
            );
        } catch (err) {
            console.error("[ops-dashboard] Failed to load dashboard data:", err);
            renderStateRow("Unable to connect to the backend server.", true);
            setText("opsCount", "Showing 0 of 0 active schedules");
        }
    }

    function init() {
        renderDateLine();
        loadDashboard();

        // "Live Updates" is a real poll, not decoration.
        refreshTimer = setInterval(loadDashboard, REFRESH_MS);

        // Stop polling when the tab is hidden; resume (and refresh) on return.
        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                clearInterval(refreshTimer);
                console.log("[ops-dashboard] Tab hidden - live refresh paused.");
            } else {
                loadDashboard();
                refreshTimer = setInterval(loadDashboard, REFRESH_MS);
                console.log("[ops-dashboard] Tab visible - live refresh resumed.");
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
