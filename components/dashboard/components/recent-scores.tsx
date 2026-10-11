import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ClipboardList, Trophy } from "lucide-react";
import type { RecentScore } from "@/types/dashboard";

type RecentScoresProps = {
  scores: RecentScore[];
};

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] ?? "")
      .join("")
      .toUpperCase() || "?"
  );
}

export function RecentScores({ scores }: RecentScoresProps) {
  if (scores.length === 0) {
    return (
      <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-5 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-xl border border-slate-200 bg-white">
          <ClipboardList className="h-5 w-5 text-indigo-600" />
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-800">No recent submissions</p>
        <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">
          Submissions in the selected date range will appear here once participants complete a quiz.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {scores.map((score) => (
        <div
          key={score.id}
          className="rounded-xl border border-transparent p-3 transition-colors hover:border-slate-200 hover:bg-slate-50/80"
        >
          <div className="flex items-start gap-3">
            <Avatar className="mt-0.5 h-10 w-10 shrink-0 border border-slate-200">
              <AvatarFallback className="bg-indigo-50 text-xs font-bold text-indigo-700">
                {initials(score.name)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{score.name}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{score.email}</p>
                </div>
                <span className="text-base font-bold tabular-nums text-slate-900">{score.percentage}%</span>
              </div>

              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all"
                  style={{ width: `${Math.max(0, Math.min(100, score.percentage))}%` }}
                />
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">
                  {score.correctAnswers}/{score.totalQuestions} correct
                </span>
                {score.isQualified ? (
                  <Badge className="h-5 gap-1 border border-emerald-200 bg-emerald-50 px-1.5 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-50">
                    <Trophy className="h-3 w-3" /> Qualified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="h-5 border-slate-200 px-1.5 text-[10px] font-medium text-slate-500">
                    Not qualified
                  </Badge>
                )}
                <span className="ml-auto text-[10px] text-slate-400">
                  {new Date(score.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>

              <Link
                href={`/quiz/${score.quizSlug || score.quizId}`}
                className="mt-2 inline-flex max-w-full items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                <span className="truncate">{score.quizTitle}</span>
                <ArrowUpRight className="h-3 w-3 shrink-0" />
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
