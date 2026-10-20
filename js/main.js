import { words } from "./data/words.js";
import { createQuiz, setQuestionCount } from "./domain/quiz.js";
import {
  getCustomWords,
  getSavedWords,
  getSettings,
  getStats,
  saveCustomWords,
  saveSavedWords,
  saveSettings,
  saveStats
} from "./services/storage.js";
import { showNotification } from "./services/notifications.js";
import { setupInstallPrompt } from "./services/install.js";
import { speakText } from "./services/speech.js";
import { renderLearningProgress, renderStats } from "./ui/dom.js";
import {
  renderQuestion,
  renderResults,
  renderReview,
  renderSavedWords
} from "./ui/quizView.js";
import { setupSettingsView } from "./ui/settingsView.js";

const stats = getStats();
const settings = getSettings();
let customWords = getCustomWords();
let savedWords = getSavedWords();
let quiz;
let answerTimer;
let reminderTimer;
let incorrectWords = [];

function allWords() {
  const unique = new Map();
  [...words, ...customWords].forEach((word) => {
    unique.set(word.word.trim().toLocaleLowerCase(), word);
  });
  return [...unique.values()];
}

function selectedWords() {
  const category = document.querySelector("#category-limit").value;
  const available = allWords();
  if (category === "all") return available;
  if (category === "custom") return customWords;
  return available.filter((word) => word.category === category);
}

function refreshStats() {
  renderStats(stats);
  saveStats(stats);
  renderLearningProgress(stats, allWords().length);
}

function updateWordCount() {
  const pool = selectedWords();
  const unseenCount = pool.filter((word) =>
    !stats.wordProgress[word.word.trim().toLocaleLowerCase()]?.attempts
  ).length;
  const count = unseenCount || pool.length;
  document.querySelector("#available-words").textContent = unseenCount
    ? `${new Intl.NumberFormat("ar").format(unseenCount)} كلمة جديدة من ${new Intl.NumberFormat("ar").format(pool.length)}`
    : `اكتملت الكلمات الجديدة · مراجعة ${new Intl.NumberFormat("ar").format(pool.length)} كلمة`;
  document.querySelectorAll("#question-limit option").forEach((option) => {
    if (option.value === "all") return;
    option.disabled = Number(option.value) > count;
  });
}

function showCurrentQuestion() {
  const question = quiz.getCurrentQuestion();
  if (!question) return;
  renderQuestion(
    question,
    quiz.index,
    quiz.questions.length,
    null,
    null,
    savedWords.some((savedWord) => savedWord.word === question.word),
    handleAnswer
  );
}

function showResults() {
  renderResults(quiz.score, quiz.questions.length, startQuiz);
  renderReview(quiz.questions, incorrectWords, startReviewQuiz);
}

function chooseQuizWords(pool, count) {
  const randomOrder = new Map(pool.map((word) => [word.word, Math.random()]));
  return [...pool]
    .sort((left, right) => {
      const leftProgress = stats.wordProgress[left.word.trim().toLocaleLowerCase()];
      const rightProgress = stats.wordProgress[right.word.trim().toLocaleLowerCase()];
      const priority = (entry) => {
        if (!entry?.attempts) return 0;
        if (entry.wrong > 0) return 1;
        return 2;
      };
      const priorityDifference = priority(leftProgress) - priority(rightProgress);
      if (priorityDifference) return priorityDifference;
      const lastAskedDifference = (leftProgress?.lastAsked || 0) -
        (rightProgress?.lastAsked || 0);
      if (lastAskedDifference) return lastAskedDifference;
      return randomOrder.get(left.word) - randomOrder.get(right.word);
    })
    .slice(0, count);
}

function handleAnswer(answer) {
  if (quiz.answered) return;
  const question = quiz.getCurrentQuestion();
  const isCorrect = quiz.submitAnswer(answer);
  const key = question.word.trim().toLocaleLowerCase();
  const wordProgress = stats.wordProgress[key] || {
    word: question.word,
    meaning: question.meaning,
    attempts: 0,
    correct: 0,
    wrong: 0,
    lastAsked: 0
  };
  wordProgress.attempts += 1;
  wordProgress.lastAsked = Date.now();
  stats.answered += 1;
  if (isCorrect) {
    wordProgress.correct += 1;
    stats.correct += 1;
  } else {
    wordProgress.wrong += 1;
    incorrectWords.push(question.word);
    saveWordForReview(question);
  }
  stats.wordProgress[key] = wordProgress;
  refreshStats();
  renderQuestion(
    question,
    quiz.index,
    quiz.questions.length,
    isCorrect,
    answer,
    savedWords.some((savedWord) => savedWord.word === question.word)
  );

  if (!isCorrect) {
    const savedWordsCard = document.querySelector("#saved-words-card");
    savedWordsCard.open = true;
    savedWordsCard.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  answerTimer = window.setTimeout(() => {
    if (quiz.advance()) {
      showCurrentQuestion();
    } else {
      showResults();
    }
  }, isCorrect ? 900 : 1800);
}

function startQuiz() {
  window.clearTimeout(answerTimer);
  const selectedPool = selectedWords();
  const unseenWords = selectedPool.filter((word) =>
    !stats.wordProgress[word.word.trim().toLocaleLowerCase()]?.attempts
  );
  const pool = unseenWords.length ? unseenWords : selectedPool;
  if (pool.length < 2) {
    document.querySelector("#settings-message").textContent =
      "أضف كلمتين على الأقل لهذا القسم حتى تبدأ الاختبار.";
    return;
  }

  const requestedCount = document.querySelector("#question-limit").value;
  const count = requestedCount === "all" ? pool.length : Number(requestedCount);
  const quizWords = chooseQuizWords(pool, Math.min(count, pool.length));
  quiz = createQuiz(quizWords, quizWords.length, allWords());
  incorrectWords = [];
  updateWordCount();
  showCurrentQuestion();
  document.querySelector("#review-card").hidden = true;
  document.querySelector("#settings-message").textContent = unseenWords.length
    ? ""
    : "أكملتِ كل كلمات هذا القسم؛ هذه جولة مراجعة للكلمات الأقدم.";
}

function startReviewQuiz(missedWords) {
  if (!missedWords.length) {
    document.querySelector("#review-summary").textContent =
      "لا توجد كلمات تحتاج إلى مراجعة.";
    return;
  }
  window.clearTimeout(answerTimer);
  quiz = createQuiz(missedWords, missedWords.length, allWords());
  incorrectWords = [];
  showCurrentQuestion();
  document.querySelector("#review-card").hidden = true;
}

function updateSavedWords() {
  saveSavedWords(savedWords);
  renderSavedWords(savedWords, removeSavedWord);
}

function saveWordForReview(word) {
  if (savedWords.some((savedWord) => savedWord.word === word.word)) return;
  savedWords = [...savedWords, { word: word.word, meaning: word.meaning }];
  updateSavedWords();
}

function removeSavedWord(word) {
  savedWords = savedWords.filter((savedWord) => savedWord.word !== word);
  updateSavedWords();
  const saveButton = document.querySelector("#save-word-button");
  if (saveButton.dataset.word === word) {
    saveButton.setAttribute("aria-pressed", "false");
    saveButton.textContent = "☆ احفظ الكلمة";
  }
}

function setReminder(enabled) {
  window.clearTimeout(reminderTimer);
  if (!enabled) return;

  const frequencyHours = Number(document.querySelector("#reminder-frequency").value);
  reminderTimer = window.setTimeout(async () => {
    const candidates = savedWords.length ? savedWords : allWords();
    if (candidates.length) {
      const word = candidates[Math.floor(Math.random() * candidates.length)];
      try {
        await showNotification(`مراجعة كلمة: ${word.word}`, {
          body: `${word.meaning} — افتح كلمتي لمراجعتها.`,
          icon: "./icons/icon.svg",
          tag: "kalimati-review"
        });
      } catch (error) {
        console.error("تعذّر إرسال تذكير المراجعة:", error);
      }
    }
    setReminder(true);
  }, frequencyHours * 60 * 60 * 1000);
}

function addCustomWord(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const word = String(formData.get("word")).trim();
  const meaning = String(formData.get("meaning")).trim();
  const example = String(formData.get("example")).trim();
  const kind = String(formData.get("kind"));
  const category = String(formData.get("category"));
  const duplicate = allWords().some(
    (entry) => entry.word.toLocaleLowerCase() === word.toLocaleLowerCase()
  );
  const message = document.querySelector("#add-word-message");

  if (!word || !meaning) {
    message.textContent = "اكتب الكلمة ومعناها أولًا.";
    return;
  }
  if (duplicate) {
    message.textContent = "هذه الكلمة موجودة بالفعل في قائمة الكلمات.";
    return;
  }

  customWords = [...customWords, {
    word,
    meaning,
    category,
    kind,
    example,
    custom: true
  }];
  saveCustomWords(customWords);
  form.reset();
  message.textContent = "تمت إضافة الكلمة. يمكنك اختيار قسمها وبدء الاختبار.";
  updateWordCount();
  refreshStats();
  if (document.querySelector("#category-limit").value === "custom") startQuiz();
}

document.querySelector("#category-limit").addEventListener("change", () => {
  updateWordCount();
  startQuiz();
});
document.querySelector("#question-limit").addEventListener("change", startQuiz);
document.querySelector("#add-word-form").addEventListener("submit", addCustomWord);

document.querySelector("#save-word-button").addEventListener("click", (event) => {
  const button = event.currentTarget;
  const word = button.dataset.word;
  const meaning = button.dataset.meaning;
  const exists = savedWords.some((savedWord) => savedWord.word === word);
  if (exists) {
    savedWords = savedWords.filter((savedWord) => savedWord.word !== word);
  } else {
    savedWords = [...savedWords, { word, meaning }];
  }
  button.setAttribute("aria-pressed", String(!exists));
  button.textContent = exists ? "☆ احفظ الكلمة" : "★ محفوظة";
  updateSavedWords();
});

document.querySelector("#speak-button").addEventListener("click", (event) => {
  const text = event.currentTarget.dataset.text;
  if (!text) return;
  try {
    speakText(text);
  } catch (error) {
    document.querySelector("#feedback").textContent = error.message;
    console.error("تعذّرت القراءة الصوتية:", error);
  }
});

document.querySelector("#review-list").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-text]");
  if (!button) return;
  try {
    speakText(button.dataset.text);
  } catch (error) {
    document.querySelector("#review-summary").textContent = error.message;
    console.error("تعذّرت القراءة الصوتية:", error);
  }
});

document.querySelector("#mistakes-list").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-save-word]");
  if (!button) return;
  const entry = stats.wordProgress[button.dataset.saveWord];
  if (!entry) return;
  saveWordForReview(entry);
  button.textContent = "تم الحفظ";
  button.disabled = true;
});

document.querySelector("#reminder-frequency").addEventListener("change", () => {
  settings.reminderFrequencyHours = Number(
    document.querySelector("#reminder-frequency").value
  );
  saveSettings(settings);
  if (settings.reminderEnabled) setReminder(true);
});

setupSettingsView({
  settings,
  onSettingsChange: (nextSettings) => {
    Object.assign(settings, nextSettings);
    saveSettings(settings);
    setReminder(settings.reminderEnabled);
  },
  onResetStats: () => {
    stats.answered = 0;
    stats.correct = 0;
    stats.wordProgress = {};
    refreshStats();
  },
  onEnableReminder: async () => {
    await showNotification("كلمتي", {
      body: "تم تفعيل تذكير مراجعة الكلمات أثناء استخدام التطبيق.",
      icon: "./icons/icon.svg"
    });
    return { ok: true, message: "تم التفعيل. يعمل التذكير ما دام التطبيق مفتوحًا." };
  }
});

document.querySelector("#reminder-frequency").value =
  String(settings.reminderFrequencyHours || 2);
setReminder(settings.reminderEnabled);
setupInstallPrompt();
updateSavedWords();
refreshStats();
updateWordCount();
startQuiz();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.error("تعذّر تسجيل عامل الخدمة:", error);
    });
  });
}
