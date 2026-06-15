import { Octokit } from "@octokit/rest";

/**
 * PR・コメント・レビューをまとめて取得しキャッシュする
 * @param {object} params - { owner, repo, baseUrl, token }
 * @returns {Promise<Array>} PRごとの詳細データ配列
 */
export async function loadPRData({ owner, repo, baseUrl, token }) {
  const octokit = new Octokit({ auth: token, baseUrl });

  const { data: prs } = await octokit.pulls.list({
    owner,
    repo,
    state: "all",
    sort: "created",
    direction: "desc"
  });

  // 各PRのコメント・レビューを逐次取得
  const prDetails = [];
  for (const pr of prs) {
    const number = pr.number;
    // 1PRごとに順次API呼び出し
    const [issueComments, reviewComments, reviews, detail] = await Promise.all([
      octokit.issues.listComments({ owner, repo, issue_number: number }),
      octokit.pulls.listReviewComments({ owner, repo, pull_number: number }),
      octokit.pulls.listReviews({ owner, repo, pull_number: number }),
      octokit.pulls.get({ owner, repo, pull_number: number })
    ]);
    prDetails.push({
      pr,
      issueComments: issueComments.data,
      reviewComments: reviewComments.data,
      reviews: reviews.data,
      detail: detail.data
    });
  }
  return prDetails;
}
