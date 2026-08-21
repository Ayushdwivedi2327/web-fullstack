# TP-Link Archer AX21 — Technical User Manual & Hardware Guide

## Product Overview & Specifications

The TP-Link Archer AX21 is a high-performance dual-band Wi-Fi 6 router capable of aggregate speeds up to 1800 Mbps (574 Mbps on 2.4 GHz + 1201 Mbps on 5 GHz).

### Hardware Specifications
- **CPU**: 1.5 GHz Quad-Core Processor
- **Antennas**: 4 High-Gain External Antennas with Beamforming
- **Ethernet Ports**: 1× Gigabit WAN Port, 4× Gigabit LAN Ports
- **USB Port**: 1× USB 2.0 Port (supports NTFS, FAT32, exFAT, HFS+)
- **Power Rating**: 12V / 1.5A DC

---

## Initial Router Setup

1. **Physical Connection**: Connect the blue Gigabit WAN port to your ISP cable/fiber modem using the RJ-45 Ethernet cable.
2. **Power Up**: Plug in the power adapter and push the Power ON/OFF button. Allow 45 seconds for the system to boot until the 2.4 GHz, 5 GHz, and Internet LEDs light solid green.
3. **Connect to Default SSID**: Locate the default Wi-Fi SSID and 8-digit PIN printed on the label on the bottom of the router.
4. **Web Configuration**: Navigate to `http://tplinkwifi.net` or `http://192.168.0.1` in your web browser. Create an administrator password and complete the Quick Setup Wizard.

---

## Factory Reset Procedures (Hardware Version Specific)

### Hardware Version V1.0 & V1.2
- **Reset Mechanism**: Dedicated physical button labeled **RESET** on the rear I/O panel.
- **Procedure**: While the router is powered ON, press and hold the **RESET button for 10 seconds**.
- **Indication**: Release the button when the **Power LED begins blinking amber/green**. The unit reboots to factory default configuration in approximately 60 seconds.

### Hardware Version V2.0 & V2.6
- **Reset Mechanism**: Recessed **Pinhole Reset** button located on the **bottom casing panel**.
- **Procedure**: With power connected, insert an unfolded paperclip into the bottom pinhole and hold for **8 seconds**.
- **Indication**: Release when all LED indicators turn off and the Power LED flashes rapidly.

### Hardware Version V3.0
- **Reset Mechanism**: Combined **WPS/RESET button** on the rear panel.
- **Procedure**: Press and hold the combined button for **12 seconds**. (Pressing for under 3 seconds triggers WPS pairing only).

---

## Mesh Networking (EasyMesh vs OneMesh)

### Hardware Version V1 (OneMesh)
- V1 hardware supports **TP-Link OneMesh** exclusively. It can link with TP-Link OneMesh range extenders or powerline adapters, but **cannot** form an EasyMesh network with other router models.

### Hardware Version V2 and V3 (EasyMesh)
- V2/V3 hardware supports the standardized **EasyMesh (Wi-Fi CERTIFIED EasyMesh™)** protocol with firmware version 1.2.0 or higher.
- **Setup as Controller**: Go to `Advanced > System > EasyMesh` and turn ON **EasyMesh**.
- **Adding Satellite Nodes**: Press the WPS button on the Archer AX21 controller for 2 seconds, then press WPS on the satellite node within 2 minutes. The satellite joins automatically.

---

## Troubleshooting Guide

### Wi-Fi Disconnections & Packet Loss
1. **Channel Congestion**: Log in to `tplinkwifi.net` > `Advanced` > `Wireless` > `Wireless Settings`. Change 5 GHz channel from *Auto* to fixed channels 36, 40, 44, or 48.
2. **Band Steering**: Enable **Smart Connect** under Wireless settings to unify 2.4 GHz and 5 GHz SSIDs, allowing the router to dynamically transition devices to the cleanest frequency.
3. **Firmware Outdated**: Go to `Advanced` > `System` > `Firmware Upgrade` and check online for updates.

### Orange / Red Internet LED
- An orange/amber Internet LED indicates the WAN cable is connected but no IP address is assigned by the modem:
  1. Power cycle both modem and router. Turn off the modem first, wait 2 minutes, turn modem on, wait for internet sync, then turn on Archer AX21.
  2. If using MAC-locked ISP (such as certain cable providers), go to `Advanced > Network > Internet > MAC Clone` and select **Use Current Computer MAC Address**.
