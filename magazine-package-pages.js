(function () {
  "use strict";
  var config = window.HEARTS_BIOGRAPHY_MAGAZINE_PACKAGES || {};
  var category = document.body.getAttribute("data-magazine-category") || "birthday";
  var packages = Array.isArray(config.packages) ? config.packages : [];
  var grid = document.getElementById("magazine-package-grid");
  var status = document.getElementById("package-selection-status");
  var draftKey = "hbMagazineDraft:" + category;
  var savedDraft = {};
  try { savedDraft = JSON.parse(window.localStorage.getItem(draftKey) || "{}"); } catch (error) { savedDraft = {}; }
  if (category === "love-story" && !savedDraft.category) {
    try {
      var legacyDraft = JSON.parse(window.localStorage.getItem("hbMagazineDraft:valentines") || "{}");
      if (legacyDraft && Object.keys(legacyDraft).length) {
        savedDraft = Object.assign({}, legacyDraft, { category: "love-story", categoryName: document.body.getAttribute("data-magazine-category-name") });
        window.localStorage.setItem(draftKey, JSON.stringify(savedDraft));
      }
    } catch (error) { /* Legacy data remains untouched if storage is unavailable. */ }
  }
  var savedHardCopySelections = savedDraft.hardCopySelections || {};
  var hardCopySelections = {};
  packages.forEach(function (pkg) {
    hardCopySelections[pkg.id] = savedHardCopySelections[pkg.id] === "digital-plus-hard-copy" ? "digital-plus-hard-copy" : "digital-only";
  });
  var selectedPackageId = "";

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function priceFor(pkg, hardCopySelection) {
    var value = priceValue(pkg, hardCopySelection);
    if (typeof value !== "number" || !isFinite(value) || value < 0) {
      var extra = hardCopyChargeFor(pkg, hardCopySelection);
      return (config.priceComingSoon || "Price Coming Soon") + (extra ? " + " + (config.currency || "BDT ") + formatAmount(extra) + " Hard Copy" : "");
    }
    return (config.currency || "BDT ") + new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
  }
  function priceValue(pkg, hardCopySelection) {
    var overrides = config.categoryPriceOverrides || {};
    var categoryPrices = overrides[category] || {};
    var value = Object.prototype.hasOwnProperty.call(categoryPrices, pkg.id) ? categoryPrices[pkg.id] : (config.prices || {})[pkg.id];
    var extra = hardCopyChargeFor(pkg, hardCopySelection);
    if (extra) {
      if (typeof value !== "number" || !isFinite(value) || value < 0) return null;
      return value + extra;
    }
    return value;
  }
  function formatAmount(value) { return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value); }
  function hardCopyChargeFor(pkg, selection) { return pkg.hardCopyOptional && selection === "digital-plus-hard-copy" && typeof pkg.hardCopyExtraCost === "number" ? pkg.hardCopyExtraCost : 0; }
  function hardCopySelectionFor(pkg) { return pkg.hardCopyOptional ? (hardCopySelections[pkg.id] || "digital-only") : "not-included"; }
  function hardCopyDescription(pkg, selection) {
    selection = selection || hardCopySelectionFor(pkg);
    if (pkg.hardCopyIncluded) return "Hard Copy Included — Physical A4 (no extra charge)";
    if (pkg.hardCopyOptional && selection === "digital-plus-hard-copy") return "Digital + Hard Copy · " + (config.hardCopyPaperGsm || 150) + " GSM Paper";
    if (pkg.hardCopyOptional) return "Digital Only — no Hard Copy charge";
    return "No Hard Copy";
  }
  function packageFeatures(pkg, listType) {
    var items = (listType === "included" ? pkg.included : pkg.notIncluded || []).slice();
    if (pkg.hardCopyOptional && hardCopySelectionFor(pkg) === "digital-plus-hard-copy") {
      if (listType === "included") items.push("Physical A4 Hard Copy — " + (config.hardCopyPaperGsm || 150) + " GSM Paper");
      else items = items.filter(function (item) { return item !== "Physical A4 Hard Copy (Optional Add-On)"; });
    }
    return items;
  }
  function loadDraft() {
    try { return JSON.parse(window.localStorage.getItem(draftKey) || "{}"); } catch (error) { return {}; }
  }
  function saveSelectedPackage(pkg) {
    var selection = hardCopySelectionFor(pkg);
    var value = priceValue(pkg, selection);
    var priceNumber = typeof value === "number" && isFinite(value) && value >= 0 ? value : null;
    var draft = loadDraft();
    draft.category = category;
    draft.categoryPage = window.location.pathname.split("/").pop();
    draft.categoryName = document.body.getAttribute("data-magazine-category-name");
    draft.packageId = pkg.id;
    draft.packageName = pkg.name;
    draft.packageSubtitle = pkg.subtitle;
    draft.packageDescription = pkg.description;
    draft.packagePages = pkg.pageCount;
    draft.packageIncluded = packageFeatures(pkg, "included");
    draft.packageNotIncluded = packageFeatures(pkg, "notIncluded");
    draft.hardCopySelection = selection;
    draft.hardCopySelections = Object.assign({}, hardCopySelections);
    draft.hardCopyIncluded = !!pkg.hardCopyIncluded || (pkg.hardCopyOptional && selection === "digital-plus-hard-copy");
    draft.hardCopyExtraCost = hardCopyChargeFor(pkg, selection);
    draft.hardCopyCharge = draft.hardCopyExtraCost;
    draft.packagePrice = priceNumber;
    draft.packagePriceText = priceNumber === null ? priceFor(pkg, selection).replace(config.priceComingSoon || "Price Coming Soon", "Price To Be Confirmed") : priceFor(pkg, selection);
    try { window.localStorage.setItem(draftKey, JSON.stringify(draft)); } catch (error) { /* Package selection remains available for this page view. */ }
    var next = document.getElementById("continue-to-personalize");
    next.href = "magazine-personalize.html?category=" + encodeURIComponent(category) + "&package=" + encodeURIComponent(pkg.id) + "&hardCopy=" + encodeURIComponent(selection);
  }
  function featureList(list, items, icon, modifier) {
    (items || []).forEach(function (feature) {
      var li = el("li", "feature-item" + (modifier ? " " + modifier : ""));
      var mark = el("span", "feature-mark", icon);
      mark.setAttribute("aria-hidden", "true");
      li.appendChild(mark);
      li.appendChild(el("span", "feature-text", feature));
      list.appendChild(li);
    });
  }
  function makePackageCard(pkg, index) {
    var card = el("article", "package-card package-card-" + pkg.id + (pkg.popular ? " is-popular" : ""));
    card.setAttribute("data-package-card", pkg.id);
    if (pkg.popular) card.appendChild(el("span", "popular-badge", "MOST POPULAR"));
    card.appendChild(el("span", "package-number", "PACKAGE 0" + (index + 1)));
    card.appendChild(el("h2", "package-name", pkg.name));
    card.appendChild(el("p", "package-subtitle", pkg.subtitle));
    card.appendChild(el("span", "package-page-count", pkg.pageCount));
    card.appendChild(el("p", "package-description", pkg.description));
    card.appendChild(el("p", "package-hardcopy-status", hardCopyDescription(pkg)));
    if (pkg.hardCopyOptional) {
      var hardCopyFieldset = el("fieldset", "hardcopy-options");
      hardCopyFieldset.setAttribute("aria-label", "Choose a format for the " + pkg.name + " package");
      hardCopyFieldset.appendChild(el("legend", "feature-heading", "Choose Your Format"));
      [["digital-only", "Digital Only", "No additional charge"], ["digital-plus-hard-copy", "Digital + Hard Copy", (config.hardCopyPaperGsm || 150) + " GSM Paper · +" + (config.currency || "BDT ") + formatAmount(pkg.hardCopyExtraCost)]].forEach(function (choice) {
        var label = el("label", "hardcopy-option");
        if (hardCopySelectionFor(pkg) === choice[0]) label.classList.add("is-selected");
        var input = el("input");
        input.type = "radio";
        input.name = "hardCopySelection-" + pkg.id;
        input.value = choice[0];
        input.checked = hardCopySelectionFor(pkg) === choice[0];
        input.setAttribute("data-hardcopy-option", choice[0]);
        input.addEventListener("change", function () {
          if (!input.checked) return;
          hardCopySelections[pkg.id] = input.value;
          Array.prototype.forEach.call(hardCopyFieldset.querySelectorAll(".hardcopy-option"), function (option) {
            option.classList.toggle("is-selected", option.querySelector("input").checked);
          });
          var hardCopyStatus = card.querySelector(".package-hardcopy-status");
          if (hardCopyStatus) hardCopyStatus.textContent = hardCopyDescription(pkg);
          var choiceDraft = loadDraft();
          choiceDraft.hardCopySelections = Object.assign({}, choiceDraft.hardCopySelections || {}, hardCopySelections);
          try { window.localStorage.setItem(draftKey, JSON.stringify(choiceDraft)); } catch (error) { /* The current selection remains active. */ }
          var priceNode = card.querySelector(".package-price");
          if (priceNode) priceNode.textContent = priceFor(pkg, hardCopySelectionFor(pkg));
          var includedList = card.querySelector(".included-list");
          var excludedList = card.querySelector(".excluded-list");
          if (includedList) { includedList.replaceChildren(); featureList(includedList, packageFeatures(pkg, "included"), "✓"); }
          if (excludedList) { excludedList.replaceChildren(); featureList(excludedList, packageFeatures(pkg, "notIncluded"), "−", "excluded-item"); }
          var excludedSection = card.querySelector(".not-included-section");
          if (excludedSection && excludedList) excludedSection.hidden = !packageFeatures(pkg, "notIncluded").length;
          if (selectedPackageId === pkg.id) {
            status.textContent = pkg.name + " · " + pkg.subtitle + " selected. " + hardCopyDescription(pkg) + " · " + priceFor(pkg, hardCopySelectionFor(pkg));
            renderSelected(pkg);
            saveSelectedPackage(pkg);
          }
        });
        label.appendChild(input);
        var labelCopy = el("span", "hardcopy-option-label");
        labelCopy.appendChild(el("strong", "hardcopy-option-title", choice[1]));
        labelCopy.appendChild(el("small", "hardcopy-option-detail", choice[2]));
        label.appendChild(labelCopy);
        hardCopyFieldset.appendChild(label);
      });
      card.appendChild(hardCopyFieldset);
    }
    var includedSection = el("section", "package-feature-section");
    includedSection.appendChild(el("h3", "feature-heading", "What's Included"));
    var included = el("ul", "package-feature-list included-list");
    featureList(included, packageFeatures(pkg, "included"), "✓");
    includedSection.appendChild(included);
    card.appendChild(includedSection);
    if (pkg.notIncluded && pkg.notIncluded.length) {
      var excludedSection = el("section", "package-feature-section not-included-section");
      excludedSection.appendChild(el("h3", "feature-heading", "Not Included"));
      var excluded = el("ul", "package-feature-list excluded-list");
      featureList(excluded, packageFeatures(pkg, "notIncluded"), "−", "excluded-item");
      excludedSection.appendChild(excluded);
      card.appendChild(excludedSection);
    }
    var priceArea = el("div", "package-price-area");
    priceArea.appendChild(el("span", "package-price-label", "PACKAGE PRICE"));
    priceArea.appendChild(el("strong", "package-price", priceFor(pkg, hardCopySelectionFor(pkg))));
    card.appendChild(priceArea);
    var button = el("button", "package-select");
    button.type = "button";
    button.setAttribute("data-package-option", pkg.id);
    button.setAttribute("data-package-name", pkg.name);
    button.setAttribute("aria-pressed", "false");
    button.appendChild(el("span", "package-action-text", "SELECT PACKAGE"));
    var arrow = el("span", "package-action-arrow", "↗");
    arrow.setAttribute("aria-hidden", "true");
    button.appendChild(arrow);
    button.addEventListener("click", function () { selectPackage(button); });
    card.appendChild(button);
    card.addEventListener("click", function (event) {
      if (event.target.closest && event.target.closest("[data-package-option], .hardcopy-options")) return;
      selectPackage(button);
    });
    return card;
  }
  function renderPackages() {
    grid.replaceChildren();
    packages.forEach(function (pkg, index) { grid.appendChild(makePackageCard(pkg, index)); });
  }
  function hasFeature(pkg, feature) {
    return (pkg.included || []).some(function (item) { return item === feature; });
  }
  function defaultMusicCount(pkg) {
    var item = (pkg.included || []).find(function (feature) { return /Default Music Tracks/i.test(feature); });
    var match = item && item.match(/(\d+)\s+Default Music Tracks/i);
    return match ? Number(match[1]) : 0;
  }
  function comparisonRows() {
    return [
      { feature: "Magazine Pages", values: packages.map(function (pkg) { var match = String(pkg.pageCount || "").match(/\d+/); return match ? match[0] : "—"; }) },
      { feature: "3D Flipbook", values: packages.map(function (pkg) { return hasFeature(pkg, "Interactive 3D Flipbook") ? "Yes" : "No"; }) },
      { feature: "Physical A4 Hard Copy", values: packages.map(function (pkg) { return pkg.hardCopyOptional ? "Optional" : (pkg.hardCopyIncluded ? "Included" : "No"); }) },
      { feature: "QR Code", values: packages.map(function (pkg) { return pkg.qrCode ? "Included" : "No"; }) },
      { feature: "Custom Text", values: packages.map(function (pkg) { return pkg.customText ? "Included" : "No"; }) },
      { feature: "Cinematic Opening", values: packages.map(function (pkg) { return hasFeature(pkg, "Cinematic Opening") ? "Yes" : "No"; }) },
      { feature: "Custom Music", values: packages.map(function (pkg) { return String(pkg.customMusicTracks || 0); }) },
      { feature: "Default Music", values: packages.map(function (pkg) { return String(defaultMusicCount(pkg)); }) },
      { feature: "Total Music", values: packages.map(function (pkg) { return String((pkg.customMusicTracks || 0) + defaultMusicCount(pkg)); }) },
      { feature: "About Magazine", values: packages.map(function (pkg) { return hasFeature(pkg, "About the Magazine Section") ? "Yes" : "No"; }) },
      { feature: "About Person", values: packages.map(function (pkg) { return pkg.aboutPerson ? "Yes" : "No"; }) },
      { feature: "Music Player", values: packages.map(function (pkg) { return hasFeature(pkg, "Interactive Music Player with Song Names") ? "Yes" : "No"; }) },
      { feature: "PDF Slide Mode", values: packages.map(function (pkg) { return pkg.pdfSlideMode ? "Yes" : "No"; }) },
      { feature: "PDF Scroll Mode", values: packages.map(function (pkg) { return pkg.pdfScrollMode ? "Yes" : "No"; }) },
      { feature: "Mobile Support", values: packages.map(function (pkg) { return hasFeature(pkg, "Mobile & Desktop Support") ? "Yes" : "No"; }) },
      { feature: "Desktop Support", values: packages.map(function (pkg) { return hasFeature(pkg, "Mobile & Desktop Support") ? "Yes" : "No"; }) }
    ];
  }
  function renderComparison() {
    var tbody = document.getElementById("package-comparison-body");
    tbody.replaceChildren();
    comparisonRows().forEach(function (row) {
      var tr = el("tr");
      var th = el("th", "comparison-feature", row.feature);
      th.setAttribute("scope", "row");
      tr.appendChild(th);
      row.values.forEach(function (value) { tr.appendChild(el("td", "comparison-value", value)); });
      tbody.appendChild(tr);
    });
  }
  function renderSelected(pkg) {
    var summary = document.getElementById("selected-package-summary");
    summary.hidden = !pkg;
    if (!pkg) return;
    document.getElementById("selected-package-heading").textContent = pkg.name + " — " + pkg.subtitle;
    document.getElementById("selected-package-price").textContent = priceFor(pkg, hardCopySelectionFor(pkg));
    document.getElementById("selected-package-pages").textContent = pkg.pageCount;
    var hardCopySummary = document.getElementById("selected-package-hardcopy");
    if (hardCopySummary) hardCopySummary.textContent = "Hard Copy: " + hardCopyDescription(pkg);
    var included = document.getElementById("selected-package-included");
    included.replaceChildren();
    featureList(included, packageFeatures(pkg, "included"), "✓");
    var excludedWrap = document.getElementById("selected-package-not-included-wrap");
    var excluded = document.getElementById("selected-package-not-included");
    excluded.replaceChildren();
    var notIncluded = packageFeatures(pkg, "notIncluded");
    featureList(excluded, notIncluded, "−", "excluded-item");
    excludedWrap.hidden = !notIncluded.length;
  }
  function selectPackage(button) {
    var selectedId = button.getAttribute("data-package-option");
    var selected = packages.find(function (pkg) { return pkg.id === selectedId; });
    selectedPackageId = selectedId;
    Array.prototype.forEach.call(grid.querySelectorAll(".package-card"), function (card) {
      var active = card.getAttribute("data-package-card") === selectedId;
      card.classList.toggle("is-selected", active);
      var action = card.querySelector("[data-package-option]");
      action.setAttribute("aria-pressed", active ? "true" : "false");
      action.querySelector(".package-action-text").textContent = active ? "PACKAGE SELECTED" : "SELECT PACKAGE";
    });
    if (selected) {
      status.textContent = selected.name + " · " + selected.subtitle + " selected. " + hardCopyDescription(selected) + " · " + priceFor(selected, hardCopySelectionFor(selected));
      renderSelected(selected);
      saveSelectedPackage(selected);
      var next = document.getElementById("continue-to-personalize");
      next.hidden = false;
    }
  }

  renderPackages();
  renderComparison();
}());


