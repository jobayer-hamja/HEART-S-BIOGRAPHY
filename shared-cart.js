(function () {
  "use strict";
  var CART_KEY = "heartsBiographyUnifiedCart";
  var EDIT_KEY = "heartsBiographyCartEditId";
  var WISH_STATE_KEY = "heartsBiographyWishVerseOrder";

  function read() {
    try {
      var value = JSON.parse(window.localStorage.getItem(CART_KEY) || "null");
      if (value && Array.isArray(value.items)) return { items: value.items, checkout: value.checkout || {} };
    } catch (error) { /* Use an empty cart when stored data is unavailable. */ }
    return { items: [], checkout: {} };
  }
  function write(cart) {
    try {
      window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
      window.dispatchEvent(new Event("hb-cart-updated"));
      return true;
    } catch (error) { return false; }
  }
  function id() {
    return "hb-cart-" + (window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : Date.now() + "-" + Math.random().toString(36).slice(2));
  }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function addItem(item) {
    var cart = read();
    var activeEditId = "";
    try { activeEditId = window.localStorage.getItem(EDIT_KEY) || ""; } catch (error) { /* Treat as a new item. */ }
    var next = Object.assign({}, clone(item), { id: item.id || id(), updatedAt: new Date().toISOString() });
    var existing = cart.items.findIndex(function (entry) { return entry.id === activeEditId && entry.kind === next.kind; });
    if (existing >= 0) { next.id = activeEditId; cart.items[existing] = next; }
    else { next.createdAt = next.createdAt || next.updatedAt; cart.items.push(next); }
    Object.keys(next.checkoutPrefill || {}).forEach(function (key) {
      if (!cart.checkout[key] && next.checkoutPrefill[key]) cart.checkout[key] = next.checkoutPrefill[key];
    });
    if (!write(cart)) return null;
    try { window.localStorage.removeItem(EDIT_KEY); } catch (error) { /* Added item remains saved. */ }
    return next;
  }
  function removeItem(itemId) {
    var cart = read();
    cart.items = cart.items.filter(function (item) { return item.id !== itemId; });
    try { if (window.localStorage.getItem(EDIT_KEY) === itemId) window.localStorage.removeItem(EDIT_KEY); } catch (error) { /* The removed item is already absent from the cart. */ }
    return write(cart);
  }
  function clear() {
    try { window.localStorage.removeItem(EDIT_KEY); } catch (error) { /* Continue clearing the saved cart. */ }
    return write({ items: [], checkout: {} });
  }
  function saveCheckout(checkout) {
    var cart = read(); cart.checkout = Object.assign({}, checkout); return write(cart);
  }
  function summarize(items) {
    var result = { subtotal: 0, discount: 0, knownTotal: 0, allPricesKnown: true };
    (items || []).forEach(function (item) {
      if (typeof item.total === "number" && Number.isFinite(item.total)) result.knownTotal += item.total;
      else result.allPricesKnown = false;
      if (typeof item.regularTotal === "number" && Number.isFinite(item.regularTotal)) result.subtotal += item.regularTotal;
      else if (typeof item.total === "number" && Number.isFinite(item.total)) result.subtotal += item.total;
      if (typeof item.discount === "number" && Number.isFinite(item.discount)) result.discount += item.discount;
    });
    return result;
  }
  function beginEdit(itemId) {
    var cart = read();
    var item = cart.items.find(function (entry) { return entry.id === itemId; });
    if (!item) return false;
    try {
      if (item.kind === "memory") {
        var draft = clone(item.payload || {});
        var category = item.categoryKey || draft.category;
        if (!category) return false;
        window.localStorage.setItem(EDIT_KEY, item.id);
        window.localStorage.setItem("hbMagazineDraft:" + category, JSON.stringify(draft));
        var query = new URLSearchParams({ category: category, package: item.packageId || draft.packageId || "", hardCopy: item.hardCopySelection || draft.hardCopySelection || "digital-only" });
        window.location.href = "magazine-personalize.html?" + query.toString();
        return true;
      }
      if (item.kind === "wishverse") {
        var wishState = clone(item.payload && item.payload.state || {});
        window.localStorage.setItem(EDIT_KEY, item.id);
        wishState.categories = item.categories.slice();
        wishState.wishes = clone(item.wishes || {});
        wishState.customerFullName = item.orderPlacedBy || wishState.customerFullName || "";
        wishState.started = true;
        wishState.stage = "personalization";
        wishState.step = 1;
        wishState.furthestStep = 1;
        window.sessionStorage.setItem(WISH_STATE_KEY, JSON.stringify(wishState));
        window.location.href = "wishverse.html#builder";
        return true;
      }
    } catch (error) { return false; }
    return false;
  }
  window.HeartBiographyCart = {
    key: CART_KEY,
    editKey: EDIT_KEY,
    get: read,
    addItem: addItem,
    removeItem: removeItem,
    clear: clear,
    saveCheckout: saveCheckout,
    summarize: summarize,
    beginEdit: beginEdit
  };
}());
