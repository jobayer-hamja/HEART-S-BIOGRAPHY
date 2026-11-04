(function () {
  "use strict";
  var DB_NAME = "heartBiographyDateInvitationAssets";
  var STORE = "photos";
  function openDatabase() {
    return new Promise(function (resolve, reject) {
      if (!window.indexedDB) { reject(new Error("Browser file storage is unavailable.")); return; }
      var request = window.indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = function () { var db = request.result; if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" }); };
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error || new Error("Could not open file storage.")); };
    });
  }
  function withStore(mode, action) {
    return openDatabase().then(function (db) {
      return new Promise(function (resolve, reject) {
        var transaction = db.transaction(STORE, mode), store = transaction.objectStore(STORE), request;
        try { request = action(store); } catch (error) { db.close(); reject(error); return; }
        request.onsuccess = function () { resolve(request.result); };
        request.onerror = function () { reject(request.error || new Error("File storage operation failed.")); };
        transaction.oncomplete = function () { db.close(); };
        transaction.onerror = function () { db.close(); reject(transaction.error || new Error("File storage transaction failed.")); };
      });
    });
  }
  /* Phones: big camera photos (8-12 MB) are shrunk to max 1600px before they are stored.
     Keeps preview and checkout fast. Audio / small images / unsupported formats are stored as-is. */
  var outType = null;
  function pickType() {
    if (outType) return outType;
    var t = document.createElement("canvas"); t.width = t.height = 1;
    outType = t.toDataURL("image/webp").indexOf("data:image/webp") === 0 ? "image/webp" : "image/jpeg";
    return outType;
  }
  function shrinkImage(file) {
    try {
      if (!file || !/^image\/(jpe?g|png|webp|heic|heif)$/i.test(file.type || "") || file.size < 350 * 1024 || !window.createImageBitmap) return Promise.resolve(file);
      return window.createImageBitmap(file, { imageOrientation: "from-image" }).then(function (bmp) {
        var scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
        var w = Math.max(1, Math.round(bmp.width * scale)), h = Math.max(1, Math.round(bmp.height * scale));
        var canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h;
        var ctx = canvas.getContext("2d"), type = pickType();
        if (type === "image/jpeg") { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h); }
        ctx.drawImage(bmp, 0, 0, w, h); if (bmp.close) bmp.close();
        return new Promise(function (resolve) {
          canvas.toBlob(function (blob) {
            if (!blob || blob.size >= file.size) { resolve(file); return; }
            var base = (file.name || "photo").replace(/\.[^.]+$/, "");
            try { resolve(new File([blob], base + (type === "image/webp" ? ".webp" : ".jpg"), { type: type, lastModified: Date.now() })); }
            catch (e) { resolve(file); }
          }, type, 0.82);
        });
      }).catch(function () { return file; });
    } catch (e) { return Promise.resolve(file); }
  }
  function makeId() { return "date-asset-" + (window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : Date.now() + "-" + Math.random().toString(36).slice(2)); }
  window.HeartBiographyDateAssets = {
    saveAsset: function (file, id) { var assetId=id||makeId(); return shrinkImage(file).then(function (f) { return withStore("readwrite", function (store) { return store.put({ id:assetId,name:f.name,type:f.type,size:f.size,blob:f,updatedAt:Date.now() }); }); }).then(function () { return this.getAsset(assetId); }.bind(this)); },
    getAsset: function (id) { if (!id) return Promise.resolve(null); return withStore("readonly", function (store) { return store.get(id); }); },
    removeAsset: function (id) { if (!id) return Promise.resolve(); return withStore("readwrite", function (store) { return store.delete(id); }); },
    getAssets: function (ids) { return Promise.all((ids || []).map(function (entry) { return window.HeartBiographyDateAssets.getAsset(entry.id).then(function (record) { return { field: entry.field, record: record }; }); })); },
    acceptedAudio: function (file) { return !!file && (/^audio\//i.test(file.type) || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(file.name || "")) && file.size <= 20 * 1024 * 1024; }
  };
}());
