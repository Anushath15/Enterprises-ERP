import pandas as pd
import os

OUT_DIR = r"D:\Senthil Enterprises\BS Software\Release\RC1"
REPORTS_DIR = os.path.join(OUT_DIR, "Reports")

def write_md(name, content):
    with open(os.path.join(REPORTS_DIR, name), "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

# 1. Windows Acceptance
write_md("WINDOWS_ACCEPTANCE_CHECKLIST.md", """
# WINDOWS DESKTOP ACCEPTANCE CHECKLIST

**Operator Instructions:** Execute the RC1 Installer on the target Windows hardware. Capture a screenshot for each step and place it in \Release/RC1/Screenshots/\. Mark the status below.

| Item | Purpose | Expected Result | Screenshot Required | Pass/Fail | Comments |
|---|---|---|---|---|---|
| **Installer** | Verify installation flow | Installer runs smoothly with official ASK logo and Company Name. | Yes (\installer.png\) | [ ] Pass / [ ] Fail | |
| **Uninstaller** | Verify clean removal | Uninstaller removes app from Add/Remove programs cleanly. | Yes (\uninstaller.png\) | [ ] Pass / [ ] Fail | |
| **Desktop Shortcut** | Verify desktop access | Senthil Enterprises ERP icon is present and correct. | Yes (\desktop_shortcut.png\) | [ ] Pass / [ ] Fail | |
| **Start Menu** | Verify OS search | App appears in Start Menu with correct name and icon. | Yes (\start_menu.png\) | [ ] Pass / [ ] Fail | |
| **Taskbar** | Verify active app icon | Pinned/Running app shows correct ASK logo (not default electron icon). | Yes (\	askbar.png\) | [ ] Pass / [ ] Fail | |
| **Alt+Tab** | Verify window switcher | App shows correct name and logo in Windows Alt+Tab view. | Yes (\lt_tab.png\) | [ ] Pass / [ ] Fail | |
| **Application Window** | Verify window frame | Top left of window displays correct logo and title. | Yes (\pp_window.png\) | [ ] Pass / [ ] Fail | |
| **About Dialog** | Verify software info | Displays correct Version, Company, Copyright. | Yes (\bout.png\) | [ ] Pass / [ ] Fail | |
| **Window Icon** | Verify titlebar | Top left titlebar icon is the sharp ASK logo. | Yes (\	itlebar.png\) | [ ] Pass / [ ] Fail | |
| **EXE Metadata** | Verify compiled properties | Right-click -> Properties -> Details shows correct Version, Company Name, Product Name. | Yes (\exe_metadata.png\) | [ ] Pass / [ ] Fail | |
""")

# 2. Thermal Print Acceptance
write_md("THERMAL_PRINT_ACCEPTANCE.md", """
# THERMAL PRINT ACCEPTANCE CHECKLIST

**Operator Instructions:** Connect the physical thermal printers and A4 laser printer to the machine. Print an invoice using all formats. Photograph the physical paper and place photos in \Release/RC1/Prints/\.

### 58 mm Thermal Print
| Item | Expected Result | Photo Required | Pass/Fail | Comments |
|---|---|---|---|---|
| Logo sharpness | Clear, not blurred | Yes (\58mm_logo.jpg\) | [ ] Pass / [ ] Fail | |
| Margins | Content is centered, no cutoff | Yes (\58mm_margins.jpg\) | [ ] Pass / [ ] Fail | |
| No clipping | All text fits within 58mm width | Yes (\58mm_clip.jpg\) | [ ] Pass / [ ] Fail | |
| Correct page breaks | Continuous roll prints without arbitrary breaks | Yes (\58mm_full.jpg\) | [ ] Pass / [ ] Fail | |
| GST alignment | CGST/SGST lines up perfectly | Yes (\58mm_gst.jpg\) | [ ] Pass / [ ] Fail | |
| Totals alignment | Grand Total is bold and aligned right | Yes (\58mm_totals.jpg\) | [ ] Pass / [ ] Fail | |
| Barcode | Barcode scans correctly with hardware scanner | Yes (\58mm_barcode.jpg\) | [ ] Pass / [ ] Fail | |
| Footer | "Thank You" message and T&C visible | Yes (\58mm_footer.jpg\) | [ ] Pass / [ ] Fail | |
| Timestamp | Print date/time is accurate | Yes (\58mm_time.jpg\) | [ ] Pass / [ ] Fail | |
| Store information | Shop Name, Address, Phone, GSTIN correct | Yes (\58mm_store.jpg\) | [ ] Pass / [ ] Fail | |

### 80 mm Thermal Print
*(Repeat above checks and provide photos named \80mm_*.jpg\)*

| Item | Photo Required | Pass/Fail | Comments |
|---|---|---|---|
| Logo sharpness | Yes | [ ] Pass / [ ] Fail | |
| Margins & Clipping | Yes | [ ] Pass / [ ] Fail | |
| GST & Totals Alignment | Yes | [ ] Pass / [ ] Fail | |
| Barcode Scannability | Yes | [ ] Pass / [ ] Fail | |

### A4 Portrait Print
*(Provide photos named \A4_portrait_*.jpg\)*

| Item | Photo Required | Pass/Fail | Comments |
|---|---|---|---|
| Correct scaling (fills page) | Yes | [ ] Pass / [ ] Fail | |
| Header and Footer clarity | Yes | [ ] Pass / [ ] Fail | |
| Tabular data alignment | Yes | [ ] Pass / [ ] Fail | |

### A4 Landscape Print
*(Provide photos named \A4_landscape_*.jpg\)*

| Item | Photo Required | Pass/Fail | Comments |
|---|---|---|---|
| Correct orientation | Yes | [ ] Pass / [ ] Fail | |
| Table scaling | Yes | [ ] Pass / [ ] Fail | |

### Digital PDF Export
| Item | Evidence Required | Pass/Fail | Comments |
|---|---|---|---|
| PDF saved successfully | Yes (\saved_invoice.pdf\) | [ ] Pass / [ ] Fail | |
| Selectable text in PDF | N/A | [ ] Pass / [ ] Fail | |
""")

# 3. Shop Workflow Acceptance
write_md("SHOP_WORKFLOW_ACCEPTANCE.md", """
# SHOP WORKFLOW ACCEPTANCE CHECKLIST

**Operator Instructions:** Execute the following scenarios inside the ERP software on the real shop computer. Capture screenshots for each result and place them in \Release/RC1/Screenshots/\.

| Workflow | Expected Result | Actual Result | Screenshot | Pass/Fail |
|---|---|---|---|---|
| Create Product | Product saves and appears in Inventory | | \wf_create_prod.png\ | [ ] Pass / [ ] Fail |
| Purchase Stock | Inventory quantity increases correctly | | \wf_purchase.png\ | [ ] Pass / [ ] Fail |
| Create Customer | Customer details save in POS | | \wf_create_cust.png\ | [ ] Pass / [ ] Fail |
| Create Invoice | Invoice generates, stock decreases | | \wf_invoice.png\ | [ ] Pass / [ ] Fail |
| Apply Discount | Total recalculates accurately | | \wf_discount.png\ | [ ] Pass / [ ] Fail |
| Apply GST | CGST/SGST calculates exactly | | \wf_gst.png\ | [ ] Pass / [ ] Fail |
| Receive Payment | Cash/UPI recorded properly | | \wf_payment.png\ | [ ] Pass / [ ] Fail |
| Print Invoice | Print dialog opens flawlessly | | \wf_print.png\ | [ ] Pass / [ ] Fail |
| Cancel Invoice | Stock reverts, invoice marked void | | \wf_cancel.png\ | [ ] Pass / [ ] Fail |
| Daily Closing | Cash balances match exactly | | \wf_closing.png\ | [ ] Pass / [ ] Fail |
| Backup | Database backup file downloaded | | \wf_backup.png\ | [ ] Pass / [ ] Fail |
| Restore | Database restores without corruption | | \wf_restore.png\ | [ ] Pass / [ ] Fail |
| Search Product | Fast auto-suggestions in POS | | \wf_search.png\ | [ ] Pass / [ ] Fail |
| Edit Product | Price updates reflect immediately | | \wf_edit.png\ | [ ] Pass / [ ] Fail |
| Delete Product | Soft delete prevents billing | | \wf_delete.png\ | [ ] Pass / [ ] Fail |
| Generate Report | Sales report loads data accurately | | \wf_report.png\ | [ ] Pass / [ ] Fail |
""")

# 4. Father Acceptance Test
write_md("FATHER_ACCEPTANCE_TEST.md", """
# FATHER ACCEPTANCE TEST

**Instructions:** Have the shop owner (your father) sit down at the computer with the software open. Do not guide him. Ask him to perform his daily duties. Note his responses.

| Question | Yes/No | Comments / Friction Points observed |
|---|---|---|
| Can he create an invoice? | [ ] Yes / [ ] No | |
| Can he find products? | [ ] Yes / [ ] No | |
| Can he understand buttons? | [ ] Yes / [ ] No | |
| Can he print? | [ ] Yes / [ ] No | |
| Can he close the day? | [ ] Yes / [ ] No | |
| Can he recover from mistakes? | [ ] Yes / [ ] No | |
| Did he need help? | [ ] Yes / [ ] No | |
| Any confusion? | [ ] Yes / [ ] No | |

**Suggestions from Shop Owner:**
1. 
2. 
3. 
""")

# 5. Final Release Signoff
write_md("FINAL_RELEASE_SIGNOFF.md", """
# V1.0 FINAL RELEASE SIGNOFF

This document dictates the ultimate fate of Release Candidate 1 (RC1).

## Signoff Required

| Role | Name/Signature | Date | Status (Pass/Fail) |
|---|---|---|---|
| Software Engineering Signoff | \__________________\ | \______\ | [ ] |
| QA Signoff | \__________________\ | \______\ | [ ] |
| Business Logic Signoff | \__________________\ | \______\ | [ ] |
| Branding Signoff | \__________________\ | \______\ | [ ] |
| Windows Signoff | \__________________\ | \______\ | [ ] |
| Printing Signoff | \__________________\ | \______\ | [ ] |
| Shop Owner Signoff | \__________________\ | \______\ | [ ] |

## Final Decision Rule
**READY FOR RELEASE**: Every mandatory acceptance item passed. Evidence complete. No Critical defects.
**READY WITH LIMITATIONS**: No Critical defects. Minor documented limitations. Evidence complete.
**NOT READY**: Any Critical issue. Any failed acceptance. Missing mandatory evidence.

## FINAL DECISION

**STATUS: NOT READY**

*(Note: Currently marked NOT READY pending the manual gathering of physical evidence into the Evidence/ folders and manual signatures on this document.)*
""")

# 6. Generate Excel Index
data = {
    "ID": [
        "EV-WIN-01", "EV-WIN-02", "EV-WIN-03", "EV-WIN-04",
        "EV-PRN-01", "EV-PRN-02", "EV-WF-01", "EV-FA-01"
    ],
    "Evidence": [
        "Desktop Shortcut Screenshot", "Taskbar Screenshot", "Start Menu Screenshot", "Installer Screenshot",
        "58mm Physical Print Photo", "A4 Physical Print Photo", "Invoice Generation Screenshot", "Father Test Video"
    ],
    "Location": [
        "Screenshots/desktop_shortcut.png", "Screenshots/taskbar.png", "Screenshots/start_menu.png", "Screenshots/installer.png",
        "Prints/58mm_full.jpg", "Prints/A4_portrait.jpg", "Screenshots/wf_invoice.png", "Videos/father_test.mp4"
    ],
    "Verified By": ["PENDING", "PENDING", "PENDING", "PENDING", "PENDING", "PENDING", "PENDING", "PENDING"],
    "Date": ["", "", "", "", "", "", "", ""],
    "Status": ["PENDING MANUAL ACCEPTANCE", "PENDING MANUAL ACCEPTANCE", "PENDING MANUAL ACCEPTANCE", "PENDING MANUAL ACCEPTANCE", "PENDING MANUAL ACCEPTANCE", "PENDING MANUAL ACCEPTANCE", "PENDING MANUAL ACCEPTANCE", "PENDING MANUAL ACCEPTANCE"],
    "Comments": ["", "", "", "", "", "", "", ""]
}

df = pd.DataFrame(data)
df.to_excel(os.path.join(OUT_DIR, "Evidence_Index.xlsx"), index=False)
print("Files generated successfully.")
