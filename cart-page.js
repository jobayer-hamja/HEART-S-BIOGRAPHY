(function () {
  "use strict";
  var cartApi = window.HeartBiographyCart;
  var config = window.HEARTS_BIOGRAPHY_MAGAZINE_PACKAGES || {};
  var currency = config.currency || "BDT ";
  var cartView = document.getElementById("cart-view");
  var checkoutView = document.getElementById("checkout-view");
  var reviewView = document.getElementById("cart-review-view");
  var checkoutForm = document.getElementById("cart-checkout-form");
  var checkout = {};

  function cart() { return cartApi.get(); }
  function escapeHtml(value) { return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[char]; }); }
  function formatPrice(value) { return currency + Number(value || 0).toLocaleString("en-BD"); }
  function validAmount(value) { return typeof value === "number" && Number.isFinite(value); }
  function totals(items) {
    return cartApi.summarize(items);
  }
  function finalPriceText(sum) {
    return sum.allPricesKnown ? formatPrice(sum.knownTotal) : (sum.knownTotal ? formatPrice(sum.knownTotal) + " + BDT price confirmation" : "BDT amount to be confirmed");
  }
  function subtotalText(sum) {
    return sum.allPricesKnown ? formatPrice(sum.subtotal) : (sum.subtotal ? formatPrice(sum.subtotal) + " + unpriced item" : "BDT subtotal to be confirmed");
  }
  function text(parent, tag, className, value) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    node.textContent = value == null ? "" : String(value);
    parent.appendChild(node);
    return node;
  }
  function detailsFor(item) {
    var rows = [];
    if (item.kind === "memory") {
      rows.push("Category: " + (item.categories || []).join(", "));
      rows.push("Package: " + (item.packageName || "Not specified"));
      if (item.payload && item.payload.packagePages) rows.push("Pages: " + item.payload.packagePages);
      rows.push("Hard Copy: " + (item.hardCopy || "Not specified"));
    } else {
      rows.push("Wish categories: " + (item.categories || []).join(", "));
      if ((item.categories || []).indexOf("The Signature Wish") !== -1) rows.push("Attach any photos or reference images you would like included in your WhatsApp order conversation.");
      if (item.dateInvitationPackage) {
        rows.push("Selected package: " + item.dateInvitationPackage.name);
        rows.push("Package price: " + formatPrice(item.dateInvitationPackage.price));
      }
      (item.categories || []).forEach(function (category) {
        var wish = (item.wishes || {})[category] || {};
        var identity = [];
        if (wish.recipient) identity.push("Recipient: " + wish.recipient);
        if (wish.sender) identity.push("Sender: " + wish.sender);
        if (identity.length) rows.push(category + " — " + identity.join(" · "));
        if (wish.relationship) rows.push("Relationship: " + wish.relationship);
        if (wish.occasionDetails) rows.push("Occasion: " + wish.occasionDetails);
        if (wish.language) rows.push("Language: " + wish.language);
        if (wish.message) rows.push("Personal message: " + (wish.message.length > 110 ? wish.message.slice(0, 107) + "…" : wish.message));
        if (item.dateInvitationPackage) {
          var labels = { orderPlacedBy: "Order Placed By", recipientPassword: "Recipient's Password", introMessages: "Introductory Messages", introductoryMessages: "Introductory Messages", counterStartDate: "Days Counter Starting Date", seriousQuestion: "Fifth Serious Yes/No Question", yesResponse: "Yes Response Message", noResponse: "No Response Message", invitationDate: "Invitation Date", invitationTime: "Invitation Time", invitationLocation: "Invitation Location", backgroundMusic: "Background Music File", introMusic: "Intro / Cinematic Music File", additionalInstructions: "Additional Instructions", personalizedLetter: "Personalized Letter", heartbreakMessage: "Heartbreak message", restorationMessage: "Heart Restoration message", finalClosingMessage: "Final emotional closing message" };
          ["orderPlacedBy","recipientPassword","introMessages","introductoryMessages","counterStartDate","seriousQuestion","yesResponse","noResponse","invitationDate","invitationTime","invitationLocation","backgroundMusic","introMusic","additionalInstructions"].forEach(function (key) { if (wish[key]) rows.push(labels[key] + ": " + (Array.isArray(wish[key]) ? wish[key].join(" / ") : wish[key])); });
          [1,2,3,4].forEach(function (number) {
            [["question"+number, "Interactive Question " + number], ["question"+number+"Answer", "Question " + number + " answer option"], ["question"+number+"Dodge", "Question " + number + " dodge option"]].forEach(function (entry) { if (wish[entry[0]]) rows.push(entry[1] + ": " + wish[entry[0]]); });
          });
          var memoryCount = item.dateInvitationPackage.id === "memory-lane" ? 2 : item.dateInvitationPackage.id === "hearts-promise" ? 5 : 0;
          for (var memoryIndex = 1; memoryIndex <= memoryCount; memoryIndex++) {
          [["memory"+memoryIndex+"Date", "Memory " + memoryIndex + " Date"], ["memory"+memoryIndex+"Location", "Memory " + memoryIndex + " Location"], ["memory"+memoryIndex+"Description", "Memory " + memoryIndex + " Description"]].forEach(function (entry) { if (wish[entry[0]]) rows.push(entry[1] + ": " + wish[entry[0]]); });
          }
          if (memoryCount && wish.personalizedLetter) rows.push("Personalized Letter: " + wish.personalizedLetter);
          if (item.dateInvitationPackage.id === "hearts-promise") ["heartbreakMessage","restorationMessage","finalClosingMessage"].forEach(function (key) { if (wish[key]) rows.push(labels[key] + ": " + wish[key]); });
        }
      });
    }
    return rows;
  }
  function dateInvitationAssets(item) {
    if (item.assetIds && typeof item.assetIds === "object") return item.assetIds;
    var legacy = item.photoAssetIds && typeof item.photoAssetIds === "object" ? item.photoAssetIds : {};
    var music = {};
    ["backgroundMusic", "introMusic"].forEach(function (key) { if (legacy[key]) music[key] = legacy[key]; });
    return music;
  }
  function itemPriceText(item) {
    return validAmount(item.total) ? ((item.currencySymbol || currency) + Number(item.total).toLocaleString("en-BD")) : (item.priceLabel || "BDT amount to be confirmed");
  }
  function renderCart() {
    var saved = cart(), items = saved.items || [], list = document.getElementById("cart-items");
    list.textContent = "";
    document.getElementById("go-to-checkout").disabled = items.length < 1;
    document.getElementById("clear-cart").hidden = items.length < 1;
    if (!items.length) {
      text(list, "div", "cart-empty", "Your cart is empty. Add a Memory Edition or WishVerse order to continue.");
    }
    items.forEach(function (item) {
      var card = document.createElement("article"); card.className = "cart-item";
      var info = document.createElement("div");
      text(info, "p", "cart-item-type", item.kind === "memory" ? "The Memory Editions" : "The WishVerse");
      text(info, "h2", "", item.title || (item.kind === "memory" ? "Memory Edition" : "WishVerse"));
      var details = document.createElement("div"); details.className = "cart-item-details";
      detailsFor(item).forEach(function (row) { text(details, "p", "", row); });
      info.appendChild(details); card.appendChild(info);
      if (Object.keys(dateInvitationAssets(item)).length) { var downloads = document.createElement("div"); downloads.className = "cart-date-asset-downloads"; downloads.setAttribute("data-date-asset-downloads", item.id); card.appendChild(downloads); renderDateAssetDownloads(downloads, item); }
      text(card, "div", "cart-item-total", itemPriceText(item));
      var actions = document.createElement("div"); actions.className = "cart-item-actions";
      var edit = text(actions, "button", "cart-action-button", "Edit"); edit.type = "button"; edit.setAttribute("data-edit-item", item.id);
      var remove = text(actions, "button", "cart-action-button is-danger", "Remove"); remove.type = "button"; remove.setAttribute("data-remove-item", item.id);
      card.appendChild(actions); list.appendChild(card);
    });
    var sum = totals(items);
    document.getElementById("cart-subtotal").textContent = items.length ? subtotalText(sum) : "—";
    document.getElementById("cart-discount").textContent = items.length ? (sum.discount ? "−" + formatPrice(sum.discount) : formatPrice(0)) : "—";
    document.getElementById("cart-total").textContent = items.length ? finalPriceText(sum) : "—";
  }
  function renderDateAssetDownloads(container, item) {
    var ids=dateInvitationAssets(item), entries=Object.keys(ids).map(function(field){return {field:field,id:ids[field]};});
    if(!entries.length)return;
    container.textContent="";
    text(container,"p","cart-date-assets-note","Download selected files here, then attach them manually in WhatsApp.");
    if(!window.HeartBiographyDateAssets){text(container,"p","cart-date-assets-error","File download support is unavailable in this browser.");return;}
    window.HeartBiographyDateAssets.getAssets(entries).then(function(results){results.forEach(function(entry){if(!entry.record){text(container,"p","cart-date-assets-error","A selected file could not be found: "+entry.field);return;}var url=URL.createObjectURL(entry.record.blob);var link=text(container,"a","cart-date-asset-download","Download "+entry.record.name+" ↓");link.href=url;link.download=entry.record.name;link.rel="noopener";link.addEventListener("click",function(){window.setTimeout(function(){URL.revokeObjectURL(url);},60000);});});}).catch(function(){text(container,"p","cart-date-assets-error","Selected files could not be loaded from this browser.");});
  }
  function setStage(stage) {
    cartView.hidden = stage !== "cart";
    checkoutView.hidden = stage !== "checkout";
    reviewView.hidden = stage !== "review";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function fillCheckout() {
    var saved = cart().checkout || {};
    ["fullName", "phoneNumber", "whatsappNumber", "email"].forEach(function (key) {
      checkoutForm.elements.namedItem(key).value = saved[key] || "";
    });
  }
  function readCheckout() {
    return {
      fullName: checkoutForm.elements.namedItem("fullName").value.trim(),
      phoneNumber: checkoutForm.elements.namedItem("phoneNumber").value,
      whatsappNumber: checkoutForm.elements.namedItem("whatsappNumber").value,
      email: checkoutForm.elements.namedItem("email").value.trim()
    };
  }
  function persistCheckout() { checkout = readCheckout(); cartApi.saveCheckout(checkout); }
  function onlyDigits(value) { return String(value || "").replace(/\D/g, ""); }
  function validPhone(value) { return /^01[3-9][0-9]{8}$/.test(String(value || "")); }
  function addPhoneInputRules() {
    [checkoutForm.elements.namedItem("phoneNumber"), checkoutForm.elements.namedItem("whatsappNumber")].forEach(function (field) {
      field.addEventListener("beforeinput", function (event) {
        if (event.inputType && event.inputType.indexOf("delete") === 0) return;
        var inserted = event.data;
        if (event.inputType === "insertFromPaste" && event.dataTransfer) inserted = event.dataTransfer.getData("text");
        if (inserted != null && inserted !== "" && !/^[0-9]+$/.test(inserted)) { event.preventDefault(); return; }
        if (inserted) {
          var selectionLength = (field.selectionEnd || 0) - (field.selectionStart || 0);
          if (field.value.length - selectionLength + inserted.length > 11) event.preventDefault();
        }
      });
      field.addEventListener("input", function () { field.value = onlyDigits(field.value).slice(0, 11); field.setCustomValidity(""); persistCheckout(); });
    });
    checkoutForm.addEventListener("input", function (event) { if (event.target.name !== "phoneNumber" && event.target.name !== "whatsappNumber") persistCheckout(); });
  }
  function itemReviewMarkup(item) {
    var rows = detailsFor(item).map(function (row) { return "<p>" + escapeHtml(row) + "</p>"; }).join("");
    return '<article class="cart-review-line"><h3>' + escapeHtml(item.title || "Order item") + "</h3>" + rows + "<p><strong>Item total: " + escapeHtml(itemPriceText(item)) + "</strong></p>" + (Object.keys(dateInvitationAssets(item)).length ? '<div class="cart-date-asset-downloads" data-date-asset-downloads="'+escapeHtml(item.id)+'"></div>' : '') + "</article>";
  }
  function buildCombinedMessage(saved, info) {
    var items = saved.items || [], sum = totals(items);
    var lines = ["Hello, Heart's Biography Team.", "", "I would like to place a combined order with Heart's Biography.", "", "━━━━━━━━━━━━━━━━━━━━", "CUSTOMER / ORDER PLACEMENT DETAILS", "━━━━━━━━━━━━━━━━━━━━", "", "Order Placed By: " + info.fullName, "Phone Number: +88" + info.phoneNumber, "WhatsApp Number: +88" + info.whatsappNumber];
    if (info.email) lines.push("Email Address: " + info.email);
    lines.push("", "━━━━━━━━━━━━━━━━━━━━", "ORDER SUMMARY", "━━━━━━━━━━━━━━━━━━━━", "");
    items.forEach(function (item, index) {
      lines.push((index + 1) + ". " + (item.kind === "memory" ? "THE MEMORY EDITIONS" : "THE WISHVERSE"));
      if (item.kind === "memory") {
        lines.push("Category: " + (item.categories || []).join(", "), "Package: " + (item.packageName || "Not specified"), "Hard Copy: " + (item.hardCopy || "Not specified"));
        if (item.personalizationSummary) lines.push("Personalization: " + item.personalizationSummary);
      } else {
        lines.push("Selected Wish Categories: " + (item.categories || []).join(", "));
        if (item.dateInvitationPackage) lines.push("Selected Package: " + item.dateInvitationPackage.name, "Package Price: " + formatPrice(item.dateInvitationPackage.price));
        (item.categories || []).forEach(function (category, categoryIndex) {
          var wish = (item.wishes || {})[category] || {};
          lines.push("", "*" + String(categoryIndex + 1).padStart(2, "0") + " | " + category + "*");
          [["Recipient's Name", wish.recipient], ["Sender's Name", wish.sender], ["Relationship", wish.relationship], ["Occasion", wish.occasionDetails], ["Language", wish.language]].forEach(function (row) { if (row[1] != null && String(row[1]).trim()) lines.push(row[0] + ": " + String(row[1]).trim()); });
          if (item.dateInvitationPackage) {
            var labels = { orderPlacedBy:"Order Placed By", recipientPassword:"Recipient's Password", introMessages:"Introductory Messages", introductoryMessages:"Introductory Messages", counterStartDate:"Days Counter Starting Date", seriousQuestion:"Fifth Serious Yes/No Question", yesResponse:"Yes Response Message", noResponse:"No Response Message", invitationDate:"Invitation Date", invitationTime:"Invitation Time", invitationLocation:"Invitation Location", backgroundMusic:"Background Music File", introMusic:"Intro / Cinematic Music File", additionalInstructions:"Additional Instructions", personalizedLetter:"Personalized Letter", heartbreakMessage:"Heartbreak message", restorationMessage:"Heart Restoration message", finalClosingMessage:"Final emotional closing message" };
            ["orderPlacedBy","recipientPassword","introMessages","introductoryMessages","counterStartDate","seriousQuestion","yesResponse","noResponse","invitationDate","invitationTime","invitationLocation","backgroundMusic","introMusic","additionalInstructions"].forEach(function (key) { if (wish[key] != null && String(wish[key]).trim()) lines.push(labels[key] + ": " + (Array.isArray(wish[key])?wish[key].join(" / "):String(wish[key]).trim())); });
            [1,2,3,4].forEach(function (number) { [["question"+number,"Interactive Question "+number],["question"+number+"Answer","Question "+number+" answer option"],["question"+number+"Dodge","Question "+number+" dodge option"]].forEach(function (row) { if (wish[row[0]] != null && String(wish[row[0]]).trim()) lines.push(row[1] + ": " + String(wish[row[0]]).trim()); }); });
            var memoryCount = item.dateInvitationPackage.id === "memory-lane" ? 2 : item.dateInvitationPackage.id === "hearts-promise" ? 5 : 0;
            for (var memoryIndex = 1; memoryIndex <= memoryCount; memoryIndex++) [["memory"+memoryIndex+"Date", "Memory " + memoryIndex + " Date"], ["memory"+memoryIndex+"Location", "Memory " + memoryIndex + " Location"], ["memory"+memoryIndex+"Photo", "Memory " + memoryIndex + " Photo"], ["memory"+memoryIndex+"Description", "Memory " + memoryIndex + " Description"]].forEach(function (row) { if (wish[row[0]] != null && String(wish[row[0]]).trim()) lines.push(row[1] + ": " + String(wish[row[0]]).trim()); });
            if (memoryCount && wish.personalizedLetter) lines.push("Personalized Letter: " + String(wish.personalizedLetter).trim());
            if (item.dateInvitationPackage.id === "hearts-promise") ["heartbreakMessage","restorationMessage","finalClosingMessage"].forEach(function (key) { if (wish[key] != null && String(wish[key]).trim()) lines.push(labels[key] + ": " + String(wish[key]).trim()); });
          }
          if (wish.message != null && String(wish.message).trim()) lines.push("", "Personal Message:", String(wish.message).trim());
          if (wish.instructions != null && String(wish.instructions).trim()) lines.push("", (category === "The Signature Wish" ? "Creative brief:" : "Additional Instructions:"), String(wish.instructions).trim());
        });
      }
      if (item.dateInvitationPackage) {
      if ((item.categories || []).indexOf("The Signature Wish") !== -1) lines.push("", "For The Signature Wish, attach any photos or reference images you would like included to this WhatsApp conversation.");
        if (item.dateInvitationPackage.id === "memory-lane") lines.push("", "Please send 6 photos in total through this WhatsApp conversation:", "", "- Date Memory 1: 1 Cover Photo + 2 Memory Photos.", "- Date Memory 2: 1 Cover Photo + 2 Memory Photos.");
        if (item.dateInvitationPackage.id === "hearts-promise") lines.push("", "Please send 15 photos in total through this WhatsApp conversation:", "", "- Each of the 5 Date Memories requires 1 Cover Photo + 2 Memory Photos.");
      }
      var musicAssets=dateInvitationAssets(item);
      if (item.dateInvitationPackage && Object.keys(musicAssets).length) {
        var fileNames=Object.keys(musicAssets).map(function(key){var wish=(item.wishes||{})["Date Invitation"]||{};return wish[key]||key;});
        lines.push("Music files selected on the website (download from Cart and attach manually in WhatsApp): " + fileNames.join(" · "));
      }
      lines.push("Item Total: " + itemPriceText(item), "");
    });
    lines.push("━━━━━━━━━━━━━━━━━━━━", "COMBINED BILLING", "━━━━━━━━━━━━━━━━━━━━", "Subtotal: " + subtotalText(sum), "Existing Discounts: " + (sum.discount ? "−" : "") + formatPrice(sum.discount), "Final Combined Total: " + finalPriceText(sum), "", "Please review my order and guide me through the next steps.", "", "Best regards,", info.fullName, "", "Heart's Biography", "Every Memory Deserves a Story.");
    return lines.join("\n");
  }
  function openReview() {
    var saved = cart(), items = saved.items || [], sum = totals(items);
    document.getElementById("cart-review-items").innerHTML = items.map(itemReviewMarkup).join("");
    items.forEach(function(item){var container=document.querySelector('[data-date-asset-downloads="'+item.id+'"]');if(container)renderDateAssetDownloads(container,item);});
    document.getElementById("review-subtotal").textContent = subtotalText(sum);
    document.getElementById("review-discount").textContent = (sum.discount ? "−" : "") + formatPrice(sum.discount);
    document.getElementById("review-total").textContent = finalPriceText(sum);
    document.getElementById("combined-message-preview").textContent = buildCombinedMessage(saved, checkout);
    setStage("review");
  }
  function showFeedback() {
    var type = new URLSearchParams(window.location.search).get("added");
    if (!type) return;
    var message = type === "memory" ? "Memory Edition added to your cart." : (type === "wishverse" ? "WishVerse order added to your cart." : "Your selection was added to the cart.");
    var feedback = document.getElementById("cart-feedback"); feedback.textContent = message; feedback.hidden = false;
  }

  document.getElementById("cart-items").addEventListener("click", function (event) {
    var edit = event.target.closest("[data-edit-item]"), remove = event.target.closest("[data-remove-item]");
    if (edit && !cartApi.beginEdit(edit.getAttribute("data-edit-item"))) window.alert("This item could not be opened for editing.");
    if (remove) { cartApi.removeItem(remove.getAttribute("data-remove-item")); renderCart(); }
  });
  document.getElementById("clear-cart").addEventListener("click", function () { if (window.confirm("Remove every item from your cart?")) { cartApi.clear(); renderCart(); setStage("cart"); } });
  document.getElementById("go-to-checkout").addEventListener("click", function () { if (!cart().items.length) return; fillCheckout(); setStage("checkout"); });
  document.getElementById("back-to-cart").addEventListener("click", function () { setStage("cart"); });
  checkoutForm.addEventListener("submit", function (event) {
    event.preventDefault();
    var values = readCheckout();
    checkoutForm.elements.namedItem("phoneNumber").setCustomValidity(validPhone(values.phoneNumber) ? "" : "Enter an 11-digit Bangladeshi mobile number starting with 01.");
    checkoutForm.elements.namedItem("whatsappNumber").setCustomValidity(validPhone(values.whatsappNumber) ? "" : "Enter an 11-digit Bangladeshi mobile number starting with 01.");
    var error = document.getElementById("cart-form-error");
    if (!checkoutForm.reportValidity()) { error.textContent = "Enter your name and valid 11-digit phone and WhatsApp numbers to continue."; return; }
    if (!cart().items.length) { error.textContent = "Your cart is empty. Add an item before checkout."; setStage("cart"); return; }
    error.textContent = ""; checkout = values; cartApi.saveCheckout(checkout); openReview();
  });
  document.getElementById("edit-checkout").addEventListener("click", function () { fillCheckout(); setStage("checkout"); });
  document.getElementById("open-combined-whatsapp").addEventListener("click", function () {
    var number = String(config.businessWhatsApp || "").replace(/\D/g, ""), message = buildCombinedMessage(cart(), checkout);
    if (!/^[1-9][0-9]{7,14}$/.test(number) || !message || !cart().items.length) { window.alert("The WhatsApp order channel is unavailable. Your cart is still saved on this device."); return; }
    window.location.href = "https://wa.me/" + number + "?text=" + encodeURIComponent(message);
  });
  window.addEventListener("hb-cart-updated", renderCart);
  window.addEventListener("storage", renderCart);
  renderCart(); showFeedback();
}());
