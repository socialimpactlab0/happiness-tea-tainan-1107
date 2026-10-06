(function () {
  "use strict";

  const config = window.TEA_EVENT_CONFIG || {};
  const form = document.getElementById("registrationForm");
  const successState = document.getElementById("successState");
  const status = document.getElementById("formStatus");
  const submitButton = form.querySelector(".submit-button");
  const buttonText = submitButton.querySelector(".button-text");
  const buttonLoading = submitButton.querySelector(".button-loading");
  const newRegistration = document.getElementById("newRegistration");
  const partySizeSelect = form.elements.partySize;
  const participantGroups = Array.from(document.querySelectorAll("[data-participant]"));

  const VISITOR_KEY = "tea_event_visitor_id_v1";
  const SESSION_KEY = "tea_event_session_id_v1";
  const ATTRIBUTION_KEY = "tea_event_attribution_v1";
  const PENDING_SUBMISSION_KEY = "tea_event_pending_submission_v1";

  const visitorId = getOrCreateId(localStorage, VISITOR_KEY);
  const sessionId = getOrCreateId(sessionStorage, SESSION_KEY);
  const tracking = getTracking();
  let formStarted = false;

  function gasUrlIsReady() {
    return /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(
      String(config.GAS_WEB_APP_URL || "").trim()
    );
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return "v-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12);
  }

  function getOrCreateId(storage, key) {
    try {
      let value = storage.getItem(key);
      if (!value) {
        value = createId();
        storage.setItem(key, value);
      }
      return value;
    } catch (error) {
      return createId();
    }
  }

  function getPendingSubmissionId(signature) {
    try {
      const raw = sessionStorage.getItem(PENDING_SUBMISSION_KEY);
      const saved = raw ? JSON.parse(raw) : null;
      if (saved && saved.signature === signature && saved.id) return saved.id;
      const id = createId();
      sessionStorage.setItem(PENDING_SUBMISSION_KEY, JSON.stringify({ id: id, signature: signature }));
      return id;
    } catch (error) {
      return createId();
    }
  }

  function clearPendingSubmission() {
    try { sessionStorage.removeItem(PENDING_SUBMISSION_KEY); } catch (error) {}
  }

  function checkRegistrationJsonp(recordId) {
    return new Promise(function (resolve) {
      if (!gasUrlIsReady() || !recordId) return resolve(false);

      const callbackName = "__teaCheck_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const script = document.createElement("script");
      let finished = false;

      function cleanup(value) {
        if (finished) return;
        finished = true;
        try { delete window[callbackName]; } catch (error) { window[callbackName] = undefined; }
        if (script.parentNode) script.parentNode.removeChild(script);
        resolve(Boolean(value));
      }

      window[callbackName] = function (payload) {
        cleanup(payload && payload.ok && payload.found);
      };

      const timer = setTimeout(function () { cleanup(false); }, 7000);
      const originalCleanup = cleanup;
      cleanup = function (value) {
        clearTimeout(timer);
        originalCleanup(value);
      };

      script.onerror = function () { cleanup(false); };
      script.src = config.GAS_WEB_APP_URL
        + "?requestType=check_registration"
        + "&eventId=" + encodeURIComponent(config.EVENT_ID || "happiness-tea")
        + "&recordId=" + encodeURIComponent(recordId)
        + "&callback=" + encodeURIComponent(callbackName)
        + "&_=" + Date.now();
      document.head.appendChild(script);
    });
  }

  function showRegistrationSuccess(recordId, partySize) {
    clearPendingSubmission();
    trackEvent("registration_success", {
      recordId: recordId || "",
      partySize: partySize
    });
    if (typeof window.TEA_META_TRACK_COMPLETE_REGISTRATION === "function") {
      window.TEA_META_TRACK_COMPLETE_REGISTRATION(recordId || "");
    }
    form.hidden = true;
    successState.hidden = false;
    successState.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function setLoading(loading) {
    submitButton.disabled = loading;
    buttonText.hidden = loading;
    buttonLoading.hidden = !loading;
  }

  function normalizePhone(value) {
    return String(value || "").replace(/[^0-9]/g, "");
  }

  function readSavedAttribution() {
    try {
      const raw = localStorage.getItem(ATTRIBUTION_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      return {};
    }
  }

  function saveAttribution(value) {
    try {
      localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(value));
    } catch (error) {}
  }

  function getTracking() {
    const params = new URLSearchParams(window.location.search);
    const saved = readSavedAttribution();
    const current = {
      utmSource: params.get("utm_source") || "",
      utmMedium: params.get("utm_medium") || "",
      utmCampaign: params.get("utm_campaign") || "",
      utmContent: params.get("utm_content") || "",
      utmTerm: params.get("utm_term") || "",
      fbclid: params.get("fbclid") || ""
    };

    if (Object.values(current).some(Boolean)) {
      saveAttribution(current);
      return current;
    }

    return {
      utmSource: saved.utmSource || "",
      utmMedium: saved.utmMedium || "",
      utmCampaign: saved.utmCampaign || "",
      utmContent: saved.utmContent || "",
      utmTerm: saved.utmTerm || "",
      fbclid: saved.fbclid || ""
    };
  }

  function getDeviceType() {
    const ua = navigator.userAgent || "";
    if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) return "tablet";
    if (/Mobi|Android|iPhone|iPod/i.test(ua)) return "mobile";
    return "desktop";
  }

  function trackEvent(eventName, detail) {
    if (!gasUrlIsReady()) return Promise.resolve();

    const extra = detail || {};
    const payload = new URLSearchParams({
      requestType: "track_event",
      eventName: eventName,
      eventId: config.EVENT_ID || "happiness-tea",
      visitorId: visitorId,
      sessionId: sessionId,
      pageUrl: window.location.href,
      referrer: document.referrer || "",
      device: getDeviceType(),
      userAgent: navigator.userAgent || "",
      clientTime: new Date().toISOString(),
      recordId: String(extra.recordId || ""),
      eventDetail: JSON.stringify(extra),
      ...tracking
    });

    return fetch(config.GAS_WEB_APP_URL, {
      method: "POST",
      body: payload,
      redirect: "follow",
      keepalive: true
    }).catch(function (error) {
      console.warn("Tracking event failed:", eventName, error);
    });
  }

  function syncParticipantGroups() {
    const partySize = Number(partySizeSelect.value) || 1;

    participantGroups.forEach(function (group) {
      const index = Number(group.dataset.participant);
      const active = index <= partySize;
      group.hidden = !active;

      group.querySelectorAll("input").forEach(function (input) {
        input.disabled = !active;
        input.required = active && !input.name.endsWith("Occupation");
        if (!active) input.value = "";
      });
    });
  }

  function collectParticipants(formData, partySize) {
    const participants = [];
    for (let index = 1; index <= partySize; index += 1) {
      participants.push({
        name: String(formData.get("participant" + index + "Name") || "").trim(),
        phone: normalizePhone(formData.get("participant" + index + "Phone")),
        // 留白以明確的缺省標記送至既有 GAS，兼容後台的非空檢查。
        occupation: String(formData.get("participant" + index + "Occupation") || "").trim() || "未填寫"
      });
    }
    return participants;
  }

  function markFormStarted() {
    if (formStarted) return;
    formStarted = true;
    trackEvent("form_start", {
      field: document.activeElement && document.activeElement.name
        ? document.activeElement.name
        : ""
    });
    if (typeof window.TEA_META_TRACK_LEAD === "function") {
      window.TEA_META_TRACK_LEAD();
    }
  }

  document.querySelectorAll('a[href="#registration"]').forEach(function (link) {
    link.addEventListener("click", function () {
      trackEvent("registration_click", {
        label: String(link.textContent || "").trim().slice(0, 100),
        className: String(link.className || "").slice(0, 150)
      });
    });
  });

  form.addEventListener("input", markFormStarted);
  form.addEventListener("change", markFormStarted);

  partySizeSelect.addEventListener("change", syncParticipantGroups);
  syncParticipantGroups();

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    status.textContent = "";

    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    const partySize = Number(formData.get("partySize"));
    if (!Number.isInteger(partySize) || partySize < 1 || partySize > 2) {
      status.textContent = "每次最多可報名 2 位，請選擇 1 位或 2 位。";
      partySizeSelect.focus();
      return;
    }
    const participants = collectParticipants(formData, partySize);

    const invalidPhoneIndex = participants.findIndex(function (participant) {
      return participant.phone.length < 8 || participant.phone.length > 15;
    });
    if (invalidPhoneIndex !== -1) {
      status.textContent = "請確認第" + (invalidPhoneIndex + 1) + "位參加者的手機格式。";
      form.elements["participant" + (invalidPhoneIndex + 1) + "Phone"].focus();
      return;
    }

    const uniquePhones = new Set(participants.map(function (participant) {
      return participant.phone;
    }));
    if (uniquePhones.size !== participants.length) {
      status.textContent = "每位參加者請填寫不同的聯絡手機。";
      return;
    }

    if (!gasUrlIsReady()) {
      status.textContent = "尚未設定 GAS 網頁應用程式網址，請先依 README 完成部署並填入 config.js。";
      return;
    }

    const signature = JSON.stringify({
      eventId: config.EVENT_ID || "happiness-tea",
      partySize: partySize,
      phones: participants.map(function (p) { return p.phone; })
    });
    const clientRecordId = getPendingSubmissionId(signature);

    const payload = new URLSearchParams({
      eventId: config.EVENT_ID || "happiness-tea",
      partySize: String(partySize),
      participants: JSON.stringify(participants),
      clientRecordId: clientRecordId,
      website: String(formData.get("website") || ""),
      pageUrl: window.location.href,
      referrer: document.referrer || "",
      visitorId: visitorId,
      sessionId: sessionId,
      userAgent: navigator.userAgent,
      ...tracking
    });

    setLoading(true);

    const controller = typeof AbortController === "function" ? new AbortController() : null;
    const timeoutId = setTimeout(function () {
      if (controller) controller.abort();
    }, 15000);

    try {
      const response = await fetch(config.GAS_WEB_APP_URL, {
        method: "POST",
        body: payload,
        redirect: "follow",
        signal: controller ? controller.signal : undefined
      });

      if (!response.ok) throw new Error("HTTP " + response.status);

      const result = await response.json();
      if (!result.ok) {
        status.textContent = result.message || "報名資料無法送出，請確認後再試。";
        return;
      }

      showRegistrationSuccess(result.recordId || clientRecordId, partySize);
    } catch (error) {
      console.warn("Registration response failed, verifying saved record:", error);
      status.textContent = "正在確認資料是否已送達，請稍候…";

      const found = await checkRegistrationJsonp(clientRecordId);
      if (found) {
        showRegistrationSuccess(clientRecordId, partySize);
      } else {
        status.textContent = "目前無法確認資料是否送達。請先不要重複按送出，稍後再試；如持續發生可聯絡主辦單位。";
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  });

  newRegistration.addEventListener("click", function () {
    form.reset();
    formStarted = false;
    syncParticipantGroups();
    successState.hidden = true;
    form.hidden = false;
    status.textContent = "";
    form.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  trackEvent("page_view", { title: document.title });
})();