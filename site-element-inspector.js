(function () {
  "use strict";
  if (window.__hbPageElementInspectorLoaded) return;
  window.__hbPageElementInspectorLoaded = true;

  var pages = [
    ["index.html", "Home"], ["editions.html", "The Memory Editions"], ["wishverse.html", "The Wishverse"],
    ["about.html", "About"], ["contact.html", "Contact"], ["cart.html", "Cart"],
    ["birthday-magazine.html", "Birthday Edition"], ["anniversary-magazine.html", "Anniversary Edition"],
    ["love-story-magazine.html", "Love Story Edition"], ["valentines-day-magazine.html", "Valentine’s Day Edition"],
    ["wedding-magazine.html", "Wedding Edition"], ["friendship-magazine.html", "Friendship Edition"],
    ["just-because-magazine.html", "Just Because Edition"], ["magazine-personalize.html", "Magazine Personalization"],
    ["magazine-review.html", "Magazine Review"], ["wishverse-birthday-celebration.html", "Birthday Celebration"],
    ["wishverse-gift-presentation.html", "Gift Presentation"], ["wishverse-marriage-proposal.html", "Marriage Proposal"],
    ["wishverse-love-confession.html", "Love Confession"], ["wishverse-anniversary-surprise.html", "Anniversary Surprise"],
    ["wishverse-apology-makeup.html", "Apology & Make Up"], ["wishverse-signature-wish.html", "The Signature Wish"]
  ];
  var targetSelector = [
    "body", "header", "nav", "main", "footer", "section", "article", "aside", "form", "fieldset",
    "h1", "h2", "h3", "h4", "h5", "h6", "p", "button", "a", "img", "svg", "input", "select", "textarea", "video", "audio",
    "[role='img']", "[aria-label]", "[class*='card']", "[class*='hero']", "[class*='panel']", "[class*='background']", "[class*='texture']", "[class*='banner']"
  ].join(",");
  var state = { open: false, entries: [], selected: null, hovered: null, host: null, panel: null, list: null, overlay: null, toastTimer: 0, scrollHandler: null };
  var rootPath = new URL(".", window.location.href);

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }
  function pad(number) { return String(number).padStart(2, "0"); }
  function cleanText(value, limit) {
    var result = String(value || "").replace(/\s+/g, " ").trim();
    limit = limit || 76;
    return result.length > limit ? result.slice(0, limit - 1) + "…" : result;
  }
  function visible(node) {
    if (!node || !node.isConnected) return false;
    var style = window.getComputedStyle(node), rect = node.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) !== 0 && !node.hidden && rect.width > 1 && rect.height > 1;
  }
  function logoNode() {
    var candidates = document.querySelectorAll(".mobile-brand-icon img, .brand-logo-image, header .brand img[alt*='Biography'], .topbar .brand img");
    for (var i = 0; i < candidates.length; i++) if (visible(candidates[i])) return candidates[i];
    return document.querySelector("header .brand-logo-link, header .brand, .topbar .brand");
  }
  function brandNameNode() {
    var mobileName = document.querySelector(".mobile-brand-name");
    if (visible(mobileName)) return mobileName;
    return document.querySelector("header .brand-logo-link, header .brand, .topbar .brand");
  }
  function elementName(node) {
    var tag = node.tagName.toLowerCase();
    var explicit = node.getAttribute("aria-label") || node.getAttribute("alt") || node.getAttribute("title") || node.getAttribute("data-testid") || node.getAttribute("data-component");
    if (explicit) return cleanText(explicit);
    if (tag === "body") return "Page background";
    if (/^h[1-6]$/.test(tag)) return cleanText(node.innerText) || "Heading";
    if (tag === "img") return cleanText(node.alt) || cleanText(node.currentSrc || node.src).split("/").pop() || "Image";
    if (tag === "svg") {
      var svgTitle = node.querySelector("title");
      return cleanText(svgTitle && svgTitle.textContent) || "SVG illustration / icon";
    }
    var content = node.innerText || node.value || "";
    if (content.trim()) return cleanText(content);
    var classes = typeof node.className === "string" ? node.className.trim().split(/\s+/) : [];
    var meaningful = classes.find(function (name) { return name && !/^(is-|has-|js-|active|selected|hidden|open)/i.test(name); });
    if (node.id) return node.id.replace(/[-_]+/g, " ");
    if (meaningful) return meaningful.replace(/[-_]+/g, " ");
    return tag.charAt(0).toUpperCase() + tag.slice(1);
  }
  function elementType(node) {
    var tag = node.tagName.toLowerCase(), cls = typeof node.className === "string" ? node.className : "";
    if (tag === "body" || /background|texture/i.test(cls)) return "Background / surface";
    if (/card/i.test(cls) || tag === "article") return "Card";
    if (/hero/i.test(cls)) return "Hero section";
    if (/^h[1-6]$/.test(tag)) return "Heading";
    if (tag === "p") return "Paragraph";
    if (tag === "button") return "Button";
    if (tag === "a") return "Link";
    if (tag === "img") return "Image / logo";
    if (tag === "svg") return "SVG illustration / icon";
    if (["input", "select", "textarea"].indexOf(tag) >= 0) return "Form control";
    if (["video", "audio"].indexOf(tag) >= 0) return tag === "video" ? "Video" : "Audio";
    if (tag === "nav") return "Navigation";
    if (tag === "form" || tag === "fieldset") return "Form";
    if (["header", "main", "footer", "section", "aside"].indexOf(tag) >= 0) return tag.charAt(0).toUpperCase() + tag.slice(1) + " region";
    return node.getAttribute("role") ? node.getAttribute("role") + " role" : "Container / component";
  }
  function selectorFor(node) {
    if (!node || node.nodeType !== 1) return "Not detected";
    if (node.id) return "#" + (window.CSS && CSS.escape ? CSS.escape(node.id) : node.id);
    var parts = [], current = node;
    while (current && current.nodeType === 1 && current !== document.documentElement) {
      var part = current.tagName.toLowerCase();
      var classes = typeof current.className === "string" ? current.className.trim().split(/\s+/).filter(Boolean).slice(0, 2) : [];
      if (classes.length) part += classes.map(function (name) { return "." + (window.CSS && CSS.escape ? CSS.escape(name) : name); }).join("");
      var siblings = current.parentElement ? Array.prototype.filter.call(current.parentElement.children, function (sibling) { return sibling.tagName === current.tagName; }) : [];
      if (siblings.length > 1) part += ":nth-of-type(" + (siblings.indexOf(current) + 1) + ")";
      parts.unshift(part);
      try { if (document.querySelectorAll(parts.join(" > ")).length === 1) return parts.join(" > "); } catch (error) { /* Keep building a safe DOM path. */ }
      current = current.parentElement;
    }
    return parts.join(" > ") || "Not detected";
  }
  function isInsideBrand(node, logo, nameNode) {
    var brand = document.querySelector("header .brand-logo-link, header .brand, .topbar .brand");
    return node === logo || node === nameNode || (!!brand && (node === brand || brand.contains(node))) || (logo && logo.contains && logo.contains(node)) || (nameNode && nameNode.contains && nameNode.contains(node));
  }
  function makeEntry(node, number, name, type) {
    return { node: node, number: number, name: name || elementName(node), type: type || elementType(node), selector: selectorFor(node), tag: node ? node.tagName.toLowerCase() : "Not detected" };
  }
  function collect() {
    var entries = [], seen = new Set(), logo = logoNode(), brandName = brandNameNode();
    if (logo) { entries.push(makeEntry(logo, 1, "Website logo", "Logo / brand mark")); seen.add(logo); }
    if (brandName && brandName !== logo) { entries.push(makeEntry(brandName, 2, "Website name — Heart’s Biography", "Brand wordmark")); seen.add(brandName); }
    var nodes = Array.prototype.slice.call(document.querySelectorAll(targetSelector));
    nodes.sort(function (a, b) { if (a === b) return 0; return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1; });
    nodes.forEach(function (node) {
      if (seen.has(node) || !visible(node) || isInsideBrand(node, logo, brandName)) return;
      if (node.tagName.toLowerCase() === "svg" && (node.getAttribute("aria-hidden") === "true" || node.closest("button, a") && node.closest("button, a").querySelector("span"))) return;
      if (node.tagName.toLowerCase() === "p" && !cleanText(node.innerText, 6)) return;
      seen.add(node);
      entries.push(makeEntry(node, entries.length + 1));
    });
    return entries;
  }
  function pageTitle() {
    var title = document.querySelector("h1");
    return cleanText(title && title.innerText) || cleanText(document.title) || window.location.pathname;
  }
  function showToast(text) {
    var toast = state.host.querySelector(".hb-inspector-toast");
    toast.textContent = text; toast.classList.add("is-visible");
    window.clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(function () { toast.classList.remove("is-visible"); }, 2100);
  }
  function renderList(query) {
    state.list.replaceChildren();
    var search = String(query || "").trim().toLowerCase();
    var matching = state.entries.filter(function (entry) { return !search || (pad(entry.number) + " " + entry.name + " " + entry.type + " " + entry.tag + " " + entry.selector).toLowerCase().indexOf(search) >= 0; });
    state.host.querySelector(".hb-inspector-status").textContent = matching.length + " of " + state.entries.length + " elements · #1 logo · #2 website name";
    matching.forEach(function (entry) {
      var row = el("button", "hb-inspector-row"), number = el("span", "hb-inspector-number", pad(entry.number)), name = el("span", "hb-inspector-name", entry.name), tag = el("span", "hb-inspector-tag", "<" + entry.tag + ">");
      row.type = "button"; row.title = entry.type + " · " + entry.selector;
      if (entry === state.selected) row.classList.add("is-active");
      row.append(number, name, tag);
      row.addEventListener("click", function () { choose(entry, true); });
      state.list.appendChild(row);
    });
    if (!matching.length) state.list.appendChild(el("p", "hb-inspector-status", "No matching elements."));
  }
  function updateSelectedInfo(entry) {
    var box = state.host.querySelector(".hb-inspector-selected"), strong = box.querySelector("strong"), code = box.querySelector("code");
    if (!entry) { box.classList.remove("is-visible"); return; }
    strong.textContent = pad(entry.number) + " · " + entry.name;
    code.textContent = entry.type + "  |  " + entry.selector;
    box.classList.add("is-visible");
  }
  function drawMarkers() {
    if (!state.open) return;
    var markers = state.host.querySelectorAll(".hb-inspector-marker,.hb-inspector-outline");
    markers.forEach(function (node) { node.remove(); });
    var viewportWidth = window.innerWidth, viewportHeight = window.innerHeight, collisions = Object.create(null);
    state.entries.forEach(function (entry) {
      var rect = entry.node.getBoundingClientRect();
      if (!entry.node.isConnected || rect.width < 1 || rect.height < 1 || rect.bottom < 0 || rect.right < 0 || rect.top > viewportHeight || rect.left > viewportWidth) return;
      var outline = el("div", "hb-inspector-outline" + (entry === state.selected ? " is-selected" : ""));
      outline.style.left = rect.left + "px"; outline.style.top = rect.top + "px"; outline.style.width = rect.width + "px"; outline.style.height = rect.height + "px";
      state.host.appendChild(outline);
      var key = Math.round(rect.left / 30) + ":" + Math.round(rect.top / 24), stack = collisions[key] || 0;
      collisions[key] = stack + 1;
      var marker = el("button", "hb-inspector-marker" + (entry === state.selected ? " is-selected" : ""), pad(entry.number));
      marker.type = "button"; marker.title = pad(entry.number) + " — " + entry.name;
      marker.style.left = Math.max(2, Math.min(viewportWidth - 25, rect.left + Math.min(stack * 20, Math.max(0, rect.width - 23)))) + "px";
      marker.style.top = Math.max(2, Math.min(viewportHeight - 25, rect.top + Math.min(stack * 5, Math.max(0, rect.height - 23)))) + "px";
      marker.addEventListener("click", function (event) { event.preventDefault(); event.stopPropagation(); choose(entry, false); });
      state.host.appendChild(marker);
    });
  }
  function choose(entry, scroll) {
    if (!entry || !entry.node || !entry.node.isConnected) return;
    state.selected = entry;
    updateSelectedInfo(entry);
    renderList(state.host.querySelector(".hb-inspector-search").value);
    if (scroll) entry.node.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    window.requestAnimationFrame(drawMarkers);
  }
  function closestEntry(node) {
    for (var current = node; current && current.nodeType === 1; current = current.parentElement) {
      var exact = state.entries.find(function (item) { return item.node === current; });
      if (exact) return exact;
    }
    return null;
  }
  function setOpen(open) {
    state.open = !!open;
    state.panel.classList.toggle("is-open", state.open);
    state.host.querySelector(".hb-inspector-trigger").setAttribute("aria-expanded", state.open ? "true" : "false");
    if (state.open) {
      state.entries = collect();
      state.selected = null;
      updateSelectedInfo(null);
      state.host.querySelector(".hb-inspector-page-name").textContent = pageTitle();
      renderList(""); drawMarkers();
      state.host.querySelector(".hb-inspector-search").focus({ preventScroll: true });
    } else {
      state.selected = null;
      state.host.querySelectorAll(".hb-inspector-marker,.hb-inspector-outline").forEach(function (node) { node.remove(); });
      updateSelectedInfo(null);
    }
  }
  function makePanel() {
    var host = el("div", "hb-element-inspector-host");
    host.setAttribute("data-hb-element-inspector", "true");
    var trigger = el("button", "hb-inspector-trigger"), triggerMark = el("span", "hb-inspector-trigger-mark", "#"), triggerLabel = el("span", "", "Inspect");
    trigger.type = "button"; trigger.setAttribute("aria-label", "Open numbered page inspector"); trigger.setAttribute("aria-expanded", "false"); trigger.append(triggerMark, triggerLabel);
    var panel = el("section", "hb-inspector-panel"); panel.setAttribute("aria-label", "Numbered page element inspector");
    var header = el("header", "hb-inspector-header"), heading = el("div", "hb-inspector-heading"), kicker = el("p", "hb-inspector-kicker", "PAGE ELEMENT MAP"), title = el("h2", "hb-inspector-title", "What should change?");
    var pageName = el("span", "hb-inspector-page-name", pageTitle()); heading.append(kicker, title, pageName);
    var close = el("button", "hb-inspector-close", "×"); close.type = "button"; close.setAttribute("aria-label", "Close element inspector"); header.append(heading, close);
    var controls = el("div", "hb-inspector-controls"), pageLabel = el("label", "hb-inspector-page-label", "Go to page"), pageSelect = el("select", "hb-inspector-page"), searchLabel = el("label", "hb-inspector-search-label", "Find an element"), search = el("input", "hb-inspector-search");
    pages.forEach(function (page) { var option = el("option", "", page[1]); option.value = page[0]; pageSelect.appendChild(option); });
    var current = window.location.pathname.split("/").pop() || "index.html";
    if (pages.some(function (page) { return page[0] === current; })) pageSelect.value = current;
    pageSelect.setAttribute("aria-label", "Go to a website page"); search.type = "search"; search.placeholder = "Search number, name, tag or selector"; search.autocomplete = "off";
    pageLabel.appendChild(pageSelect); searchLabel.appendChild(search); controls.append(pageLabel, searchLabel);
    var status = el("div", "hb-inspector-status", "Open Inspect to number this page’s elements.");
    var list = el("div", "hb-inspector-list"); list.setAttribute("role", "listbox"); list.setAttribute("aria-label", "Numbered elements on this page");
    var selected = el("div", "hb-inspector-selected"), selectedName = el("strong"), selectedSelector = el("code"), copy = el("button", "hb-inspector-copy", "Copy element reference");
    copy.type = "button"; selected.append(selectedName, selectedSelector, copy);
    var toast = el("div", "hb-inspector-toast"); toast.setAttribute("role", "status"); toast.setAttribute("aria-live", "polite");
    panel.append(header, controls, status, list, selected); host.append(trigger, panel, toast); document.body.appendChild(host);
    state.host = host; state.panel = panel; state.list = list;
    trigger.addEventListener("click", function () { setOpen(!state.open); });
    close.addEventListener("click", function () { setOpen(false); trigger.focus(); });
    search.addEventListener("input", function () { renderList(search.value); });
    pageSelect.addEventListener("change", function () { window.location.href = new URL(pageSelect.value, rootPath).href; });
    copy.addEventListener("click", function () {
      if (!state.selected) return;
      var entry = state.selected;
      var report = "Page: " + pageTitle() + "\nElement: " + pad(entry.number) + " — " + entry.name + "\nType: " + entry.type + "\nSelector: " + entry.selector + "\nTag: <" + entry.tag + ">";
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(report).then(function () { showToast("Element reference copied."); }).catch(function () { showToast(report); });
      else showToast(report);
    });
  }
  function pageClick(event) {
    if (!state.open || !state.host || event.composedPath && event.composedPath().indexOf(state.host) >= 0) return;
    var node = event.target && event.target.nodeType === 1 ? event.target : event.target && event.target.parentElement;
    var entry = closestEntry(node);
    if (!entry) return;
    event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation(); choose(entry, false);
  }
  function pageHover(event) {
    if (!state.open || !state.host || event.composedPath && event.composedPath().indexOf(state.host) >= 0) return;
    var node = event.target && event.target.nodeType === 1 ? event.target : event.target && event.target.parentElement;
    var entry = closestEntry(node);
    if (!entry || entry === state.hovered || entry === state.selected) return;
    state.hovered = entry;
    drawHover(entry);
  }
  function drawHover(entry) {
    state.host.querySelectorAll(".hb-inspector-outline.is-hover").forEach(function (node) { node.remove(); });
    if (!entry || !entry.node.isConnected) return;
    var rect = entry.node.getBoundingClientRect(), outline = el("div", "hb-inspector-outline is-hover");
    outline.style.left = rect.left + "px"; outline.style.top = rect.top + "px"; outline.style.width = rect.width + "px"; outline.style.height = rect.height + "px"; state.host.appendChild(outline);
  }
  function init() {
    makePanel();
    document.addEventListener("click", pageClick, true);
    document.addEventListener("pointerover", pageHover, true);
    document.addEventListener("keydown", function (event) { if (event.key === "Escape" && state.open) setOpen(false); });
    state.scrollHandler = function () { if (state.open) drawMarkers(); };
    window.addEventListener("scroll", state.scrollHandler, { passive: true });
    window.addEventListener("resize", state.scrollHandler, { passive: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true }); else init();
}());
