import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import fs from "fs";

/**
 * PR分析データから棒グラフ画像を生成する
 * @param {Array} prData - runAnalysisの結果配列
 * @param {string} chartFilename - 生成する画像ファイル名
 * @returns {Promise<void>}
 */
export async function createPRChart(prData, chartFilename) {
  const width = 800;
  const height = 400;
  const chartCanvas = new ChartJSNodeCanvas({ width, height });

  // ヒストグラム用ビン（例：0-1h, 1-2h, ... 最大24hまで、24h超は「24+」）
  const maxHour = 24;
  const binCount = maxHour + 1;
  const labels = Array.from({ length: maxHour }, (_, i) => `${i}-${i+1}h`).concat([`${maxHour}+h`]);

  // フィードバック・承認それぞれの時間配列
  const feedbackTimes = prData
    .map(p => p.hours_to_first_feedback)
    .filter(v => v !== null && v !== undefined && !isNaN(v));
  const approvalTimes = prData
    .map(p => p.hours_to_first_approval)
    .filter(v => v !== null && v !== undefined && !isNaN(v));

  // ビン分け
  function toBins(times) {
    const bins = Array.from({ length: binCount }, () => 0);
    times.forEach(h => {
      if (h >= maxHour) {
        bins[maxHour]++;
      } else if (h > 0) {
        bins[h - 1]++;
      }
      // h <= 0（理論上発生しない）は無視. businessHoursDiff の仕様上、１時間以内は１として返されるので０は発生しない
    });
    return bins;
  }
  const feedbackBins = toBins(feedbackTimes);
  const approvalBins = toBins(approvalTimes);

  const config = {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "フィードバックまでの時間",
          data: feedbackBins,
          backgroundColor: "rgba(75, 192, 192, 0.7)"
        },
        {
          label: "承認までの時間",
          data: approvalBins,
          backgroundColor: "rgba(153, 102, 255, 0.7)"
        }
      ]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "フィードバック・承認までの時間分布"
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "時間帯"
          }
        },
        y: {
          title: {
            display: true,
            text: "件数"
          },
          ticks: {
            precision: 0
          },
          beginAtZero: true
        }
      }
    }
  };

  const buffer = await chartCanvas.renderToBuffer(config);
  fs.writeFileSync(chartFilename, buffer);
}