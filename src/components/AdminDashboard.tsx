"use client";

import {
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GAME_LABELS } from "@/lib/games";
import type { AnalyticsStats, GameId } from "@/lib/types";

const GENDER_COLORS = { male: "#22d3ee", female: "#f472b6" };
const EXPRESSION_COLOR = "#fbbf24";
const AGE_COLOR = "#34d399";
const GAME_COLORS: Record<GameId, string> = {
  "face-catch": "#22d3ee",
  "emotion-match": "#fbbf24",
};

const EXPRESSION_LABELS: Record<string, string> = {
  neutral: "平靜",
  happy: "開心",
  sad: "難過",
  angry: "生氣",
  fearful: "害怕",
  disgusted: "厭惡",
  surprised: "驚訝",
};

function formatDuration(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min < 60) return `${min}m ${sec}s`;
  const hr = Math.floor(min / 60);
  return `${hr}h ${min % 60}m`;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/sessions?view=stats", { cache: "no-store" });
      if (!res.ok) throw new Error("讀取失敗");
      const data = (await res.json()) as AnalyticsStats;
      setStats(data);
    } catch {
      setError("無法載入分析資料");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 5000);
    return () => window.clearInterval(id);
  }, [refresh]);

  async function clearAll() {
    if (!confirm("確定清空所有 session 資料？")) return;
    await fetch("/api/sessions", { method: "DELETE" });
    await refresh();
  }

  if (loading && !stats) {
    return <p className="text-slate-400">載入儀表板…</p>;
  }

  if (error && !stats) {
    return <p className="text-rose-300">{error}</p>;
  }

  if (!stats) return null;

  const genderData = stats.genderDistribution.map((g) => ({
    name: g.gender === "male" ? "男性" : "女性",
    key: g.gender,
    value: g.count,
  }));

  const expressionData = stats.expressionDistribution.map((e) => ({
    name: EXPRESSION_LABELS[e.expression] ?? e.expression,
    count: e.count,
  }));

  const attemptsData = stats.gameStats.map((g) => ({
    name: g.label,
    attempts: g.attempts,
    fill: GAME_COLORS[g.gameId],
  }));

  const durationData = stats.gameStats.map((g) => ({
    name: g.label,
    minutes: Math.round((g.totalDurationMs / 60000) * 10) / 10,
    fill: GAME_COLORS[g.gameId],
  }));

  const dailyData = stats.dailyUsers.map((d) => ({
    ...d,
    shortDate: d.date.slice(5),
  }));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/80">
            Analytics Console
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl text-white sm:text-4xl">
            玩家人口統計後台
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            彙整 Face Catch / Emotion Match 的匿名臉部估計、遊戲耗時、每日用戶與嘗試次數。每 5 秒自動刷新。
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/10"
          >
            立即刷新
          </button>
          <button
            type="button"
            onClick={() => void clearAll()}
            className="rounded-lg border border-rose-400/40 px-4 py-2 text-sm text-rose-200 hover:bg-rose-950/50"
          >
            清空資料
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          title="今日用戶"
          value={String(stats.todayUsers)}
          hint="匿名瀏覽器 ID（當日）"
        />
        <Kpi
          title="總嘗試次數"
          value={String(stats.totalSessions)}
          hint="所有遊戲累計局數"
        />
        <Kpi
          title="最耗時遊戲"
          value={stats.mostTimeSpentGame?.label ?? "—"}
          hint={
            stats.mostTimeSpentGame
              ? formatDuration(stats.mostTimeSpentGame.totalDurationMs)
              : "尚無資料"
          }
        />
        <Kpi
          title="最多嘗試"
          value={stats.mostAttemptedGame?.label ?? "—"}
          hint={
            stats.mostAttemptedGame
              ? `${stats.mostAttemptedGame.attempts} 局`
              : "尚無資料"
          }
        />
      </div>

      {stats.totalSessions === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/50 px-6 py-16 text-center">
          <p className="font-[family-name:var(--font-display)] text-xl text-white">
            尚無資料
          </p>
          <p className="mt-2 text-sm text-slate-400">
            請先到{" "}
            <a
              href="/play"
              className="text-cyan-300 underline underline-offset-2"
            >
              前台遊戲
            </a>{" "}
            完成一局
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="各遊戲嘗試次數">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={attemptsData}>
                  <CartesianGrid
                    stroke="rgba(148,163,184,0.15)"
                    vertical={false}
                  />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                  <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="attempts" name="嘗試次數" radius={[6, 6, 0, 0]}>
                    {attemptsData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="各遊戲累計遊玩時間（分鐘）">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={durationData}>
                  <CartesianGrid
                    stroke="rgba(148,163,184,0.15)"
                    vertical={false}
                  />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="minutes" name="分鐘" radius={[6, 6, 0, 0]}>
                    {durationData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="每日活躍用戶數">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={dailyData}>
                  <CartesianGrid stroke="rgba(148,163,184,0.15)" />
                  <XAxis dataKey="shortDate" stroke="#94a3b8" fontSize={12} />
                  <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="users"
                    name="用戶數"
                    stroke="#34d399"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#34d399" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sessions"
                    name="局數"
                    stroke="#22d3ee"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 2, fill: "#22d3ee" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="性別分布">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={genderData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {genderData.map((entry) => (
                      <Cell
                        key={entry.key}
                        fill={
                          GENDER_COLORS[
                            entry.key as keyof typeof GENDER_COLORS
                          ]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => [String(value ?? 0), "人數"]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="年齡區間">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stats.ageDistribution}>
                  <CartesianGrid
                    stroke="rgba(148,163,184,0.15)"
                    vertical={false}
                  />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
                  <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar
                    dataKey="count"
                    name="人數"
                    fill={AGE_COLOR}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="主要表情">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={expressionData}
                  layout="vertical"
                  margin={{ left: 16 }}
                >
                  <CartesianGrid
                    stroke="rgba(148,163,184,0.15)"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    stroke="#94a3b8"
                    fontSize={12}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={48}
                    stroke="#94a3b8"
                    fontSize={12}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar
                    dataKey="count"
                    name="次數"
                    fill={EXPRESSION_COLOR}
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60">
            <div className="border-b border-white/5 px-4 py-3 text-sm font-medium text-slate-200">
              遊戲摘要
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-950/60 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3">遊戲</th>
                    <th className="px-4 py-3">嘗試次數</th>
                    <th className="px-4 py-3">累計時間</th>
                    <th className="px-4 py-3">獨立玩家</th>
                    <th className="px-4 py-3">平均得分</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.gameStats.map((g) => (
                    <tr
                      key={g.gameId}
                      className="border-t border-white/5 text-slate-200"
                    >
                      <td className="px-4 py-3 font-medium text-white">
                        {g.label}
                      </td>
                      <td className="px-4 py-3">{g.attempts}</td>
                      <td className="px-4 py-3">
                        {formatDuration(g.totalDurationMs)}
                      </td>
                      <td className="px-4 py-3">{g.uniquePlayers}</td>
                      <td className="px-4 py-3 text-amber-300">
                        {g.averageScore}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60">
            <div className="border-b border-white/5 px-4 py-3 text-sm font-medium text-slate-200">
              最近 Sessions
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-950/60 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3">時間</th>
                    <th className="px-4 py-3">遊戲</th>
                    <th className="px-4 py-3">年齡</th>
                    <th className="px-4 py-3">性別</th>
                    <th className="px-4 py-3">表情</th>
                    <th className="px-4 py-3">時長</th>
                    <th className="px-4 py-3">得分</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentSessions.map((s) => (
                    <tr
                      key={s.id}
                      className="border-t border-white/5 text-slate-200"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-slate-400">
                        {new Date(s.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        {GAME_LABELS[s.gameId] ?? s.gameId}
                      </td>
                      <td className="px-4 py-3">{s.age}</td>
                      <td className="px-4 py-3">
                        {s.gender === "male" ? "男性" : "女性"}
                      </td>
                      <td className="px-4 py-3">
                        {EXPRESSION_LABELS[s.dominantExpression] ??
                          s.dominantExpression}
                      </td>
                      <td className="px-4 py-3">
                        {formatDuration(s.durationMs)}
                      </td>
                      <td className="px-4 py-3 font-medium text-amber-300">
                        {s.score}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const tooltipStyle: CSSProperties = {
  background: "#0f172a",
  border: "1px solid rgba(148,163,184,0.25)",
  borderRadius: 8,
  color: "#e2e8f0",
};

function Kpi({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 px-5 py-4">
      <p className="text-xs uppercase tracking-wider text-slate-400">{title}</p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-2xl text-white sm:text-3xl">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
      <h2 className="mb-3 text-sm font-medium text-slate-200">{title}</h2>
      {children}
    </div>
  );
}
