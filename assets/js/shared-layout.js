/* ==========================================================================
   ACADEMIC TRANSIT — SHARED LAYOUT INJECTOR
   Phase 1 deliverable. Renders the Navy top app bar and the fixed 280px
   role-aware sidebar into placeholder elements, so admin/, coordinator/ and
   driver/ share one implementation instead of three bespoke copies.

   Deliberately a plain script with no bundler, no modules and no framework —
   this repo has no build step and keeps it that way.

   USAGE — add two placeholders and this script to any portal page:

     <div data-at-topbar data-title="Coordinator Portal"></div>
     <div data-at-sidebar data-role="coordinator" data-active="dashboard"></div>
     <script src="../assets/js/shared-layout.js"></script>

   data-role   : "coordinator" | "admin" | "driver"  (which nav set to render)
   data-active : the `key` of the nav item to mark active
   ========================================================================== */

(function () {
    "use strict";

    // ----------------------------------------------------------------------
    // Inline SVG icons. Vector rather than emoji so they inherit currentColor
    // and stay crisp at any size.
    // ----------------------------------------------------------------------
    const ICONS = {
        dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>',
        users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
        bus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 17h16M4 17V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v11"/><path d="M4 11h16"/><circle cx="7.5" cy="17" r="1.5"/><circle cx="16.5" cy="17" r="1.5"/></svg>',
        calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
        shieldCheck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>',
        star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>',
        route: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><path d="M9 19h4a4 4 0 0 0 4-4V8"/></svg>',
        logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>',
        bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
        menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12h18M3 6h18M3 18h18"/></svg>',
        ticket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 6v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-6z"/><path d="M13 5v14"/></svg>',
        chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3v18h18"/><path d="M7 15v-4M12 15V8M17 15v-6"/></svg>',
        settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6 1.65 1.65 0 0 0 10 3.09V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.14.37.42.68.78.87"/></svg>',
        help: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>',
        plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
        user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M6.5 19.5a6 6 0 0 1 11 0"/></svg>'
    };

    // Secondary nav shown beneath the CTA. These open existing modals rather
    // than navigating, matching how the current pages already behave.
    const SECONDARY_NAV = [
        { label: "Settings", icon: "settings", handler: "openSettingsModal" },
        { label: "Support", icon: "help", handler: "openSupportModal" }
    ];

    // ----------------------------------------------------------------------
    // Nav sets. Only these differ per role — the markup and CSS are identical
    // across all three portals. Hrefs are relative to the portal folder, so
    // the same entry works from any page inside that folder.
    // ----------------------------------------------------------------------
    const NAV = {
        coordinator: {
            label: "Coordinator",
            // Labels follow the coordinator reference design. "Bookings" and
            // "Reports" appear in the reference but this repo has no page for
            // either, so they render disabled rather than linking to a 404.
            // "Driver Management" is not in the reference but is kept because
            // manage-drivers.html exists and works — dropping it would remove
            // the only route to that screen.
            items: [
                { key: "dashboard", label: "Dashboard", href: "dashboard.html", icon: "dashboard" },
                { key: "manage-shuttles", label: "Shuttle Management", href: "manage-shuttles.html", icon: "bus" },
                { key: "schedule-shuttles", label: "Scheduling", href: "schedule-shuttles.html", icon: "calendar" },
                { key: "manage-drivers", label: "Driver Management", href: "manage-drivers.html", icon: "users" },
                { key: "bookings", label: "Bookings", href: null, icon: "ticket" },
                { key: "reports", label: "Reports", href: null, icon: "chart" }
            ]
        },
        admin: {
            label: "Administrator",
            items: [
                { key: "dashboard", label: "Dashboard", href: "dashboard.html", icon: "dashboard" },
                { key: "verify-drivers", label: "Verify Drivers", href: "verify-drivers.html", icon: "shieldCheck" },
                { key: "driver-ratings", label: "Driver Ratings", href: "driver-ratings.html", icon: "star" }
            ]
        },
        driver: {
            label: "Driver",
            items: [
                { key: "dashboard", label: "My Dashboard", href: "dashboard.html", icon: "dashboard" }
            ]
        }
    };

    // Escapes text before it reaches innerHTML, so a label can never inject markup.
    function escapeHtml(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    // Portal pages live one folder deep (admin/, coordinator/, driver/), so
    // shared assets resolve via "../".
    function assetPath(relative) {
        return "../" + relative;
    }

    function renderTopbar(host) {
        const title = host.getAttribute("data-title") || "GetYourRide";

        // data-inset renders the light strip shown in the coordinator reference:
        // it sits to the right of the sidebar and right-aligns its contents.
        // Without it, the Phase 1 full-width Navy bar is used.
        const isInset = host.hasAttribute("data-inset");

        host.className = "at-topbar" + (isInset ? " at-topbar--inset" : "");
        host.setAttribute("role", "banner");

        const menuButton = `
            <button class="at-icon-btn at-topbar__menu-btn" type="button"
                    data-at-menu-toggle aria-label="Toggle navigation menu"
                    aria-controls="atSidebar" aria-expanded="false">
                ${ICONS.menu}
            </button>
        `;

        if (isInset) {
            host.innerHTML = `
                ${menuButton}

                <!-- Portal label, status dot and account button, right-aligned -->
                <div class="at-topbar__actions">
                    <span class="at-topbar__portal-label">${escapeHtml(title)}</span>
                    <span class="at-topbar__status-dot" role="status"
                          aria-label="Unread notifications"></span>
                    <button class="at-icon-btn" type="button" data-at-account
                            aria-label="Account">
                        ${ICONS.user}
                    </button>
                </div>
            `;
            return;
        }

        host.innerHTML = `
            <!-- Brand lockup: logo left, aligned over the sidebar rail -->
            <div class="at-topbar__brand">
                ${menuButton}
                <img class="at-topbar__logo" src="${assetPath("assets/img/logo.png")}" alt="GetYourRide logo">
                <span class="at-topbar__title">${escapeHtml(title)}</span>
            </div>

            <!-- Notification bell right -->
            <div class="at-topbar__actions">
                <button class="at-icon-btn" type="button" data-at-notifications
                        aria-label="Notifications">
                    ${ICONS.bell}
                    <span class="at-icon-btn__dot" aria-hidden="true"></span>
                </button>
            </div>
        `;
    }

    function renderSidebar(host) {
        const role = (host.getAttribute("data-role") || "").toLowerCase();
        const activeKey = host.getAttribute("data-active") || "";
        const config = NAV[role];

        // Fail loudly in the console rather than rendering an empty rail —
        // console output is the only diagnostic this app has.
        if (!config) {
            console.error(
                `[shared-layout] Unknown sidebar role "${role}". Expected one of: ${Object.keys(NAV).join(", ")}.`
            );
            return;
        }

        const links = config.items.map(item => {
            const isActive = item.key === activeKey;

            // Items with no href are destinations the reference shows but this
            // repo has no page for. Render them inert instead of linking to a 404.
            if (!item.href) {
                return `
                    <li>
                        <span class="at-sidebar__link" aria-disabled="true"
                              title="Not available yet — this portal has no ${escapeHtml(item.label)} page.">
                            ${ICONS[item.icon] || ""}
                            <span>${escapeHtml(item.label)}</span>
                        </span>
                    </li>
                `;
            }

            return `
                <li>
                    <a class="at-sidebar__link${isActive ? " is-active" : ""}"
                       href="${escapeHtml(item.href)}"
                       ${isActive ? 'aria-current="page"' : ""}>
                        ${ICONS[item.icon] || ""}
                        <span>${escapeHtml(item.label)}</span>
                    </a>
                </li>
            `;
        }).join("");

        // --- Optional blocks, all opt-in via data attributes so the Phase 1
        //     default chrome on other portals is unaffected. ---
        const brandName = host.getAttribute("data-brand");
        const brandRole = host.getAttribute("data-brand-role");
        const brandBlock = brandName
            ? `
            <a class="at-sidebar__brand" href="dashboard.html">
                <span class="at-sidebar__brand-name">${escapeHtml(brandName)}</span>
                ${brandRole ? `<span class="at-sidebar__brand-role">${escapeHtml(brandRole)}</span>` : ""}
            </a>`
            : `<p class="at-sidebar__role">${escapeHtml(config.label)}</p>`;

        const ctaLabel = host.getAttribute("data-cta-label");
        const ctaHref = host.getAttribute("data-cta-href");
        const ctaBlock = ctaLabel
            ? `
            <div class="at-sidebar__cta-wrap">
                ${ctaHref
                    ? `<a class="at-sidebar__cta" href="${escapeHtml(ctaHref)}">${ICONS.plus}<span>${escapeHtml(ctaLabel)}</span></a>`
                    : `<button class="at-sidebar__cta" type="button" data-at-cta>${ICONS.plus}<span>${escapeHtml(ctaLabel)}</span></button>`}
            </div>`
            : "";

        const secondaryBlock = host.hasAttribute("data-secondary-nav")
            ? `
            <ul class="at-sidebar__nav at-sidebar__nav--secondary">
                ${SECONDARY_NAV.map(item => `
                    <li>
                        <button class="at-sidebar__link at-sidebar__link--logout" type="button"
                                data-at-handler="${escapeHtml(item.handler)}">
                            ${ICONS[item.icon] || ""}
                            <span>${escapeHtml(item.label)}</span>
                        </button>
                    </li>
                `).join("")}
            </ul>`
            : "";

        // The user block reuses the IDs the existing scripts already populate
        // (coordinatorNameLabel / coordinatorEmailLabel) so profile loading and
        // the profile dropdown keep working untouched.
        const userBlock = host.hasAttribute("data-user-footer")
            ? `
            <div class="sidebar-profile-footer">
                <div class="at-sidebar__user" id="profileTrigger" onclick="toggleProfileMenu(event)">
                    <span class="at-sidebar__avatar" aria-hidden="true">SC</span>
                    <span class="at-sidebar__user-text">
                        <span class="at-sidebar__user-name" id="coordinatorNameLabel">Loading profile...</span>
                        <span class="at-sidebar__user-role" id="coordinatorEmailLabel">connecting to database...</span>
                    </span>
                </div>

                <div class="profile-dropdown-menu" id="profileDropdown">
                    <a href="#" class="dropdown-link" id="btnDropdownProfile" onclick="openProfileModal(event)">View Profile</a>
                    <hr class="dropdown-divider">
                    <a href="#" class="dropdown-link logout-action" data-at-logout>Logout Portal</a>
                </div>
            </div>`
            : `
            <div class="at-sidebar__footer">
                <button class="at-sidebar__link at-sidebar__link--logout" type="button" data-at-logout>
                    ${ICONS.logout}
                    <span>Log out</span>
                </button>
            </div>`;

        host.id = "atSidebar";
        host.className = "at-sidebar" + (host.hasAttribute("data-full-height") ? " at-sidebar--full" : "");
        host.innerHTML = `
            ${brandBlock}

            <!-- Role-aware nav: the only part that differs between portals -->
            <ul class="at-sidebar__nav">
                ${links}
            </ul>

            <div class="at-sidebar__footer" style="padding:0;">
                ${ctaBlock}
                ${secondaryBlock}
                ${userBlock}
            </div>
        `;

        console.log(`[shared-layout] Sidebar rendered for role "${role}" (active: "${activeKey || "none"}").`);
    }

    // Wires the collapsible rail and the logout button. Both are new UI, so
    // each branch logs on the paths a reviewer would want to trace.
    function bindBehaviour() {
        const sidebar = document.getElementById("atSidebar");
        const toggle = document.querySelector("[data-at-menu-toggle]");

        if (sidebar && toggle) {
            toggle.addEventListener("click", () => {
                const isOpen = sidebar.classList.toggle("is-open");
                toggle.setAttribute("aria-expanded", String(isOpen));
            });
        }

        // Secondary nav buttons call a global handler by name (openSettingsModal,
        // openSupportModal). Those already exist in admin-dropdown.js; if a page
        // doesn't load it, log instead of throwing.
        document.querySelectorAll("[data-at-handler]").forEach(btn => {
            btn.addEventListener("click", () => {
                const fnName = btn.getAttribute("data-at-handler");
                if (typeof window[fnName] === "function") {
                    window[fnName]();
                } else {
                    console.warn(`[shared-layout] Handler "${fnName}" is not defined on this page.`);
                }
            });
        });

        // The top-bar account button opens the same profile modal the sidebar
        // dropdown uses, so both entry points behave identically.
        const accountBtn = document.querySelector("[data-at-account]");
        if (accountBtn) {
            accountBtn.addEventListener("click", () => {
                if (typeof window.openProfileModal === "function") {
                    window.openProfileModal();
                } else {
                    console.warn("[shared-layout] openProfileModal() is not defined on this page.");
                }
            });
        }

        const logoutBtn = document.querySelector("[data-at-logout]");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", () => {
                // Existing pages already define handleLogout(); reuse it so the
                // confirm-then-redirect behaviour stays identical.
                if (typeof window.handleLogout === "function") {
                    window.handleLogout();
                } else {
                    console.log("[shared-layout] No page-level handleLogout(); using default redirect.");
                    if (confirm("Log out of this session?")) {
                        window.location.href = assetPath("Login.html");
                    }
                }
            });
        }
    }

    function init() {
        const topbarHost = document.querySelector("[data-at-topbar]");
        if (topbarHost) renderTopbar(topbarHost);

        const sidebarHost = document.querySelector("[data-at-sidebar]");
        if (sidebarHost) renderSidebar(sidebarHost);

        bindBehaviour();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
