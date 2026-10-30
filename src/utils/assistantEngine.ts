import { ChatAction, ChatMessage, Doctor } from '../types/clinic';
import { CLINIC, DOCTORS_SEED } from '../data/clinicData';
import {
  bookAppointment,
  findBookingByIdAndPhone,
  formatDayLabel,
  getDoctorById,
  getFreeSlots,
  getStoredDoctors,
  getUpcomingDays,
  normalizePhone,
  updateBookingStatus,
  validateName,
} from './storage';

export interface AssistantState {
  mode: 'idle' | 'booking' | 'doctors' | 'clinic_info' | 'manage';
  bookingDraft?: {
    doctorId?: number;
    doctorName?: string;
    date?: string;
    time?: string;
    patientName?: string;
    phone?: string;
  };
  manageDraft?: {
    step?: 'ask_id' | 'ask_phone';
    bookingId?: string;
    phone?: string;
  };
}

export function createAssistantReply(
  userText: string,
  state: AssistantState,
): { reply: string; actions?: ChatAction[]; newState: AssistantState } {
  const text = (userText || '').trim();
  const lower = text.toLowerCase();

  // Reset/exit intent
  if (['cancel', 'quit', 'stop', 'back', 'menu', 'restart', 'exit', 'start over'].includes(lower)) {
    return {
      reply: 'Conversation reset. How can I help you today? You can choose a quick option below or ask any question.',
      actions: [
        { t: '📅 Book appointment', m: '__mode__booking' },
        { t: '🩺 Doctors & fees', m: '__mode__doctors' },
        { t: 'ℹ️ Clinic information', m: '__mode__clinic_info' },
        { t: '↪ Cancel booking', m: '__mode__manage' },
      ],
      newState: { mode: 'idle' },
    };
  }

  // Handle Mode Triggers
  if (text.startsWith('__mode__')) {
    const targetMode = text.replace('__mode__', '') as AssistantState['mode'];
    if (targetMode === 'booking') {
      const docs = getStoredDoctors();
      return {
        reply: "I'd be glad to help you book an appointment. First, which doctor would you like to consult?",
        actions: docs.map((d) => ({
          t: `${d.name} (${d.spec} · ₹${d.fee})`,
          m: `__doc__${d.id}`,
        })),
        newState: { mode: 'booking', bookingDraft: {} },
      };
    }

    if (targetMode === 'doctors') {
      const docs = getStoredDoctors();
      const list = docs
        .map(
          (d) =>
            `• **${d.name}** (${d.spec}) — Consultation fee: **₹${d.fee}**\n  Available slots: ${d.slots.join(', ')}`,
        )
        .join('\n\n');

      return {
        reply: `Here are our clinic doctors and consultation fees:\n\n${list}\n\nWould you like to book an appointment with one of our doctors?`,
        actions: docs.map((d) => ({
          t: `Book with ${d.name.split(' ')[1]}`,
          m: `__doc__${d.id}`,
        })),
        newState: { mode: 'idle' },
      };
    }

    if (targetMode === 'clinic_info') {
      return {
        reply: `**CityCare Clinic Details:**\n\n• **Address:** ${CLINIC.address}\n• **Phone:** ${CLINIC.phone}\n• **Working Hours:** ${CLINIC.hours}\n• **Sunday:** Closed\n\nAll consultation fees are listed transparently upfront. What else would you like to know?`,
        actions: [
          { t: '📅 Book appointment', m: '__mode__booking' },
          { t: '🩺 Doctors & fees', m: '__mode__doctors' },
          { t: 'Call clinic', m: 'How do I call the clinic?' },
        ],
        newState: { mode: 'idle' },
      };
    }

    if (targetMode === 'manage') {
      return {
        reply: 'To locate and cancel your appointment, please enter your **Booking Reference** (e.g. `CC-10842`).',
        actions: [{ t: 'Back to menu', m: 'menu' }],
        newState: { mode: 'manage', manageDraft: { step: 'ask_id' } },
      };
    }
  }

  // Handle Booking Mode Steps
  if (state.mode === 'booking') {
    const draft = state.bookingDraft || {};

    // Step 1: Doctor selection
    if (text.startsWith('__doc__') || !draft.doctorId) {
      let docId = 0;
      if (text.startsWith('__doc__')) {
        docId = Number(text.replace('__doc__', ''));
      } else {
        const found = getStoredDoctors().find(
          (d) =>
            lower.includes(d.name.toLowerCase()) ||
            lower.includes(d.spec.toLowerCase()) ||
            (d.id === 1 && lower.includes('misbah')) ||
            (d.id === 2 && lower.includes('farooq')) ||
            (d.id === 3 && (lower.includes('arshad') || lower.includes('haddi'))),
        );
        if (found) docId = found.id;
      }

      const doc = getDoctorById(docId);
      if (!doc) {
        return {
          reply: 'Please select one of our clinic doctors to proceed:',
          actions: getStoredDoctors().map((d) => ({
            t: `${d.name} (${d.spec})`,
            m: `__doc__${d.id}`,
          })),
          newState: state,
        };
      }

      draft.doctorId = doc.id;
      draft.doctorName = doc.name;

      // Ask for date
      const days = getUpcomingDays(7);
      return {
        reply: `You selected **${doc.name}** (${doc.spec} · Fee: ₹${doc.fee}).\n\nPlease select an appointment date:`,
        actions: days.map((day) => ({
          t: day.short,
          m: `__date__${day.iso}`,
        })),
        newState: { mode: 'booking', bookingDraft: draft },
      };
    }

    // Step 2: Date selection
    if (text.startsWith('__date__') || !draft.date) {
      let selectedIso = '';
      if (text.startsWith('__date__')) {
        selectedIso = text.replace('__date__', '');
      } else {
        const match = text.match(/\d{4}-\d{2}-\d{2}/);
        if (match) selectedIso = match[0];
      }

      if (!selectedIso) {
        const days = getUpcomingDays(7);
        return {
          reply: 'Please pick an upcoming appointment date from the options below:',
          actions: days.map((day) => ({
            t: day.short,
            m: `__date__${day.iso}`,
          })),
          newState: state,
        };
      }

      draft.date = selectedIso;
      const slots = getFreeSlots(draft.doctorId!, draft.date);

      if (slots.length === 0) {
        return {
          reply: `There are no available slots for ${formatDayLabel(draft.date)}. Please choose another date:`,
          actions: getUpcomingDays(7).map((day) => ({
            t: day.short,
            m: `__date__${day.iso}`,
          })),
          newState: {
            mode: 'booking',
            bookingDraft: { ...draft, date: undefined },
          },
        };
      }

      return {
        reply: `Great! Available slots for **${formatDayLabel(draft.date)}** with **${draft.doctorName}**:\n\nSelect your preferred time slot:`,
        actions: slots.map((s) => ({
          t: s,
          m: `__time__${s}`,
        })),
        newState: { mode: 'booking', bookingDraft: draft },
      };
    }

    // Step 3: Time slot selection
    if (text.startsWith('__time__') || !draft.time) {
      let selectedTime = '';
      if (text.startsWith('__time__')) {
        selectedTime = text.replace('__time__', '');
      } else {
        const slots = getFreeSlots(draft.doctorId!, draft.date!);
        const found = slots.find((s) => text.includes(s));
        if (found) selectedTime = found;
      }

      if (!selectedTime) {
        const slots = getFreeSlots(draft.doctorId!, draft.date!);
        return {
          reply: 'Please select one of the available time slots below:',
          actions: slots.map((s) => ({
            t: s,
            m: `__time__${s}`,
          })),
          newState: state,
        };
      }

      draft.time = selectedTime;
      return {
        reply: `Slot selected: **${draft.time}** on **${formatDayLabel(draft.date!)}**.\n\nNow, please enter the **Patient's Full Name**:`,
        newState: { mode: 'booking', bookingDraft: draft },
      };
    }

    // Step 4: Patient Name
    if (!draft.patientName) {
      try {
        const validName = validateName(text);
        draft.patientName = validName;
        return {
          reply: `Thank you, **${validName}**.\n\nPlease enter your **10-digit mobile number** (e.g. 9876543210) for appointment confirmation:`,
          newState: { mode: 'booking', bookingDraft: draft },
        };
      } catch (err: any) {
        return {
          reply: `⚠️ ${err.message || 'Please enter a valid patient name'}.`,
          newState: state,
        };
      }
    }

    // Step 5: Phone number & Confirmation
    if (!draft.phone) {
      try {
        const validPhone = normalizePhone(text);
        draft.phone = validPhone;

        // Perform booking!
        const booking = bookAppointment({
          doctorId: draft.doctorId!,
          apptDate: draft.date!,
          apptTime: draft.time!,
          patientName: draft.patientName!,
          phone: validPhone,
          reason: 'Booked via CityCare Assistant',
        });

        return {
          reply: `🎉 **Appointment Confirmed!**\n\n• **Booking Reference:** \`${booking.booking_id}\`\n• **Doctor:** ${booking.doctor_name} (${booking.doctor_spec})\n• **Date & Time:** ${formatDayLabel(booking.appt_date)} at ${booking.appt_time}\n• **Patient:** ${booking.patient_name}\n• **Mobile:** ${booking.phone}\n\n*A simulated WhatsApp & SMS confirmation has been dispatched. Please keep your booking reference handy.*`,
          actions: [
            { t: 'Book another appointment', m: '__mode__booking' },
            { t: 'Clinic details', m: '__mode__clinic_info' },
          ],
          newState: { mode: 'idle' },
        };
      } catch (err: any) {
        return {
          reply: `⚠️ ${err.message || 'Please enter a valid 10-digit mobile number'}.`,
          newState: state,
        };
      }
    }
  }

  // Handle Manage / Cancellation Mode
  if (state.mode === 'manage') {
    const draft = state.manageDraft || { step: 'ask_id' };

    if (draft.step === 'ask_id') {
      const match = text.toUpperCase().match(/CC[-\s]?\d{4,6}/);
      const cleanInput = match ? match[0].replace(/\s/g, '-') : text.trim().toUpperCase();

      draft.bookingId = cleanInput;
      draft.step = 'ask_phone';

      return {
        reply: `Found reference \`${cleanInput}\`.\n\nFor security verification, please enter the **10-digit mobile number** registered with this booking:`,
        newState: { mode: 'manage', manageDraft: draft },
      };
    }

    if (draft.step === 'ask_phone') {
      try {
        const phone = normalizePhone(text);
        const booking = findBookingByIdAndPhone(draft.bookingId || '', phone);

        if (!booking) {
          return {
            reply: `❌ No appointment matched reference \`${draft.bookingId}\` and mobile \`${phone}\`.\n\nPlease double check your reference number or call CityCare Clinic directly at ${CLINIC.phone}.`,
            actions: [
              { t: 'Try again', m: '__mode__manage' },
              { t: 'Main menu', m: 'menu' },
            ],
            newState: { mode: 'idle' },
          };
        }

        if (booking.status === 'Cancelled') {
          return {
            reply: `Appointment \`${booking.booking_id}\` with **${booking.doctor_name}** on **${booking.appt_date}** at **${booking.appt_time}** is already marked **Cancelled**.`,
            actions: [{ t: 'Main menu', m: 'menu' }],
            newState: { mode: 'idle' },
          };
        }

        if (booking.status === 'Completed') {
          return {
            reply: `Appointment \`${booking.booking_id}\` is already marked **Completed**. Completed visits cannot be cancelled online. Please call the clinic desk at ${CLINIC.phone} if you have any questions.`,
            actions: [{ t: 'Main menu', m: 'menu' }],
            newState: { mode: 'idle' },
          };
        }

        // Proceed to cancel
        updateBookingStatus(booking.booking_id, 'Cancelled');
        return {
          reply: `✅ **Appointment Cancelled Successfully.**\n\nAppointment \`${booking.booking_id}\` with **${booking.doctor_name}** on **${booking.appt_date}** at **${booking.appt_time}** has been cancelled. A cancellation notice has been sent to \`${booking.phone}\`.\n\nCall ${CLINIC.phone} if you wish to rebook at a future date.`,
          actions: [
            { t: 'Book a new appointment', m: '__mode__booking' },
            { t: 'Back to menu', m: 'menu' },
          ],
          newState: { mode: 'idle' },
        };
      } catch (err: any) {
        return {
          reply: `⚠️ ${err.message || 'Please enter a valid 10-digit mobile number'}.`,
          newState: state,
        };
      }
    }
  }

  // Natural Language Understanding (Fallback & General Triage)
  if (
    lower.includes('book') ||
    lower.includes('appointment') ||
    lower.includes('schedule') ||
    lower.includes('slot')
  ) {
    const docs = getStoredDoctors();
    return {
      reply: 'Would you like to book an appointment? Choose a doctor below to get started:',
      actions: docs.map((d) => ({
        t: `${d.name} (${d.spec})`,
        m: `__doc__${d.id}`,
      })),
      newState: { mode: 'booking', bookingDraft: {} },
    };
  }

  if (
    lower.includes('fee') ||
    lower.includes('price') ||
    lower.includes('cost') ||
    lower.includes('charge') ||
    lower.includes('rate')
  ) {
    const docs = getStoredDoctors();
    const feeText = docs
      .map((d) => `• **${d.name}** (${d.spec}): **₹${d.fee}**`)
      .join('\n');
    return {
      reply: `Here are the consultation fees at CityCare Clinic:\n\n${feeText}\n\nAll fees are listed transparently upfront.`,
      actions: [
        { t: 'Book appointment', m: '__mode__booking' },
        { t: 'Doctors info', m: '__mode__doctors' },
      ],
      newState: { mode: 'idle' },
    };
  }

  if (
    lower.includes('doctor') ||
    lower.includes('specialist') ||
    lower.includes('farooq') ||
    lower.includes('misbah') ||
    lower.includes('arshad') ||
    lower.includes('haddi')
  ) {
    const docs = getStoredDoctors();
    return {
      reply: `Our clinic specialists:\n\n• **Dr. Misbah Ambar** (BHUMS) — ₹300 consultation\n• **Dr. Farooq** (MBBS) — ₹500 consultation\n• **Dr. Arshad** (Haddi Specialist / Orthopedic) — ₹400 consultation\n\nWho would you like to book with?`,
      actions: docs.map((d) => ({
        t: `Book ${d.name.split(' ')[1]}`,
        m: `__doc__${d.id}`,
      })),
      newState: { mode: 'idle' },
    };
  }

  if (
    lower.includes('time') ||
    lower.includes('hour') ||
    lower.includes('timing') ||
    lower.includes('open') ||
    lower.includes('close') ||
    lower.includes('sunday')
  ) {
    return {
      reply: `CityCare Clinic is open **Monday to Saturday, from 9:00 AM to 8:00 PM**. We are **Closed on Sundays**.\n\nDoctor sample consultation slots run throughout the day between 9:00 AM and 6:30 PM.`,
      actions: [
        { t: '📅 Book appointment', m: '__mode__booking' },
        { t: 'Clinic address', m: 'Where is the clinic located?' },
      ],
      newState: { mode: 'idle' },
    };
  }

  if (
    lower.includes('address') ||
    lower.includes('location') ||
    lower.includes('where') ||
    lower.includes('map') ||
    lower.includes('direction') ||
    lower.includes('route') ||
    lower.includes('phone') ||
    lower.includes('contact') ||
    lower.includes('call')
  ) {
    const encoded = encodeURIComponent(CLINIC.address);
    const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encoded}`;
    return {
      reply: `**CityCare Clinic Location & Map:**\n\n📍 **Address:** ${CLINIC.address}\n🗺️ [View on Google Maps](${mapsLink})\n📞 **Phone:** ${CLINIC.phone}\n⏰ **Timings:** ${CLINIC.hours} (Sunday closed)\n\nLocated near Saeed Colony and Karond Square on Berasia Road with ample parking and wheelchair access.`,
      actions: [
        { t: '🗺️ Open Interactive Map', m: '__mode__map' },
        { t: '📅 Book appointment', m: '__mode__booking' },
        { t: '🩺 Meet our doctors', m: '__mode__doctors' },
      ],
      newState: { mode: 'idle' },
    };
  }

  if (
    lower.includes('cancel') ||
    lower.includes('change') ||
    lower.includes('reschedule')
  ) {
    return {
      reply: 'To manage or cancel an appointment, please enter your **Booking Reference** (e.g. `CC-10842`):',
      actions: [{ t: 'Back to menu', m: 'menu' }],
      newState: { mode: 'manage', manageDraft: { step: 'ask_id' } },
    };
  }

  // Default helpful triage response
  return {
    reply: `I'm here to help you with CityCare Clinic appointments, doctors, fees, and clinic information. How can I assist you right now?`,
    actions: [
      { t: '📅 Book appointment', m: '__mode__booking' },
      { t: '🩺 Doctors & fees', m: '__mode__doctors' },
      { t: 'ℹ️ Clinic information', m: '__mode__clinic_info' },
      { t: '↪ Cancel booking', m: '__mode__manage' },
    ],
    newState: { mode: 'idle' },
  };
}
