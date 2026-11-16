/* Beyond STEP: analytics consent. Google Analytics loads only after the visitor accepts. */
(function () {
  "use strict";
  var me = document.currentScript;
  var GA_ID = me && me.getAttribute("data-ga");
  var KEY = "beyondstep-analytics-consent";
  if (!GA_ID) return;

  function getChoice() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function setChoice(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* storage blocked: ask again next visit */ } }
  function clearChoice() { try { localStorage.removeItem(KEY); } catch (e) { } }

  function loadGA() {
    if (window.__gaLoaded) return;
    window.__gaLoaded = true;
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_ID);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GA_ID);
  }

  function removeGACookies() {
    document.cookie.split(";").forEach(function (c) {
      var name = c.split("=")[0].trim();
      if (/^_ga/.test(name)) {
        var host = location.hostname, parts = host.split(".");
        for (var i = 0; i < parts.length - 1; i++) {
          var domain = parts.slice(i).join(".");
          document.cookie = name + "=; Max-Age=0; path=/; domain=." + domain;
        }
        document.cookie = name + "=; Max-Age=0; path=/";
      }
    });
  }

  function hideBanner() {
    var b = document.getElementById("consent-banner");
    if (b) b.remove();
  }

  function showBanner() {
    if (document.getElementById("consent-banner")) return;
    var root = document.body.getAttribute("data-root") || "";
    var b = document.createElement("div");
    b.id = "consent-banner";
    b.className = "consent-banner";
    b.setAttribute("role", "region");
    var zh = /^zh/i.test(document.documentElement.lang || "");
    var t = zh ? {
      label: "Cookie 同意设置", title: "Cookie 与你的隐私",
      body: "英国隐私法例（PECR 及 UK GDPR）规定，本网站在设置分析用 Cookie 前必须先征得你的同意。" +
            "如你接受，Google Analytics 会记录你浏览了哪些页面，让我们了解本书的使用情况。" +
            "如你拒绝，本网站不会设置任何分析用 Cookie，也不会向 Google 传送任何资料。" +
            "你可随时通过每页底部的 Cookie 设置连结更改选择。",
      notice: "隐私声明", reject: "拒绝", accept: "接受"
    } : {
      label: "Cookie consent", title: "Cookies and your privacy",
      body: "UK privacy law (PECR and UK GDPR) requires this site to ask your permission before setting analytics cookies. " +
            "If you accept, Google Analytics will record which pages you visit, so that we can see how the book is used. " +
            "If you reject, no analytics cookies are set and nothing is sent to Google. You can change your choice at any time " +
            "using the cookie settings link at the foot of every page.",
      notice: "Privacy notice", reject: "Reject", accept: "Accept"
    };
    b.setAttribute("aria-label", t.label);
    b.innerHTML =
      '<div class="consent-icon" aria-hidden="true"></div>' +
      '<div class="consent-text"><p class="consent-title">' + t.title + '</p>' +
      '<p>' + t.body + ' ' +
      '<a href="' + root + 'privacy/index.html">' + t.notice + '</a></p></div>' +
      '<div class="consent-buttons"><button type="button" data-consent="denied">' + t.reject + '</button>' +
      '<button type="button" data-consent="granted">' + t.accept + '</button></div>';
    b.addEventListener("click", function (e) {
      var v = e.target.getAttribute && e.target.getAttribute("data-consent");
      if (!v) return;
      setChoice(v);
      hideBanner();
      if (v === "granted") loadGA(); else removeGACookies();
    });
    document.body.appendChild(b);
  }

  function init() {
    var choice = getChoice();
    if (choice === "granted") loadGA();
    else if (choice !== "denied") showBanner();
    document.addEventListener("click", function (e) {
      var t = e.target.closest && e.target.closest("[data-cookie-settings]");
      if (!t) return;
      e.preventDefault();
      var was = getChoice();
      clearChoice();
      if (was === "granted") { removeGACookies(); location.reload(); return; }
      showBanner();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
