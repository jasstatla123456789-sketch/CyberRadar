
/* =========================================
   CYBERRADAR - HOME WI-FI SCAN
========================================= */

let knownNetworkDevices = [];
let selectedDeviceIP = null;

const $ = id => document.getElementById(id);


/* =========================================
   WIFI INFORMATION
========================================= */

async function loadWifiInfo() {
    try {
        const response = await fetch("/api/wifi/info");
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Wi-Fi unavailable");
        }

        $("wifiName").textContent = data.ssid;
        $("localIP").textContent = data.ip;
        $("gateway").textContent = data.gateway;

    } catch (error) {
        $("wifiName").textContent = "Unavailable";
        console.error("Wi-Fi information:", error);
    }
}


/* =========================================
   NETWORK DISCOVERY
========================================= */

function deviceDisplayName(device) {
    if (device.custom_name) {
        return device.custom_name;
    }

    if (device.hostname && device.hostname !== "Unknown") {
        return device.hostname;
    }

    return "Unknown Device";
}


function updateDeviceSummary() {
    const responding = knownNetworkDevices.filter(
        device => device.responding
    ).length;

    const newCount = knownNetworkDevices.filter(
        device => device.new
    ).length;

    $("knownDevices").textContent =
        knownNetworkDevices.length;

    $("onlineDevices").textContent = responding;

    $("newDevices").textContent = newCount;

    $("deviceCount").textContent =
        knownNetworkDevices.length;
}


function createDeviceCard(device) {
    const card = document.createElement("button");

    card.type = "button";
    card.className = "network-device-card";

    const avatar = document.createElement("div");
    avatar.className = "network-device-avatar";
    avatar.textContent = "◎";

    const info = document.createElement("div");
    info.className = "network-device-info";

    const title = document.createElement("strong");
    title.textContent = deviceDisplayName(device);

    const subtitle = document.createElement("p");
    subtitle.textContent =
        device.ip + " • " + (device.vendor || "Unknown");

    info.append(title, subtitle);

    if (device.room) {
        const room = document.createElement("small");
        room.textContent = "Location: " + device.room;
        info.appendChild(room);
    }

    const state = document.createElement("span");

    state.className = device.responding
        ? "device-state responding"
        : "device-state not-seen";

    state.textContent = device.responding
        ? "Responding"
        : "Not seen";

    card.append(avatar, info, state);

    if (device.new) {
        const badge = document.createElement("span");
        badge.className = "new-device-label";
        badge.textContent = "NEW";
        card.appendChild(badge);
    }

    card.addEventListener("click", () => {
        showDeviceDetails(device.ip);
    });

    return card;
}


function renderDeviceCards() {
    const container = $("deviceCards");
    container.innerHTML = "";

    const query = $("deviceSearch").value
        .trim()
        .toLowerCase();

    const filter = $("deviceFilter").value;

    const filtered = knownNetworkDevices.filter(device => {
        const searchable = [
            device.ip,
            device.mac,
            device.hostname,
            device.vendor,
            device.custom_name,
            device.room
        ].filter(Boolean).join(" ").toLowerCase();

        if (!searchable.includes(query)) {
            return false;
        }

        if (filter === "responding") {
            return device.responding;
        }

        if (filter === "not-seen") {
            return !device.responding;
        }

        if (filter === "new") {
            return device.new;
        }

        return true;
    });

    filtered.sort((a, b) => {
        if (a.responding !== b.responding) {
            return a.responding ? -1 : 1;
        }

        return deviceDisplayName(a).localeCompare(
            deviceDisplayName(b)
        );
    });

    if (filtered.length === 0) {
        const empty = document.createElement("p");
        empty.className = "status-text";
        empty.textContent = "No matching devices found.";
        container.appendChild(empty);
        return;
    }

    filtered.forEach(device => {
        container.appendChild(createDeviceCard(device));
    });
}


function setNetworkDevices(devices) {
    knownNetworkDevices = devices;

    updateDeviceSummary();
    renderDeviceCards();

    if (selectedDeviceIP) {
        const exists = devices.some(
            device => device.ip === selectedDeviceIP
        );

        if (exists) {
            showDeviceDetails(selectedDeviceIP);
        } else {
            closeDeviceDetails();
        }
    }
}


async function loadSavedDevices() {
    try {
        const response = await fetch(
            "/api/wifi/saved-devices"
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Could not load devices");
        }

        setNetworkDevices(data.devices || []);

    } catch (error) {
        $("discoveryStatus").textContent =
            "Error loading devices: " + error.message;
    }
}


async function loadDiscoveryNetwork() {
    try {
        const response = await fetch(
            "/api/wifi/discovery-info"
        );

        const data = await response.json();

        $("networkRange").textContent =
            data.network || "Unavailable";

    } catch (error) {
        $("networkRange").textContent = "Unavailable";
    }
}


async function discoverNetwork() {
    if (!$("scanAuthorized").checked) {
        $("discoveryStatus").textContent =
            "Confirm that you have permission to scan.";
        return;
    }

    const button = $("discoverBtn");

    button.disabled = true;
    button.textContent = "Scanning network...";

    $("discoveryStatus").textContent =
        "Searching for responding devices...";

    try {
        const response = await fetch(
            "/api/wifi/discover",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    authorized: true
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Discovery failed");
        }

        setNetworkDevices(data.devices || []);

        $("networkRange").textContent = data.network;

        $("discoveryStatus").textContent =
            `Found ${data.discovered_count} responding ` +
            `device(s), including ${data.new_count} new.`;

        $("lastDiscovery").textContent =
            "Last scan: " +
            data.timestamp.replace("T", " ");

    } catch (error) {
        $("discoveryStatus").textContent =
            "Error: " + error.message;

    } finally {
        button.disabled = false;
        button.textContent = "◎  Scan Home Network";
    }
}


/* =========================================
   DEVICE DETAILS
========================================= */

function showDeviceDetails(ip) {
    const device = knownNetworkDevices.find(
        item => item.ip === ip
    );

    if (!device) return;

    selectedDeviceIP = ip;

    $("detailTitle").textContent =
        deviceDisplayName(device);

    const fields = {
        detailIP: device.ip,
        detailMAC: device.mac,
        detailHostname: device.hostname,
        detailVendor: device.vendor,
        detailFirstSeen: device.first_seen,
        detailLastSeen: device.last_seen
    };

    Object.entries(fields).forEach(([id, value]) => {
        $(id).textContent = value || "Unavailable";
    });

    $("deviceCustomName").value =
        device.custom_name || "";

    $("deviceRoom").value =
        device.room || "";

    $("deviceSaveStatus").textContent = "";

    $("deviceDetailPanel").hidden = false;

    $("deviceDetailPanel").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


function closeDeviceDetails() {
    selectedDeviceIP = null;
    $("deviceDetailPanel").hidden = true;
}


async function saveDeviceDetails() {
    if (!selectedDeviceIP) return;

    const name = $("deviceCustomName").value.trim();
    const room = $("deviceRoom").value.trim();

    const status = $("deviceSaveStatus");
    const button = $("saveDeviceBtn");

    button.disabled = true;
    status.textContent = "Saving...";

    try {
        const response = await fetch(
            "/api/wifi/device/" +
            encodeURIComponent(selectedDeviceIP),
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    custom_name: name,
                    room: room
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Save failed");
        }

        const index = knownNetworkDevices.findIndex(
            device => device.ip === selectedDeviceIP
        );

        if (index !== -1) {
            knownNetworkDevices[index] = data.device;
        }

        renderDeviceCards();

        $("detailTitle").textContent =
            deviceDisplayName(data.device);

        status.textContent =
            "Device details saved successfully.";

    } catch (error) {
        status.textContent =
            "Error: " + error.message;

    } finally {
        button.disabled = false;
    }
}


/* =========================================
   LIVE LAPTOP NETWORK ACTIVITY
========================================= */

function formatBytes(bytes) {
    if (bytes >= 1024 * 1024 * 1024) {
        return (
            bytes / (1024 * 1024 * 1024)
        ).toFixed(2) + " GB";
    }

    if (bytes >= 1024 * 1024) {
        return (
            bytes / (1024 * 1024)
        ).toFixed(2) + " MB";
    }

    if (bytes >= 1024) {
        return (bytes / 1024).toFixed(2) + " KB";
    }

    return bytes.toFixed(0) + " B";
}


async function updateLiveActivity() {
    try {
        const response = await fetch(
            "/api/live/network"
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "Monitor unavailable"
            );
        }

        $("downloadSpeed").textContent =
            formatBytes(data.download_bps) + "/s";

        $("uploadSpeed").textContent =
            formatBytes(data.upload_bps) + "/s";

        $("totalReceived").textContent =
            formatBytes(data.total_download);

        $("totalSent").textContent =
            formatBytes(data.total_upload);

        const scale = 5 * 1024 * 1024;

        $("downloadBar").style.width =
            Math.min(
                100,
                data.download_bps / scale * 100
            ) + "%";

        $("uploadBar").style.width =
            Math.min(
                100,
                data.upload_bps / scale * 100
            ) + "%";

        $("liveStatus").textContent =
            "Last updated: " + data.timestamp;

    } catch (error) {
        $("liveStatus").textContent =
            "Error: " + error.message;
    }
}


/* =========================================
   LIVE LAPTOP APPLICATIONS
========================================= */

async function updateLiveApps() {
    const table = $("liveAppsTable");
    const status = $("liveAppsStatus");

    try {
        const response = await fetch(
            "/api/live/apps"
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "Application lookup failed"
            );
        }

        table.innerHTML = "";

        if (!data.apps || data.apps.length === 0) {
            const row = table.insertRow();
            const cell = row.insertCell();

            cell.colSpan = 3;
            cell.textContent =
                "No active application connections found.";

        } else {
            data.apps.forEach(app => {
                const row = table.insertRow();

                [
                    app.app,
                    app.connections,
                    app.remote_ips
                ].forEach(value => {
                    const cell = row.insertCell();
                    cell.textContent = value;
                });
            });
        }

        status.textContent =
            data.count + " application(s) detected.";

    } catch (error) {
        console.error("Live Apps error:", error);

        status.textContent =
            "Error: " + error.message;
    }
}


/* =========================================
   START EVERYTHING
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    $("discoverBtn").addEventListener(
        "click",
        discoverNetwork
    );

    $("deviceSearch").addEventListener(
        "input",
        renderDeviceCards
    );

    $("deviceFilter").addEventListener(
        "change",
        renderDeviceCards
    );

    $("closeDeviceDetail").addEventListener(
        "click",
        closeDeviceDetails
    );

    $("saveDeviceBtn").addEventListener(
        "click",
        saveDeviceDetails
    );

    loadWifiInfo();
    loadDiscoveryNetwork();
    loadSavedDevices();

    updateLiveActivity();
    updateLiveApps();

    setInterval(updateLiveActivity, 2000);
    setInterval(updateLiveApps, 3000);
});
