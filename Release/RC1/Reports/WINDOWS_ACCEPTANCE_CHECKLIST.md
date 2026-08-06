# WINDOWS DESKTOP ACCEPTANCE CHECKLIST

**Operator Instructions:** Execute the RC1 Installer on the target Windows hardware. Capture a screenshot for each step and place it in `Release/RC1/Screenshots/`. Mark the status below.

| Item | Purpose | Expected Result | Screenshot Required | Pass/Fail | Comments |
|---|---|---|---|---|---|
| **Installer** | Verify installation flow | Installer runs smoothly with official ASK logo and Company Name. | Yes (`installer.png`) | [ ] Pass / [ ] Fail | |
| **Uninstaller** | Verify clean removal | Uninstaller removes app from Add/Remove programs cleanly. | Yes (`uninstaller.png`) | [ ] Pass / [ ] Fail | |
| **Desktop Shortcut** | Verify desktop access | Senthil Enterprises ERP icon is present and correct. | Yes (`desktop_shortcut.png`) | [ ] Pass / [ ] Fail | |
| **Start Menu** | Verify OS search | App appears in Start Menu with correct name and icon. | Yes (`start_menu.png`) | [ ] Pass / [ ] Fail | |
| **Taskbar** | Verify active app icon | Pinned/Running app shows correct ASK logo (not default electron icon). | Yes (`taskbar.png`) | [ ] Pass / [ ] Fail | |
| **Alt+Tab** | Verify window switcher | App shows correct name and logo in Windows Alt+Tab view. | Yes (`alt_tab.png`) | [ ] Pass / [ ] Fail | |
| **Application Window** | Verify window frame | Top left of window displays correct logo and title. | Yes (`app_window.png`) | [ ] Pass / [ ] Fail | |
| **About Dialog** | Verify software info | Displays correct Version, Company, Copyright. | Yes (`about.png`) | [ ] Pass / [ ] Fail | |
| **Window Icon** | Verify titlebar | Top left titlebar icon is the sharp ASK logo. | Yes (`titlebar.png`) | [ ] Pass / [ ] Fail | |
| **EXE Metadata** | Verify compiled properties | Right-click -> Properties -> Details shows correct Version, Company Name, Product Name. | Yes (`exe_metadata.png`) | [ ] Pass / [ ] Fail | |
