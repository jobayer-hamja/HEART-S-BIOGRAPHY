(function () {
  "use strict";

  var items = [
    { id: "memory-birthday", kind: "memory", title: "Birthday Edition", category: "Birthday Edition", selector: "#birthday-magazine", href: "birthday-magazine.html", aliases: ["birthday", "birthday magazine", "birthday edition", "birthday gift", "birthday memories"] },
    { id: "memory-anniversary", kind: "memory", title: "Anniversary Edition", category: "Anniversary Edition", selector: "#anniversary-magazine", href: "anniversary-magazine.html", aliases: ["anniversary", "anniversary magazine", "anniversary edition", "anniversary gift", "couple anniversary"] },
    { id: "memory-love-story", kind: "memory", title: "Love Story Edition", category: "Love Story Edition", selector: "#love-story-magazine", href: "love-story-magazine.html", aliases: ["love story", "love magazine", "our love story", "couple magazine", "relationship story", "romantic magazine"] },
    { id: "memory-wedding", kind: "memory", title: "Wedding Edition", category: "Wedding Edition", selector: "#wedding-magazine", href: "wedding-magazine.html", aliases: ["wedding", "wedding magazine", "wedding edition", "wedding memories", "marriage memories"] },
    { id: "memory-friendship", kind: "memory", title: "Friendship Edition", category: "Friendship Edition", selector: "#friendship-magazine", href: "friendship-magazine.html", aliases: ["friendship", "best friend", "friendship magazine", "best friend gift", "friends memories"] },
    { id: "memory-just-because", kind: "memory", title: "Just Because Edition", category: "Just Because Edition", selector: "#just-because-magazine", href: "just-because-magazine.html", aliases: ["just because", "random gift", "surprise magazine", "special memories", "unexpected gift"] },
    { id: "wish-date", kind: "wishverse", title: "Date Invitation", category: "Date Invitation", selector: "#date-invitation", href: "wishverse.html#date-invitation", aliases: ["date invitation", "date invite", "ask for a date", "dinner invitation", "romantic date"] },
    { id: "wish-birthday", kind: "wishverse", title: "Birthday Celebration", category: "Birthday Celebration", selector: "#birthday-celebration", href: "wishverse.html#birthday-celebration", aliases: ["birthday wish", "birthday surprise", "birthday website", "birthday celebration", "birthday greeting"] },
    { id: "wish-gift", kind: "wishverse", title: "Gift Presentation", category: "Gift Presentation", selector: "#gift-presentation", href: "wishverse.html#gift-presentation", aliases: ["gift", "gift presentation", "surprise gift", "present", "digital gift", "gift reveal"] },
    { id: "wish-proposal", kind: "wishverse", title: "Marriage Proposal", category: "Marriage Proposal", selector: "#marriage-proposal", href: "wishverse.html#marriage-proposal", aliases: ["marriage proposal", "propose", "proposal", "will you marry me", "wedding proposal"] },
    { id: "wish-love", kind: "wishverse", title: "Love Confession", category: "Love Confession", selector: "#love-confession", href: "wishverse.html#love-confession", aliases: ["love confession", "confess love", "i love you", "express love", "romantic confession"] },
    { id: "wish-anniversary", kind: "wishverse", title: "Anniversary Surprise", category: "Anniversary Surprise", selector: "#anniversary-surprise", href: "wishverse.html#anniversary-surprise", aliases: ["anniversary wish", "anniversary surprise", "anniversary celebration", "anniversary greeting"] },
    { id: "wish-apology", kind: "wishverse", title: "Apology & Make Up", category: "Apology & Make Up", selector: "#apology-makeup", href: "wishverse.html#apology-makeup", aliases: ["sorry", "apology", "say sorry", "forgive me", "make up", "reconciliation"] },
    { id: "wish-signature", kind: "wishverse", title: "The Signature Wish", category: "The Signature Wish", selector: "#signature-wish", href: "wishverse-signature-wish.html", aliases: ["signature wish", "custom digital wish", "premium custom experience", "personalized digital experience"] }
  ];

  var allIds = items.map(function (item) { return item.id; });
  var generalTerms = {
    "3d magazine": allIds.slice(0, 6), "digital magazine": allIds.slice(0, 6), "interactive magazine": allIds.slice(0, 6), "personalized magazine": allIds.slice(0, 6), "memory magazine": allIds.slice(0, 6), "the memory edition": allIds.slice(0, 6), "memory editions": allIds.slice(0, 6),
    "romantic gift": ["memory-love-story", "wish-love", "wish-proposal", "wish-anniversary"],
    "gift for girlfriend": ["memory-birthday", "memory-love-story", "wish-gift", "wish-love"], "gift for boyfriend": ["memory-birthday", "memory-love-story", "wish-gift", "wish-love"],
    "gift for wife": ["memory-anniversary", "memory-wedding", "wish-anniversary"], "gift for husband": ["memory-anniversary", "memory-wedding", "wish-anniversary"],
    "surprise for her": ["wish-birthday", "wish-gift", "wish-love"], "surprise for him": ["wish-birthday", "wish-gift", "wish-love"],
    "digital gift": allIds, "personalized gift": allIds, "unique gift": allIds, "online gift": allIds, "special occasion": allIds,
    "digital wish": allIds.slice(6), "digital wishes": allIds.slice(6), "personalized digital wish": allIds.slice(6),
    "the wishverse": allIds.slice(6)
  };
  Object.keys(generalTerms).forEach(function (phrase) {
    items.forEach(function (item) { if (generalTerms[phrase].indexOf(item.id) !== -1) item.aliases.push(phrase); });
  });

  window.HeartBiographySearch = {
    find: function (query) { return matchedItems(query).map(function (item) { return { id: item.id, title: item.title, kind: item.kind }; }); }
  };

  var trigger = document.querySelector(".site-search-trigger");
  if (!trigger) return;
  var overlay = document.createElement("div");
  overlay.className = "site-search-overlay";
  overlay.hidden = true;
  overlay.innerHTML = '<section class="site-search-dialog" role="dialog" aria-modal="false" aria-label="Search Heart’s Biography products"><form class="site-search-form" role="search"><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.2"></circle><path d="m15.3 15.3 5 5"></path></svg><input class="site-search-input" type="search" autocomplete="off" placeholder="Search magazines, wishes, or occasions" aria-label="Search products"><button class="site-search-clear" type="button" aria-label="Clear search">×</button><button class="site-search-close" type="button" aria-label="Close search">Close</button></form><p class="site-search-status" aria-live="polite">Search across The Memory Editions and The WishVerse.</p><div class="site-search-results" hidden></div></section>';
  document.body.appendChild(overlay);
  var dialog = overlay.querySelector(".site-search-dialog");
  var form = overlay.querySelector(".site-search-form");
  var input = overlay.querySelector(".site-search-input");
  var status = overlay.querySelector(".site-search-status");
  var results = overlay.querySelector(".site-search-results");
  var clearButton = overlay.querySelector(".site-search-clear");
  var closeButton = overlay.querySelector(".site-search-close");
  var templatesPromise = null;
  var changeSequence = 0;
  var debounceTimer = 0;
  var previousFocus = null;

  function normalize(value) {
    return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’']/g, "").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ")
      .replace(/\bfreindship\b|\bfrendship\b/g, "friendship").replace(/\bbirtday\b/g, "birthday").replace(/\banniversery\b/g, "anniversary").replace(/\bweding\b/g, "wedding").replace(/\bmagzine\b|\bmagazin\b/g, "magazine").replace(/\bwishes\b/g, "wish");
  }
  function searchScore(item, query) {
    var title = normalize(item.title), aliases = item.aliases.map(normalize);
    if (title === query) return 1200;
    if (generalTerms[query] && generalTerms[query].indexOf(item.id) !== -1) return 1100 + (generalTerms[query].length - generalTerms[query].indexOf(item.id));
    if (aliases.indexOf(query) !== -1) return 1100;
    if (title.indexOf(query) !== -1) return 950;
    if (aliases.some(function (alias) { return alias.indexOf(query) !== -1; })) return 850;
    var words = query.split(" ").filter(Boolean);
    if (words.length === 1 && aliases.some(function (alias) { return query.indexOf(alias) !== -1; })) return 800;
    var phrases = [title].concat(aliases);
    if (words.length > 1 && phrases.some(function (phrase) { var phraseWords = phrase.split(" "); return words.every(function (word) { return phraseWords.indexOf(word) !== -1; }); })) return 650 + words.length;
    var haystack = normalize(item.title + " " + item.aliases.join(" "));
    if (words.length === 1 && words[0].length > 1 && haystack.split(" ").some(function (word) { return word.indexOf(words[0]) === 0; })) return 500;
    return 0;
  }
  function matchedItems(query) {
    var normalized = normalize(query), seen = Object.create(null);
    return items.map(function (item, index) { return { item: item, index: index, score: searchScore(item, normalized) }; })
      .filter(function (entry) { if (!entry.score || seen[entry.item.id]) return false; seen[entry.item.id] = true; return true; })
      .sort(function (a, b) { return b.score - a.score || a.index - b.index; }).map(function (entry) { return entry.item; });
  }
  function loadTemplateData() {
    if (templatesPromise) return templatesPromise;
    templatesPromise = Promise.all([fetch("editions.html").then(function (response) { if (!response.ok) throw new Error("Could not load magazine catalogue"); return response.text(); }), fetch("wishverse.html").then(function (response) { if (!response.ok) throw new Error("Could not load WishVerse catalogue"); return response.text(); })]).then(function (html) {
      var parser = new DOMParser();
      var editionDoc = parser.parseFromString(html[0], "text/html");
      var wishDoc = parser.parseFromString(html[1], "text/html");
      function stylesheetData(doc, allowed) {
        var inline = Array.prototype.map.call(doc.querySelectorAll("style"), function (style) { return style.textContent; });
        var urls = Array.prototype.map.call(doc.querySelectorAll('link[rel="stylesheet"]'), function (link) { return link.getAttribute("href"); }).filter(function (href) { return allowed.some(function (name) { return href.indexOf(name) !== -1; }); });
        return Promise.all([Promise.resolve(inline.join("\n"))].concat(urls.map(function (href) { return fetch(new URL(href, window.location.href)).then(function (response) { if (!response.ok) throw new Error("Could not load catalogue styling"); return response.text(); }); })));
      }
      return Promise.all([stylesheetData(editionDoc, ["edition-category-cards.css", "category-card-type.css"]), stylesheetData(wishDoc, ["wishverse.css", "wishverse-category-cards.css", "category-card-type.css"])]).then(function (styles) {
        var templates = { memory: {}, wishverse: {}, styles: { memory: styles[0], wishverse: styles[1] } };
        items.forEach(function (item) {
          var doc = item.kind === "memory" ? editionDoc : wishDoc;
          var source = doc.querySelector(item.selector);
          if (source) templates[item.kind][item.id] = source.cloneNode(true);
        });
        return templates;
      });
    });
    return templatesPromise;
  }
  function makeArticle(template, item) {
    var article = document.createElement("article");
    article.className = template.className;
    article.id = template.id;
    article.setAttribute("role", "button");
    article.setAttribute("tabindex", "0");
    article.setAttribute("aria-label", "Quick preview " + item.title);
    if (item.kind === "wishverse") article.setAttribute("aria-pressed", "false");
    while (template.firstChild) article.appendChild(template.firstChild);
    var oldAction = article.querySelector(item.kind === "memory" ? ".explore" : ".category-explore");
    var actions = document.createElement("div");
    actions.className = item.kind === "memory" ? "occasion-actions" : "search-mini-actions";
    var exploreLink = document.createElement("a");
    exploreLink.className = item.kind === "memory" ? "explore search-mini-explore" : "category-explore search-mini-explore";
    exploreLink.href = item.href;
    exploreLink.textContent = "Explore / Customize →";
    var previewButton = document.createElement("button");
    previewButton.className = "search-mini-preview";
    previewButton.type = "button";
    previewButton.textContent = "Quick Preview";
    previewButton.addEventListener("click", function (event) { event.stopPropagation(); if (window.HeartBiographyQuickPreview) window.HeartBiographyQuickPreview.openSearchPreview(article, previewItem(item, article, templates.styles[item.kind]), previewButton); });
    if (item.kind === "memory") {
      if (oldAction) oldAction.replaceWith(actions);
      else article.appendChild(actions);
      actions.appendChild(exploreLink);
      actions.appendChild(previewButton);
    } else {
      if (oldAction) oldAction.replaceWith(exploreLink);
      var inner = article.querySelector(".wish-category-card") || article;
      var categoryActions = document.createElement("div"); categoryActions.className = "search-mini-actions";
      categoryActions.appendChild(exploreLink); categoryActions.appendChild(previewButton); inner.appendChild(categoryActions);
    }
    function openPreview() { if (window.HeartBiographyQuickPreview) window.HeartBiographyQuickPreview.openSearchPreview(article, previewItem(item, article, templates.styles[item.kind]), article); }
    article.addEventListener("click", function (event) { if (event.target.closest("a,button")) return; openPreview(); });
    article.addEventListener("keydown", function (event) { if (event.target !== article || (event.key !== "Enter" && event.key !== " ")) return; event.preventDefault(); openPreview(); });
    return article;
  }
  function previewItem(item, article, styles) {
    var descNode = article.querySelector("p");
    return { kind: item.kind, category: item.category, categoryKey: item.kind === "memory" ? item.id.replace("memory-", "") : "", title: item.title, description: descNode && descNode.textContent || "A personalized experience created for a meaningful moment.", href: item.href, artNode: article, styles: styles };
  }
  function decorateShadow(shadow, item, styles, article) {
    styles.forEach(function (css) { var style = document.createElement("style"); style.textContent = css.replace(/:root/g, ":host"); shadow.appendChild(style); });
    var compact = document.createElement("style");
    compact.textContent = item.kind === "memory"
      ? ".occasion-grid{display:block;width:100%;margin:0}.occasion-grid .occasion-card{width:100%;height:auto;min-height:0;padding:11px;border-radius:15px;cursor:pointer}.occasion-grid .book-scene{height:86px;margin:4px auto}.occasion-grid .book{transform:scale(.72) rotate(-5deg) rotateY(-11deg)}.occasion-grid .occasion-card h2{font-size:17px;margin:2px 0 5px}.occasion-grid .occasion-card p{font-size:10px;min-height:0}.occasion-grid .occasion-actions{gap:6px}.occasion-grid .occasion-card .occasion-actions .explore{font-size:9px}.occasion-grid .search-mini-preview{display:inline-flex;align-items:center;justify-content:center;padding:6px 8px;border:1px solid rgba(255,235,203,.42);border-radius:999px;background:rgba(255,248,240,.1);color:var(--card-accent);font:700 9px/1.2 'DM Sans',Arial,sans-serif;white-space:nowrap;cursor:pointer}.occasion-grid .live-demo{display:none}"
      : ".wish-category-grid.search-mini-grid{display:block;width:100%;margin:0}.wish-category-grid .wish-category{width:100%;height:auto;min-height:0;padding:10px;border-radius:15px;cursor:pointer}.wish-category-grid .category-art{height:76px;margin:5px 0 7px}.wish-category-grid .category-number{font-size:9px}.wish-category-grid .wish-category h3{font-size:16px}.wish-category-grid .wish-category h4{font-size:15px}.wish-category-grid .wish-category p{font-size:10px;line-height:1.35}.wish-category-grid .search-mini-actions{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-top:8px;padding-top:7px;border-top:1px solid rgba(255,255,255,.2)}.wish-category-grid .search-mini-explore{font-size:9px;text-decoration:none}.wish-category-grid .search-mini-preview{padding:6px 8px;border:1px solid rgba(226,199,146,.5);border-radius:999px;background:rgba(12,42,123,.12);color:#0c2a7b;font:700 9px/1.2 'DM Sans',Arial,sans-serif;white-space:nowrap;cursor:pointer} .wish-category-grid .category-art:before,.wish-category-grid .category-art:after{display:none!important}";
    shadow.appendChild(compact);
    var holder = document.createElement("div"); holder.className = "search-mini-grid " + (item.kind === "memory" ? "occasion-grid" : "wish-category-grid");
    holder.appendChild(article); shadow.appendChild(holder);
  }
  function makeResultCard(item, templates) {
    var template = templates[item.kind][item.id];
    if (!template) return null;
    var host = document.createElement("article"); host.className = "site-search-result-card"; host.tabIndex = 0;
    var shadow = host.attachShadow({ mode: "open" });
    decorateShadow(shadow, item, templates.styles[item.kind], makeArticle(template.cloneNode(true), item));
    return host;
  }
  function showResults(query, sequence) {
    status.hidden = false; status.textContent = "Searching the catalogue…"; results.hidden = true; results.textContent = "";
    loadTemplateData().then(function (templates) {
      if (sequence !== changeSequence || normalize(input.value) !== normalize(query)) return;
      var matches = matchedItems(query);
      results.textContent = "";
      if (!matches.length) { status.textContent = "No matching products found. Try another keyword."; return; }
      matches.forEach(function (item) { var card = makeResultCard(item, templates); if (card) results.appendChild(card); });
      status.hidden = true; results.hidden = false;
    }).catch(function () { if (sequence === changeSequence) { status.hidden = false; status.textContent = "Search is temporarily unavailable. Please try again."; results.hidden = true; } });
  }
  function updateSearch() {
    var query = input.value.trim();
    changeSequence += 1;
    window.clearTimeout(debounceTimer);
    if (!query) { results.textContent = ""; results.hidden = true; status.hidden = false; status.textContent = "Search across The Memory Editions and The WishVerse."; return; }
    var sequence = changeSequence;
    debounceTimer = window.setTimeout(function () { showResults(query, sequence); }, 120);
  }
  function openSearch() {
    previousFocus = trigger;
    var header = trigger.closest("header");
    if (header) {
      var menuToggle = header.querySelector(".mobile-menu-toggle");
      if (header.classList.contains("is-mobile-menu-open") && menuToggle) menuToggle.click();
      var rect = header.getBoundingClientRect(); dialog.style.top = Math.min(rect.bottom + 8, window.innerHeight - 120) + "px";
    }
    overlay.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    window.requestAnimationFrame(function () { input.focus(); });
  }
  function closeSearch() { overlay.hidden = true; trigger.setAttribute("aria-expanded", "false"); if (previousFocus) previousFocus.focus(); }
  trigger.setAttribute("aria-expanded", "false");
  trigger.addEventListener("click", function () { if (overlay.hidden) openSearch(); else closeSearch(); });
  form.addEventListener("submit", function (event) { event.preventDefault(); updateSearch(); });
  input.addEventListener("input", updateSearch);
  clearButton.addEventListener("click", function () { input.value = ""; updateSearch(); input.focus(); });
  closeButton.addEventListener("click", closeSearch);
  overlay.addEventListener("click", function (event) { if (event.target === overlay) closeSearch(); });
  document.addEventListener("click", function (event) { if (!overlay.hidden && !dialog.contains(event.target) && event.target !== trigger && !trigger.contains(event.target)) closeSearch(); });
  document.addEventListener("keydown", function (event) { if (event.key === "Escape" && !overlay.hidden) closeSearch(); });
}());
