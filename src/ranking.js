import { extractEvents } from "./filter.js";

/**
 * PRごとの初回フィードバック担当者ランキングを集計
 * @param {object} params
 * @param {Array} params.prDetails - prDataLoader.jsで取得したPR詳細配列
 * @param {Date} params.since - 対象期間の開始日
 * @param {Set<string>} params.excludedUsers - 除外ユーザーセット
 * @returns {Promise<object>} ランキング集計結果
 */
export async function runRanking({ prDetails, since, excludedUsers }) {
  const counter = {};
  for (const { pr, issueComments, reviewComments, reviews } of prDetails) {
    const created = new Date(pr.created_at);
    if (created < since) continue;
    const events = extractEvents({ issueComments, reviewComments, reviews, excludedUsers });
    if (!events.length) continue;
    events.sort((a, b) => a.date - b.date);
    const firstUser = events[0].login;
    counter[firstUser] = (counter[firstUser] || 0) + 1;
  }
  const userStats = Object.entries(counter)
    .sort((a, b) => b[1] - a[1])
    .map(([login, count]) => ({ login, count }));
  return {
    user_stats: userStats,
    total_prs: userStats.reduce((sum, u) => sum + u.count, 0)
  };
}