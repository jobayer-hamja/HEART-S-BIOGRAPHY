(function () {
  "use strict";
  var config = window.WISHVERSE_CONFIG || {};
  var page = document.body;
  var experienceId = page.getAttribute("data-wish-experience");
  var experience = typeof config.getSingleWishExperience === "function" ? config.getSingleWishExperience(experienceId) : null;
  if (!experience) return;
  if (experienceId === "gift-presentation") {
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
  }

  var category = experience.category;
  var packageInfo = Array.isArray(config.packages) ? config.packages[0] : {};
  var includes = Array.isArray(packageInfo.includes) ? packageInfo.includes : [];
  var price = Number(experience.price != null ? experience.price : (config.pricing || {}).baseWishPrice);
  var title = document.querySelector("[data-experience-title]");
  var context = document.querySelector("[data-experience-context]");
  var subtitle = document.querySelector("[data-experience-subtitle]");
  var description = document.querySelector("[data-experience-description]");
  var highlightList = document.querySelector("[data-experience-highlights]");
  var includeList = document.querySelector("[data-experience-includes]");
  var cta = document.querySelector("[data-experience-cta]");
  var back = document.querySelector("[data-experience-back]");
  var emblem = document.querySelector(".birthday-emblem");

  document.title = (experience.pageTitle || category) + " — The WishVerse | Heart's Biography";
  var metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) metaDescription.setAttribute("content", experience.description);
  if (title) title.textContent = experience.title || category;
  if (context) context.textContent = experience.context;
  if (subtitle) subtitle.textContent = experience.subtitle || "A personalized digital Wish for a moment that matters.";
  if (description) description.textContent = experience.description;
  if (emblem && experienceId !== "birthday-celebration" && experienceId !== "apology-makeup") emblem.hidden = true;

  var priceNode = document.querySelector("[data-experience-price]");
  var packageDescription = document.querySelector("[data-experience-package-description]");
  if (priceNode) { if (experience.priceDisplay) priceNode.textContent = experience.priceDisplay; else if (Number.isSafeInteger(price)) priceNode.textContent = (config.currency || "BDT ") + price.toLocaleString("en-BD"); }
  if (packageDescription) packageDescription.textContent = packageInfo.description || "A personal digital Wish with its own predefined design and experience.";
  if (includeList) includeList.innerHTML = includes.map(function (item) { var li = document.createElement("li"); li.textContent = item; return li.outerHTML; }).join("");

  if (Array.isArray(experience.highlights) && experience.highlights.length && highlightList) {
    highlightList.innerHTML = experience.highlights.map(function (item) { var li = document.createElement("li"); li.textContent = item; return li.outerHTML; }).join("");
  } else if (highlightList) {
    highlightList.hidden = true;
  }
  if (cta) {
    cta.href = experience.ctaHref || ("wishverse.html?wish=" + encodeURIComponent(experienceId) + "#builder");
    cta.setAttribute("aria-label", experienceId === "signature-wish" ? "Create your Signature Wish" : "Personalize your " + category + " Wish");
    cta.innerHTML = (experience.ctaText || ("Personalize Your " + category + " Wish")) + " <span aria-hidden=\"true\">→</span>";
  }
  if (back) back.href = "wishverse.html?view=categories#" + encodeURIComponent(experienceId);
}());
