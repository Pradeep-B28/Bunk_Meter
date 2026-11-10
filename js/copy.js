// All words on the site. Do not reword unless I ask. Use t("hero.title") to read one.
// {name} parts are filled in by t(key, { name: value }).

export const COPY = {
  brand: "Wrench Wise",
  hero: {
    eyebrow: "Free attendance tool",
    title: "How many classes can you skip?",
    sub: "Enter your classes attended and the total so far. Bunk Meter tells you how many you can skip and still keep {target}%."
  },
  input: {
    attended: "Classes attended",
    total: "Total classes so far",
    target: "Your college needs",
    minus: "One less",
    plus: "One more",
    examples: "Try an example",
    exampleSafe: "Doing well",
    exampleDanger: "Falling behind",
    reset: "Start over"
  },
  errors: {
    empty: "Enter a number.",
    notWhole: "Use whole numbers only, like 36.",
    tooBig: "That is more than 5,000 classes. Check the number.",
    zeroTotal: "Total classes must be at least 1.",
    moreThanTotal: "Classes attended cannot be more than the total.",
    badTarget: "Pick a target from the list."
  },
  meter: {
    idle: "Your answer shows up here.",
    idleSub: "Fill in both numbers, or try an example.",
    safeLabel: "You can skip",
    safeUnit: "{count} classes",
    safeUnitOne: "1 class",
    edgeTitle: "Don't skip the next class.",
    edgeSub: "You are right at {target}%. One skip takes you below it.",
    dangerLabel: "Attend the next",
    dangerUnit: "{count} classes",
    dangerUnitOne: "class",
    now: "You are at {percent}%",
    afterSkip: "After {count} skips: {percent}%",
    afterSkipOne: "After 1 skip: {percent}%",
    dropLine: "One more skip and you drop to {percent}%.",
    afterAttend: "After {count} classes in a row: {percent}%",
    afterAttendOne: "After the next class: {percent}%",
    target: "{target}% line",
    missed: "Missed so far: {count}"
  },
  whatIf: {
    heading: "What if?",
    skip: "Skip",
    attend: "Attend",
    line: "If you {action} the next {count} classes, you will be at {percent}%.",
    lineOne: "If you {action} the next class, you will be at {percent}%.",
    lineZero: "Move the slider to see where you will be.",
    above: "Above {target}%",
    below: "Below {target}%"
  },
  today: {
    heading: "Had a class today?",
    attended: "I attended",
    skipped: "I skipped",
    undo: "Undo",
    done: "Added. Your numbers are updated.",
    full: "You have reached the 5,000 class limit."
  },
  save: {
    on: "Saved on this device only",
    clear: "Clear my data",
    cleared: "Your data is cleared.",
    blocked: "Your browser is not saving data, so your numbers will reset when you close this page."
  },
  share: {
    button: "Share my result",
    safe: "I can skip {count} classes and still keep {target}%. Check yours:",
    edge: "I am right at {target}% attendance. No more skipping for me. Check yours:",
    danger: "I need to attend the next {count} classes to get back to {target}%. Check yours:",
    copied: "Link copied"
  },
  how: {
    heading: "How the maths works",
    intro: "Every class you skip adds 1 to the total but not to attended. Every class you attend adds 1 to both.",
    skipTitle: "Classes you can skip",
    skipFormula: "(100 × attended − {target} × total) ÷ {target}, rounded down",
    needTitle: "Classes you must attend",
    needFormula: "({target} × total − 100 × attended) ÷ (100 − {target}), rounded up",
    yours: "With your numbers: ({top}) ÷ {bottom} = {answer}",
    loopTitle: "Loop or formula?",
    loop: "A loop would test one class at a time and need {checks} checks. The formula gets the answer in 1 step, however many classes you have.",
    rounding: "Percentages here are rounded down, so 74.96% shows as 74.9%, never 75%."
  },
  yourTurn: {
    heading: "Your turn: add subject-wise tracking",
    body: "Some colleges check 75% for every subject, not just overall. Build it into this project.",
    one: "Your numbers are already saved as a list of subjects. Right now the list has one item.",
    two: "Add a form to name a subject, then show one meter card per subject.",
    three: "Use the same calc() function for each card. No new maths needed."
  },
  note: "Your college's rules decide. Some count medical leave or round differently, so check with them.",
  cta: {
    title: "Want to build tools like this?",
    body: "Bunk Meter is built with plain JavaScript, a little maths and smart state. Learn these skills step by step in the {program}.",
    button: "Explore the program",
    whatsApp: "Talk to us on WhatsApp"
  },
  footer: {
    built: "Built by Wrench Wise",
    privacy: "Your numbers stay on your device."
  },
  noScript: "This page needs JavaScript to run."
};

export function t(key, values = {}) {
  const found = key.split(".").reduce((node, part) => node?.[part], COPY);
  if (typeof found !== "string") return "";
  return found.replace(/\{(\w+)\}/g, (all, name) => values[name] ?? all);
}
