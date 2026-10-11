export type DashboardStats = {
  totalGroups: number;
  totalQuizzes: number;
  publishedQuizzes: number;
  draftQuizzes: number;
  totalQuestions: number;
  totalSubmissions: number;
  qualifiedSubmissions: number;
  submissionsInRange: number;
};

export type OverviewPoint = {
  key: string;
  name: string;
  total: number;
};

export type DashboardOverview = {
  granularity: "day" | "month";
  data: OverviewPoint[];
};

export type DashboardScore = {
  id: string;
  name: string;
  email: string;
  quizId: string;
  quizTitle: string;
  correctAnswers: number;
  answeredQuestions: number;
  unansweredQuestions: number;
  totalQuestions: number;
  percentage: number;
  isQualified: boolean;
  createdAt: string;
};

export type RecentScore = DashboardScore;
export type TopScore = DashboardScore;

export type DashboardData = {
  stats: DashboardStats;
  overview: DashboardOverview;
  recentScores: RecentScore[];
  topScores: TopScore[];
  dateRange: {
    from: string;
    to: string;
    timeZone?: string;
  };
};

export type DashboardGroupOption = {
  id: string;
  name: string;
};
