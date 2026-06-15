/**
 * prDetails: prDataLoader.jsで取得したPR詳細配列 [{ pr, issueComments, reviewComments, reviews, detail }]
 * since: Dateオブジェクト（daysで計算済み）
 */
function businessHoursDiff(start, end, holidays) {
  let cur = new Date(start);
  let total = 0;

  while (cur < end) {
    const weekday = cur.getUTCDay(); // 0=Sun
    const dateStr = cur.toISOString().slice(0, 10);

    if (weekday >= 1 && weekday <= 5 && !holidays.has(dateStr)) {
      total += 1;
    }
    cur.setUTCHours(cur.getUTCHours() + 1);
  }
  return total;
}

/**
 * PRごとの分析（初回フィードバック・承認までの時間等）を行う
 * @param {object} params
 * @param {Array} params.prDetails - prDataLoader.jsで取得したPR詳細配列
 * @param {Date} params.since - 対象期間の開始日
 * @param {Set<string>} params.holidays - 祝日セット
 * @returns {Promise<Array>} 分析結果配列
 */
export async function runAnalysis({ prDetails, since, holidays }) {
  // holidays: Set (祝日)
  const results = [];
  for (const { pr, issueComments, reviewComments, reviews, detail } of prDetails) {
    const created = new Date(pr.created_at);
    if (created < since) continue;

    // ---- first feedback (comment or approve)
    const feedbackTimes = [];
    issueComments.forEach(c => feedbackTimes.push(new Date(c.created_at)));
    reviewComments.forEach(c => feedbackTimes.push(new Date(c.created_at)));
    const approveTimes = reviews
      .filter(r => r.state === "APPROVED")
      .map(r => new Date(r.submitted_at));
    feedbackTimes.push(...approveTimes);

    const firstFeedbackAt =
      feedbackTimes.length > 0
        ? new Date(Math.min(...feedbackTimes))
        : null;
    // ---- first approval only
    const firstApprovalAt =
      approveTimes.length > 0
        ? new Date(Math.min(...approveTimes))
        : null;
    const hoursToFirstFeedback = firstFeedbackAt
      ? businessHoursDiff(created, firstFeedbackAt, holidays)
      : null;
    const hoursToFirstApproval = firstApprovalAt
      ? businessHoursDiff(created, firstApprovalAt, holidays)
      : null;
    const add = detail.additions || 0;
    const del = detail.deletions || 0;
    results.push({
      pr_number: pr.number,
      created_at: pr.created_at,
      merged_at: pr.merged_at,
      hours_to_first_feedback: hoursToFirstFeedback,
      hours_to_first_approval: hoursToFirstApproval,
      additions: add,
      deletions: del,
      changes: add + del
    });
  }
  return results;
}