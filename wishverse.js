(function () {
  "use strict";
  var config = window.WISHVERSE_CONFIG || {};
  var validCategories = Array.prototype.map.call(document.querySelectorAll("[data-category]"), function (card) { return card.getAttribute("data-category"); });
  var categoryCards = Array.prototype.slice.call(document.querySelectorAll("[data-category]"));
  var storageKey = "heartsBiographyWishVerseOrder";
  var form = document.getElementById("wish-form");
  var categoryProcess = document.querySelector(".category-section");
  var categorySelectionView = document.getElementById("wish-category-selection-view");
  var heroSection = document.querySelector(".wv-hero");
  var builderSection = document.getElementById("builder");
  var builderShell = document.getElementById("wish-builder-shell");
  var selectionContinue = document.getElementById("continue-to-personalization");
  var selectionError = document.getElementById("wish-selection-error");
  var selectionSummary = document.querySelector("[data-wish-order-summary]");
  var currentStep = 1;
  var furthestStep = 1;
  var state = loadState();
  var query = new URLSearchParams(window.location.search);
  var requestedExperience = typeof config.getSingleWishExperience === "function" ? config.getSingleWishExperience(query.get("wish")) : null;
  var directDateInvitationStart = query.get("wish") === "date-invitation";
  var directWishCategory = requestedExperience ? requestedExperience.category : (query.get("birthday") === "personalize" ? "Birthday Celebration" : "");
  var directWishStart = !!directWishCategory;
  var wishVerseCategoryStart = query.get("view") === "categories";
  if (directWishCategory) {
    state.categories = [directWishCategory];
    state.wishes[directWishCategory] = Object.assign(blankWish(), state.wishes[directWishCategory] || {});
    state.started = true;
    state.stage = "personalization";
    state.step = 1;
    state.furthestStep = 1;
  } else if (wishVerseCategoryStart) {
    state.categories = [];
    state.started = false;
    state.stage = "selection";
    state.step = 1;
    state.furthestStep = 1;
  } else if (!state.started) {
    state.categories = [];
    state.stage = "selection";
    state.step = 1;
    state.furthestStep = 1;
  }
  var dateInvitationState = loadDateInvitationState();
  var dateInvitationStage = dateInvitationState.stage || "packages";
  var dateInvitationFlow = document.createElement("section");
  dateInvitationFlow.className = "date-invitation-flow";
  dateInvitationFlow.hidden = true;
  dateInvitationFlow.id = "date-invitation-package-flow";
  dateInvitationFlow.setAttribute("aria-labelledby", "date-invitation-flow-title");
  document.querySelector("main").insertBefore(dateInvitationFlow, heroSection);

  function loadDateInvitationState() {
    var initial = { packageId: "", fields: { introMessages: [""] }, assetIds: {}, step: 0, stage: "packages" };
    try {
      var saved = JSON.parse(window.sessionStorage.getItem(storageKey + ":date-invitation") || "null");
      if (saved && typeof saved === "object") {
        initial.packageId = String(saved.packageId || "");
        initial.fields = saved.fields && typeof saved.fields === "object" ? saved.fields : {};
        if (!Array.isArray(initial.fields.introMessages)) initial.fields.introMessages = initial.fields.introductoryMessages ? [String(initial.fields.introductoryMessages)] : [""];
        var savedAssets=saved.assetIds&&typeof saved.assetIds==="object"?saved.assetIds:(saved.photoAssetIds&&typeof saved.photoAssetIds==="object"?saved.photoAssetIds:{});
        initial.assetIds={};["backgroundMusic","introMusic"].forEach(function(key){if(savedAssets[key])initial.assetIds[key]=savedAssets[key];});
        initial.step = Number.isInteger(saved.step) && saved.step >= 0 ? saved.step : 0;
        initial.stage = ["packages", "personalization", "review"].indexOf(saved.stage) >= 0 ? saved.stage : "packages";
      }
    } catch (error) { /* Keep a fresh Date Invitation draft when session storage is unavailable. */ }
    return initial;
  }
  function saveDateInvitationState() {
    dateInvitationState.stage = dateInvitationStage;
    try { window.sessionStorage.setItem(storageKey + ":date-invitation", JSON.stringify(dateInvitationState)); } catch (error) { /* Keep the active Date Invitation order in memory. */ }
  }
  function dateInvitationPackages() { return Array.isArray(config.dateInvitationPackages) ? config.dateInvitationPackages : []; }
  function dateInvitationPackage() { return typeof config.getDateInvitationPackage === "function" ? config.getDateInvitationPackage(dateInvitationState.packageId) : null; }
  function dateValue(key) { return String(dateInvitationState.fields[key] || ""); }
  function dateField(key, label, type, required, placeholder, accept) {
    var value = dateValue(key);
    var safeKey = "date-invitation-" + slug(key);
    var requiredAttr = required ? " required" : "";
    var control = type === "textarea"
      ? '<textarea id="' + safeKey + '" data-date-field="' + escapeHtml(key) + '" maxlength="1000" rows="3" placeholder="' + escapeHtml(placeholder || "") + '"' + requiredAttr + '>' + escapeHtml(value) + '</textarea>'
      : '<input id="' + safeKey + '" data-date-field="' + escapeHtml(key) + '" type="' + type + '"' + (type === "file" ? ' accept="' + escapeHtml(accept || "") + '"' : ' value="' + escapeHtml(value) + '"') + requiredAttr + '>';
    return '<label class="date-invitation-field' + (type === "textarea" ? ' date-invitation-wide' : '') + '" for="' + safeKey + '"><span>' + escapeHtml(label) + (required ? ' <b aria-hidden="true">*</b>' : '') + '</span>' + control + (type === "file" ? '<small class="date-file-name" data-file-for="' + escapeHtml(key) + '">' + escapeHtml(value || "Choose a file") + '</small>' : '') + '</label>';
  }
  function memoryFields(index) {
    var prefix = "memory" + index;
    return '<div class="date-memory-fields"><h3>Previous Date Memory ' + index + '</h3><div class="date-invitation-form-grid">' +
      dateField(prefix + "Date", "Date", "date", true) + dateField(prefix + "Location", "Location", "text", true, "Where did you go?") +
      dateField(prefix + "Description", "Description", "textarea", true, "Describe this memory") + '<p class="date-memory-photo-instructions">After placing your order, send exactly 3 photos for this memory in the same WhatsApp conversation: 1 Cover Photo + 2 Memory Photos.</p></div></div>';
  }
  function renderDateInvitationFlow() {
    var selectedPackage = dateInvitationPackage(), list = dateInvitationPackages();
    dateInvitationFlow.innerHTML = '<nav class="date-invitation-steps" aria-label="Date Invitation order steps"><span class="' + (dateInvitationStage === "packages" ? "is-active" : "") + '">01 · Package</span><i aria-hidden="true">→</i><span class="' + (dateInvitationStage === "personalization" ? "is-active" : "") + '">02 · Personalization</span><i aria-hidden="true">→</i><span class="' + (dateInvitationStage === "review" ? "is-active" : "") + '">03 · Order Review</span></nav><button type="button" class="date-invitation-back-categories" data-date-back-categories>← Back to WishVerse Categories</button>' +
      (dateInvitationStage === "packages" ? renderDatePackageSelection(list) : "") + (dateInvitationStage === "personalization" ? renderDatePersonalization(selectedPackage) : "") + (dateInvitationStage === "review" ? renderDateReview(selectedPackage) : "");
    wireDateInvitationFlow();
  }
  function renderDatePackageSelection(packages) {
    var selectedPackage = dateInvitationPackage();
    var summary = selectedPackage ? '<section class="date-selected-package-summary" aria-live="polite"><div class="date-selected-package-overview"><span>YOUR SELECTED PACKAGE</span><h3>' + escapeHtml(selectedPackage.name) + '</h3><p>' + escapeHtml(selectedPackage.description) + '</p><strong>' + escapeHtml(formatPrice(selectedPackage.price)) + '</strong></div><div class="date-selected-package-features"><h4>What\'s Included</h4><ul>' + effectiveDatePackageFeatures(packages, packages.indexOf(selectedPackage)).map(function (feature) { return '<li>' + escapeHtml(feature) + '</li>'; }).join('') + '</ul></div></section>' : '<p class="date-package-selection-hint" aria-live="polite">Select a package to see its details here.</p>';
    return '<header class="date-invitation-heading"><p class="eyebrow dark-eyebrow">THE WISHVERSE · DATE INVITATION</p><h2 id="date-invitation-flow-title">Choose your experience.</h2><p>Choose a Date Invitation package to personalize.</p></header><div class="date-package-grid">' + packages.map(function (item) {
      var selected = dateInvitationState.packageId === item.id;
      return '<article class="date-package-card' + (selected ? ' is-selected' : '') + '" data-date-package-card="' + escapeHtml(item.id) + '">' + (selected ? '<span class="date-package-selected-badge">SELECTED ✓</span>' : '') + '<p class="date-package-kicker">DATE INVITATION · PACKAGE</p><h3>' + escapeHtml(item.name) + '</h3><p class="date-package-description">' + escapeHtml(item.description) + '</p><ul>' + item.includes.map(function (feature) { return '<li>' + escapeHtml(feature) + '</li>'; }).join("") + '</ul><p class="date-package-price">' + escapeHtml(formatPrice(item.price)) + '</p><button class="btn btn-dark date-package-select" type="button" data-select-date-package="' + escapeHtml(item.id) + '" aria-pressed="' + (selected ? "true" : "false") + '">' + (selected ? "PACKAGE SELECTED" : "SELECT PACKAGE") + ' <span aria-hidden="true">✓</span></button></article>';
    }).join("") + '</div>' + summary + renderDatePackageComparison(packages) + '<p class="date-package-error" role="alert" aria-live="polite"></p><div class="date-package-continue-wrap"><button class="btn btn-dark date-package-continue" type="button" data-date-continue ' + (selectedPackage ? '' : 'disabled') + '>CONTINUE TO PERSONALIZATION <span aria-hidden="true">→</span></button></div>';
  }
  function effectiveDatePackageFeatures(packages, endIndex) {
    var features = [];
    packages.slice(0, endIndex + 1).forEach(function (item) {
      (item.includes || []).forEach(function (feature) {
        if (/^Everything in /i.test(feature)) return;
        if (features.indexOf(feature) < 0) features.push(feature);
      });
    });
    return features;
  }
  function renderDatePackageComparison(packages) {
    var allFeatures = [];
    packages.forEach(function (item, index) {
      effectiveDatePackageFeatures(packages, index).forEach(function (feature) { if (allFeatures.indexOf(feature) < 0) allFeatures.push(feature); });
    });
    var rows = '<tr><th scope="row">Package price</th>' + packages.map(function (item) { return '<td>' + escapeHtml(formatPrice(item.price)) + '</td>'; }).join('') + '</tr>' + allFeatures.map(function (feature) {
      return '<tr><th scope="row">' + escapeHtml(feature) + '</th>' + packages.map(function (item, index) { return '<td>' + (effectiveDatePackageFeatures(packages, index).indexOf(feature) >= 0 ? '<span class="date-compare-yes" aria-label="Included">✓</span>' : '<span class="date-compare-no" aria-label="Not included">—</span>') + '</td>'; }).join('') + '</tr>';
    }).join('');
    return '<section class="date-package-comparison" aria-labelledby="date-package-comparison-title"><div class="date-package-comparison-heading"><p class="eyebrow dark-eyebrow">AT A GLANCE</p><h3 id="date-package-comparison-title">Compare the Experiences</h3><p>See what each Date Invitation package includes.</p></div><div class="date-package-comparison-table-wrap" tabindex="0" role="region" aria-label="Date Invitation package comparison"><table class="date-package-comparison-table"><thead><tr><th scope="col">Features</th>' + packages.map(function (item) { return '<th scope="col">' + escapeHtml(item.name) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div></section>';
  }
  function dateWizardSteps(item) {
    var steps = [
      { key:"basic", title:"Basic Information", description:"Tell us who is placing this order and who the invitation is for.", fields:[["orderPlacedBy","Order Placed By · Your Full Name","text",true,"Who is placing this order?"],["recipient","Wish Recipient · Recipient's Name","text",true,"Who is receiving the invitation?"],["sender","Wish Sender · Sender's Name","text",true,"Whose name appears as the inviter?"],["recipientPassword","Recipient's Password","text",true,"Password the recipient will use to unlock the invitation"]] },
      { key:"intro", title:"Introductory Messages", description:"Create a sequence of short messages. Each message becomes its own intro page." }
    ];
    [1,2,3,4].forEach(function(number){steps.push({key:"question"+number,title:"Interactive Question "+number,description:"Write one question and its two answer choices.",fields:[["question"+number,"Question text","textarea",true,"Write the question"],["question"+number+"Answer","First answer option · continues","text",true,"The answer that continues the story"],["question"+number+"Dodge","Second answer option · dodges","text",true,"A playful answer that dodges the question"]]});});
    steps.push({key:"days",title:"Days Counter",description:"Choose the date the counter starts from. It represents the day your shared story began.",fields:[["counterStartDate","Days Counter Starting Date","date",true,""]]}, {key:"serious",title:"The Fifth Serious Question",description:"This is the central yes-or-no invitation moment.",fields:[["seriousQuestion","Fifth Yes/No Question","textarea",true,"Write the important question"],["yesResponse","Yes Response Message","textarea",true,"What should appear when they say yes?"],["noResponse","No Response Message","textarea",true,"What should appear when they say no?"]]});
    if(item.id==="memory-lane"||item.id==="hearts-promise"){var memoryCount=item.id==="memory-lane"?2:5;for(var m=1;m<=memoryCount;m++)steps.push({key:"memory"+m,title:"Previous Date Memory "+m,description:"Add the date, place and description. Send this memory’s three photos separately through WhatsApp."});steps.push({key:"letter",title:"Personalized Letter",description:"Write the letter that will open as part of the experience.",fields:[["personalizedLetter","Custom letter content","textarea",true,"Write your personal letter"]]});}
    if(item.id==="hearts-promise")steps.push({key:"heartbreak",title:"Heartbreak Message",description:"Write the message shown in the cinematic No response sequence.",fields:[["heartbreakMessage","Heartbreak Message","textarea",true,"Write the heartbreak message"]]},{key:"restoration",title:"Heart Restoration",description:"Write the message shown after the heartbreak sequence.",fields:[["restorationMessage","Heart Restoration Message","textarea",true,"Write the restoration message"]]},{key:"closing",title:"Final Emotional Closing",description:"Write the final message that closes the experience.",fields:[["finalClosingMessage","Final Emotional Closing Message","textarea",true,"Write the closing message"]]});
    steps.push({key:"date",title:"Date Invitation Details",description:"The live countdown will use this scheduled date, time and location.",fields:[["invitationDate","Invitation Date","date",true,""],["invitationTime","Invitation Time","time",true,""],["invitationLocation","Invitation Location","text",true,"Where will you meet?"]]},{key:"music",title:"Music & Additional Instructions",description:"Music files and extra instructions are optional. You can attach music in WhatsApp when ordering.",fields:[["backgroundMusic","Background Music · Optional","file",false,"","audio/*"],["introMusic","Intro / Cinematic Music · Optional","file",false,"","audio/*"],["additionalInstructions","Additional Instructions · Optional","textarea",false,"Any extra details for the experience?"]]});
    return steps;
  }
  function renderDateWizardStep(item, step) {
    if(step.key==="intro"){
      var messages=Array.isArray(dateInvitationState.fields.introMessages)?dateInvitationState.fields.introMessages:[""];
      return '<div class="date-intro-messages">'+messages.map(function(message,index){return '<div class="date-intro-message"><label class="date-invitation-field date-invitation-wide"><span>Introductory Message '+String(index+1).padStart(2,"0")+' <b aria-hidden="true">*</b></span><textarea data-intro-index="'+index+'" maxlength="800" rows="4" required placeholder="Write one opening message">'+escapeHtml(message)+'</textarea></label><div class="date-intro-actions"><button type="button" data-intro-up="'+index+'" aria-label="Move message up" '+(index===0?'disabled':'')+'>↑</button><button type="button" data-intro-down="'+index+'" aria-label="Move message down" '+(index===messages.length-1?'disabled':'')+'>↓</button><button type="button" data-intro-remove="'+index+'" '+(messages.length===1?'disabled':'')+'>Remove</button></div></div>';}).join("")+'</div><button type="button" class="date-add-message" data-intro-add>+ Add another message</button>';
    }
    if(/^question[1-4]$/.test(step.key))return step.fields.map(function(row){return dateField.apply(null,row);}).join("");
    if(/^memory[1-5]$/.test(step.key))return memoryFields(Number(step.key.replace("memory","")));
    return (step.fields||[]).map(function(row){if(row[2]!=="file")return dateField.apply(null,row);var key=row[0],name=dateValue(key),id=dateInvitationState.assetIds[key];return '<label class="date-invitation-field date-invitation-wide"><span>'+escapeHtml(row[1])+'</span><input type="file" data-date-asset-field="'+escapeHtml(key)+'" accept="'+escapeHtml(row[5])+'"><small class="date-file-name" data-file-for="'+escapeHtml(key)+'">'+escapeHtml(id?name+" · saved in this browser":name||"No file selected")+'</small></label>';}).join("");
  }
  function renderDatePersonalization(item) {
    if(!item)return '<p role="alert">Choose a valid Date Invitation package first.</p>';
    var steps=dateWizardSteps(item),index=Math.min(dateInvitationState.step,steps.length-1),step=steps[index],total=steps.length+1;
    var dots=Array.from({length:total},function(_,i){return '<span class="date-step-dot'+(i<=index?' is-complete':'')+(i===index?' is-current':'')+'"></span>';}).join("");
    var fields=renderDateWizardStep(item,step);
    return '<header class="date-invitation-heading"><p class="eyebrow dark-eyebrow">DATE INVITATION · '+escapeHtml(item.name.toUpperCase())+' · '+escapeHtml(formatPrice(item.price))+'</p><h2 id="date-invitation-flow-title">'+escapeHtml(step.title)+'</h2><p>'+escapeHtml(step.description)+'</p><p class="date-identity-help">Order Placed By is the customer. Wish Recipient receives the invitation. Wish Sender is the name shown as the inviter.</p></header><div class="date-wizard-progress" aria-label="Step '+(index+1)+' of '+total+'"><div class="date-step-dots">'+dots+'</div><span>STEP '+String(index+1).padStart(2,"0")+' OF '+String(total).padStart(2,"0")+'</span></div><button type="button" class="date-invitation-back-packages" data-date-back-packages>← Change Package</button><form class="date-invitation-form" novalidate><section class="date-invitation-form-section"><div class="date-invitation-form-grid">'+fields+'</div></section><p class="date-form-error" role="alert" aria-live="polite"></p><div class="date-invitation-actions"><button class="btn btn-outline" type="button" data-date-wizard-back>'+ (index===0?'← BACK TO PACKAGES':'← BACK')+'</button><button class="btn btn-dark" type="submit">'+(index===steps.length-1?'REVIEW YOUR ORDER':'CONTINUE')+' <span aria-hidden="true">→</span></button></div></form>';
  }
  function dateWizardValues(step) {
    var fields=dateInvitationState.fields,values=[];
    if(step.key==="intro")(fields.introMessages||[]).forEach(function(value,index){if(String(value||"").trim())values.push(["Introductory Message "+(index+1),value]);});
    else if(/^memory[1-5]$/.test(step.key)){var n=step.key.replace("memory","");[["memory"+n+"Date","Date"],["memory"+n+"Location","Location"],["memory"+n+"Description","Description"]].forEach(function(row){if(fields[row[0]])values.push([row[1],fields[row[0]]]);});}
    else (step.fields||[]).forEach(function(row){var value=fields[row[0]];if(Array.isArray(value))value=value.join("\n");if(value)values.push([row[1].replace(/ · Optional$/,""),value]);});
    return values;
  }
  function dateInvitationEntries(item) {
    var entries=[["Package",item&&item.name],["Package Price",item&&formatPrice(item.price)]];
    if(item)dateWizardSteps(item).forEach(function(step){dateWizardValues(step).forEach(function(row){entries.push([step.title+" · "+row[0],row[1]]);});});
    Object.keys(dateInvitationState.assetIds||{}).forEach(function(field){if(dateInvitationState.assetIds[field])entries.push(["Music file · "+field,dateValue(field)]);});
    return entries.filter(function(row){return row[1]!=null&&String(row[1]).trim();});
  }
  function renderDateReview(item) {
    var groups=item?dateWizardSteps(item).map(function(step,index){var rows=dateWizardValues(step);return '<section class="date-review-group"><header><h4>'+escapeHtml(step.title)+'</h4><button type="button" data-edit-date-step="'+index+'">Edit</button></header><dl>'+rows.map(function(row){return '<div><dt>'+escapeHtml(row[0])+'</dt><dd>'+escapeHtml(row[1])+'</dd></div>';}).join("")+'</dl></section>';}).join(""):"";
    return '<header class="date-invitation-heading"><p class="eyebrow dark-eyebrow">DATE INVITATION · ORDER REVIEW</p><h2 id="date-invitation-flow-title">Your invitation, ready to review.</h2></header><p class="date-review-package">'+escapeHtml(item?item.name:"")+' · '+escapeHtml(item?formatPrice(item.price):"")+'</p><article class="date-review-card">'+groups+'<p class="date-validity-note">The countdown is scheduled to end at the invitation date and time. Experience validity is intended to continue through 10 days after the invitation date. Secure expiry for a hosted experience requires server-side enforcement.</p><p class="date-upload-note">Photos are not uploaded on this website. Send the required photos in the same WhatsApp conversation as your order. Selected music can be downloaded from Cart and attached manually.</p></article><p class="date-review-error" role="alert" aria-live="polite"></p><div class="date-invitation-actions"><button class="btn btn-outline" type="button" data-date-back-personalization>← BACK</button><button class="btn btn-dark" type="button" data-date-add-cart>ADD DATE INVITATION TO CART · '+escapeHtml(item?formatPrice(item.price):"")+' <span aria-hidden="true">→</span></button></div>';
  }
  function showDateInvitationStage(stage) {
    dateInvitationStage=stage;saveDateInvitationState();categoryProcess.hidden=true;heroSection.hidden=true;builderSection.hidden=true;dateInvitationFlow.hidden=false;renderDateInvitationFlow();dateInvitationFlow.scrollIntoView({behavior:"smooth",block:"start"});
  }
  var pendingDateAssetWrite=Promise.resolve();
  function saveDateAsset(input) {
    var file=input.files&&input.files[0],field=input.getAttribute("data-date-asset-field"),error=dateInvitationFlow.querySelector(".date-form-error"),assets=window.HeartBiographyDateAssets;
    if(!file)return;if(!(assets&&assets.acceptedAudio(file))){input.value="";if(error)error.textContent="Choose an audio file smaller than 20 MB.";return;}
    pendingDateAssetWrite=pendingDateAssetWrite.then(function(){return assets.saveAsset(file,dateInvitationState.assetIds[field]);}).then(function(record){dateInvitationState.assetIds[field]=record.id;dateInvitationState.fields[field]=record.name;saveDateInvitationState();var label=dateInvitationFlow.querySelector('[data-file-for="'+field+'"]');if(label)label.textContent=record.name+" · saved in this browser";return record;}).catch(function(){if(error)error.textContent="The music file could not be saved in this browser. Try a smaller file or another browser.";});
  }
  function validateCurrentDateStep(formElement) {
    var item=dateInvitationPackage(),step=dateWizardSteps(item)[dateInvitationState.step],error=formElement.querySelector(".date-form-error");
    if(step.key==="intro"&&!(dateInvitationState.fields.introMessages||[]).some(function(message){return String(message||"").trim();})){error.textContent="Add at least one introductory message to continue.";return false;}
    var invalid=Array.prototype.find.call(formElement.querySelectorAll("[required]"),function(field){return !String(field.value||"").trim()||!field.checkValidity();});
    if(invalid){error.textContent="Complete the required fields in this step before continuing.";invalid.reportValidity();return false;}
    return true;
  }
  function advanceDateWizard(formElement) {
    if(!validateCurrentDateStep(formElement))return;
    pendingDateAssetWrite.then(function(){var steps=dateWizardSteps(dateInvitationPackage());if(dateInvitationState.step>=steps.length-1){showDateInvitationStage("review");return;}dateInvitationState.step++;saveDateInvitationState();renderDateInvitationFlow();});
  }
  function wireDateInvitationFlow() {
    dateInvitationFlow.querySelectorAll("[data-date-back-categories]").forEach(function(button){button.addEventListener("click",backToCategories);});
    dateInvitationFlow.querySelectorAll("[data-select-date-package]").forEach(function(button){button.addEventListener("click",function(){var nextPackage=button.getAttribute("data-select-date-package");if(dateInvitationState.packageId!==nextPackage)dateInvitationState.step=0;dateInvitationState.packageId=nextPackage;dateInvitationStage="packages";saveDateInvitationState();renderDateInvitationFlow();});});
    dateInvitationFlow.querySelectorAll("[data-date-continue]").forEach(function(button){button.addEventListener("click",function(){if(!dateInvitationPackage()){var error=dateInvitationFlow.querySelector(".date-package-error");if(error)error.textContent="Please select a package to continue.";return;}dateInvitationState.step=0;showDateInvitationStage("personalization");});});
    dateInvitationFlow.querySelectorAll("[data-date-back-packages]").forEach(function(button){button.addEventListener("click",function(){showDateInvitationStage("packages");});});
    dateInvitationFlow.querySelectorAll("[data-date-back-personalization]").forEach(function(button){button.addEventListener("click",function(){dateInvitationState.step=Math.max(0,dateWizardSteps(dateInvitationPackage()).length-1);showDateInvitationStage("personalization");});});
    dateInvitationFlow.querySelectorAll("[data-edit-date-step]").forEach(function(button){button.addEventListener("click",function(){dateInvitationState.step=Number(button.getAttribute("data-edit-date-step"));saveDateInvitationState();showDateInvitationStage("personalization");});});
    var formElement=dateInvitationFlow.querySelector(".date-invitation-form");
    if(formElement){
      formElement.addEventListener("input",function(event){var field=event.target.getAttribute("data-date-field"),intro=event.target.getAttribute("data-intro-index");if(field&&event.target.type!=="file"){dateInvitationState.fields[field]=event.target.value;saveDateInvitationState();}if(intro!==null){dateInvitationState.fields.introMessages[Number(intro)]=event.target.value;saveDateInvitationState();}});
      formElement.addEventListener("change",function(event){if(event.target.matches("[data-date-asset-field]"))saveDateAsset(event.target);});
      formElement.addEventListener("submit",function(event){event.preventDefault();advanceDateWizard(formElement);});
      formElement.querySelectorAll("[data-intro-add]").forEach(function(button){button.addEventListener("click",function(){dateInvitationState.fields.introMessages.push("");saveDateInvitationState();renderDateInvitationFlow();});});
      formElement.querySelectorAll("[data-intro-remove]").forEach(function(button){button.addEventListener("click",function(){if(dateInvitationState.fields.introMessages.length>1)dateInvitationState.fields.introMessages.splice(Number(button.getAttribute("data-intro-remove")),1);saveDateInvitationState();renderDateInvitationFlow();});});
      formElement.querySelectorAll("[data-intro-up],[data-intro-down]").forEach(function(button){button.addEventListener("click",function(){var from=Number(button.hasAttribute("data-intro-up")?button.getAttribute("data-intro-up"):button.getAttribute("data-intro-down")),to=from+(button.hasAttribute("data-intro-up")?-1:1),messages=dateInvitationState.fields.introMessages;if(to<0||to>=messages.length)return;var message=messages.splice(from,1)[0];messages.splice(to,0,message);saveDateInvitationState();renderDateInvitationFlow();});});
      formElement.querySelectorAll("[data-date-asset-field]").forEach(function(input){var key=input.getAttribute("data-date-asset-field"),id=dateInvitationState.assetIds[key],label=dateInvitationFlow.querySelector('[data-file-for="'+key+'"]');if(id)window.HeartBiographyDateAssets.getAsset(id).then(function(record){if(record&&label)label.textContent=record.name+" · saved in this browser";});});
    }
    var back=dateInvitationFlow.querySelector("[data-date-wizard-back]");if(back)back.addEventListener("click",function(){if(dateInvitationState.step===0){showDateInvitationStage("packages");return;}dateInvitationState.step--;saveDateInvitationState();renderDateInvitationFlow();});
    var add=dateInvitationFlow.querySelector("[data-date-add-cart]");if(add)add.addEventListener("click",addDateInvitationToCart);
  }
  function addDateInvitationToCart(event) {
    var itemPackage = dateInvitationPackage();
    if (!itemPackage || !window.HeartBiographyCart) return;
    var placedBy = String(dateInvitationState.fields.orderPlacedBy || "").trim();
    if (!placedBy) { dateInvitationFlow.querySelector(".date-review-error").textContent = "Your full name is required to place this order."; showDateInvitationStage("personalization"); return; }
    if (event && event.currentTarget) { event.currentTarget.disabled = true; event.currentTarget.setAttribute("aria-busy", "true"); }
    var wish = { orderPlacedBy: placedBy, introMessages: (dateInvitationState.fields.introMessages || []).slice() };
    dateWizardSteps(itemPackage).forEach(function(step){(step.fields||[]).forEach(function(row){if(Object.prototype.hasOwnProperty.call(dateInvitationState.fields,row[0]))wish[row[0]]=dateInvitationState.fields[row[0]];});if(/^memory[1-5]$/.test(step.key)){var prefix=step.key;["Date","Location","Description"].forEach(function(part){var key=prefix+part;if(Object.prototype.hasOwnProperty.call(dateInvitationState.fields,key))wish[key]=dateInvitationState.fields[key];});}});
    var memoryCount=itemPackage.id==="memory-lane"?2:itemPackage.id==="hearts-promise"?5:0, selectedAssets={};
    ["backgroundMusic","introMusic"].forEach(function(key){if(dateInvitationState.assetIds[key])selectedAssets[key]=dateInvitationState.assetIds[key];});
    var item = { kind: "wishverse", title: "Date Invitation · " + itemPackage.name, categories: ["Date Invitation"], wishes: { "Date Invitation": wish }, orderPlacedBy: placedBy, dateInvitationPackage: { id: itemPackage.id, name: itemPackage.name, price: itemPackage.price }, assetIds: selectedAssets, total: itemPackage.price, regularTotal: itemPackage.price, discount: 0, priceLabel: formatPrice(itemPackage.price), payload: { dateInvitation: { packageId: itemPackage.id, fields: wish, assetIds:selectedAssets } }, checkoutPrefill: { fullName: placedBy } };
    if (!window.HeartBiographyCart.addItem(item)) { dateInvitationFlow.querySelector(".date-review-error").textContent = "The invitation could not be added. Please try again."; if(event&&event.currentTarget){event.currentTarget.disabled=false;event.currentTarget.removeAttribute("aria-busy");} return; }
    Object.keys(dateInvitationState.assetIds||{}).forEach(function(key){if(!selectedAssets[key])window.HeartBiographyDateAssets.removeAsset(dateInvitationState.assetIds[key]);});
    try { window.sessionStorage.removeItem(storageKey + ":date-invitation"); } catch (error) { /* Cart now holds the order summary. */ }
    window.location.href = "cart.html?added=wishverse";
  }

  function blankWish() { return { recipient: "", sender: "", relationship: "", occasionDetails: "", language: "English", message: "", instructions: "" }; }
  function slug(value) { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
  function escapeHtml(value) { return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[char]; }); }
  function wishFor(category) { if (!state.wishes[category]) state.wishes[category] = blankWish(); return state.wishes[category]; }
  function experienceForCategory(category) {
    var experiences = config.singleWishExperiences || {};
    return Object.keys(experiences).map(function (id) { return experiences[id]; }).find(function (experience) { return experience.category === category; }) || null;
  }
  function regularPriceFor(categories) {
    if (Array.isArray(categories) && categories.indexOf("The Signature Wish") !== -1) return null;
    return (categories || []).reduce(function (total, category) {
      var experience = experienceForCategory(category), price = experience && Number.isSafeInteger(experience.price) ? experience.price : Number((config.pricing || {}).baseWishPrice);
      return total + price;
    }, 0);
  }
  function priceFor(count, categories) { return count > 0 && typeof config.calculateTotal === "function" ? config.calculateTotal(count, categories) : null; }
  function formatPrice(amount, categories) {
    var isSignatureWish = Array.isArray(categories) && categories.indexOf("The Signature Wish") !== -1;
    return (isSignatureWish ? "৳" : (config.currency || "BDT ")) + Number(amount).toLocaleString("en-BD");
  }
  function saveState() {
    state.step = currentStep;
    state.furthestStep = furthestStep;
    try { window.sessionStorage.setItem(storageKey, JSON.stringify(state)); } catch (error) { /* Keep the current order in memory when session storage is unavailable. */ }
  }
  function loadState() {
    var checkoutName = "";
    try { checkoutName = String(window.HeartBiographyCart && window.HeartBiographyCart.get().checkout.fullName || "").trim(); } catch (error) { /* Keep customer name blank when cart storage is unavailable. */ }
    var initial = { categories: [], wishes: {}, customerFullName: checkoutName, started: false, stage: "selection", step: 1, furthestStep: 1 };
    try {
      var parsed = JSON.parse(window.sessionStorage.getItem(storageKey) || "null");
      if (!parsed || !Array.isArray(parsed.categories)) return initial;
      var unique = [];
      parsed.categories.forEach(function (category) { if (validCategories.indexOf(category) !== -1 && unique.indexOf(category) === -1) unique.push(category); });
      unique = unique.slice(0, 1);
      var wishes = {};
      unique.forEach(function (category) {
        wishes[category] = Object.assign(blankWish(), parsed.wishes && parsed.wishes[category] || {});
        delete wishes[category].style;
        delete wishes[category].color;
        delete wishes[category].colour;
        delete wishes[category].designStyle;
        delete wishes[category].colourDirection;
        delete wishes[category].colorDirection;
        delete wishes[category].colorTheme;
        delete wishes[category].colourTheme;
      });
      initial.categories = unique;
      initial.wishes = wishes;
      initial.customerFullName = String(parsed.customerFullName || checkoutName).trim();
      initial.started = !!parsed.started && unique.length > 0;
      initial.stage = initial.started && parsed.stage === "order" ? "order" : (initial.started ? "personalization" : "selection");
      initial.step = parsed.stage === "billing" || parsed.stage === "order" || Number(parsed.step) >= 5 ? 3 : (Number(parsed.step) >= 2 ? 2 : 1);
      initial.furthestStep = parsed.stage === "billing" || parsed.stage === "order" || Number(parsed.furthestStep) >= 5 ? 3 : (Number(parsed.furthestStep) >= 2 ? 2 : 1);
    } catch (error) { /* Start a fresh order if saved data is unavailable or invalid. */ }
    return initial;
  }
  function totalPrice() { return priceFor(state.categories.length, state.categories); }
  function updateSelection() {
    var count = state.categories.length;
    var amount = totalPrice();
    var variablePrice = state.categories.indexOf("The Signature Wish") !== -1;
    var quoteText = "Price based on your requirements";
    var regularPrice = regularPriceFor(state.categories);
    var discount = !variablePrice && count && Number.isFinite(regularPrice) && Number.isSafeInteger(amount) ? Math.max(0, regularPrice - amount) : 0;
    categoryCards.forEach(function (card) {
      var active = state.categories.indexOf(card.getAttribute("data-category")) !== -1;
      card.classList.toggle("is-selected", active);
      card.setAttribute("aria-pressed", active ? "true" : "false");
      var label = card.querySelector(".category-explore");
      if (label) label.innerHTML = active ? 'SELECTED <b aria-hidden="true">✓</b>' : 'EXPLORE <b aria-hidden="true">↗</b>';
    });
    document.querySelector("[data-selected-count]").textContent = count + (count === 1 ? " category selected" : " categories selected");
    selectionContinue.disabled = count < 1 || (!Number.isSafeInteger(amount) && !variablePrice);
    selectionError.textContent = "";
    document.querySelector("[data-selection-billing-empty]").hidden = count > 0;
    document.querySelector("[data-selection-billing-details]").hidden = count < 1;
    document.querySelector("[data-selection-regular]").textContent = count ? (variablePrice ? quoteText : formatPrice(regularPrice, state.categories)) : "—";
    document.querySelector("[data-selection-discount]").textContent = count ? (variablePrice ? "—" : (discount ? "−" + formatPrice(discount, state.categories) : formatPrice(0, state.categories))) : "—";
    document.querySelector("[data-selection-total]").textContent = count ? (variablePrice ? quoteText : formatPrice(amount, state.categories)) : "—";
    document.querySelector("[data-billing-regular]").textContent = count ? (variablePrice ? quoteText : formatPrice(regularPrice, state.categories)) : "—";
    document.querySelector("[data-billing-discount]").textContent = count ? (variablePrice ? "—" : (discount ? "−" + formatPrice(discount, state.categories) : formatPrice(0, state.categories))) : "—";
    document.querySelector("[data-wish-order-count]").textContent = count + (count === 1 ? " category" : " categories");
    document.querySelector("[data-wish-order-total]").textContent = count ? (variablePrice ? quoteText : formatPrice(amount, state.categories) + " total") : "";
    document.querySelector("[data-review-count]").textContent = count + (count === 1 ? " category" : " categories");
    document.querySelector("[data-review-total]").textContent = count ? (variablePrice ? quoteText : formatPrice(amount, state.categories)) : "—";
    document.querySelector("[data-order-count]").textContent = count + (count === 1 ? " CATEGORY" : " CATEGORIES");
    document.querySelector("[data-order-categories]").textContent = state.categories.join(" · ");
    document.querySelector("[data-package-price-bottom]").textContent = count ? (variablePrice ? quoteText : formatPrice(amount, state.categories)) : "—";
    refreshOrderChannel();
    saveState();
  }
  function setFlowStage(stage) {
    document.querySelectorAll("[data-flow-indicator]").forEach(function (indicator) {
      indicator.querySelectorAll("[data-flow-step]").forEach(function (item) {
        var active = item.getAttribute("data-flow-step") === stage;
        item.classList.toggle("is-active", active);
        if (active) item.setAttribute("aria-current", "step"); else item.removeAttribute("aria-current");
      });
    });
  }
  function backToCategories() {
    state.stage = "selection";
    state.started = false;
    dateInvitationStage = "packages";
    saveDateInvitationState();
    dateInvitationFlow.hidden = true;
    currentStep = 1;
    categoryProcess.hidden = false;
    categorySelectionView.hidden = false;
    heroSection.hidden = true;
    builderSection.hidden = true;
    builderShell.hidden = true;
    selectionSummary.hidden = true;
    setFlowStage("selection");
    updateSelection();
    categoryProcess.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function onWishVerseNavigationClick(event) {
    var link = event.currentTarget;
    var target;
    try { target = new URL(link.href, window.location.href); } catch (error) { return; }
    if (target.pathname !== window.location.pathname) return;
    var dateFlowActive = !dateInvitationFlow.hidden;
    event.preventDefault();
    if (dateFlowActive || state.started && categorySelectionView.hidden) backToCategories();
    else window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function renderPersonalizationForms() {
    var container = document.getElementById("wish-personalization-forms");
    container.innerHTML = `<div class="form-grid wish-customer-name"><div class="wish-identity-group full-field"><strong>Order Placed By</strong><p class="quiet-note">Who is placing this order?</p><label>Your Full Name <input id="wish-customer-full-name" name="customerFullName" autocomplete="name" required maxlength="120" placeholder="Enter your full name" value="${escapeHtml(state.customerFullName)}"></label></div></div>` + state.categories.map(function (category, index) {
      var wish = wishFor(category), key = slug(category);
      return `<fieldset class="wish-personalization-card"><legend><span>${String(index + 1).padStart(2,"0")}</span> ${escapeHtml(category)} Wish</legend><div class="form-grid"><div class="wish-identity-group"><strong>Wish Recipient</strong><p class="quiet-note">Who is this Wish being created for?</p><label>Recipient's Name <input data-wish-category="${escapeHtml(category)}" data-wish-field="recipient" autocomplete="off" required maxlength="60" placeholder="Enter recipient's name" value="${escapeHtml(wish.recipient)}"></label></div><div class="wish-identity-group"><strong>Wish Sender</strong><p class="quiet-note">Who is this Wish from?</p><label>Sender's Name <input data-wish-category="${escapeHtml(category)}" data-wish-field="sender" autocomplete="off" required maxlength="60" placeholder="Enter sender's name" value="${escapeHtml(wish.sender)}"></label></div><label>Relationship <input data-wish-category="${escapeHtml(category)}" data-wish-field="relationship" maxlength="60" placeholder="e.g. friend, partner, sister" value="${escapeHtml(wish.relationship)}"></label><label>Preferred language <input data-wish-category="${escapeHtml(category)}" data-wish-field="language" required maxlength="40" value="${escapeHtml(wish.language)}"></label><label class="full-field">${escapeHtml(category)} details <textarea data-wish-category="${escapeHtml(category)}" data-wish-field="occasionDetails" maxlength="400" rows="2" placeholder="Any occasion-specific details? (optional)">${escapeHtml(wish.occasionDetails)}</textarea></label><label class="full-field">Your ${escapeHtml(category.toLowerCase())} message <textarea data-wish-category="${escapeHtml(category)}" data-wish-field="message" required minlength="3" maxlength="600" rows="4" placeholder="Write a message just for this Wish…">${escapeHtml(wish.message)}</textarea><span class="field-hint"><span data-count-for="${key}">${wish.message.length}</span>/600</span></label><label class="full-field">Additional instructions <textarea data-wish-category="${escapeHtml(category)}" data-wish-field="instructions" maxlength="400" rows="2" placeholder="Anything else for this Wish? (optional)">${escapeHtml(wish.instructions)}</textarea></label></div></fieldset>`;
    }).join("");
    container.querySelectorAll(".wish-personalization-card").forEach(function (card) {
      var field = card.querySelector("[data-wish-category]");
      if (!field || field.getAttribute("data-wish-category") !== "The Signature Wish") return;
      var legend = card.querySelector("legend");
      if (legend && legend.lastChild) legend.lastChild.textContent = " The Signature Wish";
      var details = card.querySelector('[data-wish-field="occasionDetails"]');
      if (details) {
        details.closest("label").firstChild.textContent = "Story or occasion inspiration ";
        details.placeholder = "What story, moment, or purpose should inspire your experience? (optional)";
      }
      var message = card.querySelector('[data-wish-field="message"]');
      if (message) {
        message.closest("label").firstChild.textContent = "Core message or words to include ";
        message.placeholder = "Write the words you want woven into this experience…";
      }
      var brief = card.querySelector('[data-wish-field="instructions"]');
      if (brief) {
        var label = brief.closest("label");
        label.firstChild.textContent = "Your creative brief ";
        brief.required = true;
        brief.minLength = 20;
        brief.maxLength = 1200;
        brief.rows = 5;
        brief.placeholder = "Describe the look, story, sections, interactions, colors, tone, or other details you imagine. You can attach photos in WhatsApp after checkout.";
        var hint = document.createElement("span");
        hint.className = "field-hint";
        hint.textContent = "Share at least 20 characters so we can shape your custom experience.";
        label.insertBefore(hint, brief);
      }
    });
    var isSignature = state.categories.indexOf("The Signature Wish") !== -1;
    var stepTitle = document.querySelector('[data-step="1"] .step-heading h3');
    var stepDescription = document.querySelector('[data-step="1"] .step-heading p');
    if (stepTitle) stepTitle.textContent = isSignature ? "Shape your Signature Wish." : "Personalize each Wish.";
    if (stepDescription) stepDescription.textContent = isSignature ? "Share the vision, story, and personal details you want brought to life." : "Each selected category has its own recipient, occasion details, language, and message.";
  }
  function renderReview() {
    document.getElementById("wish-review-list").innerHTML = state.categories.map(function (category, index) {
      var wish = wishFor(category);
      var lines = [["Recipient's Name", wish.recipient], ["Sender's Name", wish.sender], ["Relationship", wish.relationship], ["Occasion details", wish.occasionDetails], ["Language", wish.language], ["Message", wish.message], [category === "The Signature Wish" ? "Creative brief" : "Additional instructions", wish.instructions]];
      return `<article class="wish-review-card"><div class="wish-review-card-head"><span>${String(index + 1).padStart(2,"0")}</span><h4>${escapeHtml(category === "The Signature Wish" ? category : category + " Wish")}</h4></div><dl>${lines.filter(function (row) { return String(row[1] || "").trim(); }).map(function (row) { return `<div><dt>${escapeHtml(row[0])}</dt><dd>${escapeHtml(row[1])}</dd></div>`; }).join("")}</dl></article>`;
    }).join("");
  }
  function refreshOrderChannel() {
    var variablePrice = state.categories.indexOf("The Signature Wish") !== -1;
    var button = document.getElementById("order-button"), ready = state.categories.length > 0 && (Number.isSafeInteger(totalPrice()) || variablePrice) && !!String(state.customerFullName || "").trim();
    button.disabled = !ready;
    button.textContent = "ADD TO CART";
    document.querySelector("[data-order-status]").textContent = !String(state.customerFullName || "").trim() ? "Enter Your Full Name in Personalization before adding this order to your cart." : (ready ? (variablePrice ? "Your Signature Wish is ready to add to your cart. Final pricing will be based on your requirements." : "Your " + state.categories.length + "-category WishVerse order totals " + formatPrice(totalPrice(), state.categories) + " and is ready to add to your shared cart.") : "Select at least one Wish category before continuing.");
  }
  function updateStepButtons() {
    document.querySelectorAll(".step-nav").forEach(function (button) {
      var index = Number(button.getAttribute("data-goto"));
      button.classList.toggle("is-active", index === currentStep);
      button.classList.toggle("is-complete", index < currentStep);
      button.setAttribute("aria-current", index === currentStep ? "step" : "false");
      button.disabled = index > furthestStep;
    });
  }
  function gotoStep(number) {
    if (builderShell.hidden || number < 1 || number > 3 || number > furthestStep) return;
    currentStep = number;
    state.stage = number === 3 ? "order" : "personalization";
    setFlowStage(number === 3 ? "order" : "personalization");
    document.querySelectorAll(".builder-step").forEach(function (section) {
      var active = Number(section.getAttribute("data-step")) === number;
      section.hidden = !active;
      section.classList.toggle("is-active", active);
    });
    updateStepButtons();
    if (number === 2) renderReview();
    saveState();
    var heading = document.querySelector('[data-step="' + number + '"] .step-heading h3');
    if (heading) { heading.setAttribute("tabindex", "-1"); heading.focus({ preventScroll: true }); }
  }
  function startPersonalization() {
    if (!state.categories.length) { selectionError.textContent = "Select at least one Wish category to continue."; return; }
    state.started = true;
    state.stage = "personalization";
    currentStep = 1;
    categoryProcess.hidden = true;
    heroSection.hidden = true;
    builderSection.hidden = false;
    selectionSummary.hidden = false;
    builderShell.hidden = false;
    renderPersonalizationForms();
    setFlowStage("personalization");
    updateSelection();
    gotoStep(1);
    builderSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function validatePersonalization() {
    var required = Array.prototype.slice.call(form.querySelectorAll("[required]"));
    var invalid = required.find(function (input) { return !input.value.trim() || !input.checkValidity(); });
    if (invalid) {
      form.querySelector(".form-error").textContent = invalid.id === "wish-customer-full-name" ? "Enter your full name before continuing." : (invalid.getAttribute("data-wish-field") === "instructions" && state.categories.indexOf("The Signature Wish") !== -1 ? "Add a creative brief of at least 20 characters for The Signature Wish." : "Complete Order Placed By, Recipient's Name, Sender's Name, language, and message for every selected Wish.");
      invalid.reportValidity();
      return false;
    }
    form.querySelector(".form-error").textContent = "";
    return true;
  }
  function addWishVerseToCart() {
    if (!state.categories.length || !String(state.customerFullName || "").trim()) return false;
    if (!window.HeartBiographyCart) return false;
    var count = state.categories.length, total = totalPrice();
    var variablePrice = state.categories.indexOf("The Signature Wish") !== -1;
    var regular = regularPriceFor(state.categories);
    var wishes = {};
    state.categories.forEach(function (category) { wishes[category] = Object.assign({}, wishFor(category)); });
    var payloadState = { categories: state.categories.slice(), wishes: wishes, customerFullName: String(state.customerFullName).trim(), started: true, stage: "personalization", step: 1, furthestStep: 1 };
    var item = {
      kind: "wishverse",
      title: state.categories.indexOf("The Signature Wish") !== -1 ? "The Signature Wish · Premium Custom Experience" : "The WishVerse · " + count + (count === 1 ? " Wish" : " Wishes"),
      categories: state.categories.slice(),
      wishes: wishes,
      orderPlacedBy: String(state.customerFullName).trim(),
      total: total,
      regularTotal: regular,
      discount: variablePrice ? null : Math.max(0, regular - total),
      priceLabel: variablePrice ? "Price based on your requirements" : formatPrice(total, state.categories),
      currencySymbol: variablePrice ? "" : (config.currency || "BDT "),
      payload: { state: payloadState },
      checkoutPrefill: { fullName: String(state.customerFullName).trim() }
    };
    if (!window.HeartBiographyCart.addItem(item)) return false;
    try { window.sessionStorage.removeItem(storageKey); } catch (error) { /* Cart item has its own saved copy. */ }
    window.location.href = "cart.html?added=wishverse";
    return true;
  }
  function updateOrder() {
    state.categories.forEach(function (category) { var wish = wishFor(category); });
    updateSelection();
    if (currentStep === 2) renderReview();
  }

  categoryCards.forEach(function (card) {
    card.addEventListener("click", function (event) {
      event.preventDefault();
      var category = card.getAttribute("data-category");
      if (category === "Date Invitation") { dateInvitationState.packageId = ""; dateInvitationState.step = 0; dateInvitationStage = "packages"; saveDateInvitationState(); showDateInvitationStage("packages"); return; }
      var experienceId = Object.keys(config.singleWishExperiences || {}).find(function (id) { return config.singleWishExperiences[id].category === category; });
      if (experienceId) { window.location.href = config.singleWishExperiences[experienceId].page; return; }
      state.categories = [category];
      wishFor(category);
      state.started = false;
      state.stage = "selection";
      currentStep = 1;
      furthestStep = 1;
      categoryProcess.hidden = false;
      categorySelectionView.hidden = false;
      heroSection.hidden = false;
      builderSection.hidden = true;
      builderShell.hidden = true;
      selectionSummary.hidden = true;
      setFlowStage("selection");
      updateSelection();
    });
  });
  selectionContinue.addEventListener("click", startPersonalization);
  document.getElementById("back-to-categories").addEventListener("click", backToCategories);
  form.addEventListener("input", function (event) {
    var target = event.target;
    if (target && target.id === "wish-customer-full-name") {
      state.customerFullName = target.value.trim();
      saveState();
      refreshOrderChannel();
      return;
    }
    if (target && target.hasAttribute("data-wish-field")) {
      var category = target.getAttribute("data-wish-category"), fieldName = target.getAttribute("data-wish-field");
      wishFor(category)[fieldName] = target.value;
      var count = document.querySelector('[data-count-for="' + slug(category) + '"]');
      if (count && fieldName === "message") count.textContent = String(target.value.length);
      saveState();
    }
  });
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!validatePersonalization()) return;
    furthestStep = Math.max(furthestStep, 2); gotoStep(2);
  });
  document.querySelectorAll("[data-next]").forEach(function (button) {
    button.addEventListener("click", function () {
      var next = Math.min(3, currentStep + 1); furthestStep = Math.max(furthestStep, next); gotoStep(next);
    });
  });
  document.querySelectorAll("[data-back]").forEach(function (button) { button.addEventListener("click", function () { gotoStep(currentStep - 1); }); });
  document.querySelectorAll(".step-nav").forEach(function (button) { button.addEventListener("click", function () { gotoStep(Number(button.getAttribute("data-goto"))); }); });
  document.querySelectorAll("[data-start]").forEach(function (link) { link.addEventListener("click", function (event) { event.preventDefault(); (state.started ? builderSection : document.getElementById("experiences")).scrollIntoView({ behavior: "smooth", block: "start" }); }); });
  document.querySelectorAll('header .wishverse-nav > a:first-child').forEach(function (link) { link.addEventListener("click", onWishVerseNavigationClick); });
  document.querySelector("[data-reveal]").addEventListener("click", function (event) { var note = document.querySelector(".revealed-note"); note.hidden = !note.hidden; event.currentTarget.setAttribute("aria-expanded", note.hidden ? "false" : "true"); event.currentTarget.querySelector("span").textContent = note.hidden ? "＋" : "−"; });
  document.getElementById("order-button").addEventListener("click", function () {
    var button = document.getElementById("order-button");
    button.disabled = true;
    if (addWishVerseToCart()) return;
    button.disabled = false;
    document.querySelector("[data-order-status]").textContent = window.HeartBiographyCart ? "Complete your order details before adding this WishVerse order to your cart." : "The shared cart is unavailable. Refresh the page and try again.";
  });
  if (state.started && state.categories.length) { currentStep = Math.min(state.step, state.furthestStep); furthestStep = state.furthestStep; }
  if (dateInvitationState.packageId && !dateInvitationPackage()) { dateInvitationState.packageId = ""; saveDateInvitationState(); }
  if (!dateInvitationState.packageId) { dateInvitationState.packageId = ""; }
  categoryCards.forEach(function (card) { var active = state.categories.indexOf(card.getAttribute("data-category")) !== -1; card.classList.toggle("is-selected", active); card.setAttribute("aria-pressed", active ? "true" : "false"); if (active) card.querySelector(".category-explore").innerHTML = 'SELECTED <b aria-hidden="true">✓</b>'; });
  renderPersonalizationForms(); updateSelection();
  if (state.started && state.categories.length) {
    categoryProcess.hidden = true; heroSection.hidden = true; builderSection.hidden = false; builderShell.hidden = false; selectionSummary.hidden = false;
    categorySelectionView.hidden = true; setFlowStage(state.stage === "order" ? "order" : "personalization"); gotoStep(currentStep);
    if (directWishStart) window.requestAnimationFrame(function () { builderSection.scrollIntoView({ behavior: "smooth", block: "start" }); });
  } else {
    categoryProcess.hidden = false; heroSection.hidden = false; builderSection.hidden = true; builderShell.hidden = true; selectionSummary.hidden = true;
    categorySelectionView.hidden = false; setFlowStage("selection");
  }
  if (directDateInvitationStart) showDateInvitationStage("packages");
  else if (dateInvitationState.packageId && dateInvitationStage !== "packages") showDateInvitationStage(dateInvitationStage);
}());



