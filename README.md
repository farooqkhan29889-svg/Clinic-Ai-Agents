# CityCare Clinic

CityCare Clinic web application and appointment system rewritten in **React 19**, **TypeScript**, **Vite**, and **Tailwind CSS v4**.

It preserves the Plasery design template's centered branding, warm terracotta palette, split hero layout, full appointment booking lifecycle, doctor panel, and AI assistant desk.

## Features

- **Clinic Branding & Topbar**: Displays clinic hours (`Mon - Sat: 9:00 AM - 8:00 PM · Sunday closed`), direct call shortcut (`+91 87704 65561`), and brand identity.
- **Doctor Directory & Fees**: Upfront listed fees and schedules for Dr. Misbah Ambar (BHUMS - ₹300), Dr. Farooq (MBBS - ₹500), and Dr. Arshad (Haddi Specialist - ₹400).
- **Online Appointment Booking**:
  - Doctor selection with instant fee and specialization preview.
  - 14-day upcoming slot picker with real-time slot conflict prevention.
  - Validated patient name and 10-digit mobile number.
  - Instant booking confirmation with reference ID (`CC-XXXXX`) and simulated WhatsApp/SMS confirmation dispatch.
- **CityCare AI Assistant**:
  - Interactive multi-agent clinic help desk.
  - 4 specialist modes: Appointment booking wizard, Doctors & fees agent, Clinic information agent, and Booking management/cancellation.
  - Interactive quick-action response pills.
- **Doctor & Staff Portal**:
  - Protected doctor login with demo credential hints (`citycare1123`, `citycare2123`, `citycare3123`).
  - Key metrics: Appointments Today, Confirmed, Completed.
  - Status filters and date selectors.
  - Real-time status update controls (Confirmed, Completed, Cancelled).
  - Simulated 24-hour and 2-hour reminder batch processing.
- **New Feature — Smart Symptom Triage**:
  - Interactive symptom assessment matching patients to the ideal specialist based on symptoms (bone/joint, acute medicine, or chronic/homeopathy).
  - 1-click booking flow pre-filled with the recommended doctor.
- **Floating Quick Shortcuts**:
  - Floating action buttons for quick appointment booking and assistant opening.

## Development

```bash
npm install
npm run dev
```

Dev server runs on `http://0.0.0.0:3000`.

## Build

```bash
npm run build
```
