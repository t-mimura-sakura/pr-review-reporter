/**
 * PRのコメント・レビューから除外ユーザーを除いたイベントを抽出する
 * @param {object} params
 * @param {Array} params.issueComments - Issueコメント配列
 * @param {Array} params.reviewComments - Reviewコメント配列
 * @param {Array} params.reviews - レビュー配列
 * @param {Set<string>} params.excludedUsers - 除外ユーザーセット
 * @returns {Array<{date: Date, login: string, type: 'comment' | 'approve'}>} イベント配列
 */
export function extractEvents({ issueComments, reviewComments, reviews, excludedUsers }) {
  const events = [];
  issueComments
    .filter(c => c.user?.login && !excludedUsers.has(c.user.login))
    .forEach(c => events.push({ date: new Date(c.created_at), login: c.user.login, type: "comment" }));
  reviewComments
    .filter(c => c.user?.login && !excludedUsers.has(c.user.login))
    .forEach(c => events.push({ date: new Date(c.created_at), login: c.user.login, type: "comment" }));
  reviews
    .filter(r => r.state === "APPROVED" && r.user?.login && !excludedUsers.has(r.user.login))
    .forEach(r => events.push({ date: new Date(r.submitted_at), login: r.user.login, type: "approve" }));
  return events;
}
