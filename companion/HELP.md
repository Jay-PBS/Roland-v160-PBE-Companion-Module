# Roland V160 Purple Badger (modernization fork)

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

## Connection and recovery

The switcher prompts for a passcode as soon as the socket opens, and the module
answers that prompt **once**. If the passcode is wrong the switcher prompts again;
the module reports `Password rejected` and stops rather than answering, because
the switcher locks logins out after repeated attempts and then refuses even a
correct passcode. If you see `Switcher is refusing logins`, that lockout has
already happened — wait before retrying. Correct the passcode in the connection
config and save, and the module will try again immediately.

A watchdog runs once a second while connected, because a network path that dies
without closing cleanly (a pulled cable, a Wi-Fi drop, a switch power-cycle)
produces no socket error at all and would otherwise leave the connection looking
healthy indefinitely:

| Condition | Action |
|---|---|
| No data for 1.5 s while polling | Send one request already in the poll set |
| No data for 4 s while polling | Rebuild the connection |
| Login not completed within 6 s | Rebuild the connection |
| Host unreachable for 12 s | Recycle the connection attempt |

The first two tiers only apply while polling is enabled. With polling off the
switcher is expected to stay quiet, so silence is not treated as a fault.

## Polling

Polling is required for feedbacks and variables. A cycle is about 31 requests.
The minimum rate is 200 ms; going faster risks making the switcher's own panel
unresponsive, which is why the floor exists and is enforced even if a stored
configuration holds a lower value.

Memory names are read once when the connection authenticates and then refreshed
every 60th poll cycle, rather than on every cycle — they only change when someone
renames a memory on the panel, and re-reading all 240 characters each cycle was
the bulk of the traffic. If you rename a memory on the switcher, allow up to 60
cycles for `memoryname_N` to catch up.

## Notes and known limitations

- **Tally variables** report `Program` for a source that is on both PGM and PVW.
  The tally *feedbacks* handle this correctly — a source on both buses lights both
  the Program and the Preview button — but the variable reports the single value
  `Program`, matching the original module so that existing expressions comparing
  against `"Program"` keep working.
- **USB output assign** is known to write to a different address than the one the
  module polls for that state, in both this module and the original it was forked
  from. The feedback reads either, so it works; the action has been left exactly
  as the original sent it. Treat USB output assign as unverified.
- **Tally covers 42 channels** (HDMI 1-8, SDI 1-8, Still 1-16, XPT 1-10), as in
  the original module. If your unit reports more, the extra channels are received
  but have no variable or feedback yet.
- The passcode is stored in Companion's secrets store, not in the connection
  config. Existing connections are migrated automatically on upgrade.

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
