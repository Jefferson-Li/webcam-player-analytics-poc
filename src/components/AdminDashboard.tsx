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
import { useI18n } from "@/lib/i18n/context";
import type { AnalyticsStats, ExpressionName, GameId } from "@/lib/types";

const GENDER_COLORS = { male: "#22d3ee", female: "#f472b6" };
const EXPRESSION_COLOR = "#fbbf24";
const AGE_COLOR = "#34d399";
const GAME_COLORS: Record<GameId, string> = {
  "face-catch": "#22d3ee",
  "emotion-match": "#fbbf24",
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
  const { t, locale } = useI18n();
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/sessions?view=stats", { cache: "no-store" });
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as AnalyticsStats;
      setStats(data);
    } catch {
      setError(t.admin.loadError);
    } finally {
      setLoading(false);
    }
  }, [t.admin.loadError]);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 5000);
    return () => window.clearInterval(id);
  }, [refresh]);

  async function clearAll() {
    if (!confirm(t.admin.clearConfirm)) return;
    await fetch("/api/sessions", { method: "DELETE" });
    await refresh();
  }

  if (loading && !stats) {
    return <p className="text-slate-400">{t.admin.loading}</p>;
  }

  if (error && !stats) {
    return <p className="text-rose-300">{error}</p>;
  }

  if (!stats) return null;

  const genderData = stats.genderDistribution.map((g) => ({
    name: g.gender === "male" ? t.common.male : t.common.female,
    key: g.gender,
    value: g.count,
  }));

  const expressionData = stats.expressionDistribution.map((e) => ({
    name: t.expressions[e.expression as ExpressionName] ?? e.expression,
    count: e.count,
  }));

  const attemptsData = stats.gameStats.map((g) => ({
    name: GAME_LABELS[g.gameId],
    attempts: g.attempts,
    fill: GAME_COLORS[g.gameId],
  }));

  const durationData = stats.gameStats.map((g) => ({
    name: GAME_LABELS[g.gameId],
    minutes: Math.round((g.totalDurationMs / 60000) * 10) / 10,
    fill: GAME_COLORS[g.gameId],
  }));

  const dailyData = stats.dailyUsers.map((d) => ({
    ...d,
    shortDate: d.date.slice(5),
  }));

  const dateLocale = locale === "zh" ? "zh-TW" : "en-US";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/80">
            {t.admin.eyebrow}
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl text-white sm:text-4xl">
            {t.admin.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            {t.admin.subtitle}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/10"
          >
            {t.admin.refresh}
          </button>
          <button
            type="button"
            onClick={() => void clearAll()}
            className="rounded-lg border border-rose-400/40 px-4 py-2 text-sm text-rose-200 hover:bg-rose-950/50"
          >
            {t.admin.clear}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          title={t.admin.kpiTodayUsers}
          value={String(stats.todayUsers)}
          hint={t.admin.kpiTodayUsersHint}
        />
        <Kpi
          title={t.admin.kpiTotalAttempts}
          value={String(stats.totalSessions)}
          hint={t.admin.kpiTotalAttemptsHint}
        />
        <Kpi
          title={t.admin.kpiMostTime}
          value={
            stats.mostTimeSpentGame
              ? GAME_LABELS[stats.mostTimeSpentGame.gameId]
              : "—"
          }
          hint={
            stats.mostTimeSpentGame
              ? formatDuration(stats.mostTimeSpentGame.totalDurationMs)
              : t.admin.kpiNoData
          }
        />
        <Kpi
          title={t.admin.kpiMostAttempts}
          value={
            stats.mostAttemptedGame
              ? GAME_LABELS[stats.mostAttemptedGame.gameId]
              : "—"
          }
          hint={
            stats.mostAttemptedGame
              ? `${stats.mostAttemptedGame.attempts} ${t.admin.sessions}`
              : t.admin.kpiNoData
          }
        />
      </div>

      {stats.totalSessions === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/50 px-6 py-16 text-center">
          <p className="font-[family-name:var(--font-display)] text-xl text-white">
            {t.admin.emptyTitle}
          </p>
          <p className="mt-2 text-sm text-slate-400">
            {t.admin.emptyHintBefore}{" "}
            <a
              href="/play"
              className="text-cyan-300 underline underline-offset-2"
            >
              {t.admin.emptyHintLink}
            </a>{" "}
            {t.admin.emptyHintAfter}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title={t.admin.chartAttempts}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={attemptsData}>
                  <CartesianGrid
                    stroke="rgba(148,163,184,0.15)"
                    vertical={false}
                  />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                  <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar
                    dataKey="attempts"
                    name={t.admin.attempts}
                    radius={[6, 6, 0, 0]}
                  >
                    {attemptsData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title={t.admin.chartDuration}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={durationData}>
                  <CartesianGrid
                    stroke="rgba(148,163,184,0.15)"
                    vertical={false}
                  />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar
                    dataKey="minutes"
                    name={t.admin.minutes}
                    radius={[6, 6, 0, 0]}
                  >
                    {durationData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title={t.admin.chartDaily}>
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
                    name={t.admin.users}
                    stroke="#34d399"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#34d399" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sessions"
                    name={t.admin.sessions}
                    stroke="#22d3ee"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 2, fill: "#22d3ee" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title={t.admin.chartGender}>
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
                    formatter={(value) => [
                      String(value ?? 0),
                      t.admin.people,
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title={t.admin.chartAge}>
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
                    name={t.admin.people}
                    fill={AGE_COLOR}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title={t.admin.chartExpression}>
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
                    width={72}
                    stroke="#94a3b8"
                    fontSize={12}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar
                    dataKey="count"
                    name={t.admin.times}
                    fill={EXPRESSION_COLOR}
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60">
            <div className="border-b border-white/5 px-4 py-3 text-sm font-medium text-slate-200">
              {t.admin.gameSummary}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-950/60 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3">{t.admin.colGame}</th>
                    <th className="px-4 py-3">{t.admin.colAttempts}</th>
                    <th className="px-4 py-3">{t.admin.colDuration}</th>
                    <th className="px-4 py-3">{t.admin.colPlayers}</th>
                    <th className="px-4 py-3">{t.admin.colAvgScore}</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.gameStats.map((g) => (
                    <tr
                      key={g.gameId}
                      className="border-t border-white/5 text-slate-200"
                    >
                      <td className="px-4 py-3 font-medium text-white">
                        {GAME_LABELS[g.gameId]}
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
              {t.admin.recentSessions}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-950/60 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3">{t.admin.colTime}</th>
                    <th className="px-4 py-3">{t.admin.colGame}</th>
                    <th className="px-4 py-3">{t.admin.colAge}</th>
                    <th className="px-4 py-3">{t.admin.colGender}</th>
                    <th className="px-4 py-3">{t.admin.colExpression}</th>
                    <th className="px-4 py-3">{t.admin.colLength}</th>
                    <th className="px-4 py-3">{t.admin.colScore}</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentSessions.map((s) => (
                    <tr
                      key={s.id}
                      className="border-t border-white/5 text-slate-200"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-slate-400">
                        {new Date(s.createdAt).toLocaleString(dateLocale)}
                      </td>
                      <td className="px-4 py-3">
                        {GAME_LABELS[s.gameId] ?? s.gameId}
                      </td>
                      <td className="px-4 py-3">{s.age}</td>
                      <td className="px-4 py-3">
                        {s.gender === "male" ? t.common.male : t.common.female}
                      </td>
                      <td className="px-4 py-3">
                        {t.expressions[s.dominantExpression] ??
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
