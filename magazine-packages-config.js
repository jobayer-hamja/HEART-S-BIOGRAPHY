/* Shared finalized magazine package content and editable pricing. */
window.HEARTS_BIOGRAPHY_CURRENCY = "BDT ";
window.HEARTS_BIOGRAPHY_MAGAZINE_PACKAGES = {
  currency: window.HEARTS_BIOGRAPHY_CURRENCY,
  businessWhatsApp: "8801898928738", // Heart's Biography business WhatsApp number (Bangladesh).
  priceComingSoon: "Price Coming Soon",
  prices: {
    essential: null,
    premium: null,
    signature: null
  },
  hardCopyPaperGsm: 150,
  categoryPriceOverrides: {
    birthday: {},
    anniversary: {},
    "love-story": {},
    friendship: {},
    wedding: {},
    "just-because": {}
  },
  packages: [
    {
      id: "essential",
      name: "ESSENTIAL",
      subtitle: "The Classic Experience",
      pageCount: "12 A4 Pages",
      description: "A beautiful and simple way to preserve special memories in an interactive digital magazine.",
      hardCopyExtraCost: 900,
      hardCopyOptional: true,
      hardCopyIncluded: false,
      qrCode: false,
      customText: false,
      included: ["12 A4 Magazine Pages", "Interactive 3D Flipbook", "5 Default Music Tracks", "Interactive Music Player with Song Names", "About the Magazine Section", "Mobile & Desktop Support"],
      notIncluded: ["Physical A4 Hard Copy (Optional Add-On)", "QR Code", "Custom Text", "Cinematic Opening", "Custom Music", "About Person / Personal Details Section", "PDF Slide Mode", "PDF Scroll Mode"],
      customMusicTracks: 0,
      aboutPerson: false,
      pdfSlideMode: false,
      pdfScrollMode: false
    },
    {
      id: "premium",
      name: "PREMIUM",
      subtitle: "The Cinematic Experience",
      pageCount: "16 A4 Pages",
      description: "A more immersive digital magazine with cinematic storytelling, personalized details, and a richer music experience.",
      hardCopyExtraCost: 1200,
      hardCopyOptional: true,
      hardCopyIncluded: false,
      qrCode: true,
      customText: false,
      included: ["16 A4 Magazine Pages", "Interactive 3D Flipbook", "QR Code", "Cinematic Opening", "2 Custom Music Tracks", "4 Default Music Tracks", "Interactive Music Player with Song Names", "About the Magazine Section", "About Person / Personal Details Section", "PDF Slide Mode", "Mobile & Desktop Support"],
      notIncluded: ["Physical A4 Hard Copy (Optional Add-On)", "Custom Text", "PDF Scroll Mode"],
      popular: true,
      customMusicTracks: 2,
      aboutPerson: true,
      pdfSlideMode: true,
      pdfScrollMode: false
    },
    {
      id: "signature",
      name: "SIGNATURE",
      subtitle: "The Complete Experience",
      pageCount: "20 A4 Pages",
      description: "The most complete personalized digital magazine experience, designed for those who want every detail to feel special.",
      hardCopyExtraCost: 1400,
      hardCopyOptional: true,
      hardCopyIncluded: false,
      qrCode: true,
      customText: true,
      included: ["20 A4 Magazine Pages", "Interactive 3D Flipbook", "QR Code", "Custom Text", "Cinematic Opening", "6 Custom Music Tracks", "Interactive Music Player with Song Names", "About the Magazine Section", "About Person / Personal Details Section", "PDF Slide Mode", "PDF Scroll Mode", "Mobile & Desktop Support"],
      notIncluded: ["Physical A4 Hard Copy (Optional Add-On)"],
      customMusicTracks: 6,
      aboutPerson: true,
      pdfSlideMode: true,
      pdfScrollMode: true
    }
  ]
};



