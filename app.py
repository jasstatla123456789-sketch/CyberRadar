
from flask import Flask, render_template, jsonify, request
from werkzeug.exceptions import RequestEntityTooLarge

from scapy.utils import PcapReader
from scapy.layers.inet import IP, TCP, UDP, ICMP
from scapy.layers.inet6 import IPv6
from scapy.layers.dns import DNS

from collections import Counter
from datetime import datetime
from pathlib import Path

import subprocess
import shutil
import tempfile
import os
import re
import json
import socket
import ipaddress
import threading
import platform
import xml.etree.ElementTree as ET

import psutil


app = Flask(__name__)

app.config["MAX_CONTENT_LENGTH"] = 21 * 1024 * 1024

BASE_DIR = Path(__file__).resolve().parent
SCAN_DIR = BASE_DIR / "scans"
SCAN_DIR.mkdir(exist_ok=True)

DEVICE_FILE = SCAN_DIR / "home_devices.json"

TARGET = "127.0.0.1"
PORTS = "21,22,53,80,443,3306"

MAX_FILE_SIZE = 20 * 1024 * 1024
MAX_PACKETS = 5000
MAX_DISPLAY_PACKETS = 100

DEVICE_LOCK = threading.Lock()
SCAN_LOCK = threading.Lock()
NETWORK_LOCK = threading.Lock()

previous_sample = None


# ==========================================
# WEB PAGES
# ==========================================

@app.route("/")
def home():
    return render_template("index.html")


@app.route("/wifi")
def wifi_page():
    return render_template("wifi.html")


# ==========================================
# ORIGINAL LOCALHOST NMAP SCANNER
# ==========================================

@app.route("/api/scan", methods=["POST"])
def scan_network():

    nmap_path = shutil.which("nmap")

    if not nmap_path:
        return jsonify({
            "error": "Nmap not found. Install Nmap and add it to PATH."
        }), 500

    try:
        result = subprocess.run(
            [
                nmap_path,
                "-sT",
                "-Pn",
                "-p", PORTS,
                "-oX", "-",
                TARGET
            ],
            capture_output=True,
            text=True,
            timeout=40,
            check=False
        )

        if result.returncode != 0:
            return jsonify({
                "error": result.stderr.strip() or "Nmap scan failed."
            }), 500

        root = ET.fromstring(result.stdout)
        ports = []

        for port in root.findall(".//port"):
            state = port.find("state")
            service = port.find("service")

            ports.append({
                "port": port.get("portid", ""),
                "protocol": port.get("protocol", ""),
                "state": (
                    state.get("state", "unknown")
                    if state is not None else "unknown"
                ),
                "service": (
                    service.get("name", "unknown")
                    if service is not None else "unknown"
                )
            })

        return jsonify({
            "target": TARGET,
            "timestamp": datetime.now().strftime(
                "%Y-%m-%d %H:%M:%S"
            ),
            "ports": ports,
            "open_ports": sum(
                p["state"] == "open" for p in ports
            ),
            "total_ports": len(ports)
        })

    except subprocess.TimeoutExpired:
        return jsonify({
            "error": "Nmap scan timed out."
        }), 504

    except (ET.ParseError, OSError):
        app.logger.exception("Nmap scan failed")
        return jsonify({
            "error": "Could not complete Nmap scan."
        }), 500


# ==========================================
# ORIGINAL WIRESHARK PACKET ANALYZER
# ==========================================

@app.route("/api/analyze", methods=["POST"])
def analyze_capture():

    uploaded = request.files.get("capture")

    if not uploaded:
        return jsonify({
            "error": "Please upload a capture file."
        }), 400

    extension = Path(
        uploaded.filename or ""
    ).suffix.lower()

    if extension not in (".pcap", ".pcapng"):
        return jsonify({
            "error": "Only PCAP and PCAPNG files are supported."
        }), 400

    uploaded.stream.seek(0, os.SEEK_END)
    size = uploaded.stream.tell()
    uploaded.stream.seek(0)

    if size == 0 or size > MAX_FILE_SIZE:
        return jsonify({
            "error": "File must be between 1 byte and 20 MB."
        }), 400

    protocol_counts = Counter()
    source_counts = Counter()
    packet_details = []

    total_packets = 0
    truncated = False
    temporary_path = None

    try:
        with tempfile.NamedTemporaryFile(
            suffix=extension,
            delete=False
        ) as temp:
            temporary_path = temp.name
            uploaded.save(temp)

        with PcapReader(temporary_path) as reader:

            for packet in reader:

                if total_packets >= MAX_PACKETS:
                    truncated = True
                    break

                total_packets += 1

                source = "Unknown"
                destination = "Unknown"

                if IP in packet:
                    source = packet[IP].src
                    destination = packet[IP].dst

                elif IPv6 in packet:
                    source = packet[IPv6].src
                    destination = packet[IPv6].dst

                if DNS in packet:
                    protocol = "DNS"
                elif TCP in packet:
                    protocol = "TCP"
                elif UDP in packet:
                    protocol = "UDP"
                elif ICMP in packet:
                    protocol = "ICMP"
                else:
                    protocol = "Other"

                protocol_counts[protocol] += 1

                if source != "Unknown":
                    source_counts[source] += 1

                if len(packet_details) < MAX_DISPLAY_PACKETS:
                    packet_details.append({
                        "number": total_packets,
                        "source": source,
                        "destination": destination,
                        "protocol": protocol,
                        "length": len(packet)
                    })

        return jsonify({
            "total_packets": total_packets,
            "protocols": dict(protocol_counts),
            "top_sources": [
                {"ip": ip, "packets": count}
                for ip, count in source_counts.most_common(5)
            ],
            "packets": packet_details,
            "truncated": truncated,
            "timestamp": datetime.now().strftime(
                "%Y-%m-%d %H:%M:%S"
            )
        })

    except Exception:
        app.logger.exception("Packet analysis failed")
        return jsonify({
            "error": "Could not read the capture file."
        }), 400

    finally:
        if temporary_path and os.path.exists(temporary_path):
            os.remove(temporary_path)


# ==========================================
# WINDOWS WI-FI INFORMATION
# ==========================================

def get_wifi_info():

    info = {
        "ssid": "Unavailable",
        "ip": "Unavailable",
        "gateway": "Unavailable",
        "subnet_mask": "Unavailable",
        "network": None
    }

    if platform.system() != "Windows":
        return info

    try:
        # Read connected Wi-Fi SSID
        wlan = subprocess.run(
            ["netsh", "wlan", "show", "interfaces"],
            capture_output=True,
            text=True,
            timeout=10,
            check=False
        )

        match = re.search(
            r"^\s*SSID\s*:\s*(.+)$",
            wlan.stdout,
            re.MULTILINE
        )

        if match:
            info["ssid"] = match.group(1).strip()

        # Find the Wi-Fi interface's actual IPv4
        # address, netmask and default gateway.
        addresses = psutil.net_if_addrs()
        statistics = psutil.net_if_stats()

        wifi_candidates = []

        for interface, items in addresses.items():

            name = interface.lower()

            if not any(
                word in name
                for word in ("wi-fi", "wifi", "wireless", "wlan")
            ):
                continue

            stats = statistics.get(interface)

            if not stats or not stats.isup:
                continue

            for item in items:
                if item.family != socket.AF_INET:
                    continue

                address = ipaddress.ip_address(item.address)

                if not address.is_private or address.is_loopback:
                    continue

                wifi_candidates.append({
                    "interface": interface,
                    "ip": item.address,
                    "mask": item.netmask
                })

        if not wifi_candidates:
            return info

        selected = wifi_candidates[0]

        info["ip"] = selected["ip"]
        info["subnet_mask"] = selected["mask"]

        network = ipaddress.ip_network(
            f"{selected['ip']}/{selected['mask']}",
            strict=False
        )

        info["network"] = str(network)

        # Match the Wi-Fi interface section in ipconfig.
        config = subprocess.run(
            ["ipconfig"],
            capture_output=True,
            text=True,
            timeout=10,
            check=False
        )

        sections = re.split(
            r"\r?\n\s*\r?\n",
            config.stdout
        )

        for section in sections:
            if selected["ip"] not in section:
                continue

            gateway_match = re.search(
                r"Default Gateway[^\n]*:\s*([\d.]+)",
                section
            )

            if gateway_match:
                info["gateway"] = gateway_match.group(1)

            break

        # Fallback: read gateway from Windows routing table
        # when ipconfig parsing doesn't find it.
        if info["gateway"] == "Unavailable":

            route = subprocess.run(
                ["route", "print", "-4"],
                capture_output=True,
                text=True,
                timeout=10,
                check=False
            )

            for line in route.stdout.splitlines():
                fields = line.split()

                if len(fields) < 5:
                    continue

                if (
                    fields[0] == "0.0.0.0"
                    and fields[1] == "0.0.0.0"
                    and fields[3] == selected["ip"]
                ):
                    info["gateway"] = fields[2]
                    break

    except (OSError, ValueError, subprocess.TimeoutExpired):
        app.logger.exception("Wi-Fi information unavailable")

    return info


@app.route("/api/wifi/info")
def wifi_info_api():
    return jsonify(get_wifi_info())


# ==========================================
# FING-STYLE DEVICE DISCOVERY
# ==========================================

def get_discovery_network():

    wifi = get_wifi_info()
    network_text = wifi.get("network")

    if not network_text:
        return None

    try:
        network = ipaddress.ip_network(
            network_text,
            strict=False
        )

        if not isinstance(
            network, ipaddress.IPv4Network
        ):
            return None

        if not network.is_private:
            return None

        # Avoid scanning unusually large networks.
        if network.num_addresses > 256:
            return None

        if network.prefixlen < 24:
            return None

        return network

    except ValueError:
        return None


def load_devices():

    if not DEVICE_FILE.exists():
        return {}

    try:
        with DEVICE_FILE.open(
            "r", encoding="utf-8"
        ) as file:
            data = json.load(file)

        return data if isinstance(data, dict) else {}

    except (OSError, json.JSONDecodeError):
        return {}


def save_devices(devices):

    DEVICE_FILE.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    temporary = DEVICE_FILE.with_suffix(".tmp")

    with temporary.open(
        "w", encoding="utf-8"
    ) as file:
        json.dump(devices, file, indent=2)

    temporary.replace(DEVICE_FILE)


@app.route("/api/wifi/discovery-info")
def discovery_info():

    network = get_discovery_network()

    return jsonify({
        "network": str(network) if network else None,
        "supported": network is not None
    })


@app.route("/api/wifi/saved-devices")
def saved_devices():

    with DEVICE_LOCK:
        saved = load_devices()

    return jsonify({
        "devices": list(saved.values()),
        "count": len(saved)
    })


@app.route("/api/wifi/discover", methods=["POST"])
def discover_devices():

    payload = request.get_json(silent=True) or {}

    if payload.get("authorized") is not True:
        return jsonify({
            "error": "Please confirm permission to scan."
        }), 403

    network = get_discovery_network()

    if network is None:
        return jsonify({
            "error": (
                "Could not determine a supported Wi-Fi subnet. "
                "Connect your laptop to your home Wi-Fi."
            )
        }), 400

    nmap_path = shutil.which("nmap")

    if not nmap_path:
        return jsonify({
            "error": "Nmap not found in PATH."
        }), 500

    # Prevent overlapping scans.
    if not SCAN_LOCK.acquire(blocking=False):
        return jsonify({
            "error": "A network scan is already running."
        }), 409

    try:
        result = subprocess.run(
            [
                nmap_path,
                "-sn",
                "-n",
                "-oX", "-",
                str(network)
            ],
            capture_output=True,
            text=True,
            timeout=90,
            check=False
        )

        if result.returncode != 0:
            return jsonify({
                "error": result.stderr.strip()
                or "Device discovery failed."
            }), 500

        root = ET.fromstring(result.stdout)

        timestamp = datetime.now().isoformat(
            timespec="seconds"
        )

        with DEVICE_LOCK:

            saved = load_devices()

            for device in saved.values():
                device["responding"] = False
                device["new"] = False

            discovered_count = 0
            new_count = 0

            for host in root.findall("host"):

                status = host.find("status")

                if (
                    status is None
                    or status.get("state") != "up"
                ):
                    continue

                ip = None
                mac = None
                vendor = None

                for address in host.findall("address"):

                    kind = address.get("addrtype")

                    if kind == "ipv4":
                        ip = address.get("addr")

                    elif kind == "mac":
                        mac = address.get("addr")
                        vendor = address.get("vendor")

                if not ip:
                    continue

                try:
                    if ipaddress.ip_address(ip) not in network:
                        continue
                except ValueError:
                    continue

                hostname = "Unknown"

                hostnames = host.find("hostnames")

                if hostnames is not None:
                    item = hostnames.find("hostname")

                    if item is not None:
                        hostname = item.get(
                            "name", "Unknown"
                        )

                previous = saved.get(ip, {})

                is_new = ip not in saved

                saved[ip] = {
                    "ip": ip,
                    "mac": mac or previous.get(
                        "mac", "Unavailable"
                    ),
                    "vendor": vendor or previous.get(
                        "vendor", "Unknown"
                    ),
                    "hostname": (
                        hostname
                        if hostname != "Unknown"
                        else previous.get(
                            "hostname", "Unknown"
                        )
                    ),
                    "custom_name": previous.get(
                        "custom_name", ""
                    ),
                    "room": previous.get("room", ""),
                    "first_seen": previous.get(
                        "first_seen", timestamp
                    ),
                    "last_seen": timestamp,
                    "responding": True,
                    "new": is_new
                }

                discovered_count += 1

                if is_new:
                    new_count += 1

            save_devices(saved)

            devices = list(saved.values())

        return jsonify({
            "network": str(network),
            "devices": devices,
            "discovered_count": discovered_count,
            "new_count": new_count,
            "timestamp": timestamp
        })

    except subprocess.TimeoutExpired:
        return jsonify({
            "error": "Device discovery timed out."
        }), 504

    except (ET.ParseError, OSError):
        app.logger.exception("Device discovery error")
        return jsonify({
            "error": "Could not complete device discovery."
        }), 500

    finally:
        SCAN_LOCK.release()


@app.route(
    "/api/wifi/device/<device_ip>",
    methods=["PATCH"]
)
def update_device(device_ip):

    try:
        ipaddress.IPv4Address(device_ip)
    except ValueError:
        return jsonify({
            "error": "Invalid IP address."
        }), 400

    data = request.get_json(silent=True) or {}

    name = data.get("custom_name", "")
    room = data.get("room", "")

    if not isinstance(name, str) or not isinstance(room, str):
        return jsonify({
            "error": "Labels must be text."
        }), 400

    name = name.strip()
    room = room.strip()

    if len(name) > 60 or len(room) > 60:
        return jsonify({
            "error": "Labels cannot exceed 60 characters."
        }), 400

    with DEVICE_LOCK:

        saved = load_devices()

        if device_ip not in saved:
            return jsonify({
                "error": "Device not found."
            }), 404

        saved[device_ip]["custom_name"] = name
        saved[device_ip]["room"] = room

        save_devices(saved)

        device = saved[device_ip].copy()

    return jsonify({
        "success": True,
        "device": device
    })


# ==========================================
# LIVE LAPTOP NETWORK ACTIVITY
# ==========================================

@app.route("/api/live/network")
def live_network():

    global previous_sample

    current = psutil.net_io_counters()
    now = __import__("time").monotonic()

    with NETWORK_LOCK:

        download_speed = 0
        upload_speed = 0

        if previous_sample is not None:

            previous_time, previous_sent, previous_recv = (
                previous_sample
            )

            elapsed = now - previous_time

            if elapsed > 0:

                download_speed = max(
                    0,
                    (current.bytes_recv - previous_recv) / elapsed
                )

                upload_speed = max(
                    0,
                    (current.bytes_sent - previous_sent) / elapsed
                )

        previous_sample = (
            now,
            current.bytes_sent,
            current.bytes_recv
        )

    return jsonify({
        "download_bps": round(download_speed, 2),
        "upload_bps": round(upload_speed, 2),
        "total_download": current.bytes_recv,
        "total_upload": current.bytes_sent,
        "timestamp": datetime.now().strftime("%H:%M:%S")
    })


# ==========================================
# LIVE LAPTOP APPLICATION CONNECTIONS
# ==========================================

@app.route("/api/live/apps")
def live_apps():

    applications = {}

    try:
        connections = psutil.net_connections(
            kind="inet"
        )

        for connection in connections:

            if not connection.pid or not connection.raddr:
                continue

            if connection.status not in (
                "ESTABLISHED", "NONE"
            ):
                continue

            try:
                process = psutil.Process(connection.pid)
                name = process.name()

            except (
                psutil.NoSuchProcess,
                psutil.AccessDenied,
                psutil.ZombieProcess
            ):
                continue

            if name not in applications:
                applications[name] = {
                    "app": name,
                    "connections": 0,
                    "remote_ips": set()
                }

            applications[name]["connections"] += 1
            applications[name]["remote_ips"].add(
                connection.raddr.ip
            )

        apps = []

        for item in applications.values():
            apps.append({
                "app": item["app"],
                "connections": item["connections"],
                "remote_ips": len(item["remote_ips"])
            })

        apps.sort(
            key=lambda item: item["connections"],
            reverse=True
        )

        return jsonify({
            "apps": apps,
            "count": len(apps)
        })

    except (psutil.AccessDenied, OSError):
        return jsonify({
            "error": "Unable to inspect connections."
        }), 500


@app.errorhandler(RequestEntityTooLarge)
def file_too_large(error):
    return jsonify({
        "error": "Upload exceeds the allowed file size."
    }), 413


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )
