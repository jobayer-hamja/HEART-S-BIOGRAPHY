/* WishVerse order and pricing configuration. */
window.WISHVERSE_CONFIG = {
  currency: window.HEARTS_BIOGRAPHY_CURRENCY || "BDT ",
  pricing: {
    baseWishPrice: 599,
    additionalWishPrice: 500,
    minimumMultipleQuantity: 2
  },
  dateInvitationPackages: [
    {
      id: "first-spark",
      name: "The First Spark",
      price: 499,
      description: "A little journey of questions, memories, and one special invitation.",
      includes: ["Password Unlock", "Cinematic Introduction with music controls", "Four Interactive Questions", "Animated Days Counter", "Fifth Serious Yes/No Question", "Cinematic Date Invitation Reveal", "Live Countdown", "Emotional Ending for the No response"]
    },
    {
      id: "memory-lane",
      name: "The Memory Lane",
      price: 599,
      description: "Two memories. One heartfelt letter. One more special date.",
      includes: ["Everything in The First Spark", "Two Previous Date Memories with photos, dates, locations and descriptions", "Fifth Serious Yes/No Question", "Cinematic Envelope Opening", "Personalized Letter", "Personalized Date Invitation", "Live Countdown", "Emotional Ending for the No response"]
    },
    {
      id: "hearts-promise",
      name: "The Heart's Promise",
      price: 699,
      description: "Five memories. One heartfelt promise. A story worth continuing.",
      includes: ["Everything in The Memory Lane", "Five Previous Date Memories with photos, dates, locations and descriptions", "Cinematic Envelope Opening", "Personalized Letter", "Personalized Date Invitation", "Live Countdown", "Cinematic Heartbreak Sequence for the No response", "Heart Restoration Sequence", "Final Emotional Closing Experience"]
    }
  ],
  packages: [
    {
      id: "digital-wish",
      name: "Personalized digital Wish",
      description: "A personal digital Wish created with the customer’s own text and photos where that Wish requires them. Each Wish keeps its own predefined design and experience.",
      includes: [
        "One personalized digital Wish experience",
        "Customer-provided text and photos where required by the selected Wish",
        "A fixed, predefined design unique to the selected Wish"
      ]
    }
  ],
  singleWishExperiences: {
    "birthday-celebration": {
      category: "Birthday Celebration",
      page: "wishverse-birthday-celebration.html",
      context: "MAKE A WISH",
      subtitle: "A Birthday Journey Made Just for Someone Special.",
      description: "A cinematic birthday surprise filled with fun questions, a secret envelope, personalized birthday letters, and a hidden surprise waiting to be discovered.",
      highlights: ["Cinematic Birthday Wish", "Five Fun Birthday Questions", "Secret Envelope Unlock", "Personalized Birthday Letters", "Hidden Secret Letter", "Special Cinematic Ending"]
    },
    "gift-presentation": {
      category: "Gift Presentation",
      page: "wishverse-gift-presentation.html",
      pageTitle: "The Grand Unwrapping",
      title: "THE GRAND UNWRAPPING",
      context: "GIFT PRESENTATION · SPECIAL EXPERIENCE",
      subtitle: "Every gift has a story. Every reveal has a feeling.",
      description: "A personalized cinematic gift-unwrapping experience where every surprise is unlocked through five questions, every gift gets its own moment, and everything ends with a heartfelt letter.",
      highlights: ["Cinematic Gift Reveal", "Five Fun Questions", "Secret Gift Unlock", "One-by-One Gift Presentation", "Personalized Gift Messages", "Cinematic Final Letter"],
      ctaText: "Personalize Your Gift Experience"
    },
    "marriage-proposal": {
      category: "Marriage Proposal",
      page: "wishverse-marriage-proposal.html",
      pageTitle: "THE MARRIAGE PROPOSAL",
      title: "THE MARRIAGE PROPOSAL",
      context: "A QUESTION THAT CHANGES EVERYTHING",
      subtitle: "A Question That Changes Everything.",
      description: "A cinematic journey through your love story, meaningful memories, heartfelt promises, and one unforgettable question.",
      highlights: ["15 Cinematic Chapters", "Interactive Marriage Interview", "Personal Memory Experience", "Heartfelt Letters & Promises", "The Grand Proposal Moment", "Future Wife Examination", "Personalized Final Report", "Scan to Experience — QR Code"],
      ctaText: "CREATE YOUR PROPOSAL",
      ctaHref: "wishverse.html?wish=marriage-proposal#builder"
    },
    "love-confession": {
      category: "Love Confession",
      page: "wishverse-love-confession.html",
      context: "MY HEART SAYS YOU",
      subtitle: "A Confession Worth Remembering.",
      description: "A cinematic confession journey with four heartfelt questions, a heartbeat moment, a vintage love letter, six promises, and a YES/NO ending with a complete response report.",
      highlights: ["Personalized Welcome & Story", "Four Interactive Questions", "Emotional Heartbeat Confession", "Vintage Envelope & Love Letter", "Six Heartfelt Promises", "YES/NO Ending & WhatsApp Report", "QR CODE"]
    },
    "anniversary-surprise": {
      category: "Anniversary Surprise",
      page: "wishverse-anniversary-surprise.html",
      context: "STILL US",
      description: "Celebrate relationship milestones with personalized messages, memories, and romantic surprises."
    },
    "apology-makeup": {
      category: "Apology & Make Up",
      page: "wishverse-apology-makeup.html",
      context: "LET'S MAKE IT RIGHT",
      subtitle: "A heartfelt journey toward understanding and a new beginning.",
      description: "Share your story, remember what matters, offer a sincere apology, and invite an honest response.",
      highlights: ["A Story of Us — Personalized Welcome & Cinematic Story", "What Happened Between Us — Interactive Questions & Answers", "Memories We Shared — Emotional Memory Experience", "A Sincere Apology — Personalized Apology Letter", "Actions Speak Louder — Six Heartfelt Promises", "Give Us Another Chance — YES / NEED TIME / NO Responses & WhatsApp Report", "Scan to Experience — QR Code"]
    },
    "signature-wish": {
      category: "The Signature Wish",
      page: "wishverse-signature-wish.html",
      pageTitle: "THE SIGNATURE WISH",
      title: "THE SIGNATURE WISH",
      context: "WISHVERSE EXCLUSIVE",
      subtitle: "Your Imagination. Your Creation.",
      description: "“Create an experience that is entirely yours.”",
      priceDisplay: "Based on your requirements",
      variablePrice: true,
      ctaText: "CREATE YOUR SIGNATURE WISH"
    }
  },
  orderChannel: {
    type: "whatsapp",
    destination: (window.HEARTS_BIOGRAPHY_MAGAZINE_PACKAGES || {}).businessWhatsApp || ""
  }
};

window.WISHVERSE_CONFIG.getDateInvitationPackage = function (id) {
  return window.WISHVERSE_CONFIG.dateInvitationPackages.find(function (item) { return item.id === id; }) || null;
};

window.WISHVERSE_CONFIG.getSingleWishExperience = function (id) {
  return window.WISHVERSE_CONFIG.singleWishExperiences[id] || null;
};

window.WISHVERSE_CONFIG.calculateTotal = function (quantity, categories) {
  var pricing = window.WISHVERSE_CONFIG.pricing;
  if (!Number.isSafeInteger(quantity) || quantity < 1) return null;
  if (Array.isArray(categories) && categories.indexOf("The Signature Wish") !== -1) return null;
  var basePrice = pricing.baseWishPrice;
  var total = basePrice + (quantity - 1) * pricing.additionalWishPrice;
  return Number.isSafeInteger(total) ? total : null;
};
