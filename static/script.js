
/* ====================================
   CYBERRADAR - COMPLETE JAVASCRIPT
==================================== */

let networkChart = null;
let protocolChart = null;
let selectedCapture = null;


// ------------------------------------
// NMAP CHART
// ------------------------------------

const networkCanvas = document.getElementById("networkChart");

networkChart = new Chart(networkCanvas, {
    type: "doughnut",

    data: {
        labels: ["Open", "Closed", "Filtered", "Other"],

        datasets: [{
            data: [0, 0, 0, 0],
            backgroundColor: [
                "#20e6a4",
                "#ffb86b",
                "#7b91ff",
                "#8495ab"
            ],
            borderWidth: 0,
            hoverOffset: 8
        }]
    },

    options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "75%",

        plugins: {
            legend: {
                position: "bottom",
                labels: {
                    color: "#a6b8c9",
                    padding: 20
                }
            }
        }
    }
});


// ------------------------------------
// RUN NMAP SCAN
// ------------------------------------

async function startScan() {

    const button = document.getElementById("scanBtn");
    const status = document.getElementById("scanStatus");

    button.disabled = true;
    button.textContent = "Scanning...";
    status.textContent = "Running Nmap scan...";

    try {
        const response = await fetch("/api/scan", {
            method: "POST"
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Scan failed.");
        }

        updateDashboard(data);

        status.textContent = "Scan completed successfully!";

    } catch (error) {
        status.textContent = "Error: " + error.message;

    } finally {
        button.disabled = false;
        button.textContent = "◎  Run Local Scan";
    }
}


// ------------------------------------
// UPDATE NMAP DASHBOARD
// ------------------------------------

function updateDashboard(data) {

    document.getElementById("devices").textContent = 1;

    document.getElementById("openPorts").textContent =
        data.open_ports;

    document.getElementById("lastScan").textContent =
        "Last scan: " + data.timestamp +
        " | Target: " + data.target;

    updateNmapTable(data.ports);
    updateNmapChart(data.ports);
}


// ------------------------------------
// NMAP RESULTS TABLE
// ------------------------------------

function updateNmapTable(ports) {

    const tbody = document.getElementById("resultsBody");
    tbody.innerHTML = "";

    if (ports.length === 0) {
        const row = tbody.insertRow();
        const cell = row.insertCell();

        cell.colSpan = 4;
        cell.className = "empty";
        cell.textContent = "No port results returned.";
        return;
    }

    ports.forEach(port => {

        const row = tbody.insertRow();

        [
            port.port,
            port.protocol,
            port.service
        ].forEach(value => {
            const cell = row.insertCell();
            cell.textContent = value;
        });

        const stateCell = row.insertCell();
        stateCell.textContent = port.state;

        if (["open", "closed", "filtered"].includes(port.state)) {
            stateCell.classList.add("state-" + port.state);
        }
    });
}


// ------------------------------------
// UPDATE NMAP CHART
// ------------------------------------

function updateNmapChart(ports) {

    const open = ports.filter(
        p => p.state === "open"
    ).length;

    const closed = ports.filter(
        p => p.state === "closed"
    ).length;

    const filtered = ports.filter(
        p => p.state === "filtered"
    ).length;

    const other = ports.length - open - closed - filtered;

    networkChart.data.datasets[0].data = [
        open, closed, filtered, other
    ];

    networkChart.update();
}


// ====================================
// WIRESHARK DRAG AND DROP
// ====================================

const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("pcapFile");
const browseBtn = document.getElementById("browseBtn");
const removeBtn = document.getElementById("removeFile");
const selectedFileBox = document.getElementById("selectedFile");
const fileName = document.getElementById("fileName");
const analyzeBtn = document.getElementById("analyzeBtn");
const analysisStatus = document.getElementById("analysisStatus");


// Open file browser
browseBtn.addEventListener("click", event => {
    event.stopPropagation();
    fileInput.click();
});


// Click upload area
dropZone.addEventListener("click", event => {
    if (event.target.closest("button")) return;
    fileInput.click();
});


// File chosen
fileInput.addEventListener("change", () => {
    if (fileInput.files.length) {
        selectCapture(fileInput.files[0]);
    }
});


// Prevent browser opening dropped files
["dragenter", "dragover", "dragleave", "drop"].forEach(
    eventName => {
        dropZone.addEventListener(eventName, event => {
            event.preventDefault();
            event.stopPropagation();
        });
    }
);


// Highlight upload area
dropZone.addEventListener("dragover", () => {
    dropZone.classList.add("drag-over");
});

dropZone.addEventListener("dragleave", event => {
    if (!dropZone.contains(event.relatedTarget)) {
        dropZone.classList.remove("drag-over");
    }
});


// Handle dropped file
dropZone.addEventListener("drop", event => {

    dropZone.classList.remove("drag-over");

    const files = event.dataTransfer.files;

    if (files.length) {
        selectCapture(files[0]);
    }
});


// ------------------------------------
// VALIDATE SELECTED FILE
// ------------------------------------

function selectCapture(file) {

    // Clear previous selection
    selectedCapture = null;
    fileInput.value = "";
    selectedFileBox.hidden = true;
    analyzeBtn.disabled = true;

    const extension = file.name.split(".").pop().toLowerCase();

    if (!["pcap", "pcapng"].includes(extension)) {
        analysisStatus.textContent =
            "Invalid file. Please choose .pcap or .pcapng.";
        return;
    }

    if (file.size === 0 || file.size > 20 * 1024 * 1024) {
        analysisStatus.textContent =
            "File must be nonempty and at most 20 MB.";
        return;
    }

    selectedCapture = file;

    fileName.textContent = file.name;
    selectedFileBox.hidden = false;
    analyzeBtn.disabled = false;

    analysisStatus.textContent =
        "File ready: " + formatSize(file.size);
}


function formatSize(bytes) {
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
}


// Remove selected file
removeBtn.addEventListener("click", event => {

    event.stopPropagation();

    selectedCapture = null;
    fileInput.value = "";
    selectedFileBox.hidden = true;
    analyzeBtn.disabled = true;

    analysisStatus.textContent =
        "Waiting for capture file...";
});


// Prevent click bubbling from the selected file
selectedFileBox.addEventListener("click", event => {
    event.stopPropagation();
});


// ------------------------------------
// ANALYZE WIRESHARK CAPTURE
// ------------------------------------

analyzeBtn.addEventListener("click", event => {
    event.stopPropagation();
    analyzePackets();
});


async function analyzePackets() {

    if (!selectedCapture) return;

    analyzeBtn.disabled = true;
    analyzeBtn.textContent = "Analyzing...";

    analysisStatus.textContent =
        "Reading captured packets...";

    document.getElementById("analysisResults").hidden = true;

    const formData = new FormData();
    formData.append("capture", selectedCapture);

    try {

        const response = await fetch("/api/analyze", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Analysis failed.");
        }

        showPacketResults(data);

        document.getElementById("analysisResults").hidden = false;

        analysisStatus.textContent = data.truncated
            ? "Analysis complete. Limited to first 5,000 packets."
            : "Packet analysis completed successfully!";

    } catch (error) {

        analysisStatus.textContent =
            "Error: " + error.message;

    } finally {

        analyzeBtn.disabled = !selectedCapture;
        analyzeBtn.textContent = "Analyze Packets";
    }
}


// ------------------------------------
// UPDATE PACKET RESULTS
// ------------------------------------

function showPacketResults(data) {

    document.getElementById("packetCount").textContent =
        data.total_packets;

    document.getElementById("dashboardPackets").textContent =
        data.total_packets;

    document.getElementById("tcpCount").textContent =
        data.protocols.TCP || 0;

    document.getElementById("udpCount").textContent =
        data.protocols.UDP || 0;

    document.getElementById("dnsCount").textContent =
        data.protocols.DNS || 0;

    updateProtocolChart(data.protocols);
    updatePacketTable(data.packets);
    updateTopSources(data.top_sources);
}


// ------------------------------------
// PROTOCOL DISTRIBUTION CHART
// ------------------------------------

function updateProtocolChart(protocols) {

    if (protocolChart) {
        protocolChart.destroy();
    }

    const ctx = document.getElementById("protocolChart");

    protocolChart = new Chart(ctx, {
        type: "bar",

        data: {
            labels: Object.keys(protocols),

            datasets: [{
                label: "Packets",
                data: Object.values(protocols),
                backgroundColor: "#20e6a4",
                borderRadius: 6
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            scales: {
                x: {
                    ticks: { color: "#a6b8c9" },
                    grid: { display: false }
                },

                y: {
                    beginAtZero: true,
                    ticks: {
                        color: "#a6b8c9",
                        precision: 0
                    },
                    grid: { color: "#243347" }
                }
            },

            plugins: {
                legend: { display: false }
            }
        }
    });
}


// ------------------------------------
// PACKET DETAILS TABLE
// ------------------------------------

function updatePacketTable(packets) {

    const tbody = document.getElementById("packetTable");
    tbody.innerHTML = "";

    packets.forEach(packet => {

        const row = tbody.insertRow();

        const values = [
            packet.number,
            packet.source,
            packet.destination,
            packet.protocol,
            packet.length + " bytes"
        ];

        values.forEach(value => {
            const cell = row.insertCell();
            cell.textContent = value;
        });
    });
}


// ------------------------------------
// TOP SOURCE IP ADDRESSES
// ------------------------------------

function updateTopSources(sources) {

    const container = document.getElementById("topSources");
    container.innerHTML = "";

    if (sources.length === 0) {
        container.textContent = "No IP source addresses found.";
        return;
    }

    sources.forEach(source => {

        const item = document.createElement("div");
        item.className = "source-item";

        const ip = document.createElement("span");
        ip.textContent = source.ip;

        const count = document.createElement("strong");
        count.textContent = source.packets + " packets";

        item.append(ip, count);
        container.appendChild(item);
    });
}


// ------------------------------------
// SIDEBAR ACTIVE LINK
// ------------------------------------

const navLinks = document.querySelectorAll(".nav-link");

navLinks.forEach(link => {

    link.addEventListener("click", () => {

        navLinks.forEach(item => {
            item.classList.remove("active");
        });

        link.classList.add("active");
    });
});


async function updateLiveApps() {
    const table = document.getElementById("liveAppsTable");
    const status = document.getElementById("liveAppsStatus");

    if (!table || !status) {
        console.error("Live Apps HTML elements not found.");
        return;
    }

    try {
        const response = await fetch("/api/live/apps");
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Failed to load applications");
        }

        table.innerHTML = "";

        if (!data.apps || data.apps.length === 0) {
            const row = table.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 3;
            cell.textContent = "No active applications detected.";
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
            `${data.count} application(s) detected.`;

    } catch (error) {
        console.error("Live Apps error:", error);
        status.textContent = "Error: " + error.message;
    }
}

// Run only after the HTML has loaded
document.addEventListener("DOMContentLoaded", () => {
    updateLiveApps();
    setInterval(updateLiveApps, 3000);
});

updateLiveApps();
setInterval(updateLiveApps, 3000);
