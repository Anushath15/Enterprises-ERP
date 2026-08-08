import os

RELEASE_DIR = r"D:\Senthil Enterprises\BS Software\Release\RC1"
DIRS = [
    "Installer", "Portable", "Checksums", "Documentation",
    "Evidence", "Reports", "Screenshots", "Videos",
    "Manuals", "Recovery", "Backup", "License"
]

for d in DIRS:
    os.makedirs(os.path.join(RELEASE_DIR, d), exist_ok=True)

docs = {
    "Documentation/INSTALLATION_GUIDE.md": """# INSTALLATION GUIDE
1. Download Senthil Enterprises ERP Setup 1.0.0.exe.
2. Double-click to run.
3. Follow the on-screen prompts.
4. The installer will place a shortcut on your Desktop and Start Menu.
""",
    "Documentation/FIRST_TIME_SETUP_GUIDE.md": """# FIRST TIME SETUP GUIDE
1. Launch the application from the Desktop.
2. The initial database will be created locally.
3. Navigate to Inventory and add your first 5 products to verify storage.
4. Verify your thermal printer is set as the default Windows printer.
""",
    "Documentation/SHOP_DEPLOYMENT_GUIDE.md": """# SHOP DEPLOYMENT GUIDE
- Position the PC securely.
- Ensure UPS backup is active for the PC.
- Connect Barcode Scanner (USB).
- Connect Thermal Printer (USB).
- Set Windows power settings to 'Never Sleep'.
""",
    "Backup/BACKUP_GUIDE.md": """# BACKUP GUIDE
- Navigate to the Settings/Backup menu in the ERP.
- Click 'Export Database'.
- Save the .json file to a secure location (e.g., an external drive).
""",
    "Backup/RESTORE_GUIDE.md": """# RESTORE GUIDE
- Navigate to the Settings/Restore menu in the ERP.
- Click 'Import Database'.
- Select the previously saved .json file.
- The system will overwrite current data. Restart application.
""",
    "Backup/USB_BACKUP_GUIDE.md": """# USB BACKUP GUIDE
- Daily at 9:00 PM, insert the RED USB drive.
- Export the database.
- Save directly to the USB drive in a folder named with today's date.
- Remove USB and take it home.
""",
    "Recovery/EMERGENCY_RECOVERY_GUIDE.md": """# EMERGENCY RECOVERY GUIDE
If the PC fails:
1. Obtain a new PC.
2. Install the ERP using the Setup.exe.
3. Plug in the RED USB drive.
4. Follow the RESTORE GUIDE.
5. You are back online.
""",
    "Manuals/USER_MANUAL.md": """# USER MANUAL
For cashiers and staff:
- **Billing:** Go to POS, scan items, apply GST, collect cash, click Print.
- **Inventory:** Go to Inventory, search item, click Edit to update stock.
""",
    "Manuals/ADMIN_MANUAL.md": """# ADMIN MANUAL
For store owner:
- View daily sales in the Dashboard.
- Perform daily closing to verify cash box.
- Monitor low stock alerts.
""",
    "License/LICENSE.txt": """Copyright (c) 2026 Senthil Enterprises
All rights reserved. This software is proprietary and intended solely for use by Senthil Enterprises.
""",
    "Documentation/CHANGELOG.md": """# CHANGELOG
## V1.0.0
- Initial Commercial Release
- Fully Offline POS and Inventory
- 58mm, 80mm, A4 Printing
""",
    "Documentation/VERSION.txt": "1.0.0",
    "Documentation/KNOWN_LIMITATIONS.md": """# KNOWN LIMITATIONS
- Single PC use only (no network sync).
- Hardware failure requires manual USB restore.
""",
    "Documentation/COMMERCIAL_RELEASE_NOTES.md": """# COMMERCIAL RELEASE NOTES
Welcome to V1.0. This release provides a hardened, offline-first billing system.
""",
    "Documentation/TROUBLESHOOTING_GUIDE.md": """# TROUBLESHOOTING
- **Printer not printing:** Check USB cable. Check Windows 'Devices and Printers' to ensure it is default and online.
- **Scanner not working:** Click inside the search box first. Ensure scanner is in keyboard-emulation mode.
""",
    "Documentation/FAQ.md": """# FAQ
**Q: Do I need internet?**
A: No, the software is 100% offline.

**Q: Where is my data saved?**
A: Securely inside the application's local storage folder on this PC.
""",
    "Documentation/WINDOWS_DEPLOYMENT_GUIDE.md": """# WINDOWS DEPLOYMENT GUIDE
- **Fresh PC Setup:** Install standard Windows 10/11. Update all drivers.
- **Printer Installation:** Install generic text / thermal printer drivers provided by manufacturer.
- **Windows Defender:** Add an exclusion for the installation folder if performance is affected (optional).
- **Automatic Startup:** Press Win+R, type shell:startup, and copy the ERP shortcut there if you want auto-start.
"""
}

for rel_path, content in docs.items():
    with open(os.path.join(RELEASE_DIR, rel_path), "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

print("Generated directories and documents.")
