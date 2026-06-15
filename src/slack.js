import fs from "fs";
import fetch from "node-fetch";

/**
 * Slackに分析結果（ランキング・グラフ画像）を投稿する
 * @param {object} rankResult - runRankingの結果オブジェクト
 * @param {string} chartFilename - 投稿するグラフ画像ファイル名
 * @returns {Promise<void>}
 */
export async function postToSlack(rankResult, chartFilename) {
  const token = process.env.SLACK_BOT_TOKEN;
  const channel = process.env.SLACK_CHANNEL_ID;

  const summary =
    `*今週のPRレビュー状況*\n` +
    `初回承認までの所要時間を可視化しています。\n\n` +
    `*▼初回フィードバックランキング*\n` +
    rankResult.user_stats
      .map(u => `• ${u.login}: ${u.count} 回`)
      .join("\n");

  // Step 1: Get upload URL
  const stat = fs.statSync(chartFilename);
  const params = new URLSearchParams({ filename: chartFilename, length: stat.size });
  const getResRaw = await fetch(`https://slack.com/api/files.getUploadURLExternal?${params.toString()}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const getResJson = await getResRaw.json();
  if (!getResJson.ok) {
    throw new Error(`Failed to get Slack upload URL: ${getResJson.error}`);
  }
  const { upload_url, file_id } = getResJson;

  // Step 2: Upload binary
  const fileBuffer = fs.readFileSync(chartFilename);
  await fetch(upload_url, {
    method: "POST",
    body: fileBuffer
  });

  // Step 3: Complete upload
  const completeParams = new URLSearchParams({
    channel_id: channel,
    initial_comment: summary,
    files: JSON.stringify([{ id: file_id, title: chartFilename }])
  });
  const completeResRaw = await fetch(`https://slack.com/api/files.completeUploadExternal?${completeParams.toString()}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
  });
  const completeResJson = await completeResRaw.json();
  if (!completeResJson.ok) {
    throw new Error(`Failed to complete file upload to Slack: ${completeResJson.error}`);
  }
}
