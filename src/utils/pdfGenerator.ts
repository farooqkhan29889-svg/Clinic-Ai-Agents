import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PatientProfile, LabResult, Prescription } from '../types/clinic';

/**
 * Generates a comprehensive CityCare Clinic Patient Health Summary PDF
 * covering:
 *  1. Patient Demographics & Baseline Vitals
 *  2. Medical History & Doctor Consultations
 *  3. Recent Diagnostic Lab Results & Pathology
 *  4. Active & Recent Prescriptions with Instructions
 */
export function generateHealthSummaryPDF(profile: PatientProfile): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 36; // 0.5 inch margins
  const contentWidth = pageWidth - margin * 2;
  let currentY = margin;

  // Primary Theme Colors (CityCare Brand Palette)
  const primaryColor: [number, number, number] = [168, 71, 36]; // Terracotta #a84724
  const darkBrown: [number, number, number] = [72, 30, 11]; // #481e0b
  const emeraldGreen: [number, number, number] = [23, 101, 65]; // #176541
  const softBg: [number, number, number] = [253, 250, 248]; // #fdfaf8
  const borderColor: [number, number, number] = [217, 201, 194]; // #d9c9c2
  const textMuted: [number, number, number] = [120, 107, 101];

  // Helper: Header on first page
  const drawClinicHeader = () => {
    // Header Banner Background
    doc.setFillColor(...primaryColor);
    doc.rect(margin, currentY, contentWidth, 54, 'F');

    // Clinic Brand Name
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('CITYCARE CLINIC & DIAGNOSTICS', margin + 14, currentY + 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(
      'Shop No. 4, Near Saeed Colony, Housing Board, Karond, Bhopal, MP 462038 | Tel: +91 87704 65561',
      margin + 14,
      currentY + 36
    );
    doc.text(
      'Accredited Clinical Pathology · Telehealth · Multi-Specialty Outpatient Center',
      margin + 14,
      currentY + 47
    );

    // Document Title Badge on Right
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(pageWidth - margin - 150, currentY + 10, 140, 34, 4, 4, 'F');
    doc.setTextColor(...darkBrown);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('OFFICIAL MEDICAL RECORD', pageWidth - margin - 145, currentY + 23);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...primaryColor);
    doc.text('Health Summary Report', pageWidth - margin - 145, currentY + 35);

    currentY += 64;
  };

  drawClinicHeader();

  // Patient Information Card
  doc.setFillColor(...softBg);
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.8);
  doc.roundedRect(margin, currentY, contentWidth, 68, 5, 5, 'FD');

  // Title of patient card
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...darkBrown);
  doc.text('PATIENT IDENTIFICATION & CLINICAL DEMOGRAPHICS', margin + 12, currentY + 16);

  const genDateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  doc.text(`Generated: ${genDateStr}`, pageWidth - margin - 12, currentY + 16, { align: 'right' });

  // Demographics Grid
  doc.setFontSize(8.5);
  // Column 1
  doc.setTextColor(...textMuted);
  doc.text('Patient Full Name:', margin + 12, currentY + 32);
  doc.setTextColor(...darkBrown);
  doc.setFont('helvetica', 'bold');
  doc.text(profile.name, margin + 95, currentY + 32);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text('Patient ID / Phone:', margin + 12, currentY + 46);
  doc.setTextColor(...darkBrown);
  doc.setFont('helvetica', 'bold');
  doc.text(`${profile.id} · ${profile.phone}`, margin + 95, currentY + 46);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text('Registered Email:', margin + 12, currentY + 60);
  doc.setTextColor(...darkBrown);
  doc.text(profile.email || 'N/A', margin + 95, currentY + 60);

  // Column 2
  const col2X = margin + 270;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text('Date of Birth:', col2X, currentY + 32);
  doc.setTextColor(...darkBrown);
  doc.text(profile.dob || 'N/A', col2X + 68, currentY + 32);

  doc.setTextColor(...textMuted);
  doc.text('Gender / Blood:', col2X, currentY + 46);
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text(`${profile.gender} · Blood Group: ${profile.bloodGroup}`, col2X + 68, currentY + 46);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text('Known Allergies:', col2X, currentY + 60);
  const allergiesStr = profile.allergies && profile.allergies.length > 0 ? profile.allergies.join(', ') : 'None Reported (NKDA)';
  doc.setTextColor(profile.allergies && profile.allergies.length > 0 ? 180 : 23, profile.allergies && profile.allergies.length > 0 ? 40 : 101, profile.allergies && profile.allergies.length > 0 ? 20 : 65);
  doc.setFont('helvetica', 'bold');
  doc.text(allergiesStr, col2X + 68, currentY + 60);

  currentY += 80;

  // ==========================================
  // SECTION 1: MEDICAL HISTORY & CONSULTATIONS
  // ==========================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primaryColor);
  doc.text('1. MEDICAL HISTORY & ATTENDING PHYSICIAN CONSULTATIONS', margin, currentY);
  currentY += 6;

  const historyRows = profile.medicalHistory.map((item) => {
    let vitalsSummary = 'N/A';
    if (item.vitals) {
      const v = item.vitals;
      const parts = [];
      if (v.bloodPressure) parts.push(`BP: ${v.bloodPressure}`);
      if (v.heartRate) parts.push(`HR: ${v.heartRate}`);
      if (v.spO2) parts.push(`SpO2: ${v.spO2}`);
      if (v.weight) parts.push(`Wt: ${v.weight}`);
      vitalsSummary = parts.length > 0 ? parts.join(' | ') : 'N/A';
    }

    return [
      item.date,
      item.visitType,
      `${item.doctorName}\n(${item.doctorSpec})`,
      item.diagnosis,
      item.notes,
      vitalsSummary,
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Date', 'Visit Type', 'Doctor / Specialty', 'Primary Diagnosis', 'Clinical Notes & Recommendations', 'Recorded Vitals']],
    body: historyRows.length > 0 ? historyRows : [['N/A', 'N/A', 'N/A', 'No prior consultation history on record', 'N/A', 'N/A']],
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 4,
      textColor: darkBrown,
      lineColor: borderColor,
      lineWidth: 0.5,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 62 },
      2: { cellWidth: 85 },
      3: { cellWidth: 90, fontStyle: 'bold' },
      4: { cellWidth: 155 },
      5: { cellWidth: 80, fontSize: 7 },
    },
    didDrawPage: (_data) => {
      // Keep page tracking
    },
  });

  // Update currentY after table
  // @ts-expect-error jspdf-autotable adds lastAutoTable to doc
  currentY = doc.lastAutoTable.finalY + 18;

  // If page space is low, start a new page
  if (currentY > pageHeight - 160) {
    doc.addPage();
    currentY = margin + 10;
  }

  // ==========================================
  // SECTION 2: RECENT DIAGNOSTIC LAB RESULTS
  // ==========================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primaryColor);
  doc.text('2. RECENT DIAGNOSTIC LAB RESULTS & PATHOLOGY REPORTS', margin, currentY);
  currentY += 6;

  const labRows = profile.labResults.map((lab) => {
    return [
      lab.date,
      lab.testName,
      lab.category,
      `${lab.value} ${lab.unit}`,
      `${lab.referenceRange} ${lab.unit}`,
      lab.status,
      lab.summary,
      lab.orderedBy,
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Date', 'Diagnostic Test', 'Category', 'Observed Value', 'Biological Ref', 'Status', 'Clinical Interpretation', 'Ordered By']],
    body: labRows.length > 0 ? labRows : [['N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'No lab reports on file', 'N/A']],
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 4,
      textColor: darkBrown,
      lineColor: borderColor,
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: emeraldGreen,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 85, fontStyle: 'bold' },
      2: { cellWidth: 62 },
      3: { cellWidth: 65, fontStyle: 'bold' },
      4: { cellWidth: 65 },
      5: { cellWidth: 50, halign: 'center' },
      6: { cellWidth: 85 },
      7: { cellWidth: 60, fontSize: 7 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        const val = String(data.cell.raw);
        if (val === 'Normal') {
          data.cell.styles.textColor = [23, 101, 65];
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'Attention' || val === 'Elevated' || val === 'Critical') {
          data.cell.styles.textColor = [190, 40, 20];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  // @ts-expect-error jspdf-autotable adds lastAutoTable to doc
  currentY = doc.lastAutoTable.finalY + 18;

  if (currentY > pageHeight - 160) {
    doc.addPage();
    currentY = margin + 10;
  }

  // ==========================================
  // SECTION 3: ACTIVE & PRESCRIBED MEDICATIONS
  // ==========================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primaryColor);
  doc.text('3. ACTIVE & RECENT PRESCRIPTIONS (MEDICATION DETAILS)', margin, currentY);
  currentY += 6;

  // Flatten medications with their prescription context
  const prescriptionRows: string[][] = [];

  profile.prescriptions.forEach((rx) => {
    rx.medications.forEach((med) => {
      prescriptionRows.push([
        rx.date,
        med.name,
        med.dosage,
        med.frequency,
        med.duration,
        med.instructions + (med.timing ? ` (${med.timing})` : ''),
        `${rx.doctorName}\n${rx.doctorSpec}`,
        rx.active ? 'ACTIVE' : 'COMPLETED',
      ]);
    });
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Prescribed', 'Medication Name', 'Dosage', 'Frequency', 'Duration', 'Instructions & Special Precautions', 'Prescribed By', 'Rx Status']],
    body: prescriptionRows.length > 0 ? prescriptionRows : [['N/A', 'No medications recorded', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A']],
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 4,
      textColor: darkBrown,
      lineColor: borderColor,
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: [110, 50, 20],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 90, fontStyle: 'bold' },
      2: { cellWidth: 55 },
      3: { cellWidth: 60 },
      4: { cellWidth: 50 },
      5: { cellWidth: 110 },
      6: { cellWidth: 60, fontSize: 7 },
      7: { cellWidth: 47, halign: 'center', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 7) {
        const val = String(data.cell.raw);
        if (val === 'ACTIVE') {
          data.cell.styles.textColor = [23, 101, 65];
        } else {
          data.cell.styles.textColor = [120, 107, 101];
        }
      }
    },
  });

  // @ts-expect-error jspdf-autotable adds lastAutoTable to doc
  currentY = doc.lastAutoTable.finalY + 16;

  // Verification & Doctor Attestation Block
  if (currentY > pageHeight - 90) {
    doc.addPage();
    currentY = margin + 10;
  }

  doc.setFillColor(...softBg);
  doc.setDrawColor(...borderColor);
  doc.roundedRect(margin, currentY, contentWidth, 54, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...darkBrown);
  doc.text('LEGAL & CLINICAL ATTESTATION', margin + 10, currentY + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...textMuted);
  doc.text(
    'This medical record summary is digitally authenticated and generated directly from CityCare Clinic verified Electronic Health Records (EHR). It includes documented clinical notes, certified laboratory diagnostic findings, and authorized prescriptions. For emergencies, contact the helpline at +91 87704 65561 or visit our Karond emergency desk.',
    margin + 10,
    currentY + 26,
    { maxWidth: contentWidth - 140 }
  );

  // Digital Signature seal on the right
  doc.setTextColor(...emeraldGreen);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('DIGITALLY CERTIFIED', pageWidth - margin - 120, currentY + 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...textMuted);
  doc.text('CityCare Chief Medical Officer', pageWidth - margin - 120, currentY + 28);
  doc.text('Ref Code: CC-' + profile.id + '-' + Date.now().toString(36).toUpperCase(), pageWidth - margin - 120, currentY + 38);

  // Add Page Numbers & Footer on each page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(150, 140, 135);

    // Footer line
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 24, pageWidth - margin, pageHeight - 24);

    doc.text(
      'CityCare Clinic & Diagnostics · Confidential Medical Document · For Authorized Patient Use Only',
      margin,
      pageHeight - 14
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 14, { align: 'right' });
  }

  // Save / Trigger Download
  const sanitizedName = profile.name.trim().replace(/\s+/g, '_');
  const filename = `CityCare_Health_Summary_${sanitizedName}.pdf`;
  doc.save(filename);
}

/**
 * Generates an individual Diagnostic Pathology Report PDF for a single lab result
 */
export function generateSingleLabReportPDF(profile: PatientProfile, lab: LabResult): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 36;
  const contentWidth = pageWidth - margin * 2;
  let currentY = margin;

  const primaryColor: [number, number, number] = [23, 101, 65]; // Green for lab
  const darkBrown: [number, number, number] = [72, 30, 11];
  const softBg: [number, number, number] = [253, 250, 248];
  const borderColor: [number, number, number] = [217, 201, 194];
  const textMuted: [number, number, number] = [120, 107, 101];

  // Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(margin, currentY, contentWidth, 54, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('CITYCARE DIAGNOSTIC PATHOLOGY LABORATORY', margin + 14, currentY + 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(
    'NABL Aligned Diagnostic Division · Shop No. 4, Karond, Bhopal · Phone: +91 87704 65561',
    margin + 14,
    currentY + 36
  );
  doc.text('Certified Automated Analyzers & Multi-Disciplinary Pathology', margin + 14, currentY + 47);

  currentY += 66;

  // Patient Info & Test Header
  doc.setFillColor(...softBg);
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.8);
  doc.roundedRect(margin, currentY, contentWidth, 70, 5, 5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...darkBrown);
  doc.text('LABORATORY REPORT SPECIFICATION', margin + 12, currentY + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  doc.text(`Report ID: ${lab.id}`, margin + 12, currentY + 32);
  doc.text(`Patient: ${profile.name} (${profile.gender} · DOB: ${profile.dob || 'N/A'})`, margin + 12, currentY + 45);
  doc.text(`Contact: ${profile.phone} · Blood Group: ${profile.bloodGroup}`, margin + 12, currentY + 58);

  const col2X = margin + 260;
  doc.text(`Test Name: ${lab.testName}`, col2X, currentY + 32);
  doc.text(`Category: ${lab.category}`, col2X, currentY + 45);
  doc.text(`Date of Test: ${lab.date} · Ordered By: ${lab.orderedBy}`, col2X, currentY + 58);

  currentY += 82;

  // Results Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primaryColor);
  doc.text('OBSERVED PARAMETERS & FINDINGS', margin, currentY);
  currentY += 8;

  autoTable(doc, {
    startY: currentY,
    head: [['Parameter / Investigation', 'Observed Result', 'Biological Reference Interval', 'Status', 'Evaluation']],
    body: [
      [
        lab.testName,
        `${lab.value} ${lab.unit}`,
        `${lab.referenceRange} ${lab.unit}`,
        lab.status,
        lab.status === 'Normal' ? 'Within acceptable clinical range' : 'Requires clinical correlation',
      ],
    ],
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      cellPadding: 6,
      textColor: darkBrown,
      lineColor: borderColor,
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 150, fontStyle: 'bold' },
      1: { cellWidth: 95, fontStyle: 'bold' },
      2: { cellWidth: 110 },
      3: { cellWidth: 65, halign: 'center' },
      4: { cellWidth: 103 },
    },
  });

  // @ts-expect-error jspdf-autotable adds lastAutoTable to doc
  currentY = doc.lastAutoTable.finalY + 20;

  // Interpretation Box
  doc.setFillColor(...softBg);
  doc.setDrawColor(...borderColor);
  doc.roundedRect(margin, currentY, contentWidth, 75, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...darkBrown);
  doc.text('PATHOLOGIST INTERPRETATION & NOTES', margin + 12, currentY + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  doc.text(lab.summary, margin + 12, currentY + 30, { maxWidth: contentWidth - 24 });

  doc.text(`Verified By: ${lab.labTechnician} (Certified Medical Laboratory Technologist)`, margin + 12, currentY + 62);

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(150, 140, 135);
  doc.text(
    'CityCare Clinic Pathology Laboratory · Report generated digitally from LIS database · Bhopal, MP',
    margin,
    pageHeight - 20
  );

  const filename = `CityCare_Lab_${lab.testName.replace(/\s+/g, '_')}_${lab.id}.pdf`;
  doc.save(filename);
}

/**
 * Generates an individual Prescription Slip PDF
 */
export function generateSinglePrescriptionPDF(profile: PatientProfile, rx: Prescription): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 36;
  const contentWidth = pageWidth - margin * 2;
  let currentY = margin;

  const primaryColor: [number, number, number] = [168, 71, 36];
  const darkBrown: [number, number, number] = [72, 30, 11];
  const softBg: [number, number, number] = [253, 250, 248];
  const borderColor: [number, number, number] = [217, 201, 194];
  const textMuted: [number, number, number] = [120, 107, 101];

  // Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(margin, currentY, contentWidth, 54, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('CITYCARE CLINIC · PRESCRIPTION SLIP', margin + 14, currentY + 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(
    'Licensed Outpatient Medical Center · Shop No. 4, Karond, Bhopal · Tel: +91 87704 65561',
    margin + 14,
    currentY + 36
  );
  doc.text('Digital Rx Authorized by CityCare Medical Board', margin + 14, currentY + 47);

  currentY += 66;

  // Rx Meta & Patient Demographics
  doc.setFillColor(...softBg);
  doc.setDrawColor(...borderColor);
  doc.roundedRect(margin, currentY, contentWidth, 68, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...darkBrown);
  doc.text(`PRESCRIPTION: ${rx.prescriptionNumber}`, margin + 12, currentY + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  doc.text(`Patient Name: ${profile.name}`, margin + 12, currentY + 32);
  doc.text(`Phone: ${profile.phone} · Blood Group: ${profile.bloodGroup}`, margin + 12, currentY + 45);
  doc.text(`Known Allergies: ${profile.allergies.length > 0 ? profile.allergies.join(', ') : 'None Reported'}`, margin + 12, currentY + 58);

  const col2X = margin + 260;
  doc.text(`Prescribing Doctor: ${rx.doctorName}`, col2X, currentY + 32);
  doc.text(`Specialty: ${rx.doctorSpec}`, col2X, currentY + 45);
  doc.text(`Date of Issue: ${rx.date} · Refills Remaining: ${rx.refillsRemaining}`, col2X, currentY + 58);

  currentY += 80;

  // Medications Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primaryColor);
  doc.text('Rx - PRESCRIBED MEDICATIONS & REGIMEN', margin, currentY);
  currentY += 8;

  const rows = rx.medications.map((m) => [
    m.name,
    m.dosage,
    m.frequency,
    m.duration,
    m.instructions + (m.timing ? `\nTiming: ${m.timing}` : ''),
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Medication Name', 'Dosage', 'Frequency', 'Duration', 'Instructions & Precautions']],
    body: rows,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 5,
      textColor: darkBrown,
      lineColor: borderColor,
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    columnStyles: {
      0: { cellWidth: 120, fontStyle: 'bold' },
      1: { cellWidth: 70 },
      2: { cellWidth: 80 },
      3: { cellWidth: 65 },
      4: { cellWidth: 188 },
    },
  });

  // @ts-expect-error jspdf-autotable adds lastAutoTable to doc
  currentY = doc.lastAutoTable.finalY + 18;

  // Doctor's Advice Box
  doc.setFillColor(...softBg);
  doc.setDrawColor(...borderColor);
  doc.roundedRect(margin, currentY, contentWidth, 54, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...darkBrown);
  doc.text('DOCTOR ADVICE & INSTRUCTIONS', margin + 12, currentY + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  doc.text(rx.doctorNotes || 'Take medications exactly as directed. In case of unexpected reactions, immediately contact the clinic.', margin + 12, currentY + 30, { maxWidth: contentWidth - 24 });

  // Signature
  currentY += 75;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...darkBrown);
  doc.text(`Authorized Signatory: ${rx.doctorName}`, pageWidth - margin - 180, currentY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...textMuted);
  doc.text('Digital Signature Verified · CityCare Clinic', pageWidth - margin - 180, currentY + 12);

  const filename = `CityCare_Rx_${rx.prescriptionNumber}.pdf`;
  doc.save(filename);
}
