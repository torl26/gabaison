export const REPORT_REASON_KEYS = [
  'spam',
  'harassment',
  'inappropriate_content',
  'impersonation',
  'other',
] as const;

export type ReportReason = (typeof REPORT_REASON_KEYS)[number];

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  spam: 'スパム',
  harassment: '迷惑行為・嫌がらせ',
  inappropriate_content: '不適切な内容',
  impersonation: 'なりすまし',
  other: 'その他',
};
