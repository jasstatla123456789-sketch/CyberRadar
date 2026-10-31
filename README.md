# CyberRadar — Network Security Dashboard

CyberRadar is a Python Flask-based cybersecurity dashboard designed for network scanning, device discovery, packet analysis, and real-time laptop network monitoring.

## Features

- **Network Scanner:** Scan selected localhost TCP ports using Nmap.
- **Home Wi-Fi Discovery:** Discover responding devices on an authorized local network.
- **Device Inventory:** View discovered IP addresses, MAC addresses (when available), and device details.
- **Packet Analyzer:** Upload and analyze PCAP/PCAPNG files using Scapy.
- **Live Network Monitoring:** View laptop download and upload activity.
- **Application Monitoring:** Display locally observable application network connections.
- **Cybersecurity Dashboard:** Modern dark-themed interface with charts and glass-style panels.

## Technologies Used

- Python
- Flask
- Nmap
- Scapy
- psutil
- HTML
- CSS
- JavaScript
- Chart.js

## Installation

1. Clone the repository:

   `git clone https://github.com/YOUR_USERNAME/CyberRadar.git`

2. Open the project folder:

   `cd CyberRadar`

3. Create a virtual environment:

   `python -m venv .venv`

4. Activate the environment on Windows:

   `.venv\Scripts\activate`

5. Install the required Python packages:

   `pip install -r requirements.txt`

6. Install Nmap separately and ensure it is available in your system PATH.

7. Start the application:

   `python app.py`

8. Open:

   `http://127.0.0.1:5000`

## Project Pages

- Dashboard
- Network Scanner
- Packet Analyzer
- Scan Results
- Home Wi-Fi Scan
- Live Laptop Activity
- Live Laptop Applications

## Security and Privacy

CyberRadar is intended for educational purposes and authorized network testing only. Scan only networks you own or have permission to assess.

Packet captures and local device inventories are excluded from version control to help protect private network information.

## Future Improvements

- Network topology visualization
- Device history and alerts
- Exportable security reports
- Additional traffic analysis charts

## License

MIT License (if added to this repository).
