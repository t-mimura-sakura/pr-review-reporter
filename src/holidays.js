import fetch from "node-fetch";

/**
 * 指定年の日本の祝日一覧を取得する
 * @param {number} year - 年（西暦）
 * @returns {Promise<Set<string>>} 祝日の日付文字列セット（YYYY-MM-DD）
 */
export async function loadHolidays(year) {
  const url = `https://holidays-jp.github.io/api/v1/${year}/date.json`;
  const res = await fetch(url);
  const data = await res.json();
  return new Set(Object.keys(data));
}