(function () {
  "use strict";

  var productCards = Array.prototype.slice.call(document.querySelectorAll(".products .product[data-product-page]"));

  var activeCard = null;
  var activePreviewItem = null;
  var returnFocus = null;
  var overlay = document.createElement("div");
  overlay.className = "quick-preview-overlay";
  overlay.hidden = true;
  overlay.innerHTML = '<section class="quick-preview-dialog" role="dialog" aria-modal="true" aria-labelledby="quick-preview-title" aria-describedby="quick-preview-description"><button class="quick-preview-close" type="button" aria-label="Close preview">×</button><div class="quick-preview-content"><div class="quick-preview-art"></div><div class="quick-preview-copy"><p class="quick-preview-eyebrow">HEART’S BIOGRAPHY · PRODUCT PREVIEW</p><h2 id="quick-preview-title"></h2><p id="quick-preview-description"></p><p class="quick-preview-price"></p><div class="quick-preview-options"></div><ul class="quick-preview-features"></ul><p class="quick-preview-feedback" aria-live="polite"></p><div class="quick-preview-actions"><a class="quick-preview-explore" href="#">Explore / Customize <span aria-hidden="true">↗</span></a><button class="quick-preview-add" type="button">Add to Cart <span aria-hidden="true">＋</span></button></div></div></div></section>';
  document.body.appendChild(overlay);

  var dialog = overlay.querySelector(".quick-preview-dialog");
  var closeButton = overlay.querySelector(".quick-preview-close");
  var title = overlay.querySelector("#quick-preview-title");
  var description = overlay.querySelector("#quick-preview-description");
  var price = overlay.querySelector(".quick-preview-price");
  var art = overlay.querySelector(".quick-preview-art");
  var options = overlay.querySelector(".quick-preview-options");
  var features = overlay.querySelector(".quick-preview-features");
  var feedback = overlay.querySelector(".quick-preview-feedback");
  var explore = overlay.querySelector(".quick-preview-explore");
  var addButton = overlay.querySelector(".quick-preview-add");

  function text(value) { return String(value == null ? "" : value).trim(); }
  function appendItem(list, value) {
    if (!value) return;
    var item = document.createElement("li");
    item.textContent = value;
    list.appendChild(item);
  }
  function productKind(card, item) { return item && item.kind || (card.classList.contains("wish-card") || card.classList.contains("wish-category") ? "wishverse" : "memory"); }
  function cartContains(kind, item) {
    try { return !!(window.HeartBiographyCart && window.HeartBiographyCart.get().items.some(function (cartItem) {
      if (cartItem.kind !== kind) return false;
      if (item && item.categoryKey) return cartItem.categoryKey === item.categoryKey;
      if (item && item.category) return (cartItem.categories || []).indexOf(item.category) !== -1;
      return true;
    })); }
    catch (error) { return false; }
  }
  function renderPreview(card, previewItem) {
    activeCard = card;
    activePreviewItem = previewItem || null;
    var kind = productKind(card, previewItem);
    var packageConfig = window.HEARTS_BIOGRAPHY_MAGAZINE_PACKAGES || {};
    var wishConfig = window.WISHVERSE_CONFIG || {};
    var cardTitle = card.querySelector("h2, h3.category-art-title, h4.wish-category-context");
    title.textContent = text(previewItem && previewItem.title || cardTitle && cardTitle.textContent).replace(/\s+/g, " ");
    var cardDescription = card.querySelector(".product-desc, p");
    description.textContent = text(previewItem && previewItem.description || cardDescription && cardDescription.textContent);
    explore.href = previewItem && previewItem.href || card.getAttribute("data-product-page") || card.getAttribute("href") || (kind === "wishverse" ? "wishverse.html#experiences" : "editions.html#occasions");
    art.className = "quick-preview-art product " + (kind === "wishverse" ? "wish-card" : "mag-card");
    art.textContent = "";
    var mockup = previewItem && previewItem.artNode || card.querySelector(".mockup, .book-scene, .category-art");
    if (mockup && previewItem && previewItem.styles) {
      var artHost = document.createElement("div"); artHost.className = "search-preview-art-host";
      var shadow = artHost.attachShadow({ mode: "open" });
      previewItem.styles.forEach(function (css) { var style = document.createElement("style"); style.textContent = css.replace(/:root/g, ":host"); shadow.appendChild(style); });
      var frame = document.createElement("div"); frame.className = kind === "wishverse" ? "wish-category-grid" : "occasion-grid";
      frame.appendChild(mockup.cloneNode(true)); shadow.appendChild(frame);
      var compactArt = document.createElement("style");
      compactArt.textContent = kind === "wishverse"
        ? ":host{display:block;width:100%;height:100%}.wish-category-grid{display:block!important;width:100%;height:100%;margin:0!important}.wish-category-grid .wish-category{display:block!important;width:100%;height:100%;min-height:0!important;padding:8px!important;border:0!important;border-radius:14px!important;background:transparent!important;box-shadow:none!important;transform:none!important}.wish-category-grid .wish-category:before,.wish-category-grid .wish-category:after,.wish-category-grid .wish-category>*:not(.wish-category-card){display:none!important}.wish-category-grid .wish-category-card{height:100%;display:grid;place-items:center}.wish-category-grid .category-art{width:100%;height:100%!important;min-height:150px;margin:0!important;border-radius:12px}.wish-category-grid .category-art-title{font-size:22px!important}"
        : ":host{display:block;width:100%;height:100%}.occasion-grid{display:block!important;width:100%;height:100%;margin:0!important}.occasion-grid .occasion-card{display:block!important;width:100%;height:100%;min-height:0!important;padding:8px!important;border:0!important;border-radius:14px!important;background:transparent!important;box-shadow:none!important;transform:none!important}.occasion-grid .occasion-label,.occasion-grid .occasion-card h2,.occasion-grid .occasion-card p,.occasion-grid .occasion-actions{display:none!important}.occasion-grid .book-scene{height:100%!important;min-height:150px;margin:0!important}.occasion-grid .book{transform:scale(.95) rotate(-4deg) rotateY(-10deg)!important}";
      shadow.appendChild(compactArt); art.appendChild(artHost);
    } else if (mockup) art.appendChild(mockup.cloneNode(true));
    options.textContent = "";
    features.textContent = "";
    feedback.textContent = "";

    if (kind === "memory") {
      var packages = Array.isArray(packageConfig.packages) ? packageConfig.packages : [];
      var numericPrices = packages.map(function (item) { return packageConfig.prices && packageConfig.prices[item.id]; }).filter(function (value) { return typeof value === "number" && Number.isFinite(value); });
      price.textContent = numericPrices.length ? "Starting from " + (packageConfig.currency || "BDT ") + Math.min.apply(Math, numericPrices).toLocaleString("en-BD") : (packageConfig.priceComingSoon || "Price Coming Soon");
      packages.forEach(function (item) {
        var line = document.createElement("p");
        var amount = packageConfig.prices && packageConfig.prices[item.id];
        line.textContent = item.name + " · " + item.pageCount + " · " + (typeof amount === "number" ? (packageConfig.currency || "BDT ") + amount.toLocaleString("en-BD") : (packageConfig.priceComingSoon || "Price Coming Soon"));
        options.appendChild(line);
      });
      var included = [];
      packages.forEach(function (item) { (item.included || []).forEach(function (feature) { if (included.indexOf(feature) === -1) included.push(feature); }); });
      included.slice(0, 5).forEach(function (feature) { appendItem(features, feature); });
    } else {
      var wishPrice = typeof wishConfig.calculateTotal === "function" ? wishConfig.calculateTotal(1) : null;
      price.textContent = wishPrice == null ? "Price details available during selection" : (wishConfig.currency || "BDT ") + Number(wishPrice).toLocaleString("en-BD") + " starting price";
      if (previewItem && previewItem.category) {
        var categoryLine = document.createElement("p"); categoryLine.textContent = "Selected Wish category: " + previewItem.category; options.appendChild(categoryLine);
      } else {
        Array.prototype.forEach.call(card.querySelectorAll(".chip"), function (chip) { var line = document.createElement("p"); line.textContent = chip.textContent.trim(); options.appendChild(line); });
      }
      var packageItem = wishConfig.packages && wishConfig.packages[0];
      (packageItem && packageItem.includes || []).forEach(function (feature) { appendItem(features, feature); });
    }

    var alreadyAdded = cartContains(kind, previewItem);
    addButton.textContent = alreadyAdded ? "Go to Cart →" : "Add to Cart ＋";
    addButton.setAttribute("data-cart-state", alreadyAdded ? "added" : "new");
    overlay.hidden = false;
    document.body.classList.add("quick-preview-open");
    window.requestAnimationFrame(function () { overlay.classList.add("is-open"); closeButton.focus(); });
  }
  function closePreview() {
    if (overlay.hidden) return;
    overlay.classList.remove("is-open");
    document.body.classList.remove("quick-preview-open");
    window.setTimeout(function () { overlay.hidden = true; if (returnFocus) returnFocus.focus(); }, 180);
  }

  productCards.forEach(function (card) {
    var productInfo = card.querySelector(".product-info");
    var trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "quick-preview-trigger";
    trigger.textContent = "Quick Preview";
    trigger.setAttribute("aria-haspopup", "dialog");
    trigger.addEventListener("click", function () { returnFocus = trigger; renderPreview(card, null); });
    var productLink = productInfo && productInfo.querySelector(".product-link");
    if (productLink) productLink.insertAdjacentElement("afterend", trigger);
    else if (productInfo) productInfo.appendChild(trigger);
  });

  window.HeartBiographyQuickPreview = {
    openSearchPreview: function (card, item, focusTarget) {
      returnFocus = focusTarget || document.activeElement;
      renderPreview(card, item || {});
    }
  };

  closeButton.addEventListener("click", closePreview);
  overlay.addEventListener("click", function (event) { if (event.target === overlay) closePreview(); });
  document.addEventListener("keydown", function (event) {
    if (overlay.hidden) return;
    if (event.key === "Escape") { closePreview(); return; }
    if (event.key !== "Tab") return;
    var focusable = Array.prototype.slice.call(dialog.querySelectorAll('a[href],button:not([disabled])'));
    if (!focusable.length) return;
    var first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  addButton.addEventListener("click", function () {
    if (!activeCard) return;
    if (addButton.getAttribute("data-cart-state") === "added") { window.location.href = "cart.html"; return; }
    // A product card has no selected category, package, or completed personalization.
    // Send the customer to its existing flow rather than creating an incomplete cart item.
    window.location.href = activePreviewItem && activePreviewItem.href || activeCard.getAttribute("data-product-page") || "editions.html";
  });
  window.addEventListener("hb-cart-updated", function () {
    if (!activeCard || overlay.hidden) return;
    var added = cartContains(productKind(activeCard, activePreviewItem), activePreviewItem);
    addButton.textContent = added ? "Go to Cart →" : "Add to Cart ＋";
    addButton.setAttribute("data-cart-state", added ? "added" : "new");
  });
}());
