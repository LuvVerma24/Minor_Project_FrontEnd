import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generate and download institutional Result and Merit Tabulation PDF client-side
 */
export function exportResultPdf({
  classroom,
  facultyName,
  exams, // Array of { _id, examName, maxMarks }
  results, // Array of { rank, rollNo, marksPerExam: { [examId]: score }, totalObtained, maxPossibleMarks, percentage }
}) {
  const isLandscape = exams.length > 4;
  const doc = new jsPDF(isLandscape ? 'l' : 'p', 'mm', 'a4');
  const pageWidth = isLandscape ? 297 : 210;
  const centerX = pageWidth / 2;

  // Header
  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 58, 138);
  doc.text('COLLEGE FACULTY & STUDENT ACADEMIC PORTAL', centerX, 16, { align: 'center' });

  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(70, 70, 70);
  doc.text('OFFICIAL TABULATION OF MARKS & MERIT RANKING', centerX, 22, { align: 'center' });

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(14, 25, pageWidth - 14, 25);

  // Metadata
  doc.setFontSize(9.5);
  doc.setTextColor(20, 20, 20);

  doc.setFont('helvetica', 'bold');
  doc.text('Course / Subject:', 14, 32);
  doc.setFont('helvetica', 'normal');
  doc.text(`${classroom.subjectName}`, 48, 32);

  doc.setFont('helvetica', 'bold');
  doc.text('Department:', isLandscape ? 110 : 120, 32);
  doc.setFont('helvetica', 'normal');
  doc.text(`${classroom.department}`, isLandscape ? 138 : 148, 32);

  doc.setFont('helvetica', 'bold');
  doc.text('Year & Section:', 14, 38);
  doc.setFont('helvetica', 'normal');
  doc.text(`${classroom.year} - Section ${classroom.section}`, 48, 38);

  doc.setFont('helvetica', 'bold');
  doc.text('Instructor:', isLandscape ? 110 : 120, 38);
  doc.setFont('helvetica', 'normal');
  doc.text(`${facultyName || 'Faculty Member'}`, isLandscape ? 138 : 148, 38);

  doc.setFont('helvetica', 'bold');
  doc.text('Date of Issue:', isLandscape ? 210 : 120, 38);
  doc.setFont('helvetica', 'normal');
  doc.text(`${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`, isLandscape ? 236 : 148, 38);

  // Dynamic headers: Rank, Roll No, [Exam 1 (Max)], [Exam 2 (Max)], ..., Total, Max, %
  const headRow = ['Rank', 'Roll Number'];
  exams.forEach((ex) => {
    headRow.push(`${ex.examName} (${ex.maxMarks})`);
  });
  headRow.push('Total');
  headRow.push('Max Marks');
  headRow.push('Percentage');
  headRow.push('Result');

  const tableRows = results.map((row) => {
    const r = [row.rank, `Roll No. ${row.rollNo}`];
    exams.forEach((ex) => {
      const mark = row.marksPerExam?.[ex._id];
      r.push(mark !== undefined && mark !== null ? mark : '-');
    });
    r.push(row.totalObtained);
    r.push(row.maxPossibleMarks);
    r.push(`${Number(row.percentage).toFixed(1)}%`);
    r.push(Number(row.percentage) >= 40 ? 'Passed' : 'Needs Improvement');
    return r;
  });

  autoTable(doc, {
    startY: 44,
    head: [headRow],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
      valign: 'middle',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 14, fontStyle: 'bold' },
      1: { halign: 'left', fontStyle: 'bold', cellWidth: 32 },
    },
    didParseCell: function (data) {
      if (data.section === 'body') {
        const lastCol = headRow.length - 1;
        if (data.column.index === lastCol) {
          if (data.cell.raw === 'Passed') {
            data.cell.styles.textColor = [6, 95, 70];
          } else {
            data.cell.styles.textColor = [185, 28, 28];
          }
        }
      }
    },
  });

  const finalY = (doc).lastAutoTable.finalY || 150;
  const pageHeight = isLandscape ? 210 : 297;
  const signatureY = finalY > pageHeight - 35 ? pageHeight - 15 : Math.max(finalY + 20, pageHeight - 30);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);

  doc.line(20, signatureY, 70, signatureY);
  doc.text('Signature of Course Examiner', 20, signatureY + 4);

  doc.line(pageWidth - 70, signatureY, pageWidth - 20, signatureY);
  doc.text('Signature of Controller of Examinations', pageWidth - 70, signatureY + 4);

  const cleanSubject = classroom.subjectName.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Result_Tabulation_${cleanSubject}_${classroom.section}.pdf`);
}
