# PR Analyzer GitHub Action

GitHub Pull Request のレビュー所要時間を分析し、  
**グラフ（PNG）付きレポートを Slack に投稿する GitHub Action** です。
( Github Action ではありません。 )

- PR 作成から最初のフィードバックまでの時間
- PR 作成から最初の承認までの時間
- 土日・日本の祝日を除外して集計
- 初回フィードバックを行ったメンバーのランキング
- Chart.js によるグラフ生成
- Slack Files API で画像＋テキスト投稿

GitHub.com / GitHub Enterprise Server（GHE）の両方に対応しています。

---

## 特徴

- ✅ Node.js 製（フロントエンドリポジトリにそのまま導入可能）
- ✅ repo / API base URL の指定不要（実行環境から自動取得）
- ✅ 日本の祝日を除外した正確な時間計測
- ✅ Slack Incoming Webhook 不要（Slack App / Bot Token を利用）
- ✅ 複数リポジトリで再利用可能なカスタム Action

---

## 生成されるレポート

### Slack 投稿内容例

- PR ごとの「初回フィードバックおよび初回承認までの時間」棒グラフ（PNG）
- 初回フィードバック担当者ランキング（テキスト）

```
今週のPRレビュー状況
（初回フィードバック時間のグラフを添付）
▼ 初回フィードバックランキング
• alice: 6 回
• bob: 4 回
• carol: 2 回
```

---

## 分析内容の詳細

### PR 所要時間分析

| 指標 | 内容 |
|----|----|
| 初回フィードバック | Issue コメント / Review コメント / Approve のうち最初のもの |
| 承認 | 最初の承認。追加commitなどで承認が外れても最初の承認を見る。 |
| 営業時間計算 | 土日 + 日本の祝日を除外 |
| PR 規模 | additions + deletions (現在は未利用) |

---

## 事前準備（必須）

### 1. Slack App の作成

Slack に画像ファイルを投稿するため、**Incoming Webhook ではなく Slack App（Bot）を使用します**。

#### 必要な設定

- Bot Token Scopes
  - `files:write`
- アプリを投稿先チャンネルに招待

取得した Bot Token（`xoxb-...`）を後述の Secrets に設定します。

---

### 2. GitHub Secrets の設定

この Action を使うリポジトリで、以下の Secrets を設定してください。

| Secret 名 | 内容 |
|---------|------|
| `GITHUB_TOKEN` | GitHub が自動提供するトークン |
| `SLACK_BOT_TOKEN` | Slack Bot Token（xoxb-...） |
| `SLACK_CHANNEL_ID` | 投稿先 Slack チャンネルの ID |

---

## 使い方（GitHub Actions サンプルワークフロー）

```yaml
name: Weekly PR Review Report

on:
  schedule:
    # 毎週月曜 10:00 JST（UTC 01:00）
    - cron: "0 1 * * 1"
  workflow_dispatch:

jobs:
  analyze:
    runs-on: 
      - self-hosted
      - linux
    container:
      image: ghcr.io/t-mimura-sakura/pr-review-reporter:latest
    permissions:
      contents: read
      pull-requests: read
      issues: read
    env:
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
      SLACK_CHANNEL_ID: ${{ secrets.SLACK_CHANNEL_ID }}
      DAYS: 7
    steps:
      - name: Run PR Analyzer
        run: node /bin/index.js
```

---

## 必要な環境変数

| 環境変数 | 説明 |
|----|----|
| GITHUB_TOKEN | GitHub が自動提供するトークン |
| SLACK_BOT_TOKEN | Slack Bot Token（xoxb-...）|
| SLACK_CHANNEL_ID | 投稿先 Slack チャンネルの ID |
| DAYS | 何日前までの PR を対象にするか（例: 7）|

すべてのパラメータは環境変数で指定します。

---

## 対応環境

* GitHub.com
* GitHub Enterprise Server
* Docker（Action 実行環境）

---

## 技術スタック

* GitHub API: Octokit
* グラフ生成: chart.js + chartjs-node-canvas
* 祝日データ: holidays-jp
* Slack 投稿: Slack Web API（files.getUploadURLExternal / files.completeUploadExternal）

---

## 注意事項

* Slack Incoming Webhook は使用しません
* Slack App の権限変更後は 再インストールが必要 です
* PR 数が多い場合、API Rate Limit に注意してください
