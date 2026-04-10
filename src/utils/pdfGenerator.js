import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateRequisitionPDF = (data) => {
  const doc = new jsPDF();
  const gold = [166, 124, 82]; // Your brand color #A67C52

  // --- Header ---
  doc.setFontSize(22);
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.text("BRICKS MURSTEN MATTONI", 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("INTERNAL REQUISITION & PAYMENT VOUCHER", 14, 28);
  doc.text(`Ref ID: ${data._id.toUpperCase()}`, 14, 34);

  // --- Table 1: General Info ---
  doc.autoTable({
    startY: 45,
    head: [['Description', 'Information']],
    body: [
      ['Requester Name', data.requesterName],
      ['Department', data.department],
      ['Vendor/Beneficiary', data.vendorName],
      ['Total Amount', `${data.currency} ${data.amount.toLocaleString()}`],
      ['Amount in Words', data.amountInWords],
      ['Payment Mode', data.modeOfPayment],
      ['Narrative', data.requestNarrative],
    ],
    headStyles: { fillColor: gold },
    theme: 'striped'
  });

  // --- Table 2: Approval Trail ---
  doc.text("APPROVAL & AUDIT TRAIL", 14, doc.lastAutoTable.finalY + 15);
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 20,
    head: [['Role', 'Action', 'Approver', 'Date']],
    body: data.approvalHistory.map(h => [
      h.actorRole, 
      h.action, 
      h.actorName, 
      new Date(h.timestamp).toLocaleDateString() + " " + new Date(h.timestamp).toLocaleTimeString()
    ]),
    headStyles: { fillColor: [40, 40, 40] }
  });

  // --- Footer ---
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.text("Generated via Bricks Digital Solutions System", 14, pageHeight - 10);

  doc.save(`BRICKS_REQ_${data.vendorName.replace(/\s+/g, '_')}.pdf`);
};
