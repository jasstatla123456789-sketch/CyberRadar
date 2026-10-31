# 🛡️ CyberRadar — Network Security Monitoring & Analysis Dashboard

### Network Scanning with Nmap | Packet Analysis with Wireshark

CyberRadar is a web-based cybersecurity project developed using **Python, Flask, Nmap, Wireshark, Scapy, and psutil**. It combines network scanning, packet analysis, device discovery, and real-time network monitoring into a modern, interactive dashboard.

The project is designed to help users understand network activity, inspect packet captures, identify open ports, and discover responding devices on authorized local networks.

---

## 🎯 Project Objectives

- Perform network scanning and port discovery using **Nmap**.
- Capture and inspect network traffic using **Wireshark**.
- Analyze Wireshark-generated PCAP/PCAPNG files using **Scapy**.
- Discover responding devices on a home or authorized local network.
- Monitor real-time laptop network activity.
- Display network statistics and analysis results through an interactive dashboard.
- Provide a user-friendly interface for learning practical cybersecurity concepts.

---

## 🚀 Key Features

### 1. Network Scanner — Nmap

CyberRadar integrates Nmap to perform TCP port scanning on the local computer.

**Features:**
- Scan selected TCP ports on localhost (`127.0.0.1`).
- Identify open, closed, and filtered port states where reported by Nmap.
- Display port numbers, protocols, and service information.
- Visualize scan results using charts.
- View scan results directly in the dashboard.

### 2. Packet Analyzer — Wireshark & Scapy

Wireshark is used to capture network traffic, while Scapy processes the saved packet captures inside CyberRadar.

**Features:**
- Capture network packets using Wireshark.
- Export captures in `.pcap` or `.pcapng` format.
- Upload packet capture files through the CyberRadar interface.
- Analyze TCP, UDP, DNS, and other detectable protocols.
- Display source and destination IP addresses.
- View packet lengths and protocol statistics.
- Visualize protocol distribution using charts.
- Identify frequently occurring source IP addresses.

**Workflow:**

Wireshark → PCAP/PCAPNG File → Scapy Analysis → CyberRadar Dashboard

### 3. Home Wi-Fi Scan — Nmap

CyberRadar uses Nmap host discovery to identify responding devices on an authorized local network.

**Features:**
- Detect the connected Wi-Fi network and local IP address.
- Display the default gateway and network range.
- Discover responding network devices.
- Display IP addresses and available device information.
- Maintain a local inventory of discovered devices.
- Identify newly discovered devices.
- Add custom device names and room labels.
- Search and filter discovered devices.

### 4. Live Network Monitoring

CyberRadar monitors network activity on the laptop running the application.

**Features:**
- Real-time download speed.
- Real-time upload speed.
- Total network data received.
- Total network data sent.
- Live network activity indicators.

### 5. Live Application Monitoring

CyberRadar displays locally observable network connections associated with running applications.

**Features:**
- Identify applications with network connections.
- Display the number of observable connections.
- Count unique remote IP addresses.
- Refresh application information automatically.

### 6. Interactive Cybersecurity Dashboard

- Midnight-blue cybersecurity theme.
- Frosted-glass panels and neon-green accents.
- Animated radar interface.
- Interactive charts using Chart.js.
- Network scanning and packet analysis results.
- Responsive dashboard layout.

---

## 🛠️ Technologies Used

| Technology | Purpose |
|---|---|
| Python | Backend programming |
| Flask | Web application framework |
| Nmap | Port scanning and network device discovery |
| Wireshark | Network traffic capture and inspection |
| Scapy | Processing and analyzing packet capture files |
| psutil | Real-time system and network monitoring |
| HTML5 | Website structure |
| CSS3 | Dashboard styling and glassmorphism |
| JavaScript | Frontend functionality and API interaction |
| Chart.js | Data visualization |

---

## 🏗️ System Architecture

```text
                    CYBERRADAR
                         |
                Flask Web Application
                         |
        +----------------+----------------+
        |                |                |
     NMAP            WIRESHARK        PSUTIL
        |                |                |
  Port Scanning     Packet Capture   Live Network
  Host Discovery         |           Monitoring
        |           PCAP / PCAPNG         |
        |                |                |
        |           Scapy Analysis        |
        |                |                |
        +----------------+----------------+
                         |
                 CyberRadar Dashboard
                         |
              Charts, Tables & Results
```

**Note:** Wireshark captures are imported into CyberRadar as files. Wireshark is not directly controlled by the Flask application.

---

## 📁 Project Structure

```text
CyberRadar/
|
|-- app.py
|-- requirements.txt
|-- README.md
|-- .gitignore
|
|-- templates/
|   |-- index.html
|   |-- wifi.html
|
|-- static/
|   |-- style.css
|   |-- wifi.css
|   |-- script.js
|   |-- wifi.js
|   |
|   |-- media/
|       |-- radar.mp4
|
|-- scans/
|
|-- captures/
```

The exact project structure may vary depending on the included assets and locally generated files.

---

## ⚙️ Installation and Setup

### Prerequisites

Make sure the following are installed:

- Python 3
- Nmap
- Wireshark
- Git (for cloning the repository)
- A modern web browser

### Step 1 — Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/CyberRadar.git
```

### Step 2 — Open the Project Directory

```bash
cd CyberRadar
```

### Step 3 — Create a Virtual Environment

```bash
python -m venv .venv
```

### Step 4 — Activate the Environment (Windows)

```powershell
.venv\Scripts\activate
```

### Step 5 — Install Python Dependencies

```bash
pip install -r requirements.txt
```

### Step 6 — Verify Nmap Installation

```bash
nmap --version
```

Ensure Nmap is installed and accessible through the system PATH.

### Step 7 — Run CyberRadar

```bash
python app.py
```

### Step 8 — Open the Dashboard

Open the following address in your browser:

`http://127.0.0.1:5000`

---

## 🔍 How to Use CyberRadar

### Nmap Network Scanning

1. Open the CyberRadar dashboard.
2. Navigate to **Network Scanner**.
3. Click **Run Local Scan**.
4. View the detected TCP port states and results.

### Wireshark Packet Analysis

1. Open Wireshark.
2. Capture traffic from your own device or an authorized test environment.
3. Save the capture as `.pcap` or `.pcapng`.
4. Open **Packet Analyzer** in CyberRadar.
5. Upload the saved capture file.
6. Click **Analyze Packets**.
7. Review the packet details, statistics, and charts.

### Home Wi-Fi Device Discovery

1. Connect your laptop to your own or an authorized Wi-Fi network.
2. Navigate to **Home Wi-Fi Scan**.
3. Review the detected network range.
4. Confirm that you have permission to scan the network.
5. Click **Scan Home Network**.
6. Explore responding devices and available information.

### Live Monitoring

Open **Live Laptop Activity** or **Live Laptop Applications** on the Home Wi-Fi Scan page to view automatically refreshed monitoring information.

---

## 🔐 Security and Privacy

CyberRadar is developed for educational purposes and authorized network analysis.

- Scan only devices and networks you own or have permission to assess.
- Use Wireshark only to capture traffic you are authorized to inspect.
- Avoid uploading sensitive packet captures or private network inventories to public repositories.
- Keep personal network data and locally generated scan results out of GitHub.

---

## 📈 Future Enhancements

- Network topology visualization.
- Historical network activity graphs.
- New-device notifications.
- Additional packet analysis capabilities.
- Exportable network security reports.
- Improved device identification.
- Customizable dashboard widgets.

---

## 📌 Project Summary

**Project Name:** CyberRadar — Network Security Monitoring & Analysis Dashboard

**Primary Cybersecurity Tools:** Nmap and Wireshark

**Programming Language:** Python

**Framework:** Flask

**Project Domain:** Cybersecurity, Network Scanning, Network Traffic Analysis, and Network Monitoring

**Project Type:** Educational Cybersecurity Web Application

---

## 📜 License

This project may be distributed under the MIT License if an MIT `LICENSE` file is included in the repository.

---

Developed as a practical cybersecurity project to demonstrate network scanning using **Nmap**, packet capture using **Wireshark**, packet analysis using **Scapy**, and real-time network monitoring using **psutil**.
