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
  function makeId() { return "date-asset-" + (window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : Date.now() + "-" + Math.random().toString(36).slice(2)); }
  window.HeartBiographyDateAssets = {
    saveAsset: function (file, id) { var assetId=id||makeId(); return withStore("readwrite", function (store) { return store.put({ id:assetId,name:file.name,type:file.type,size:file.size,blob:file,updatedAt:Date.now() }); }).then(function () { return this.getAsset(assetId); }.bind(this)); },
    getAsset: function (id) { if (!id) return Promise.resolve(null); return withStore("readonly", function (store) { return store.get(id); }); },
    removeAsset: function (id) { if (!id) return Promise.resolve(); return withStore("readwrite", function (store) { return store.delete(id); }); },
    getAssets: function (ids) { return Promise.all((ids || []).map(function (entry) { return window.HeartBiographyDateAssets.getAsset(entry.id).then(function (record) { return { field: entry.field, record: record }; }); })); },
    acceptedAudio: function (file) { return !!file && (/^audio\//i.test(file.type) || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(file.name || "")) && file.size <= 20 * 1024 * 1024; }
  };
}());
