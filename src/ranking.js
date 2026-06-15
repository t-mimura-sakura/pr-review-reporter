
/**
 * prDetails: prDataLoader.jsで取得したPR詳細配列 [{ pr, issueComments, reviewComments, reviews, detail }]
 * since: Dateオブジェクト（daysで計算済み）
 */
/**
 * PRごとの初回フィードバック担当者ランキングを集計
 * @param {object} params
 * @param {Array} params.prDetails - prDataLoader.jsで取得したPR詳細配列
 * @param {Date} params.since - 対象期間の開始日
 * @returns {Promise<object>} ランキング集計結果
 */
export async function runRanking({ prDetails, since }) {
  const counter = {};
  for (const { pr, issueComments, reviewComments, reviews } of prDetails) {
    const created = new Date(pr.created_at);
    if (created < since) continue;
    let events = [];
    issueComments.forEach(c => events.push([new Date(c.created_at), c.user.login]));
    reviewComments.forEach(c => events.push([new Date(c.created_at), c.user.login]));
    reviews
      .filter(r => r.state === "APPROVED")
      .forEach(r => events.push([new Date(r.submitted_at), r.user.login]));
    if (!events.length) continue;
    events.sort((a, b) => a[0] - b[0]);
    const firstUser = events[0][1];
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