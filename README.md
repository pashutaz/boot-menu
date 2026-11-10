# Boot Menu GNOME Shell Extension

A lightweight, secure, and dynamic GNOME Shell extension that allows you to seamlessly reboot into alternative operating systems (such as Windows) or jump straight into UEFI firmware settings directly from your system status panel.

## Features

* **Dynamic OS Detection:** Automatically parses `efibootmgr` output at runtime to find your boot entries, eliminating the need for hardcoded hex indices.
* **Secure Privilege Escalation:** Uses native `pkexec` to invoke authentication dialogs safely only when needed.
* **Strict Input Validation:** Enforces strict 4-digit hexadecimal validation on parsed boot numbers to prevent command injection.
* **Modern GNOME Compatibility:** Built cleanly for modern GNOME Shell versions using native indicator patterns.

---

## Requirements

* **GNOME Shell** (compatible with recent versions supporting modern ES modules)
* **`efibootmgr`** installed on your system (standard on UEFI-based Linux distributions)
* **`pkexec`** (for graphical privilege prompts)

---

## Installation

1. Clone or copy this repository/folder into your local GNOME extensions directory:
   ```bash
   mkdir -p ~/.local/share/gnome-shell/extensions/boot-menu@local
   # Copy extension.js, metadata.json, and other files into this directory
   ```

2. Enable the extension using `gnome-extensions`:
   ```bash
   gnome-extensions enable boot-menu@local
   ```

3. Restart GNOME Shell:

   * On X11: Press `Alt + F2`, type `r`, and press `Enter`.

   * On Wayland: Log out and log back in.