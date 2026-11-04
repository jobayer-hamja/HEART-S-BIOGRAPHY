/* Heart's Biography magazine ordering configuration.
   Add confirmed prices/features here. Category overrides are optional. */
window.HEARTS_BIOGRAPHY_MAGAZINE_CONFIG = {
  currency: "",
  businessWhatsApp: "", // International format, digits only; leave blank until confirmed.
  packages: [
    { id: "essential", name: "ESSENTIAL", description: "", includes: [], price: null, priceLabel: "Price to be confirmed" },
    { id: "premium", name: "PREMIUM", description: "", includes: [], price: null, priceLabel: "Price to be confirmed" },
    { id: "signature", name: "SIGNATURE", description: "", includes: [], price: null, priceLabel: "Price to be confirmed" }
  ],
  categoryOverrides: {
    birthday: {},
    anniversary: {},
    valentines: {},
    wedding: {},
    justBecause: {}
  }
};
