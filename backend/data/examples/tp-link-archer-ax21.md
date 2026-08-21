# TP-Link Archer AX21 — Quick Start Guide

## Product Overview

The TP-Link Archer AX21 is a dual-band Wi-Fi 6 router supporting speeds up to 1800 Mbps (AX1800). It uses 802.11ax technology with OFDMA and MU-MIMO for efficient multi-device connectivity.

### Key Specifications

- Wi-Fi Standard: 802.11ax (Wi-Fi 6)
- Bands: 2.4 GHz (574 Mbps) + 5 GHz (1201 Mbps)
- Ports: 1× Gigabit WAN, 4× Gigabit LAN, 1× USB 2.0
- Security: WPA3, SPI Firewall
- Dimensions: 260.2 × 135.0 × 38.6 mm

## Initial Setup

1. Connect the WAN port to your modem using the included Ethernet cable.
2. Power on the router and wait 30 seconds for the LEDs to stabilize.
3. Connect to the default Wi-Fi network printed on the label on the bottom of the router.
4. Open a browser and navigate to http://tplinkwifi.net or http://192.168.0.1.
5. Follow the Quick Setup wizard to set your Wi-Fi name, password, and time zone.

## Factory Reset

### Hardware Version V1

Hold the **Reset** button on the back panel for **10 seconds** while the router is powered on. Release when the Power LED blinks. The router will reboot with factory default settings. The default Wi-Fi credentials are printed on the bottom label.

### Hardware Version V2

The V2 hardware moved the reset button to a **pinhole on the bottom of the router**. Insert a paperclip and hold the button for **8 seconds** until the Power LED flashes rapidly. Release and wait approximately 60 seconds for the router to restart with default settings. V2 uses the same default credentials format as V1.

## Wi-Fi Troubleshooting

If your Wi-Fi connection drops intermittently, check the following:

1. **Channel congestion**: Open the Tether app or web interface and switch to a less crowded channel. Use the Channel Utility tool under Advanced > Wireless > Channel.
2. **Firmware version**: Go to Advanced > System > Firmware Upgrade and check for updates. Outdated firmware is the most common cause of intermittent disconnections.
3. **Interference**: Keep the router away from microwaves, cordless phones, and Bluetooth devices. Place it in an open, elevated, central location.
4. **Client distance**: If devices are far from the router, enable Smart Connect to allow automatic band steering between 2.4 GHz and 5 GHz.
5. **Connected device limits**: The Archer AX21 supports up to 40 simultaneous clients. If you are near this limit, older low-priority devices may experience drops.
6. **Power supply**: Use only the included power adapter. Third-party adapters may cause instability.

## EasyMesh Setup (V2 Only)

EasyMesh is supported only on **Hardware Version V2** with firmware 1.2.0 or later.

1. Update the main router firmware to version 1.2.0 or later.
2. Go to Advanced > System > EasyMesh in the web interface.
3. Enable **EasyMesh Controller** on the main router.
4. On each satellite router, enable **EasyMesh Agent** mode.
5. The satellite routers will automatically discover the controller and join the mesh network within 2 minutes.
6. Verify connectivity in the EasyMesh section — each agent should show a green status indicator.

EasyMesh creates a unified Wi-Fi network with seamless roaming. Clients move between nodes without disconnecting.

> Note: V1 hardware does not include EasyMesh support. V1 users should consider OneMesh-compatible range extenders instead.

## USB Sharing

The USB 2.0 port supports:

- USB storage sharing (FAT32, NTFS, ext4, HFS+)
- FTP and SAMBA file server
- Media server (DLNA)

Connect a USB drive and configure sharing under Advanced > USB > USB Storage Device.
