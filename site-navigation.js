(function () {
  "use strict";

  var headers = Array.prototype.slice.call(document.querySelectorAll(".topbar, .wv-header"));
  var menus = Array.prototype.slice.call(document.querySelectorAll("[data-nav-dropdown]"));
  function isMobileViewport() {
    return window.matchMedia ? window.matchMedia("(max-width: 760px)").matches : window.innerWidth <= 760;
  }

  headers.forEach(function (header, index) {
    var brand = header.querySelector(".brand");
    var nav = header.querySelector("nav");
    var cta = header.querySelector(".top-cta, .header-cta");
    if (!brand || !nav || !cta) return;

    if (!brand.querySelector(".mobile-brand-mark")) {
      var mobileBrand = document.createElement("span");
      mobileBrand.className = "mobile-brand-mark";
      mobileBrand.innerHTML = '<span class="mobile-brand-icon"><img src="nav-logo.svg" alt="" aria-hidden="true"></span><span class="mobile-brand-name">Heart’s Biography</span>';
      brand.appendChild(mobileBrand);
    }

    var cartLink = nav.querySelector(".site-cart-link");
    if (!cartLink) {
      cartLink = document.createElement("a");
      cartLink.className = "site-cart-link";
      cartLink.href = "cart.html";
      cartLink.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 4h2l2.1 10.1a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.4L21 8H6"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg><span>Cart</span><span class="site-cart-count" aria-hidden="true" hidden>0</span>';
      nav.appendChild(cartLink);
    }
    var cartControlTray = nav.querySelector(".site-cart-control-tray");
    if (!cartControlTray) {
      cartControlTray = document.createElement("div");
      cartControlTray.className = "site-cart-control-tray";
      nav.insertBefore(cartControlTray, cartLink);
      cartControlTray.appendChild(cartLink);
    } else {
      if (cartLink.parentNode !== cartControlTray) cartControlTray.appendChild(cartLink);
      var oldPreviewToggle = cartControlTray.querySelector(".site-cart-preview-toggle");
      if (oldPreviewToggle) oldPreviewToggle.remove();
    }
    var searchTrigger = nav.querySelector(".site-search-trigger");
    if (!searchTrigger) {
      searchTrigger = document.createElement("button");
      searchTrigger.className = "site-search-trigger";
      searchTrigger.type = "button";
      searchTrigger.setAttribute("aria-label", "Search products");
      searchTrigger.setAttribute("aria-haspopup", "dialog");
      searchTrigger.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.2"></circle><path d="m15.3 15.3 5 5"></path></svg><span>Search</span>';
      nav.appendChild(searchTrigger);
    }
    nav.insertBefore(cartControlTray, searchTrigger);
    var cartBackdrop = document.createElement("div");
    cartBackdrop.className = "site-cart-backdrop";
    cartBackdrop.hidden = true;
    cartBackdrop.setAttribute("aria-hidden", "true");
    var cartPreview = document.createElement("aside");
    cartPreview.className = "site-cart-drawer";
    cartPreview.hidden = true;
    cartPreview.setAttribute("role", "dialog");
    cartPreview.setAttribute("aria-modal", "true");
    cartPreview.setAttribute("aria-label", "Your cart");
    cartPreview.innerHTML = '<header class="site-cart-drawer-header"><h2>YOUR CART <span class="site-cart-drawer-count"></span></h2><button type="button" class="site-cart-preview-close" aria-label="Close cart drawer">×</button></header><div class="site-cart-preview-content"></div><footer class="site-cart-drawer-footer"><form class="site-cart-promo" novalidate><label for="site-cart-promo-code">Promo Code</label><div><input id="site-cart-promo-code" name="promoCode" type="text" autocomplete="off" placeholder="Enter promo code"><button type="submit">Apply</button></div><p class="site-cart-promo-feedback" role="status" aria-live="polite"></p></form><dl class="site-cart-preview-billing"></dl><a class="site-cart-preview-full" href="cart.html">Review Cart &amp; Checkout <span aria-hidden="true">→</span></a></footer>';
    var titlePreview = document.createElement("div");
    titlePreview.className = "site-cart-title-preview";
    titlePreview.hidden = true;
    titlePreview.setAttribute("role", "dialog");
    titlePreview.setAttribute("aria-modal", "true");
    titlePreview.setAttribute("aria-label", "Product title preview");
    titlePreview.innerHTML = '<button type="button" class="site-cart-title-preview-close" aria-label="Close title preview">×</button><div class="site-cart-title-preview-card"><p class="site-cart-title-preview-name"></p></div>';
    document.body.appendChild(cartBackdrop);
    document.body.appendChild(cartPreview);
    document.body.appendChild(titlePreview);
    var cartPreviewContent = cartPreview.querySelector(".site-cart-preview-content");
    var cartPreviewTitle = cartPreview.querySelector(".site-cart-drawer-count");
    var promoFeedback = cartPreview.querySelector(".site-cart-promo-feedback");
    function money(value) { return "BDT " + Number(value || 0).toLocaleString("en-BD"); }
    function knownPrice(item) { return typeof item.total === "number" && Number.isFinite(item.total) ? money(item.total) : "Price confirmation required"; }
    function productTitle(item) {
      return item.title || (item.kind === "memory" ? (item.categoryKey || (item.categories || ["Memory Edition"])[0]) + " Edition" : "WishVerse");
    }
    function quickPreviewTitle(item) {
      if (item.kind === "wishverse" && Array.isArray(item.categories) && item.categories.length) return item.categories.join(" · ");
      return productTitle(item);
    }
    function itemOptions(item) {
      var lines = [];
      if (item.kind === "memory") {
        lines.push((item.categories || []).join(", ") || "Memory Edition");
        if (item.packageName) lines.push(item.packageName);
        if (item.hardCopy) lines.push("Hard Copy: " + item.hardCopy);
      } else {
        lines.push((item.categories || []).join(", ") || "Digital Wish");
        if (item.orderPlacedBy) lines.push("Order by " + item.orderPlacedBy);
      }
      return lines;
    }
    function renderCartPreview() {
      var saved = window.HeartBiographyCart ? window.HeartBiographyCart.get() : { items: [] };
      var items = saved.items || [];
      var totals = window.HeartBiographyCart ? window.HeartBiographyCart.summarize(items) : { subtotal: 0, discount: 0, knownTotal: 0, allPricesKnown: true };
      cartPreviewTitle.textContent = "(" + items.length + (items.length === 1 ? " item" : " items") + ")";
      cartPreviewContent.textContent = "";
      if (!items.length) {
        var empty = document.createElement("div"); empty.className = "site-cart-preview-empty";
        var emptyTitle = document.createElement("h3"); emptyTitle.textContent = "Your cart is waiting"; empty.appendChild(emptyTitle);
        var emptyText = document.createElement("p"); emptyText.textContent = "Your selected Memory Editions and WishVerse creations will appear here."; empty.appendChild(emptyText);
        cartPreviewContent.appendChild(empty);
      } else {
        var list = document.createElement("div"); list.className = "site-cart-preview-items";
        items.forEach(function (item) {
          var row = document.createElement("article"); row.className = "site-cart-preview-item";
          var symbol = document.createElement("div"); symbol.className = "site-cart-item-symbol"; symbol.setAttribute("aria-hidden", "true"); symbol.textContent = item.kind === "memory" ? "M" : "W"; row.appendChild(symbol);
          var info = document.createElement("div"); info.className = "site-cart-item-info";
          var type = document.createElement("p"); type.className = "site-cart-item-type"; type.textContent = item.kind === "memory" ? "THE MEMORY EDITIONS" : "THE WISHVERSE"; info.appendChild(type);
          var name = document.createElement("h3"); name.textContent = productTitle(item); info.appendChild(name);
          itemOptions(item).forEach(function (option) { var detail = document.createElement("p"); detail.className = "site-cart-item-detail"; detail.textContent = option; info.appendChild(detail); });
          var itemMeta = document.createElement("div"); itemMeta.className = "site-cart-item-meta";
          var quantity = document.createElement("span"); quantity.textContent = "Qty 1"; itemMeta.appendChild(quantity);
          var amount = document.createElement("strong"); amount.textContent = knownPrice(item); itemMeta.appendChild(amount); info.appendChild(itemMeta);
          row.appendChild(info);
          var actions = document.createElement("div"); actions.className = "site-cart-item-actions";
          var remove = document.createElement("button"); remove.type = "button"; remove.className = "site-cart-item-remove"; remove.setAttribute("data-cart-remove", item.id); remove.setAttribute("aria-label", "Remove " + productTitle(item) + " from cart"); remove.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m3 3v7m6-7v7"/></svg>'; actions.appendChild(remove);
          var quick = document.createElement("button"); quick.type = "button"; quick.className = "site-cart-item-quick-preview"; quick.textContent = "Quick Preview"; quick.setAttribute("data-cart-title-preview", item.id); actions.appendChild(quick);
          row.appendChild(actions); list.appendChild(row);
        });
        cartPreviewContent.appendChild(list);
      }
      var billing = cartPreview.querySelector(".site-cart-preview-billing"); billing.textContent = "";
      function totalRow(label, value, final) { var wrap = document.createElement("div"); if (final) wrap.className = "is-final"; var dt = document.createElement("dt"); dt.textContent = label; var dd = document.createElement("dd"); dd.textContent = value; wrap.appendChild(dt); wrap.appendChild(dd); billing.appendChild(wrap); }
      var subtotal = items.length ? (totals.allPricesKnown ? money(totals.subtotal) : (totals.subtotal ? money(totals.subtotal) + " + unpriced item" : "BDT subtotal to be confirmed")) : money(0);
      var finalTotal = items.length ? (totals.allPricesKnown ? money(totals.knownTotal) : (totals.knownTotal ? money(totals.knownTotal) + " + price confirmation" : "BDT amount to be confirmed")) : money(0);
      totalRow("Subtotal", subtotal, false);
      if (totals.discount) totalRow("Existing discounts", "−" + money(totals.discount), false);
      totalRow("Total", finalTotal, true);
      cartLink.setAttribute("aria-expanded", cartPreview.hidden ? "false" : "true");
    }
    function openCartPreview() {
      renderCartPreview();
      cartBackdrop.hidden = false;
      cartPreview.hidden = false;
      document.body.classList.add("site-cart-drawer-open");
      window.requestAnimationFrame(function () { cartBackdrop.classList.add("is-open"); cartPreview.classList.add("is-open"); });
      cartLink.setAttribute("aria-expanded", "true");
      window.setTimeout(function () { cartPreview.querySelector(".site-cart-preview-close").focus(); }, 0);
    }
    function closeTitlePreview() { titlePreview.hidden = true; }
    function closeCartPreview() {
      cartPreview.classList.remove("is-open"); cartBackdrop.classList.remove("is-open");
      document.body.classList.remove("site-cart-drawer-open");
      cartLink.setAttribute("aria-expanded", "false");
      closeTitlePreview();
      window.setTimeout(function () { if (!cartPreview.classList.contains("is-open")) { cartPreview.hidden = true; cartBackdrop.hidden = true; } }, 280);
    }
    cartLink.setAttribute("aria-haspopup", "dialog");
    cartLink.setAttribute("aria-expanded", "false");
    cartLink.addEventListener("click", function (event) { event.preventDefault(); event.stopPropagation(); if (cartPreview.hidden) openCartPreview(); else closeCartPreview(); });
    cartPreview.querySelector(".site-cart-preview-close").addEventListener("click", closeCartPreview);
    cartBackdrop.addEventListener("click", closeCartPreview);
    cartPreview.addEventListener("click", function (event) {
      event.stopPropagation();
      var removeButton = event.target.closest("[data-cart-remove]");
      if (removeButton && window.HeartBiographyCart) { window.HeartBiographyCart.removeItem(removeButton.getAttribute("data-cart-remove")); renderCartPreview(); return; }
      var previewButton = event.target.closest("[data-cart-title-preview]");
      if (previewButton) {
        var entry = (window.HeartBiographyCart.get().items || []).find(function (item) { return item.id === previewButton.getAttribute("data-cart-title-preview"); });
        if (!entry) return;
        titlePreview.querySelector(".site-cart-title-preview-name").textContent = quickPreviewTitle(entry);
        titlePreview.classList.toggle("is-wishverse", entry.kind === "wishverse");
        titlePreview.hidden = false;
        titlePreview.querySelector(".site-cart-title-preview-close").focus();
      }
    });
    titlePreview.querySelector(".site-cart-title-preview-close").addEventListener("click", closeTitlePreview);
    titlePreview.addEventListener("click", function (event) { if (event.target === titlePreview) closeTitlePreview(); });
    cartPreview.querySelector(".site-cart-promo").addEventListener("submit", function (event) {
      event.preventDefault();
      var code = cartPreview.querySelector("#site-cart-promo-code").value.trim();
      promoFeedback.textContent = code ? "Promo codes are not configured yet. Your total has not changed." : "Enter a promo code to apply.";
      promoFeedback.classList.toggle("is-error", !!code);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !titlePreview.hidden) { closeTitlePreview(); return; }
      if (event.key === "Escape" && !cartPreview.hidden) { closeCartPreview(); cartLink.focus(); }
    });
    function refreshCartCount() {
      var count = 0;
      try {
        var cart = JSON.parse(window.localStorage.getItem("heartsBiographyUnifiedCart") || "null");
        count = cart && Array.isArray(cart.items) ? cart.items.length : 0;
      } catch (error) { /* Keep the count at zero when storage is unavailable. */ }
      var badge = cartLink.querySelector(".site-cart-count");
      if (badge) { badge.textContent = String(count); badge.hidden = count === 0; }
      cartLink.setAttribute("aria-label", "Open cart preview, " + count + (count === 1 ? " item" : " items"));
      if (!cartPreview.hidden) renderCartPreview();
    }
    refreshCartCount();
    window.addEventListener("storage", refreshCartCount);
    window.addEventListener("hb-cart-updated", refreshCartCount);
    header.addEventListener("click", function (event) {
      var link = event.target.closest && event.target.closest("a");
      if (!link) return;
      var changesPage = false;
      try { changesPage = new URL(link.href, window.location.href).pathname !== window.location.pathname; } catch (error) { /* Keep the current edit context for unparseable links. */ }
      if (changesPage && !link.classList.contains("site-cart-link")) {
        try { window.localStorage.removeItem("heartsBiographyCartEditId"); } catch (error) { /* Cart state remains intact. */ }
      }
    });

    var panel = document.createElement("div");
    panel.className = "mobile-menu-panel";
    panel.id = "mobile-navigation-panel-" + (index + 1);
    panel.appendChild(nav);
    panel.appendChild(cta);

    var productMenus = Array.prototype.slice.call(nav.querySelectorAll(".nav-dropdown"));
    productMenus.forEach(function (productMenu) {
      var productLink = productMenu.querySelector("a");
      var submenu = productMenu.querySelector(".nav-submenu");
      if (!productLink || !submenu) return;
      if (!submenu.id) submenu.id = "mobile-product-submenu-" + (index + 1) + "-" + productMenus.indexOf(productMenu);

      var categoryToggle = productMenu.querySelector(".nav-dropdown-toggle");
      if (!categoryToggle) {
        categoryToggle = document.createElement("button");
        categoryToggle.className = "nav-dropdown-toggle mobile-only-category-toggle";
        categoryToggle.type = "button";
        productMenu.insertBefore(categoryToggle, submenu);
      }
      categoryToggle.innerHTML = '<svg aria-hidden="true" viewBox="0 0 20 20"><path d="m5.5 7.5 4.5 4.5 4.5-4.5"/></svg>';
      categoryToggle.setAttribute("aria-expanded", "false");
      categoryToggle.setAttribute("aria-controls", submenu.id);
      var isWishVerse = productMenu.classList.contains("wishverse-nav");
      var productName = isWishVerse ? "WishVerse" : "The Memory Editions";
      categoryToggle.setAttribute("aria-label", "Show " + productName + " categories");

      if (!submenu.querySelector(".mobile-product-destination")) {
        var destination = document.createElement("a");
        destination.className = "mobile-product-destination";
        destination.href = productLink.getAttribute("href");
        destination.textContent = isWishVerse ? "Open WishVerse" : "Open The Memory Editions";
        submenu.appendChild(destination);
      }

      function collapseOtherProducts(except) {
        productMenus.forEach(function (other) {
          var expanded = other === except;
          other.classList.toggle("is-mobile-expanded", expanded);
          var otherToggle = other.querySelector(".nav-dropdown-toggle");
          if (otherToggle) otherToggle.setAttribute("aria-expanded", expanded ? "true" : "false");
        });
      }
      function toggleProduct() {
        var shouldExpand = !productMenu.classList.contains("is-mobile-expanded");
        collapseOtherProducts(shouldExpand ? productMenu : null);
      }

      categoryToggle.addEventListener("click", function (event) {
        if (!isMobileViewport()) return;
        event.preventDefault();
        event.stopPropagation();
        toggleProduct();
      });
    });

    function collapseProductMenus() {
      productMenus.forEach(function (productMenu) {
        productMenu.classList.remove("is-mobile-expanded");
        var categoryToggle = productMenu.querySelector(".nav-dropdown-toggle");
        if (categoryToggle) categoryToggle.setAttribute("aria-expanded", "false");
      });
    }

    var toggle = document.createElement("button");
    toggle.className = "mobile-menu-toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-label", "Open navigation menu");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", panel.id);
    toggle.innerHTML = '<span></span><span></span><span></span>';
    header.insertBefore(toggle, brand.nextSibling);
    header.appendChild(panel);

    function syncMobileCartVisibility() {
      if (isMobileViewport()) {
        header.classList.add("has-mobile-cart");
        if (cartControlTray.parentNode !== header) header.insertBefore(cartControlTray, toggle);
        if (searchTrigger.parentNode !== header) header.insertBefore(searchTrigger, toggle);
      } else if (cartControlTray.parentNode !== nav) {
        header.classList.remove("has-mobile-cart");
        if (searchTrigger.parentNode !== nav) nav.appendChild(searchTrigger);
        nav.insertBefore(cartControlTray, searchTrigger);
      } else {
        header.classList.remove("has-mobile-cart");
        if (searchTrigger.parentNode !== nav) nav.appendChild(searchTrigger);
        if (cartControlTray.parentNode !== nav) nav.insertBefore(cartControlTray, searchTrigger);
      }
    }
    syncMobileCartVisibility();
    window.addEventListener("resize", syncMobileCartVisibility);

    toggle.addEventListener("click", function () {
      var open = !header.classList.contains("is-mobile-menu-open");
      header.classList.toggle("is-mobile-menu-open", open);
      if (!open) collapseProductMenus();
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
    });

    panel.addEventListener("click", function (event) {
      var link = event.target.closest && event.target.closest("a");
      if (link && !link.hasAttribute("data-mobile-accordion-trigger")) {
        collapseProductMenus();
        header.classList.remove("is-mobile-menu-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open navigation menu");
      }
    });

    document.addEventListener("click", function (event) {
      if (!header.contains(event.target)) {
        collapseProductMenus();
        header.classList.remove("is-mobile-menu-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open navigation menu");
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && header.classList.contains("is-mobile-menu-open")) {
        collapseProductMenus();
        header.classList.remove("is-mobile-menu-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open navigation menu");
        toggle.focus();
      }
    });
  });

  menus.forEach(function (menu) {
    var toggle = menu.querySelector(".nav-dropdown-toggle");
    if (!toggle) return;
    toggle.addEventListener("click", function (event) {
      if (isMobileViewport()) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      var open = !menu.classList.contains("is-open");
      menus.forEach(function (other) {
        other.classList.remove("is-open");
        var button = other.querySelector(".nav-dropdown-toggle");
        if (button) button.setAttribute("aria-expanded", "false");
      });
      if (open) {
        menu.classList.add("is-open");
        toggle.setAttribute("aria-expanded", "true");
      }
    });
  });

  document.addEventListener("click", function (event) {
    menus.forEach(function (menu) {
      if (!menu.contains(event.target)) {
        menu.classList.remove("is-open");
        var toggle = menu.querySelector(".nav-dropdown-toggle");
        if (toggle) toggle.setAttribute("aria-expanded", "false");
      }
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    menus.forEach(function (menu) {
      menu.classList.remove("is-open");
      var toggle = menu.querySelector(".nav-dropdown-toggle");
      if (toggle) {
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  });
}());

/* Load the numbered page inspector on every page that shares this navigation. */
(function () {
  if (window.__hbPageElementInspectorRequested) return;
  window.__hbPageElementInspectorRequested = true;
  /* Performance: the inspector is a design/debug tool, so it only loads on request.
     Open any page with ?inspect=1 to turn it on (stays on for this browser session),
     or ?inspect=0 to turn it off. */
  var wantInspector = false;
  try {
    var qs = new URLSearchParams(window.location.search).get("inspect");
    if (qs === "1") window.sessionStorage.setItem("hbInspector", "1");
    if (qs === "0") window.sessionStorage.removeItem("hbInspector");
    wantInspector = window.sessionStorage.getItem("hbInspector") === "1";
  } catch (e) { wantInspector = false; }
  if (!wantInspector) return;
  var navigationScript = document.currentScript;
  if (!navigationScript || !navigationScript.src) {
    var scripts = document.querySelectorAll('script[src*="site-navigation.js"]');
    navigationScript = scripts[scripts.length - 1];
  }
  var base = navigationScript && navigationScript.src ? new URL(".", navigationScript.src) : new URL(".", document.baseURI);
  if (!document.querySelector('link[data-hb-inspector-style]')) {
    var style = document.createElement("link");
    style.rel = "stylesheet";
    style.href = new URL("site-element-inspector.css?v=1", base).href;
    style.setAttribute("data-hb-inspector-style", "true");
    document.head.appendChild(style);
  }
  var inspector = document.createElement("script");
  inspector.src = new URL("site-element-inspector.js?v=1", base).href;
  inspector.defer = true;
  document.head.appendChild(inspector);
}());
