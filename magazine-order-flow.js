(function () {
  "use strict";
  var config = window.HEARTS_BIOGRAPHY_MAGAZINE_PACKAGES || {};
  var params = new URLSearchParams(window.location.search);
  var category = params.get("category") || "";
  var draftKey = category ? "hbMagazineDraft:" + category : "";
  var draft = {};
  try { draft = draftKey ? JSON.parse(window.localStorage.getItem(draftKey) || "{}") : {}; } catch (error) { draft = {}; }
  var packageId = params.get("package") || draft.packageId || "";
  var pkg = (config.packages || []).find(function (item) { return item.id === packageId; }) || null;
  var page = document.getElementById("magazine-personalization-form") ? "client" : (document.getElementById("review-order-content") ? "review" : "");
  var client = draft.clientInformation || {};
  var categoryName = draft.categoryName || "";
  var packageName = draft.packageName || (pkg && pkg.name) || "";
  var selection = params.get("hardCopy") || draft.hardCopySelection || (pkg && pkg.hardCopyIncluded ? "included" : "digital-only");

  function saveDraft() {
    if (!draftKey) return false;
    try { window.localStorage.setItem(draftKey, JSON.stringify(draft)); return true; } catch (error) { return false; }
  }
  function digits(value) { return String(value || "").replace(/\D/g, ""); }
  function phoneIsValid(value) { return /^01[3-9]\d{8}$/.test(String(value || "")); }
  function normalizePhone(value) { var valueDigits = digits(value); if (valueDigits.length === 13 && valueDigits.indexOf("880") === 0) valueDigits = "0" + valueDigits.slice(3); else if (valueDigits.length === 14 && valueDigits.indexOf("8800") === 0) valueDigits = valueDigits.slice(3); return valueDigits.slice(0, 11); }
  function displayPhone(value) { return "+88" + String(value || ""); }
  function packagePageUrl() { return (draft.categoryPage || "editions.html#occasions"); }
  function flowUrl(file) {
    var query = new URLSearchParams();
    query.set("category", category); query.set("package", packageId);
    if (selection) query.set("hardCopy", selection);
    return file + "?" + query.toString();
  }
  function text(el, value) { if (el) el.textContent = value == null ? "" : String(value); }
  function priceText() {
    if (typeof draft.packagePriceText === "string" && draft.packagePriceText.trim()) return draft.packagePriceText;
    if (typeof draft.packagePrice === "number" && isFinite(draft.packagePrice)) return (config.currency || "BDT ") + new Intl.NumberFormat(undefined, {maximumFractionDigits: 2}).format(draft.packagePrice);
    return "Price information will be confirmed";
  }
  function hardCopyText() {
    if (!pkg) return "Not specified";
    if (pkg.hardCopyIncluded || selection === "included") return "Hard Copy Included";
    if (pkg.hardCopyOptional && selection === "digital-plus-hard-copy") {
      var result = "Digital + Hard Copy · " + (config.hardCopyPaperGsm || 150) + " GSM Paper";
      var charge = Number(draft.hardCopyExtraCost != null ? draft.hardCopyExtraCost : draft.hardCopyCharge);
      if (Number.isFinite(charge) && charge > 0) result += " · Additional charge " + (config.currency || "BDT ") + new Intl.NumberFormat(undefined, {maximumFractionDigits: 2}).format(charge);
      return result;
    }
    if (pkg.hardCopyOptional) return "Digital Only";
    return "No Hard Copy";
  }
  function validSelection() { return !!(draftKey && category && categoryName && pkg && packageName); }
  function showNotice(message) {
    var heading = document.querySelector(".order-page-heading");
    if (heading) { var notice = heading.querySelector(".selection-error"); if (!notice) { notice = document.createElement("p"); notice.className = "form-error selection-error"; notice.setAttribute("role", "alert"); heading.appendChild(notice); } notice.textContent = message; }
  }
  function showMissingSelection() {
    showNotice("Your magazine selection could not be found. Please return to the magazine categories and select a package.");
    var submit = document.querySelector("#magazine-personalization-form button[type=submit], #add-magazine-to-cart");
    if (submit) submit.disabled = true;
  }
  function renderSelectionContext() {
    var context = document.getElementById("selection-context");
    if (!context) return;
    [categoryName, packageName, hardCopyText(), priceText()].forEach(function (value) { var span = document.createElement("span"); span.textContent = value; context.appendChild(span); });
  }
  function initClient() {
    var form = document.getElementById("magazine-personalization-form");
    if (!validSelection()) { showMissingSelection(); form.querySelector("button[type=submit]").disabled = true; return; }
    draft.category = category; draft.packageId = pkg.id; draft.hardCopySelection = selection; saveDraft();
    var fields = { fullName: form.elements.namedItem("fullName"), phoneNumber: form.elements.namedItem("phoneNumber"), whatsappNumber: form.elements.namedItem("whatsappNumber"), email: form.elements.namedItem("email") };
    var checkout = null;
    try { checkout = window.HeartBiographyCart && window.HeartBiographyCart.get().checkout; } catch (error) { checkout = null; }
    if (checkout) {
      if (!client.fullName) client.fullName = checkout.fullName || "";
      if (!client.phoneNumber) client.phoneNumber = checkout.phoneNumber || "";
      if (!client.whatsappNumber) client.whatsappNumber = checkout.whatsappNumber || "";
      if (!client.email) client.email = checkout.email || "";
    }
    if (!client.fullName && draft.formData && draft.formData.customerName) client.fullName = draft.formData.customerName;
    if (!client.whatsappNumber && draft.formData && draft.formData.customerWhatsApp) client.whatsappNumber = draft.formData.customerWhatsApp;
    if (!client.email && draft.formData && draft.formData.email) client.email = draft.formData.email;
    Object.keys(fields).forEach(function (key) { fields[key].value = (key === "phoneNumber" || key === "whatsappNumber") ? normalizePhone(client[key]) : (client[key] || ""); });
    function persist() { client = { fullName: fields.fullName.value.trim(), phoneNumber: normalizePhone(fields.phoneNumber.value), whatsappNumber: normalizePhone(fields.whatsappNumber.value), email: fields.email.value.trim() }; draft.clientInformation = client; saveDraft(); }
    [fields.phoneNumber, fields.whatsappNumber].forEach(function (field) { field.addEventListener("beforeinput", function (event) { if (event.inputType && event.inputType.indexOf("delete") === 0) return; var inserted = event.data; if (event.inputType === "insertFromPaste" && event.dataTransfer) inserted = event.dataTransfer.getData("text"); if (inserted != null && inserted !== "" && !/^[0-9]+$/.test(inserted)) { event.preventDefault(); return; } if (inserted) { var selectedLength = (field.selectionEnd || 0) - (field.selectionStart || 0); if (field.value.length - selectedLength + inserted.length > 11) event.preventDefault(); } }); field.addEventListener("input", function () { field.value = digits(field.value).slice(0, 11); field.setCustomValidity(""); persist(); }); });
    form.addEventListener("input", persist); form.addEventListener("change", persist);
    fields.fullName.addEventListener("input", function () { fields.fullName.setCustomValidity(""); });
    fields.phoneNumber.addEventListener("input", function () { fields.phoneNumber.setCustomValidity(""); });
    fields.whatsappNumber.addEventListener("input", function () { fields.whatsappNumber.setCustomValidity(""); });
    form.addEventListener("submit", function (event) {
      event.preventDefault(); persist();
      fields.fullName.setCustomValidity(fields.fullName.value.trim() ? "" : "Enter your full name.");
      [fields.phoneNumber, fields.whatsappNumber].forEach(function (field) { field.setCustomValidity(phoneIsValid(field.value) ? "" : "Enter an 11-digit Bangladeshi mobile number starting with 01."); });
      if (!form.reportValidity()) return;
      window.location.href = flowUrl("magazine-review.html");
    });
    var back = document.getElementById("back-to-package"); back.href = packagePageUrl();
    renderSelectionContext();
  }
  function group(container, title, rows) {
    var section = document.createElement("section"); section.className = "review-group";
    var heading = document.createElement("h2"); heading.className = "review-group-title"; heading.textContent = title; section.appendChild(heading);
    var list = document.createElement("dl"); list.className = "review-details-list";
    rows.forEach(function (row) { if (row[1] == null || String(row[1]).trim() === "") return; var wrapper = document.createElement("div"); wrapper.className = "review-detail-row"; var term = document.createElement("dt"); term.textContent = row[0]; var value = document.createElement("dd"); value.textContent = row[1]; wrapper.appendChild(term); wrapper.appendChild(value); list.appendChild(wrapper); });
    section.appendChild(list); container.appendChild(section);
  }
  function initReview() {
    if (!validSelection()) { showMissingSelection(); return; }
    document.getElementById("edit-information").href = flowUrl("magazine-personalize.html");
    if (!client.fullName || !client.phoneNumber || !client.whatsappNumber) { showNotice("Please complete Client Information before reviewing your order."); document.getElementById("add-magazine-to-cart").disabled = true; return; }
    var target = document.getElementById("review-order-content");
    group(target, "CLIENT INFORMATION", [["Full Name", client.fullName], ["Phone Number", displayPhone(client.phoneNumber)], ["WhatsApp Number", displayPhone(client.whatsappNumber)], ["Email Address", client.email]]);
    group(target, "ORDER INFORMATION", [["Product Name", "The Memory Editions"], ["Selected Magazine Type", categoryName], ["Magazine Name", categoryName], ["Selected Magazine Package", packageName], ["Hard Copy", hardCopyText()], ["Package Price", priceText()]]);
    document.getElementById("edit-information").href = flowUrl("magazine-personalize.html");
    var button = document.getElementById("add-magazine-to-cart");
    button.addEventListener("click", function () {
      button.disabled = true;
      if (!window.HeartBiographyCart) { button.disabled = false; showNotice("The shared cart is unavailable. Please refresh this page and try again."); return; }
      var total = typeof draft.packagePrice === "number" && isFinite(draft.packagePrice) ? draft.packagePrice : null;
      var item = {
        kind: "memory",
        title: categoryName + " Magazine",
        categoryKey: category,
        categories: [categoryName],
        packageId: pkg.id,
        packageName: packageName,
        hardCopySelection: selection,
        hardCopy: hardCopyText(),
        total: total,
        regularTotal: total,
        discount: 0,
        priceLabel: priceText(),
        payload: Object.assign({}, draft),
        checkoutPrefill: {
          fullName: client.fullName || "",
          phoneNumber: client.phoneNumber || "",
          whatsappNumber: client.whatsappNumber || "",
          email: client.email || ""
        }
      };
      if (!window.HeartBiographyCart.addItem(item)) { button.disabled = false; showNotice("Your magazine could not be added. Check that browser storage is available and try again."); return; }
      try { window.localStorage.removeItem(draftKey); } catch (error) { /* The cart already contains a complete copy. */ }
      window.location.href = "cart.html?added=memory";
    });
  }
  if (page === "client") initClient();
  if (page === "review") initReview();
})();
