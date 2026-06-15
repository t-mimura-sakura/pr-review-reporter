import { loadPRData } from "./src/prDataLoader.js";
import { runAnalysis } from "./src/analyze.js";
import { runRanking } from "./src/ranking.js";
import { createPRChart } from "./src/chart.js";
import { postToSlack } from "./src/slack.js";
import { loadHolidays } from "./src/holidays.js";

async function main() {
  // 必須入力・環境変数チェック
  const daysRaw = process.env.DAYS;
  const days = parseInt(daysRaw, 10);
  const repoFull = process.env.GITHUB_REPOSITORY;
  const baseUrl = process.env.GITHUB_API_URL;
  const token = process.env.GITHUB_TOKEN;
  const slackToken = process.env.SLACK_BOT_TOKEN;
  const slackChannel = process.env.SLACK_CHANNEL_ID;

  if (!daysRaw || isNaN(days) || days <= 0) {
    throw new Error("DAYS environment variable is required and must be a positive integer.");
  }
  if (!repoFull || !repoFull.includes("/")) {
    throw new Error("GITHUB_REPOSITORY environment variable is required and must be in 'owner/repo' format.");
  }
  const [owner, repo] = repoFull.split("/");
  if (!token) {
    throw new Error("GITHUB_TOKEN environment variable is required.");
  }
  if (!slackToken) {
    throw new Error("SLACK_BOT_TOKEN environment variable is required.");
  }
  if (!slackChannel) {
    throw new Error("SLACK_CHANNEL_ID environment variable is required.");
  }

  // 期間計算
  const since = new Date(Date.now() - days * 86400000);
  // 祝日セット
  const years = new Set([since.getUTCFullYear(), new Date().getUTCFullYear()]);
  let holidays = new Set();
  for (const y of years) {
    holidays = new Set([...holidays, ...(await loadHolidays(y))]);
  }

  // PR・コメント・レビューを一括取得
  const prDetails = await loadPRData({ owner, repo, baseUrl, token });

  // 分析・ランキング
  const prResult = await runAnalysis({ prDetails, since, holidays });
  const rankResult = await runRanking({ prDetails, since });

  const chartFilename = "pr-chart.png";
  await createPRChart(prResult, chartFilename);
  await postToSlack(rankResult, chartFilename);

  // 結果出力
  console.log(JSON.stringify({ prResult, rankResult }));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});