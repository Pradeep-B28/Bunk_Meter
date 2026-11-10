// Every setting lives here. Change values here, never in other files.

export const CONFIG = {
  version: "1.0.0",

  // The live address. Set in Phase 4 (deploy). Used for link previews and the share message.
  siteUrl: "",

  // Sales WhatsApp: digits only, country code first. Empty hides the WhatsApp button.
  salesWhatsApp: "",
  whatsAppText: "Hi, I tried the Bunk Meter. I want to know more about the {program}.",

  // The program the CTA sells. Always use the full name. page is its page on wrench-wise.com, or "" for the main site.
  program: {
    name: "Certification Program in AI-Powered Software Engineering & DSA",
    page: ""
  },

  website: "https://wrench-wise.com",
  utm: { source: "bunk-meter", medium: "web-project", campaign: "bunk-meter" },

  // Attendance targets a visitor can pick. The first is the default.
  targets: [75, 80, 85],

  // The two "Try an example" buttons. Their answers are checked by tools/verify.mjs.
  examples: {
    safe: { attended: 33, total: 40 },  // You can skip 4
    danger: { attended: 17, total: 25 } // Attend the next 7
  },

  whatIfMax: 30,     // the What if slider goes from 0 to this many classes
  countMs: 450,      // the big number counts to its new value for this long
  loaderMs: 900,     // the loader never runs longer than this
  holdRepeatMs: 90,  // holding a + or - button repeats this often

  // Switches. false hides the feature completely, with no errors.
  features: {
    darkTheme: true,
    whatIf: true,
    todayButtons: true,
    saveOnDevice: true,
    share: true,
    howItWorks: true,
    yourTurn: true
  }
};
