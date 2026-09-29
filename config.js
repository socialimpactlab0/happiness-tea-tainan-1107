window.TEA_EVENT_CONFIG = {
  // 先部署新的 GAS 網頁應用程式，再把結尾為 /exec 的網址貼在下面。
  GAS_WEB_APP_URL: "https://script.google.com/macros/s/AKfycbyTVCWSuKM1afRHcHk4DuqfjnTQv4uj4u5ULTWerpfA3coOXElWJ7mD74mZAmcND5U/exec",

  // 11/7 活動編號。請勿與舊活動共用同一個活動編號。
  EVENT_ID: "2026-11-07-happiness-tea-tainan",

  // 沿用原 mind-body-tea-tainan 的 Meta Pixel。
  // 若不需要 Meta Pixel，可改成空字串 ""。
  META_PIXEL_ID: "770057572700869"
};

(function initializeTeaMetaPixel() {
  "use strict";

  const config = window.TEA_EVENT_CONFIG || {};
  const pixelId = String(config.META_PIXEL_ID || "").trim();
  if (!/^\d{5,25}$/.test(pixelId)) return;

  if (!window.fbq) {
    (function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
      t = b.createElement(e); t.async = true; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  }

  const key = "__teaMetaPixelInitialized_" + pixelId;
  if (!window[key]) {
    window.fbq("init", pixelId);
    window.fbq("track", "PageView");
    window[key] = true;
  }

  window.TEA_META_TRACK_LEAD = function () {
    if (typeof window.fbq !== "function") return;
    try {
      window.fbq("track", "Lead", {
        content_name: String(config.EVENT_ID || "happiness-tea")
      });
    } catch (error) {
      console.warn("Meta Pixel Lead failed:", error);
    }
  };

  window.TEA_META_TRACK_COMPLETE_REGISTRATION = function (recordId) {
    if (typeof window.fbq !== "function") return;
    const eventData = { content_name: String(config.EVENT_ID || "happiness-tea") };
    const eventId = String(recordId || "").trim();
    try {
      if (eventId) {
        window.fbq("track", "CompleteRegistration", eventData, { eventID: eventId });
      } else {
        window.fbq("track", "CompleteRegistration", eventData);
      }
    } catch (error) {
      console.warn("Meta Pixel CompleteRegistration failed:", error);
    }
  };
})();
