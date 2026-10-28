import React, { useState, useEffect } from 'react';
import { PatientFeedback, PatientProfile } from '../types/clinic';
import { DOCTORS_SEED } from '../data/clinicData';
import {
  getStoredFeedback,
  addFeedback,
  toggleHelpfulFeedback,
} from '../utils/feedbackStorage';
import {
  Star,
  MessageSquare,
  ThumbsUp,
  ShieldCheck,
  CheckCircle2,
  Filter,
  Sparkles,
  Send,
  User,
  Award,
} from 'lucide-react';

interface FeedbackSectionProps {
  activeProfile: PatientProfile;
}

const COMMON_TAGS = [
  'Attentive listener',
  'Accurate diagnosis',
  'Punctual',
  'Clean clinic',
  'Polite staff',
  'Clear explanations',
  'Effective treatment',
  'Gentle care',
  'Quick appointment',
  'Follow-up advice',
];

const TARGET_OPTIONS = [
  { type: 'doctor' as const, name: 'Dr. Misbah Ambar (BHUMS)', doctorId: 1 },
  { type: 'doctor' as const, name: 'Dr. Farooq (MBBS)', doctorId: 2 },
  { type: 'doctor' as const, name: 'Dr. Arshad (Haddi Specialist)', doctorId: 3 },
  { type: 'service' as const, name: 'Appointment Booking & Reception Desk' },
  { type: 'service' as const, name: 'Diagnostic & Pathology Lab Service' },
  { type: 'service' as const, name: 'Overall Clinic Experience & Hygiene' },
];

export const FeedbackSection: React.FC<FeedbackSectionProps> = ({ activeProfile }) => {
  const [feedbackList, setFeedbackList] = useState<PatientFeedback[]>([]);
  const [selectedTargetIndex, setSelectedTargetIndex] = useState<number>(0);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Attentive listener']);
  const [filterTarget, setFilterTarget] = useState<string>('All');
  const [submittedNotice, setSubmittedNotice] = useState<string | null>(null);

  useEffect(() => {
    setFeedbackList(getStoredFeedback());
  }, []);

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    const target = TARGET_OPTIONS[selectedTargetIndex];
    const created = addFeedback({
      patientName: activeProfile.name,
      patientPhone: activeProfile.phone,
      targetType: target.type,
      targetName: target.name,
      doctorId: target.doctorId,
      rating,
      comment: comment.trim(),
      tags: selectedTags,
      isVerified: true,
    });

    setFeedbackList(getStoredFeedback());
    setComment('');
    setRating(5);
    setSubmittedNotice(`Thank you, ${activeProfile.name}! Your review for ${target.name} has been published.`);

    setTimeout(() => {
      setSubmittedNotice(null);
    }, 5000);
  };

  const handleHelpful = (id: string) => {
    const updated = toggleHelpfulFeedback(id);
    setFeedbackList(updated);
  };

  // Calculate rating stats
  const totalReviews = feedbackList.length;
  const averageRating =
    totalReviews > 0
      ? (feedbackList.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(1)
      : '5.0';

  const ratingCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  feedbackList.forEach((fb) => {
    ratingCounts[fb.rating] = (ratingCounts[fb.rating] || 0) + 1;
  });

  const ratingLabels: Record<number, string> = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent',
  };

  // Filtered reviews
  const filteredReviews = feedbackList.filter((fb) => {
    if (filterTarget === 'All') return true;
    if (filterTarget === 'Doctors') return fb.targetType === 'doctor';
    if (filterTarget === 'Services') return fb.targetType === 'service';
    return fb.targetName.includes(filterTarget);
  });

  return (
    <div className="space-y-8">
      {/* Overview & Rating Metrics Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] shadow-xs grid grid-cols-1 md:grid-cols-12 gap-6 items-center transition-colors">
        {/* Left Score */}
        <div className="md:col-span-4 text-center md:text-left md:border-r border-[#f0e8e3] dark:border-[#33251e] md:pr-6">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#a84724] dark:text-[#f38360] mb-1">
            PATIENT SATISFACTION
          </div>
          <div className="flex items-baseline justify-center md:justify-start gap-2">
            <span className="font-heading font-black text-4xl sm:text-5xl text-[#481e0b] dark:text-[#f7eee9]">
              {averageRating}
            </span>
            <span className="text-xs text-[#786b65] dark:text-[#a89991]">/ 5.0</span>
          </div>

          <div className="flex items-center justify-center md:justify-start gap-1 my-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className="w-4 h-4 fill-amber-400 text-amber-400"
              />
            ))}
          </div>

          <p className="text-xs text-[#786b65] dark:text-[#a89991]">
            Based on <strong>{totalReviews}</strong> verified patient evaluations.
          </p>
        </div>

        {/* Right: Star Distribution Bars */}
        <div className="md:col-span-8 space-y-1.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratingCounts[star] || 0;
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-3 text-xs">
                <span className="w-12 text-right font-medium text-[#481e0b] dark:text-[#f7eee9] flex items-center justify-end gap-1">
                  <span>{star}</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" />
                </span>
                <div className="flex-1 h-2 rounded-full bg-[#f0e8e3] dark:bg-[#2c201a] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#c85d38] dark:bg-[#f38360] transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-8 text-[11px] text-[#786b65] dark:text-[#a89991]">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {submittedNotice && (
        <div className="p-4 rounded-2xl bg-[#edf7f0] dark:bg-[#1a2d22] border border-[#cfe1d5] dark:border-[#2b4434] text-xs text-[#176541] dark:text-[#34d399] flex items-center gap-2.5 shadow-sm transition-all animate-in fade-in duration-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{submittedNotice}</span>
        </div>
      )}

      {/* Form & Reviews Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Leave a Review Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 p-6 md:p-8 rounded-3xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] shadow-xs space-y-5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#edf7f0] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399] flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-[#481e0b] dark:text-[#f7eee9]">
                Share Your Experience
              </h3>
              <p className="text-xs text-[#786b65] dark:text-[#a89991]">
                Posting as <strong>{activeProfile.name}</strong>
              </p>
            </div>
          </div>

          {/* Select Doctor or Service */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#481e0b] dark:text-[#f7eee9] mb-1.5">
              Reviewing
            </label>
            <select
              value={selectedTargetIndex}
              onChange={(e) => setSelectedTargetIndex(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#d9c9c2] dark:border-[#42332a] bg-white dark:bg-[#251d19] text-xs sm:text-sm text-[#481e0b] dark:text-[#f7eee9] focus:outline-none focus:ring-2 focus:ring-[#c85d38]/30 focus:border-[#c85d38]"
            >
              {TARGET_OPTIONS.map((opt, idx) => (
                <option key={idx} value={idx} className="dark:bg-[#251d19]">
                  {opt.type === 'doctor' ? '🩺 ' : '🏢 '}
                  {opt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Interactive Star Rating */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#481e0b] dark:text-[#f7eee9] mb-1.5">
              Rating: <span className="text-[#a84724] dark:text-[#f38360] font-bold">{ratingLabels[hoverRating || rating]}</span>
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 rounded-md hover:scale-115 transition-transform cursor-pointer"
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        isFilled
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Attribute Tags */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#481e0b] dark:text-[#f7eee9] mb-1.5">
              Highlights & Observations
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#c85d38] text-white'
                        : 'bg-[#f7f3f0] dark:bg-[#251d19] border border-[#dcc9bf] dark:border-[#42332a] text-[#56473f] dark:text-[#e8dcd5] hover:border-[#c85d38]'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Review Textarea */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#481e0b] dark:text-[#f7eee9] mb-1.5">
              Your Feedback & Detailed Review
            </label>
            <textarea
              required
              rows={4}
              maxLength={600}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe your consultation experience, the doctor's approach, explanation of medicines, or clinic cleanliness..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#d9c9c2] dark:border-[#42332a] bg-white dark:bg-[#251d19] text-xs sm:text-sm text-[#481e0b] dark:text-[#f7eee9] focus:outline-none focus:ring-2 focus:ring-[#c85d38]/30 focus:border-[#c85d38]"
            />
            <div className="text-[10px] text-[#786b65] dark:text-[#a89991] text-right mt-1">
              {comment.length} / 600 characters
            </div>
          </div>

          {/* Verified Patient Check */}
          <div className="p-3 rounded-xl bg-[#edf7f0] dark:bg-[#1a2d22] border border-[#cfe1d5] dark:border-[#2b4434] text-[11px] text-[#176541] dark:text-[#34d399] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>This review will be published with a Verified Patient badge.</span>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-6 rounded-full bg-[#c85d38] hover:bg-[#a84724] text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Submit Feedback</span>
          </button>
        </form>

        {/* Right Column: Published Patient Reviews List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-heading font-bold text-lg text-[#481e0b] dark:text-[#f7eee9]">
                Patient Reviews & Experiences
              </h3>
              <p className="text-xs text-[#786b65] dark:text-[#a89991]">
                Real testimonials from CityCare Clinic patients.
              </p>
            </div>

            {/* Target Filter */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {['All', 'Doctors', 'Services'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterTarget(f)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                    filterTarget === f
                      ? 'bg-[#c85d38] text-white'
                      : 'bg-white dark:bg-[#1e1714] text-[#786b65] dark:text-[#a89991] border border-[#dcc9bf] dark:border-[#42332a]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {filteredReviews.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] text-center text-xs text-[#786b65] dark:text-[#a89991]">
                No reviews match this filter. Be the first to leave a review!
              </div>
            ) : (
              filteredReviews.map((fb) => (
                <div
                  key={fb.id}
                  className="p-5 md:p-6 rounded-2xl bg-white dark:bg-[#1e1714] border border-[#d5e5db] dark:border-[#382b24] shadow-xs space-y-3 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-sm font-bold text-[#481e0b] dark:text-[#f7eee9]">
                          {fb.patientName}
                        </strong>
                        {fb.isVerified && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#edf7f0] dark:bg-[#1a2d22] text-[#176541] dark:text-[#34d399] text-[10px] font-bold">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Verified</span>
                          </span>
                        )}
                        <span className="text-xs text-[#786b65] dark:text-[#a89991]">
                          · {fb.date}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-[#a84724] dark:text-[#f38360] mt-0.5">
                        Reviewed: {fb.targetName}
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            fb.rating >= star
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-[#56473f] dark:text-[#c4b5ae] leading-relaxed">
                    "{fb.comment}"
                  </p>

                  {/* Tags */}
                  {fb.tags && fb.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {fb.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-[#fdfaf8] dark:bg-[#251d19] border border-[#f0e8e3] dark:border-[#33251e] text-[10px] font-medium text-[#786b65] dark:text-[#a89991]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Helpful Button */}
                  <div className="pt-2 border-t border-[#f0e8e3] dark:border-[#33251e] flex items-center justify-between text-xs text-[#786b65] dark:text-[#a89991]">
                    <span>Did this review help you?</span>
                    <button
                      onClick={() => handleHelpful(fb.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#dcc9bf] dark:border-[#42332a] bg-white dark:bg-[#251d19] hover:bg-[#edf7f0] hover:text-[#176541] hover:border-[#176541] text-[11px] font-semibold text-[#56473f] dark:text-[#e8dcd5] transition-colors cursor-pointer"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>Helpful ({fb.helpfulCount})</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
