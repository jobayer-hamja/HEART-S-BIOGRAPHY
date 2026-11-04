(function () {
  "use strict";
  var config = window.HEARTS_BIOGRAPHY_MAGAZINE_CONFIG || {};
  var categories = [
    { id: "birthday", slug: "birthday", label: "Birthday Magazine", occasionDate: true, dateLabel: "Birthday date", helper: "A birthday keepsake made personal to their story." },
    { id: "anniversary", slug: "anniversary", label: "Anniversary Magazine", occasionDate: true, dateLabel: "Anniversary date", couple: true, helper: "Celebrate the two of you and the chapters you share." },
    { id: "valentines", slug: "valentines", label: "Valentine’s Day Magazine", occasionDate: true, dateLabel: "Celebration date", helper: "A personalized issue for the person who has your heart." },
    { id: "wedding", slug: "wedding", label: "Wedding Magazine", occasionDate: true, dateLabel: "Wedding date", couple: true, helper: "Tell the story of your wedding day and the people who made it yours." },
    { id: "justBecause", slug: "just-because", label: "Just Because Magazine", occasionDate: false, dateLabel: "", customTheme: true, helper: "Create a magazine for any story, person, place, or idea—no occasion needed." }
  ];
  var state = { category: categories[0], packageId: "", files: [] };
  var categoryBySlug = {};
  categories.forEach(function (category) { categoryBySlug[category.slug] = category; });
  var configPackages = Array.isArray(config.packages) ? config.packages : [];

  function byId(id) { return document.getElementById(id); }
  function escapeText(value) { return String(value == null ? "" : value); }
  function priceFor(category, pkg) {
    var override = (((config.categoryOverrides || {})[category.id] || {})[pkg.id]) || {};
    return Object.assign({}, pkg, override);
  }
  function packageLabel(pkg) {
    if (typeof pkg.price === "number" && isFinite(pkg.price) && pkg.price >= 0) {
      return (config.currency || "") + new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(pkg.price);
    }
    return pkg.priceLabel || "Price to be confirmed";
  }
  function setPriceText() {
    var selected = state.packageId && configPackages.find(function (pkg) { return pkg.id === state.packageId; });
    var resolved = selected ? priceFor(state.category, selected) : null;
    var label = resolved ? packageLabel(resolved) : "Select a package to view its price";
    byId("selected-package-price").textContent = label;
    byId("summary-package-price").textContent = label;
    byId("summary-final-total").textContent = label;
    byId("summary-package").textContent = resolved ? resolved.name : "Not selected";
    byId("order-package").value = resolved ? resolved.name : "Not selected";
    byId("summary-features").replaceChildren();
    if (resolved && Array.isArray(resolved.includes) && resolved.includes.length) {
      resolved.includes.forEach(function (feature) {
        var li = document.createElement("li"); li.textContent = feature; byId("summary-features").appendChild(li);
      });
    } else {
      var li = document.createElement("li"); li.textContent = "Package features will be shown when configured."; byId("summary-features").appendChild(li);
    }
    byId("selected-package-name").textContent = resolved ? resolved.name : "Choose a package";
    updateOrderAvailability(resolved);
  }
  function packagesFor(category) {
    return configPackages.map(function (pkg) { return priceFor(category, pkg); });
  }
  function renderPackages() {
    var grid = byId("magazine-packages");
    grid.replaceChildren();
    byId("package-category-title").textContent = state.category.label;
    byId("category-helper").textContent = state.category.helper;
    packagesFor(state.category).forEach(function (pkg, index) {
      var card = document.createElement("article");
      card.className = "package-card" + (pkg.id === state.packageId ? " is-selected" : "");
      card.setAttribute("data-package-card", pkg.id);
      var number = document.createElement("span"); number.className = "package-number"; number.textContent = String(index + 1).padStart(2, "0");
      var title = document.createElement("h3"); title.textContent = pkg.name;
      var description = document.createElement("p"); description.className = "package-description"; description.textContent = pkg.description || "Package details will be announced soon.";
      var price = document.createElement("p"); price.className = "package-price"; price.textContent = packageLabel(pkg);
      var list = document.createElement("ul"); list.className = "package-features";
      if (Array.isArray(pkg.includes) && pkg.includes.length) pkg.includes.forEach(function (feature) { var li = document.createElement("li"); li.textContent = feature; list.appendChild(li); });
      else { var li = document.createElement("li"); li.textContent = "Features to be configured"; list.appendChild(li); }
      var button = document.createElement("button"); button.type = "button"; button.className = "package-select"; button.textContent = pkg.id === state.packageId ? "SELECTED" : "SELECT PACKAGE";
      button.setAttribute("aria-pressed", pkg.id === state.packageId ? "true" : "false");
      button.addEventListener("click", function () { state.packageId = pkg.id; renderPackages(); setPriceText(); updateUrl(); });
      card.append(number, title, description, list, price, button); grid.appendChild(card);
    });
    setPriceText();
  }
  function updateUrl() {
    var url = new URL(window.location.href);
    url.searchParams.set("category", state.category.slug);
    if (state.packageId) url.searchParams.set("package", state.packageId); else url.searchParams.delete("package");
    url.hash = "packages";
    window.history.replaceState({}, "", url.toString());
  }
  function setCategory(category, shouldScroll) {
    state.category = category;
    state.packageId = "";
    renderPackages();
    updateCategoryFields();
    updateUrl();
    if (shouldScroll) byId("packages").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function updateCategoryFields() {
    byId("order-category").value = state.category.label;
    byId("date-field").hidden = !state.category.occasionDate;
    byId("occasion-date").required = !!state.category.occasionDate;
    byId("occasion-date-label").textContent = state.category.dateLabel || "Occasion date";
    byId("couple-field").hidden = !state.category.couple;
    byId("custom-theme-field").hidden = !state.category.customTheme;
    byId("theme-field").hidden = !!state.category.customTheme;
    byId("magazine-order-form").elements.magazineTheme.required = !state.category.customTheme;
    byId("couple-names").required = !!state.category.couple;
    byId("custom-theme").required = !!state.category.customTheme;
    byId("recipient-label").textContent = state.category.couple ? "Recipient or couple’s name(s)" : "Recipient’s name";
  }
  function selectStep(step) {
    document.querySelectorAll("[data-order-panel]").forEach(function (panel) { panel.hidden = Number(panel.getAttribute("data-order-panel")) !== step; });
    document.querySelectorAll("[data-order-progress]").forEach(function (item) {
      var active = Number(item.getAttribute("data-order-progress")) === step;
      item.classList.toggle("is-active", active);
      item.classList.toggle("is-complete", Number(item.getAttribute("data-order-progress")) < step);
    });
    byId("magazine-order").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function validateForm() {
    var form = byId("magazine-order-form");
    if (!form.reportValidity()) return false;
    var phone = byId("customer-whatsapp");
    if (!/^[+0-9\s().-]{7,25}$/.test(phone.value.trim())) {
      phone.setCustomValidity("Enter a valid WhatsApp number, including country code."); phone.reportValidity(); phone.setCustomValidity(""); return false;
    }
    return true;
  }
  function fileSummary() {
    return state.files.length ? state.files.map(function (file) { return file.name + " (" + Math.max(1, Math.round(file.size / 1024)) + " KB)"; }).join("; ") : "No photos selected";
  }
  function formValues() {
    var form = byId("magazine-order-form");
    return {
      customer: form.elements.customerName.value.trim(), whatsapp: form.elements.customerWhatsApp.value.trim(), email: form.elements.customerEmail.value.trim(), recipient: form.elements.recipientName.value.trim(), date: form.elements.occasionDate.value || "Not applicable", theme: (state.category.customTheme ? form.elements.customTheme.value.trim() : form.elements.magazineTheme.value.trim()), couple: form.elements.coupleNames.value.trim(), story: form.elements.personalStory.value.trim(), message: form.elements.specialMessage.value.trim(), instructions: form.elements.orderInstructions.value.trim()
    };
  }
  function updateReview() {
    var data = formValues();
    var pkg = configPackages.find(function (item) { return item.id === state.packageId; });
    var resolved = pkg ? priceFor(state.category, pkg) : null;
    var rows = [
      ["Customer", data.customer], ["WhatsApp", data.whatsapp], ["Email", data.email || "Not provided"], ["Magazine", state.category.label], ["Package", resolved ? resolved.name : "Not selected"], ["Package features", resolved && resolved.includes && resolved.includes.length ? resolved.includes.join("; ") : "Features to be configured"], ["Recipient", data.recipient], ["Couple names", data.couple || "Not applicable"], ["Occasion date", data.date], ["Preferred theme", data.theme], ["Personal story / memories", data.story], ["Special message", data.message], ["Additional instructions", data.instructions || "None"], ["Photo uploads", fileSummary()], ["Package price", resolved ? packageLabel(resolved) : "Not configured"], ["Final total", resolved ? packageLabel(resolved) : "Not configured"]
    ];
    var dl = byId("order-review-details"); dl.replaceChildren();
    rows.forEach(function (row) { var wrap = document.createElement("div"); var dt = document.createElement("dt"); dt.textContent = row[0]; var dd = document.createElement("dd"); dd.textContent = row[1] || "—"; wrap.append(dt, dd); dl.appendChild(wrap); });
    updateOrderAvailability(resolved);
  }
  function updateOrderAvailability(resolved) {
    var destination = String(config.businessWhatsApp || "").replace(/\D/g, "");
    var hasPrice = resolved && typeof resolved.price === "number" && isFinite(resolved.price) && resolved.price >= 0;
    var button = byId("confirm-magazine-order");
    button.disabled = !(hasPrice && destination.length >= 7);
    byId("order-setup-note").hidden = hasPrice && destination.length >= 7;
    if (!hasPrice && !destination.length) byId("order-setup-note").textContent = "Order confirmation is disabled until the package price and business WhatsApp number are configured in magazine-config.js.";
    else if (!hasPrice) byId("order-setup-note").textContent = "Order confirmation is disabled until the selected package price is configured in magazine-config.js.";
    else if (!destination.length) byId("order-setup-note").textContent = "Order confirmation is disabled until the business WhatsApp number is configured in magazine-config.js.";
  }
  function orderMessage() {
    var data = formValues();
    var pkg = configPackages.find(function (item) { return item.id === state.packageId; });
    var resolved = pkg ? priceFor(state.category, pkg) : null;
    var price = resolved && typeof resolved.price === "number" ? (config.currency || "") + new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(resolved.price) : "Not configured";
    return [
      "HEART'S BIOGRAPHY — NEW MAGAZINE ORDER", "", "Customer Name: " + data.customer, "WhatsApp Number: " + data.whatsapp, "Email: " + (data.email || "Not provided"), "", "Magazine Category: " + state.category.label, "Selected Package: " + (resolved ? resolved.name : "Not selected"), "", "Recipient's Name: " + data.recipient, "Couple Names: " + (data.couple || "Not applicable"), "Occasion Date: " + data.date, "Preferred Theme: " + data.theme, "", "Personal Story: " + data.story, "Special Message: " + data.message, "Additional Instructions: " + (data.instructions || "None"), "", "Package Price: " + price, "Final Total: " + price, "", "Photo Uploads: " + fileSummary(), "Please attach the selected photo files manually in WhatsApp; this website does not upload or attach them."
    ].join("\n");
  }
  function initializeCategory() {
    var query = new URLSearchParams(window.location.search);
    var slug = query.get("category");
    if (!slug) {
      var hashMatch = window.location.hash.match(/^#(.+)-magazine$/);
      if (hashMatch) slug = hashMatch[1] === "valentines-day" ? "valentines" : hashMatch[1];
    }
    var category = categoryBySlug[slug] || categories[0];
    state.category = category;
    state.packageId = query.get("package") || "";
    if (state.packageId && !configPackages.some(function (pkg) { return pkg.id === state.packageId; })) state.packageId = "";
    updateCategoryFields(); renderPackages();
    if (query.get("category") || window.location.hash === "#packages") setTimeout(function () { byId("packages").scrollIntoView(); }, 80);
    else if (slug && categoryBySlug[slug]) setTimeout(function () { byId("packages").scrollIntoView({ behavior: "smooth" }); updateUrl(); }, 80);
  }

  document.querySelectorAll(".occasion-card[data-category-slug]").forEach(function (card) {
    card.addEventListener("click", function (event) {
      event.preventDefault();
      var category = categoryBySlug[card.getAttribute("data-category-slug")];
      if (category) setCategory(category, true);
    });
  });
  byId("continue-to-order-details").addEventListener("click", function () {
    if (!state.packageId) { byId("package-error").textContent = "Please select a package to continue."; return; }
    byId("package-error").textContent = ""; selectStep(2);
  });
  byId("back-to-packages").addEventListener("click", function () { selectStep(1); });
  byId("continue-to-order-review").addEventListener("click", function () {
    if (!validateForm()) return;
    updateReview(); selectStep(3);
  });
  byId("edit-order-information").addEventListener("click", function () { selectStep(2); });
  byId("edit-order-package").addEventListener("click", function () { selectStep(1); });
  byId("customer-whatsapp").addEventListener("input", function () { this.setCustomValidity(""); });
  byId("magazine-photos").addEventListener("change", function () {
    state.files = Array.prototype.slice.call(this.files || []);
    byId("photo-file-list").textContent = state.files.length ? state.files.map(function (file) { return file.name; }).join(", ") : "No photos selected yet.";
  });
  byId("magazine-order-form").addEventListener("input", function () { if (!byId("order-review-panel").hidden) updateReview(); });
  byId("confirm-magazine-order").addEventListener("click", function () {
    var pkg = configPackages.find(function (item) { return item.id === state.packageId; });
    var resolved = pkg ? priceFor(state.category, pkg) : null;
    updateOrderAvailability(resolved);
    if (byId("confirm-magazine-order").disabled) return;
    var destination = String(config.businessWhatsApp || "").replace(/\D/g, "");
    var target = "https://wa.me/" + destination + "?text=" + encodeURIComponent(orderMessage());
    window.open(target, "_blank", "noopener,noreferrer");
    byId("order-sent-note").hidden = false;
  });
  initializeCategory();
}());





