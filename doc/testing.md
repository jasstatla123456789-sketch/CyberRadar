# CyberRadar - Testing and Validation

> **Status:** Test plan prepared. Results below are **not yet verified**. Run each test on your own CyberRadar installation and replace `Not run` with Pass/Fail and evidence. Do not report tests as passed without executing them.

## Test environment

- Operating system: Windows (enter version)
- Python version: (enter version)
- Nmap version: (enter version)
- Wireshark version: (enter version)
- Browser: (enter name/version)
- Flask address: `http://127.0.0.1:5000`
- Testing scope: own laptop and authorized home network only

## Test cases

| ID | Feature | Procedure | Expected result | Status | Evidence |
|---|---|---|---|---|---|
| T01 | Dashboard | Open `/` | Page loads with charts and scanner panel | Not run | `screenshots/dashboard.png` |
| T02 | Nmap localhost scan | Click Run Local Scan | Port results and scan status display without error | Not run | `screenshots/nmap-scanner.png` |
| T03 | Nmap results | Inspect results table after scan | Port/protocol/service/state data and chart update | Not run | `screenshots/nmap-results.png` |
| T04 | Valid capture upload | Upload authorized `.pcap` or `.pcapng`, click Analyze | Packet counts, protocol breakdown and details display | Not run | `screenshots/wireshark-analysis.png` |
| T05 | Invalid file | Attempt unsupported file format | File is rejected or a clear error is shown | Not run | Record message |
| T06 | File size limit | Attempt capture over 20 MB | Upload is rejected with a clear error | Not run | Record message |
| T07 | Wi-Fi info | Open `/wifi` on connected laptop | Available SSID/IP/gateway/subnet displayed | Not run | `screenshots/home-wifi-scan.png` |
| T08 | Consent control | Try discovery without checking authorization | Scan does not start; consent guidance shown | Not run | Record message |
| T09 | Authorized host discovery | Check authorization and run scan on owned LAN | Responding devices and counts shown, if detectable | Not run | `screenshots/home-wifi-scan.png` |
| T10 | Device labels | Save a custom name/room for discovered device | Label persists after page refresh | Not run | Record result |
| T11 | Live laptop counters | Observe Live Laptop Activity | Download/upload counters refresh periodically | Not run | `screenshots/live-monitoring.png` |
| T12 | Application connections | Observe Live Applications | Observable local app connections are listed | Not run | `screenshots/live-monitoring.png` |

## Limitations and interpretation

- Nmap host discovery may not identify every connected device (firewalls, isolation, sleeping devices).
- MAC address, vendor and hostname may be unavailable depending on network and permissions.
- The dashboard's local TCP scan covers a selected port list; it is not a complete vulnerability assessment.
- Wireshark is an external capture tool. CyberRadar analyzes files with Scapy; it does not directly control Wireshark.
- Live counters and process connections represent the machine running the Flask application, not other devices.
- Device locations are user-entered room labels, not geolocation measurements.

## Evidence checklist

1. Capture screenshots only from your own running application.
2. Blur/redact SSIDs, MAC addresses, public IPs and identifying device labels.
3. Record the actual test date and any failures.
4. Keep private PCAP files and scan inventories out of the public GitHub repository.

## Test summary

- Tests planned: 12
- Passed: **To be completed after testing**
- Failed: **To be completed after testing**
- Not run: **12 initially**
