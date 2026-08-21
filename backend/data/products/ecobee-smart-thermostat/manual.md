# Ecobee Smart Thermostat Premium — Installation & Support Manual

## Product Overview & Technical Specifications

The Ecobee Smart Thermostat Premium is an advanced ENERGY STAR® certified smart thermostat featuring built-in air quality monitoring, a smart speaker with voice control, and remote SmartSensor integration.

### Technical Specifications
- **Compatibility**: Conventional (2H/2C), Heat Pump (4H/2C), Dual Fuel, Humidifiers, Dehumidifiers, Ventilators, ERV/HRV.
- **Powering Requirement**: 24VAC through C-wire (or using the included Power Extender Kit / PEK).
- **Sensors**: Radar occupancy detection, temperature, humidity, indoor air quality (VOC and CO2), proximity sensor.
- **Display**: 4-inch full-color LCD touch screen (540 × 540 resolution).
- **Wireless Connectivity**: Dual-band Wi-Fi 802.11 b/g/n @ 2.4 GHz and 802.11 a/n/ac @ 5 GHz, Bluetooth 5.0, Sub-1GHz for SmartSensors.

---

## Installation & Wiring Guide

### Standard 5-Wire Setup (With C-Wire)
1. Turn OFF power to your HVAC heating and cooling system at the main breaker panel before removing old thermostat.
2. Label existing wires: **R/Rc** (24V Red), **C** (Common 24V Blue/Black), **W/W1** (Heat White), **Y/Y1** (Cooling Yellow), **G** (Fan Green).
3. Connect wires to the corresponding terminals on the Ecobee backplate until the terminal clip clicks down.
4. Mount the Ecobee unit onto the backplate and restore breaker power.

### 4-Wire Setup (No C-Wire — Using Power Extender Kit / PEK)
1. At the HVAC control board inside your furnace/air handler, locate terminals **R, G, Y, W, C**.
2. Disconnect R, G, Y, W from the furnace board and attach them to the matching terminals inside the **Ecobee PEK**.
3. Connect the 5 pre-wired leads from the PEK to the furnace control board (**R, G, Y, W, C**).
4. At the thermostat wall plate:
   - Connect **R wire to Rc**.
   - Connect **G wire to C**.
   - Connect **Y wire to PEK terminal**.
   - Connect **W wire to W1**.

---

## Factory Reset & Configuration Reset

### Complete Factory Reset (Erases Wi-Fi and Equipment Setup)
1. On the Ecobee thermostat screen, tap the **Gear/Main Menu** icon.
2. Select **Settings > Reset**.
3. Tap **Reset All Settings** and confirm.
4. The thermostat will reboot, erase all registration data and HVAC stage configuration, and display the initial setup wizard.

### Resetting Wi-Fi Configuration Only
1. Tap **Main Menu > Settings > Network**.
2. Tap **Reset Wi-Fi Settings** and tap **Yes**.
3. Choose your Wi-Fi network and enter the new password.

---

## Troubleshooting Common Issues

### Issue 1: Thermostat Screen Does Not Turn On
1. Confirm HVAC equipment breaker is switched ON.
2. Verify furnace door/access panel is completely shut (many furnaces have an automatic safety cutoff switch on the door).
3. Using a multimeter, measure AC voltage across **Rc and C terminals**; voltage must read between **20VAC and 30VAC**.
4. Check if the HVAC condensate overflow switch or float switch has tripped.

### Issue 2: Heating Blows Cold Air (Heat Pump Configuration)
1. In the Ecobee menu, go to **Settings > Installation Settings > Equipment > Heat Pump**.
2. Check the **O/B Reversing Valve setting**:
   - For Rheem / Ruud heat pumps, reversing valve must be energized on **Heating (B)**.
   - For Carrier, Trane, Lennox, and most other brands, reversing valve must be energized on **Cooling (O)**.
