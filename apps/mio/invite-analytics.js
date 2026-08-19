/*
 * 招待リンクのランディングページから、PostHog へ「1イベントだけ」送る。
 *
 * ここが埋まっていないと、K（1人が何人連れてくるか）の
 * 「招待→インストール率」の**分母**が取れない。
 * 分子はアプリ側の `first_open_attributed`（lib/core/app_analytics.dart）。
 *
 * 方針（アプリ側 docs/analytics.md と揃える）:
 * - **PostHog SDK を読み込まない。** capture エンドポイントへ1回 POST するだけ。
 *   autocapture もセッション記録も Cookie も無い。
 * - **人物プロファイルを作らない**（`$process_person_profile: false`）。
 *   distinct_id は毎回その場で捨てる乱数。ページをまたいで同じ人を追わない。
 * - **トークン（?c= / ?j=）と ?r= の値は絶対に送らない。** 有無だけを bool にする。
 * - 送信に失敗しても、ページの動作は一切変えない。
 *
 * PostHog の Project API key はクライアント公開前提の鍵で、配信される HTML から
 * どのみち見える。アプリ側は CI の Secret から注入しているが、このサイトは
 * ビルド工程を持たない静的ページなので、ここだけ直書きを許容する。
 */
(function (global) {
  "use strict";

  // ▼ PostHog の Project settings にある Project API key を入れる。
  //    アプリ側の GitHub Secret `POSTHOG_PROJECT_TOKEN` と同じ値。
  //    未設定（プレースホルダのまま）なら、何も送らない。
  var TOKEN = "phc_REPLACE_ME";
  var HOST = "https://us.i.posthog.com";

  function platform() {
    var ua = navigator.userAgent || "";
    if (/iPhone|iPad|iPod/.test(ua)) return "ios";
    if (/Android/.test(ua)) return "android";
    return "desktop";
  }

  /** ページをまたいで追わない、その場限りの ID。 */
  function throwawayId() {
    try {
      if (global.crypto && global.crypto.randomUUID) {
        return global.crypto.randomUUID();
      }
    } catch (e) {}
    return "anon-" + Math.random().toString(36).slice(2) + Date.now();
  }

  /**
   * 招待ページが開かれたことを1件だけ送る。
   * @param {string} kind "friend" | "circle"
   * @param {boolean} hasToken リンクにトークンが付いていたか（値は送らない）
   */
  function invitePageViewed(kind, hasToken) {
    if (!TOKEN || TOKEN.indexOf("phc_") !== 0 || TOKEN === "phc_REPLACE_ME") {
      return;
    }
    var body = JSON.stringify({
      api_key: TOKEN,
      event: "invite_page_viewed",
      distinct_id: throwawayId(),
      properties: {
        kind: kind,
        platform: platform(),
        has_token: !!hasToken,
        $process_person_profile: false,
      },
    });
    try {
      // ストアへ離脱する直前でも落とさないよう sendBeacon を優先する。
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          HOST + "/i/v0/e/",
          new Blob([body], { type: "application/json" })
        );
        return;
      }
      fetch(HOST + "/i/v0/e/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body,
        keepalive: true,
        mode: "no-cors",
      }).catch(function () {});
    } catch (e) {}
  }

  global.mioInviteAnalytics = { invitePageViewed: invitePageViewed };
})(window);
