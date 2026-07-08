# Roland V-160HD (PBS fork)

This module controls a Roland V-160HD video switcher over the LAN.

The switcher should be running firmware 1.04 or higher. A password must be set
on the switcher in order to enable remote control. The device is controlled via
TCP port 8023.

This is a modernized fork of the original `roland-v160hd` module by Joseph
Adams.

## Configuration

- Enter the IP address of the device.
- Enter the password/passcode configured on the switcher.
- Optionally enable **polling** — this is required for the tally, PnP/Key, Aux,
  output and memory feedbacks and variables to work. Polling sends requests to
  the device at the configured interval.
- Optionally enable **verbose logging** to see all data sent/received in the log.

## Actions

- Select PGM / PVW source
- Assign inputs 1-10 (HDMI 1-8, SDI 1-8, Still 1-16)
- Assign outputs (HDMI Out 1-3, SDI Out 1-3, USB Out)
- Aux assign / mute / link / linked-PGM mode
- PinP & Key: bus select, source, key type, position, size, cropping, shape,
  border, view position/zoom, key level/gain, mix level, chroma parameters
- DSK: bus select, key/fill source, key type
- Transition type / mix type / wipe type / wipe direction / transition times
- Load / save / initialize memories 1-30
- Freeze on/off, type, per-input select
- Run macros 1-100
- Press/release any physical panel switch
- Camera PTZ control: select camera, presets, pan/tilt/zoom, focus, auto focus,
  exposure, pan-tilt speed, tally channel

## Feedbacks

- Tally state (Program / Preview / Both) per input
- Aux source / mute / link / link mode
- Output assignment
- PnP/Key on-air state (PGM/PVW)
- PnP/Key source
- Freeze state
- Selected camera
- Last loaded memory

## Variables

- Model and firmware version
- Tally state per input
- PnP/Key on-air states and sources
- Output and Aux assignments, Aux mutes and links
- Freeze state
- Memory names 1-30, last memory loaded (number and name)

## Presets

A full preset library is included, organized by category: Program, Preview,
Transitions, Layers On-Air, PinP & Key Setup, DSK Setup, AUX, Outputs, Inputs,
Memory, Freeze, Camera Control, Panel Switches, and System & Macros. Every
action is covered, and buttons light up via feedbacks where the switcher
reports state (enable polling for this).

## Sponsored By (original module)

The original module's availability to Companion was sponsored in part by:
Lars Erik Pedersen, Jeremy Alysandratos, Roope Berg, Eric Fetcho, and Gethin Davies.
