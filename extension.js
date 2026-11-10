import GLib from 'gi://GLib';
import St from 'gi://St';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

export default class BootMenuExtension extends Extension {
    enable() {
        let metadata = null;
        try {
            // imports.misc is globally available in GJS; safe to call for metadata
            if (typeof imports !== 'undefined' && imports.misc && imports.misc.extensionUtils) {
                metadata = imports.misc.extensionUtils.getCurrentExtension().metadata;
            }
        } catch (e) {
            // ignore, we'll fallback
        }

        const uuid = (metadata && metadata.uuid) ? metadata.uuid : (this.uuid || 'boot-menu');
        const name = (metadata && metadata.name) ? metadata.name : (this.metadata && this.metadata.name) ? this.metadata.name : 'Boot Menu';

        this._indicator = new PanelMenu.Button(0.0, name, false);


        const icon = new St.Icon({
            icon_name: 'system-reboot-symbolic',
            style_class: 'system-status-icon'
        });
        this._indicator.add_child(icon);

        const header = new PopupMenu.PopupMenuItem('Reboot Into OS:', { reactive: false });
        this._indicator.menu.addMenuItem(header);
        this._indicator.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        const linuxItem = new PopupMenu.PopupMenuItem('Ubuntu (Default)');
        linuxItem.connect('activate', () => {
            this._bootDynamic('Ubuntu');
        });
        this._indicator.menu.addMenuItem(linuxItem);

        const windowsItem = new PopupMenu.PopupMenuItem('Windows');
        windowsItem.connect('activate', () => {
            this._bootDynamic('Windows');
        });
        this._indicator.menu.addMenuItem(windowsItem);

        this._indicator.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        const uefiItem = new PopupMenu.PopupMenuItem('UEFI Firmware Settings');
        uefiItem.connect('activate', () => {
            // request privilege to reboot to firmware setup
            GLib.spawn_command_line_async("pkexec /bin/sh -c 'systemctl reboot --firmware-setup'");
        });
        this._indicator.menu.addMenuItem(uefiItem);

        Main.panel.addToStatusArea(uuid, this._indicator);
    }

    _bootDynamic(targetName) {
        try {
            // Run efibootmgr and parse its output
            const [success, stdout, stderr, exitStatus] = GLib.spawn_command_line_sync('efibootmgr');
            if (!success || !stdout) {
                log(`BootMenu: efibootmgr call failed or returned no output (success=${success})`);
                return;
            }

            const output = (typeof stdout === 'string') ? stdout : new TextDecoder().decode(stdout);
            const lines = output.split('\n');
            let bootNum = null;

            // Match lines that mention the requested name (case-insensitive)
            for (const line of lines) {
                if (!line) continue;
                if (line.toLowerCase().includes(targetName.toLowerCase())) {
                    // Capture the 4 hex digits after "Boot"
                    const match = line.match(/Boot([0-9A-Fa-f]{4})/);
                    if (match) {
                        bootNum = match[1];
                        break;
                    }
                }
            }

            if (!bootNum) {
                log(`BootMenu: No EFI boot entry found matching "${targetName}"`);
                return;
            }

            // Validate bootNum strictly (4 hex chars)
            if (!/^[0-9A-Fa-f]{4}$/.test(bootNum)) {
                logError(new Error(`Invalid boot number parsed: ${bootNum}`), 'BootMenu');
                return;
            }

            // Use pkexec so polkit prompts for authentication.
            // We validate bootNum so interpolation here is safe.
            const cmd = `pkexec /bin/sh -c 'efibootmgr --bootnext ${bootNum} && systemctl reboot'`;
            GLib.spawn_command_line_async(cmd);
        } catch (e) {
            logError(e, 'BootMenu: Failed to find or set dynamic boot entry');
        }
    }

    disable() {
        try {
            this._indicator?.destroy();
        } catch (e) {
            logError(e, 'BootMenu: Error destroying indicator');
        } finally {
            this._indicator = null;
        }
    }
}