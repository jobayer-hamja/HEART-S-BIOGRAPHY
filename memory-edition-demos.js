(function () {
  "use strict";

  // Replace this shared temporary URL when category-specific demos are ready.
  var liveDemoUrl = "https://bonny-verse.github.io/BONNY-The-Birthday-Edition/";
  var cards = document.querySelectorAll(".occasion-grid .occasion-card");

  cards.forEach(function (card) {
    if (card.tagName !== "A") return;

    var categoryUrl = card.getAttribute("href");
    var article = document.createElement("article");
    article.className = card.className;
    article.id = card.id;
    article.setAttribute("role", "group");
    article.setAttribute("tabindex", "0");
    article.setAttribute("aria-label", card.getAttribute("aria-label") || "Memory Edition category");
    while (card.firstChild) article.appendChild(card.firstChild);
    card.replaceWith(article);

    var explore = article.querySelector(".explore");
    if (explore) {
      var categoryLink = document.createElement("a");
      categoryLink.className = "explore";
      categoryLink.href = categoryUrl;
      categoryLink.innerHTML = explore.innerHTML;
      explore.replaceWith(categoryLink);
    }

    var actions = document.createElement("div");
    actions.className = "occasion-actions";
    if (categoryLink) actions.appendChild(categoryLink);

    var demoLink = document.createElement("a");
    demoLink.className = "live-demo";
    demoLink.href = liveDemoUrl;
    demoLink.target = "_blank";
    demoLink.rel = "noopener noreferrer";
    demoLink.innerHTML = 'Explore Live Demo <span aria-hidden="true">↗</span>';
    actions.appendChild(demoLink);
    article.appendChild(actions);

    article.addEventListener("click", function (event) {
      if (event.target.closest("a")) return;
      window.location.href = categoryUrl;
    });
    article.addEventListener("keydown", function (event) {
      if (event.target !== article || (event.key !== "Enter" && event.key !== " ")) return;
      event.preventDefault();
      window.location.href = categoryUrl;
    });
  });
}());
