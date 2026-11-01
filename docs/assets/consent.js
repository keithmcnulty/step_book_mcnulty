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
    b.setAttribute("aria-label", "Analytics consent");
    b.innerHTML =
      '<div class="consent-icon" aria-hidden="true"></div>' +
      '<div class="consent-text"><p class="consent-title">Help improve Beyond STEP</p>' +
      '<p>May we count your visit with Google Analytics? It shows which questions and worksheets are most used, ' +
      'so we know what to improve. Nothing is collected unless you accept. ' +
      '<a href="' + root + 'privacy/index.html">Read the privacy note</a>.</p></div>' +
      '<div class="consent-buttons"><button type="button" data-consent="denied" class="consent-decline">No thanks</button>' +
      '<button type="button" data-consent="granted" class="consent-accept">Accept</button></div>';
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
