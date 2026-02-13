
const LS_KEYS = {
  CARDS: "flashcards_v1",
  SETTINGS: "flashcards_settings_v1",
};

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}


let cards = loadJSON(LS_KEYS.CARDS, [
  
  { id: crypto.randomUUID(), cn: "你好", en: "Hello", pinyin: "nǐ hǎo", notes: "" },
  { id: crypto.randomUUID(), cn: "谢谢", en: "Thank you", pinyin: "xiè xie", notes: "" },
]);

let settings = loadJSON(LS_KEYS.SETTINGS, {
  direction: "CN_TO_EN", 
  showPinyin: true,
  currentIndex: 0,
});

function persist() {
  saveJSON(LS_KEYS.CARDS, cards);
  saveJSON(LS_KEYS.SETTINGS, settings);
}



const flashcardEl = document.getElementById("flashcard");
const frontTextEl = document.getElementById("frontText");
const backTextEl = document.getElementById("backText");
const frontSubEl = document.getElementById("frontSub");
const backSubEl = document.getElementById("backSub");
const frontTagEl = document.getElementById("frontTag");
const backTagEl = document.getElementById("backTag");

const countLabelEl = document.getElementById("countLabel");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const shuffleBtn = document.getElementById("shuffleBtn");
const swapBtn = document.getElementById("swapBtn");
const togglePinyinBtn = document.getElementById("togglePinyinBtn");
const deleteCurrentBtn = document.getElementById("deleteCurrentBtn");

const addForm = document.getElementById("addForm");
const cnInput = document.getElementById("cnInput");
const enInput = document.getElementById("enInput");
const pyInput = document.getElementById("pyInput");
const notesInput = document.getElementById("notesInput");
const apiFillBtn = document.getElementById("apiFillBtn");

const deckList = document.getElementById("deckList");
const clearAllBtn = document.getElementById("clearAllBtn");


const contactForm = document.getElementById("contactForm");
const nameInput = document.getElementById("nameInput");
const emailInput = document.getElementById("emailInput");
const messageInput = document.getElementById("messageInput");
const nameError = document.getElementById("nameError");
const emailError = document.getElementById("emailError");
const messageError = document.getElementById("messageError");
const contactSuccess = document.getElementById("contactSuccess");


function clampIndex(i) {
  if (cards.length === 0) return 0;
  const max = cards.length - 1;
  return Math.min(Math.max(i, 0), max);
}

function currentCard() {
  if (cards.length === 0) return null;
  settings.currentIndex = clampIndex(settings.currentIndex);
  return cards[settings.currentIndex];
}

function setFlipped(isFlipped) {
  flashcardEl.classList.toggle("flipped", isFlipped);
}

function updateCountLabel() {
  const total = cards.length;
  const n = total === 0 ? 0 : settings.currentIndex + 1;
  countLabelEl.textContent = `${n} / ${total}`;
}

function renderStudyCard() {
  updateCountLabel();
  const card = currentCard();

  if (!card) {
    frontTextEl.textContent = "Add cards to start";
    backTextEl.textContent = "...";
    frontSubEl.textContent = "";
    backSubEl.textContent = "";
    frontTagEl.textContent = "—";
    backTagEl.textContent = "—";
    return;
  }

  const isCNtoEN = settings.direction === "CN_TO_EN";

  const frontMain = isCNtoEN ? card.cn : card.en;
  const backMain = isCNtoEN ? card.en : card.cn;

  frontTextEl.textContent = frontMain || "—";
  backTextEl.textContent = backMain || "—";


  frontTagEl.textContent = isCNtoEN ? "中文" : "English";
  backTagEl.textContent = isCNtoEN ? "English" : "中文";

  
  const pinyinLine = settings.showPinyin && card.pinyin ? `Pinyin: ${card.pinyin}` : "";
  const notesLine = card.notes ? `Notes: ${card.notes}` : "";

  if (isCNtoEN) {
    frontSubEl.textContent = [pinyinLine, notesLine].filter(Boolean).join(" - ");
    backSubEl.textContent = "";
  } else {
    
    frontSubEl.textContent = notesLine;
    backSubEl.textContent = settings.showPinyin && card.pinyin ? `Pinyin: ${card.pinyin}` : "";
  }
}

function renderDeckList() {
  deckList.innerHTML = "";

  if (cards.length === 0) {
    const empty = document.createElement("div");
    empty.className = "muted small";
    empty.textContent = "No cards yet. Add some above.";
    deckList.appendChild(empty);
    return;
  }

  cards.forEach((c, idx) => {
    const item = document.createElement("div");
    item.className = "deck-item";

    const main = document.createElement("div");
    main.className = "deck-main";

    const line1 = document.createElement("div");
    line1.className = "deck-line";
    line1.innerHTML = `
      <span class="badge">中文</span>
      <strong>${escapeHTML(c.cn || "")}</strong>
      ${c.pinyin ? `<span class="muted">${escapeHTML(c.pinyin)}</span>` : ""}
    `;

    const line2 = document.createElement("div");
    line2.className = "deck-line";
    line2.innerHTML = `
      <span class="badge">EN</span>
      <span>${escapeHTML(c.en || "")}</span>
      ${c.notes ? `<span class="muted">• ${escapeHTML(c.notes)}</span>` : ""}
    `;

    main.appendChild(line1);
    main.appendChild(line2);

    const actions = document.createElement("div");
    actions.className = "deck-actions";

    const studyBtn = document.createElement("button");
    studyBtn.className = "btn btn-ghost iconbtn";
    studyBtn.type = "button";
    studyBtn.textContent = "Study";
    studyBtn.addEventListener("click", () => {
      settings.currentIndex = idx;
      setFlipped(false);
      persist();
      renderAll();
      flashcardEl.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    const editBtn = document.createElement("button");
    editBtn.className = "btn btn-ghost iconbtn";
    editBtn.type = "button";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => {
      
      cnInput.value = c.cn || "";
      enInput.value = c.en || "";
      pyInput.value = c.pinyin || "";
      notesInput.value = c.notes || "";

      cards = cards.filter(x => x.id !== c.id);
      if (settings.currentIndex >= cards.length) settings.currentIndex = Math.max(cards.length - 1, 0);

      persist();
      renderAll();
      cnInput.focus();
    });

    const delBtn = document.createElement("button");
    delBtn.className = "btn btn-danger iconbtn";
    delBtn.type = "button";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => {
      cards = cards.filter(x => x.id !== c.id);
      settings.currentIndex = clampIndex(settings.currentIndex);
      setFlipped(false);
      persist();
      renderAll();
    });

    actions.appendChild(studyBtn);
    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    item.appendChild(main);
    item.appendChild(actions);
    deckList.appendChild(item);
  });
}

function escapeHTML(str) {
  str = str.replaceAll("&", "&amp;");
  str = str.replaceAll("<", "&lt;");
  str = str.replaceAll(">", "&gt;");
  str = str.replaceAll('"', "&quot;");
  str = str.replaceAll("'", "&#039;");
  return str;
}

function renderAll() {
  renderStudyCard();
  renderDeckList();
}


function goNext() {
  if (cards.length === 0) return;
  settings.currentIndex = (settings.currentIndex + 1) % cards.length;
  setFlipped(false);
  persist();
  renderStudyCard();
}

function goPrev() {
  if (cards.length === 0) return;
  settings.currentIndex = (settings.currentIndex - 1 + cards.length) % cards.length;
  setFlipped(false);
  persist();
  renderStudyCard();
}

flashcardEl.addEventListener("click", () => {
  flashcardEl.classList.toggle("flipped");
});

flashcardEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    flashcardEl.classList.toggle("flipped");
  }
  if (e.key === "ArrowRight") goNext();
  if (e.key === "ArrowLeft") goPrev();
});

nextBtn.addEventListener("click", goNext);
prevBtn.addEventListener("click", goPrev);

shuffleBtn.addEventListener("click", () => {
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  settings.currentIndex = 0;
  setFlipped(false);
  persist();
  renderAll();
});

swapBtn.addEventListener("click", () => {
  settings.direction = settings.direction === "CN_TO_EN" ? "EN_TO_CN" : "CN_TO_EN";
  setFlipped(false);
  persist();
  renderStudyCard();
});

togglePinyinBtn.addEventListener("click", () => {
  settings.showPinyin = !settings.showPinyin;
  persist();
  renderStudyCard();
});

deleteCurrentBtn.addEventListener("click", () => {
  const card = currentCard();
  if (!card) return;

  cards = cards.filter(c => c.id !== card.id);
  settings.currentIndex = clampIndex(settings.currentIndex);
  setFlipped(false);
  persist();
  renderAll();
});


addForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const cn = cnInput.value.trim();
  const en = enInput.value.trim();
  const pinyin = pyInput.value.trim();
  const notes = notesInput.value.trim();

  if (!cn || !en) return;

  cards.unshift({
    id: crypto.randomUUID(),
    cn,
    en,
    pinyin,
    notes,
  });

 
  settings.currentIndex = 0;
  setFlipped(false);

  
  addForm.reset();

  persist();
  renderAll();
});



async function translate(text, langPair) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(langPair)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Translation request failed");
  const data = await res.json();
  const translated = data?.responseData?.translatedText;
  return translated || "";
}

apiFillBtn.addEventListener("click", async () => {
  const cn = cnInput.value.trim();
  const en = enInput.value.trim();

  apiFillBtn.disabled = true;
  apiFillBtn.textContent = "Translating...";

  try {
    
    if (cn && !en) {
      const t = await translate(cn, "zh-CN|en");
      enInput.value = t;
    }
    
    else if (en && !cn) {
      const t = await translate(en, "en|zh-CN");
      cnInput.value = t;
    }
  } catch (err) {
    alert("Could not translate right now. Try again later.");
  } finally {
    apiFillBtn.disabled = false;
    apiFillBtn.textContent = "Auto-translate (API)";
  }
});


clearAllBtn.addEventListener("click", () => {
  const ok = confirm("Clear all cards? This cannot be undone.");
  if (!ok) return;

  cards = [];
  settings.currentIndex = 0;
  setFlipped(false);
  persist();
  renderAll();
});


const isValidEmail = email => email.includes("@") && email.includes(".");

function setError(el, msg) {
  el.textContent = msg || "";
}

contactForm.addEventListener("submit", (e) => {
  e.preventDefault();
  contactSuccess.textContent = "";

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const message = messageInput.value.trim();

  let ok = true;

  if (name.length < 2) { setError(nameError, "Please enter your name (min 2 chars)."); ok = false; }
  else setError(nameError, "");

  if (!isValidEmail(email)) { setError(emailError, "Please enter a valid email."); ok = false; }
  else setError(emailError, "");

  if (message.length < 10) { setError(messageError, "Message must be at least 10 characters."); ok = false; }
  else setError(messageError, "");

  if (!ok) return;

  contactSuccess.textContent = "Thanks for your message!";
  contactForm.reset();
});


persist();
renderAll();


