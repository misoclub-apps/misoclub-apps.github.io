/*
 * MIO のサイトから PostHog へ「1ページにつき1イベントだけ」送る。
 *
 * 送るのは2種類だけ:
 * - `invite_page_viewed` … 招待リンクのランディングページ（add / join / invite）
 *   K（1人が何人連れてくるか）の「招待→インストール率」の**分母**。
 *   分子はアプリ側の `first_open_attributed`（lib/core/app_analytics.dart）。
 * - `store_link_clicked` … ストアのバッジを押した数（LP の index.html と download.html）
 *   SNS に置いたリンクが、実際にストアまで運べたか。
 *   流入元は `?s=`、ページ内のどこのボタンかは `slot` で分ける
 *   （`docs/growth-sns.md` / `docs/growth-log.md`）。
 *
 * 方針（アプリ側 docs/analytics.md と揃える）:
 * - **PostHog SDK を読み込まない。** capture エンドポイントへ1回 POST するだけ。
 *   autocapture もセッション記録も Cookie も無い。
 * - **人物プロファイルを作らない**（`$process_person_profile: false`）。
 *   distinct_id は毎回その場で捨てる乱数。ページをまたいで同じ人を追わない。
 * - **トークン（?c= / ?j= / ?i=）と ?r= の値は絶対に送らない。** 有無だけを bool にする。
 * - **?s= も値をそのまま送らない。** 知っている名前だけを通し、
 *   知らない値は `other` に丸める（アプリ側 `touch_error` と同じ作法）。
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
  var TOKEN = "phc_CGiF9NUekhBgRG2En7ChDAYfZRRBdHY8vSfbHnqcpaZ9";
  var HOST = "https://us.i.posthog.com";

  /**
   * 知らない流入元は `other` に丸める。**自由文をそのまま送らないため。**
   *
   * `x` / `threads` … その媒体の**プロフィール**に置いたリンク
   * `x_post` / `threads_post` … **投稿（自己リプ）**に置いたリンク
   *   どちらの置き場所が実際にストアまで運べているかを比べるために分けてある。
   *   詳細は docs/growth-sns.md の「URL の置き場所」。
   */
  var SOURCES = [
    "x",
    "x_post",
    "threads",
    "threads_post",
    "instagram",
    "tiktok",
    "youtube",
    "note",
  ];

  function platform() {
    var ua = navigator.userAgent || "";
    if (/iPhone|iPad|iPod/.test(ua)) return "ios";
    if (/Android/.test(ua)) return "android";
    return "desktop";
  }

  /** `?s=` の流入元。知らない値・未指定は `other`。 */
  function source() {
    var raw = "";
    try {
      raw = (new URLSearchParams(location.search).get("s") || "").toLowerCase();
    } catch (e) {
      return "other";
    }
    return SOURCES.indexOf(raw) >= 0 ? raw : "other";
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
   * イベントを1件送る。**ここを通らない送信を足さないこと。**
   * @param {string} event イベント名
   * @param {object} properties 固定ID・bool・粗い区分だけ。自由文を入れない
   */
  function send(event, properties) {
    if (!TOKEN || TOKEN.indexOf("phc_") !== 0 || TOKEN === "phc_REPLACE_ME") {
      return;
    }
    properties.$process_person_profile = false;
    var body = JSON.stringify({
      api_key: TOKEN,
      event: event,
      distinct_id: throwawayId(),
      properties: properties,
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

  /**
   * 招待ページが開かれたことを1件だけ送る。
   * @param {string} kind "friend" | "circle" | "invite"
   * @param {boolean} hasToken リンクにトークンが付いていたか（値は送らない）
   */
  function invitePageViewed(kind, hasToken) {
    send("invite_page_viewed", {
      kind: kind,
      platform: platform(),
      has_token: !!hasToken,
    });
  }

  /** ページ内のどのボタンか。知らない値は `other` に丸める。 */
  var SLOTS = ["hero", "footer", "download"];

  /**
   * ストアのバッジが押されたことを送る。
   * @param {string} store 押されたバッジ "ios" | "android"
   * @param {string} slot ページ内の位置 "hero"（LP冒頭）| "footer"（LP末尾）| "download"
   */
  function storeLinkClicked(store, slot) {
    send("store_link_clicked", {
      store: store === "ios" || store === "android" ? store : "other",
      slot: SLOTS.indexOf(slot) >= 0 ? slot : "other",
      platform: platform(),
      source: source(),
    });
  }

  global.mioInviteAnalytics = {
    invitePageViewed: invitePageViewed,
    storeLinkClicked: storeLinkClicked,
  };
})(window);
