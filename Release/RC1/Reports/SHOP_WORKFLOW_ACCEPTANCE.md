# SHOP WORKFLOW ACCEPTANCE CHECKLIST

**Operator Instructions:** Execute the following scenarios inside the ERP software on the real shop computer. Capture screenshots for each result and place them in `Release/RC1/Screenshots/`.

| Workflow | Expected Result | Actual Result | Screenshot | Pass/Fail |
|---|---|---|---|---|
| Create Product | Product saves and appears in Inventory | | `wf_create_prod.png` | [ ] Pass / [ ] Fail |
| Purchase Stock | Inventory quantity increases correctly | | `wf_purchase.png` | [ ] Pass / [ ] Fail |
| Create Customer | Customer details save in POS | | `wf_create_cust.png` | [ ] Pass / [ ] Fail |
| Create Invoice | Invoice generates, stock decreases | | `wf_invoice.png` | [ ] Pass / [ ] Fail |
| Apply Discount | Total recalculates accurately | | `wf_discount.png` | [ ] Pass / [ ] Fail |
| Apply GST | CGST/SGST calculates exactly | | `wf_gst.png` | [ ] Pass / [ ] Fail |
| Receive Payment | Cash/UPI recorded properly | | `wf_payment.png` | [ ] Pass / [ ] Fail |
| Print Invoice | Print dialog opens flawlessly | | `wf_print.png` | [ ] Pass / [ ] Fail |
| Cancel Invoice | Stock reverts, invoice marked void | | `wf_cancel.png` | [ ] Pass / [ ] Fail |
| Daily Closing | Cash balances match exactly | | `wf_closing.png` | [ ] Pass / [ ] Fail |
| Backup | Database backup file downloaded | | `wf_backup.png` | [ ] Pass / [ ] Fail |
| Restore | Database restores without corruption | | `wf_restore.png` | [ ] Pass / [ ] Fail |
| Search Product | Fast auto-suggestions in POS | | `wf_search.png` | [ ] Pass / [ ] Fail |
| Edit Product | Price updates reflect immediately | | `wf_edit.png` | [ ] Pass / [ ] Fail |
| Delete Product | Soft delete prevents billing | | `wf_delete.png` | [ ] Pass / [ ] Fail |
| Generate Report | Sales report loads data accurately | | `wf_report.png` | [ ] Pass / [ ] Fail |
