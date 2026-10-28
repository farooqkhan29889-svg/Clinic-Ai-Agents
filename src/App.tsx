import React, { useState } from 'react';
import { NavTab } from './types/clinic';
import { Topbar } from './components/Topbar';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { FloatingActions } from './components/FloatingActions';
import { SymptomTriageModal } from './components/SymptomTriageModal';
import { useTheme } from './utils/theme';

import { HomeView } from './components/views/HomeView';
import { DoctorsView } from './components/views/DoctorsView';
import { ServicesView } from './components/views/ServicesView';
import { AppointmentsView } from './components/views/AppointmentsView';
import { PatientPortalView } from './components/views/PatientPortalView';
import { ContactView } from './components/views/ContactView';
import { AssistantView } from './components/views/AssistantView';
import { StaffView } from './components/views/StaffView';

import { Activity, Sparkles } from 'lucide-react';

export default function App() {
  const { isDark, toggleTheme } = useTheme();
  const [currentTab, setCurrentTab] = useState<NavTab>('Home');
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | undefined>(undefined);
  const [isTriageOpen, setIsTriageOpen] = useState<boolean>(false);

  const handleNavigate = (tab: NavTab, doctorId?: number) => {
    if (doctorId) {
      setSelectedDoctorId(doctorId);
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTriageDoctorSelect = (doctorId: number) => {
    setSelectedDoctorId(doctorId);
    setCurrentTab('Appointments');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen clinic-bg text-[#30221d] dark:text-[#f4eae5] flex flex-col justify-between selection:bg-[#c85d38]/20 selection:text-[#a84724] transition-colors duration-200">
      <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex-1 flex flex-col">
        {/* Topbar with Dark Mode Toggle */}
        <Topbar
          onNavigate={handleNavigate}
          isDark={isDark}
          onToggleTheme={toggleTheme}
        />

        {/* Navigation & Symptom Checker Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-2">
          <div className="flex-1 overflow-x-auto">
            <Navbar currentTab={currentTab} onSelectTab={handleNavigate} />
          </div>

          <div className="hidden sm:flex items-center pb-3">
            <button
              onClick={() => setIsTriageOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#cfe1d5] dark:border-[#2b4434] bg-[#edf7f0] dark:bg-[#1a2d22] hover:bg-[#dceee2] dark:hover:bg-[#233c2e] text-[#176541] dark:text-[#34d399] text-xs font-bold transition-all shadow-2xs hover:scale-102 cursor-pointer shrink-0"
            >
              <Activity className="w-3.5 h-3.5 text-[#176541] dark:text-[#34d399]" />
              <span>Symptom Checker</span>
              <Sparkles className="w-3 h-3 text-amber-500" />
            </button>
          </div>
        </div>

        {/* View Switcher */}
        <main className="flex-1">
          {currentTab === 'Home' && <HomeView onNavigate={handleNavigate} />}
          {currentTab === 'Our doctors' && <DoctorsView onNavigate={handleNavigate} />}
          {currentTab === 'Services' && <ServicesView onNavigate={handleNavigate} />}
          {currentTab === 'Appointments' && (
            <AppointmentsView
              initialDoctorId={selectedDoctorId}
              onNavigate={handleNavigate}
            />
          )}
          {currentTab === 'Patient portal' && (
            <PatientPortalView onNavigate={handleNavigate} />
          )}
          {currentTab === 'Contact' && <ContactView onNavigate={handleNavigate} />}
          {currentTab === 'Assistant' && <AssistantView onNavigate={handleNavigate} />}
          {currentTab === 'Staff' && <StaffView onNavigate={handleNavigate} />}
        </main>

        {/* Footer */}
        <Footer />
      </div>

      {/* Floating Action Shortcuts */}
      <FloatingActions onNavigate={handleNavigate} />

      {/* Smart Symptom Triage Modal */}
      <SymptomTriageModal
        isOpen={isTriageOpen}
        onClose={() => setIsTriageOpen(false)}
        onSelectDoctor={handleTriageDoctorSelect}
      />
    </div>
  );
}
