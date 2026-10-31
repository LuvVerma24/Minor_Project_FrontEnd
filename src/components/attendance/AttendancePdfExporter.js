import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generate and download institutional Attendance Report PDF client-side
 */
export function exportAttendancePdf({
  classroom,
  facultyName,
  attendanceData, // Array of { rollNo, totalClasses, presentClasses, absentClasses, percentage }
  totalClassesHeld,
}) {
  const doc = new jsPDF('p', 'mm', 'a4');

  // Institutional Header
  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 58, 138); // Deep Navy
  doc.text('COLLEGE FACULTY & STUDENT ACADEMIC PORTAL', 105, 18, { align: 'center' });

  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(70, 70, 70);
  doc.text('OFFICIAL COURSE ATTENDANCE REGISTER & SUMMARY REPORT', 105, 24, { align: 'center' });

  // Divider line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(14, 28, 196, 28);

  // Metadata Grid
  doc.setFontSize(9.5);
  doc.setTextColor(20, 20, 20);

  doc.setFont('helvetica', 'bold');
  doc.text('Course / Subject:', 14, 35);
  doc.setFont('helvetica', 'normal');
  doc.text(`${classroom.subjectName}`, 48, 35);

  doc.setFont('helvetica', 'bold');
  doc.text('Department:', 120, 35);
  doc.setFont('helvetica', 'normal');
  doc.text(`${classroom.department}`, 148, 35);

  doc.setFont('helvetica', 'bold');
  doc.text('Year & Section:', 14, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(`${classroom.year} - Section ${classroom.section}`, 48, 42);

  doc.setFont('helvetica', 'bold');
  doc.text('Faculty In-Charge:', 120, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(`${facultyName || 'Faculty Member'}`, 154, 42);

  doc.setFont('helvetica', 'bold');
  doc.text('Total Sessions Held:', 14, 49);
  doc.setFont('helvetica', 'normal');
  doc.text(`${totalClassesHeld || 0} classes`, 48, 49);

  doc.setFont('helvetica', 'bold');
  doc.text('Generated On:', 120, 49);
  doc.setFont('helvetica', 'normal');
  doc.text(`${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`, 148, 49);

  // Table rows
  const tableRows = attendanceData.map((item, index) => [
    index + 1,
    `Roll No. ${item.rollNo}`,
    item.totalClasses,
    item.presentClasses,
    item.absentClasses,
    `${Number(item.percentage).toFixed(1)}%`,
    Number(item.percentage) >= 75 ? 'Satisfactory' : 'Shortage',
  ]);

  autoTable(doc, {
    startY: 55,
    head: [['S.No', 'Student Roll No', 'Classes Held', 'Attended', 'Absent', 'Percentage', 'Attendance Status']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138], // Institutional Deep Navy
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 2.5,
      valign: 'middle',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 14 },
      1: { halign: 'left', fontStyle: 'bold', cellWidth: 40 },
      2: { halign: 'center', cellWidth: 26 },
      3: { halign: 'center', cellWidth: 22 },
      4: { halign: 'center', cellWidth: 20 },
      5: { halign: 'center', fontStyle: 'bold', cellWidth: 26 },
      6: { halign: 'center', cellWidth: 34 },
    },
    didParseCell: function (data) {
      if (data.section === 'body' && data.column.index === 6) {
        if (data.cell.raw === 'Shortage') {
          data.cell.styles.textColor = [185, 28, 28]; // Red for shortage
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [6, 95, 70]; // Green
        }
      }
    },
  });

  // Footer Signature Block
  const finalY = (doc).lastAutoTable.finalY || 200;
  const signatureY = finalY > 240 ? 270 : Math.max(finalY + 25, 240);

  if (signatureY > 275) {
    doc.addPage();
  }

  const signY = signatureY > 275 ? 40 : signatureY;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);

  doc.line(20, signY, 70, signY);
  doc.text('Signature of Course Instructor', 20, signY + 5);

  doc.line(135, signY, 185, signY);
  doc.text('Signature of Head of Department', 135, signY + 5);

  // Save PDF
  const cleanSubject = classroom.subjectName.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Attendance_Report_${cleanSubject}_${classroom.section}.pdf`);
}
