/** Dhakaiya Bangla labels for every NPC/engine job flag id (kill any English fallback). */
export const JOB_LABELS: Record<string, string> = {
  job_retail: 'দোকান-পসার',
  job_service: 'সেবা-কাম',
  job_office: 'অফিস-কেরানি',
  job_tech: 'আইটি / টেক',
  job_medical: 'ডাক্তারিখানা',
  job_legal: 'আইন-কানুন',
  job_finance: 'ব্যাংক-ফাইন্যান্স',
  job_art: 'শিল্প-কারখানা',
  job_trade: 'কারিগরি ঠেক',
  job_military: 'সেনা-বাহিনী',
  job_entertainer: 'বিনোদন-জগত',
  job_politics: 'রাজনীতি-রংমহল',
  job_sports: 'খেলার মাঠ',
  job_business: 'ব্যবসা-বাণিজ্য',
};

/** Always returns a Dhakaiya label; unknown ids degrade to the raw token wrapped in parens. */
export function jobLabel(jobId: string | undefined | null): string {
  if (!jobId) return '';
  return JOB_LABELS[jobId] ?? `(${jobId})`;
}