/**
 * Weekly Pulse Types
 */

export interface PulseTrendDataPoint {
  weekStart: string; // ISO date string
  average: number | null; // null if below threshold
  participation: number; // percentage
  responseCount: number;
  insufficient: boolean; // true if below anonymity threshold
}

export interface PulseQuestionSummary {
  questionId: string;
  questionText: string;
  category: string | null;
  scale: 'LIKERT_1_5' | 'NPS_0_10';
  trend: PulseTrendDataPoint[];
  overallAverage: number | null;
  insufficient: boolean;
}

export interface PulseSummaryResponse {
  tenantId: string;
  anonThreshold: number;
  summary: {
    overallTrend: PulseTrendDataPoint[];
    participationRate: number; // overall participation %
    totalResponses: number;
    totalInvites: number;
  };
  questions: PulseQuestionSummary[];
  heatmap?: {
    // Category x Week matrix
    [category: string]: {
      [weekStart: string]: {
        average: number | null;
        insufficient: boolean;
      };
    };
  };
}

export interface PulseSummaryQuery {
  tenantId: string;
  range?: string; // e.g., '4w', '8w', '12w'
  teamId?: string; // Optional team filter (future)
  anonThreshold?: number; // Override default threshold
}
