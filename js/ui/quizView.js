const answerList = document.querySelector("#answer-list");
const feedback = document.querySelector("#feedback");
const progressTrack = document.querySelector(".progress-track");
const progressBar = document.querySelector("#progress-bar");
const saveWordButton = document.querySelector("#save-word-button");
const autoNextMessage = document.querySelector("#auto-next-message");
const quizActions = document.querySelector(".quiz-actions");
const speakButton = document.querySelector("#speak-button");

export function renderQuestion(
  question,
  index,
  total,
  isCorrect = null,
  submittedAnswer = null,
  isSaved = false,
  onAnswer = null
) {
  if (!quizActions.contains(saveWordButton)) {
    quizActions.replaceChildren(saveWordButton, autoNextMessage);
  }
  answerList.replaceChildren();
  feedback.textContent = "";
  feedback.className = "feedback";
  autoNextMessage.textContent = "";

  document.querySelector("#word-prompt").textContent = question.word;
  document.querySelector("#question-title").textContent =
    question.kind === "sentence" ? "ما معنى هذه الجملة؟" : "ما معنى هذه الكلمة؟";
  document.querySelector("#word-example").textContent = question.example || "";
  speakButton.hidden = false;
  speakButton.dataset.text = question.word;
  speakButton.textContent = question.kind === "sentence" ? "🔊 اسمع الجملة" : "🔊 اسمع الكلمة";
  document.querySelector("#question-count").textContent =
    `السؤال ${index + 1} من ${total}`;
  progressBar.style.width = `${((index + 1) / total) * 100}%`;
  progressTrack.setAttribute("aria-valuenow", String(Math.round(((index + 1) / total) * 100)));
  saveWordButton.hidden = false;
  saveWordButton.disabled = isCorrect !== null;
  saveWordButton.dataset.word = question.word;
  saveWordButton.dataset.meaning = question.meaning;
  saveWordButton.setAttribute("aria-pressed", String(isSaved));
  saveWordButton.textContent = isSaved ? "★ محفوظة" : "☆ احفظ الكلمة";

  question.choices.forEach((choice) => {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "answer-option";
    option.textContent = choice;
    option.dataset.answer = choice;
    option.setAttribute("aria-pressed", "false");
    option.addEventListener("click", () => {
      if (option.disabled || !onAnswer) return;
      answerList.querySelectorAll(".answer-option").forEach((button) => {
        button.disabled = true;
        if (button.dataset.answer === question.meaning) button.classList.add("is-correct");
      });
      option.classList.add(option.dataset.answer === question.meaning
        ? "is-correct"
        : "is-incorrect");
      option.setAttribute("aria-pressed", "true");
      onAnswer(choice);
    });
    answerList.append(option);
  });

  if (isCorrect !== null) {
    const correctAnswer = question.meaning;
    answerList.querySelectorAll(".answer-option").forEach((option) => {
      option.disabled = true;
      if (option.dataset.answer === correctAnswer) option.classList.add("is-correct");
      if (option.dataset.answer === submittedAnswer && !isCorrect) {
        option.classList.add("is-incorrect");
      }
    });
    feedback.textContent = isCorrect
      ? "إجابة صحيحة، أحسنت!"
      : `الإجابة الصحيحة: ${correctAnswer}. أُضيفت الكلمة إلى كلماتك المحفوظة.`;
    feedback.classList.add(isCorrect ? "is-correct" : "is-incorrect");
    saveWordButton.disabled = true;
    autoNextMessage.textContent = index + 1 === total
      ? "جاري عرض النتيجة..."
      : "جاري الانتقال للسؤال التالي...";
  }
}

export function renderResults(score, total, onRestart) {
  const percent = Math.round((score / total) * 100);
  document.querySelector("#question-count").textContent = "اكتمل الاختبار";
  document.querySelector("#word-prompt").textContent = `${score} / ${total}`;
  answerList.replaceChildren();
  saveWordButton.hidden = true;
  speakButton.hidden = true;
  feedback.textContent = `أجبت بشكل صحيح عن ${percent}٪ من الأسئلة.`;
  feedback.className = "feedback is-correct";
  progressBar.style.width = "100%";
  progressTrack.setAttribute("aria-valuenow", "100");
  autoNextMessage.textContent = "";
  const restartButton = document.createElement("button");
  restartButton.type = "button";
  restartButton.className = "button button-primary";
  restartButton.textContent = "ابدأ اختبارًا جديدًا";
  restartButton.addEventListener("click", onRestart, { once: true });
  quizActions.replaceChildren(restartButton);
}

export function renderReview(questions, incorrectWords, onRetry) {
  const card = document.querySelector("#review-card");
  const summary = document.querySelector("#review-summary");
  const list = document.querySelector("#review-list");
  const retryButton = document.querySelector("#review-again-button");
  const missed = questions.filter((question) =>
    incorrectWords.includes(question.word)
  );

  card.hidden = false;
  summary.textContent = missed.length
    ? `هذه الكلمات التي تحتاج مراجعة (${missed.length}):`
    : "ممتاز! أجبت عن كل الكلمات بشكل صحيح.";
  list.replaceChildren();
  missed.forEach((word) => {
    const row = document.createElement("div");
    row.className = "saved-word";
    const details = document.createElement("span");
    const english = document.createElement("strong");
    english.dir = "ltr";
    english.textContent = word.word;
    const meaning = document.createElement("small");
    meaning.textContent = word.meaning;
    details.append(english, meaning);
    const audioButton = document.createElement("button");
    audioButton.type = "button";
    audioButton.className = "button button-quiet";
    audioButton.textContent = "🔊 اسمع";
    audioButton.dataset.text = word.word;
    audioButton.setAttribute("aria-label", `استمع إلى ${word.word}`);
    row.append(details, audioButton);
    list.append(row);
  });
  retryButton.hidden = missed.length === 0;
  retryButton.onclick = missed.length ? () => onRetry(missed) : null;
}

export function renderSavedWords(savedWords, onRemove) {
  const list = document.querySelector("#saved-words-list");
  const count = document.querySelector("#saved-word-count");
  count.textContent = new Intl.NumberFormat("ar").format(savedWords.length);
  list.replaceChildren();

  if (!savedWords.length) {
    const empty = document.createElement("p");
    empty.className = "empty-saved-words";
    empty.textContent = "لم تحفظ كلمات بعد. اضغط «احفظ الكلمة» أثناء الاختبار.";
    list.append(empty);
    return;
  }

  savedWords.forEach((word) => {
    const row = document.createElement("div");
    row.className = "saved-word";
    const details = document.createElement("span");
    const english = document.createElement("strong");
    english.dir = "ltr";
    english.textContent = word.word;
    const meaning = document.createElement("small");
    meaning.textContent = word.meaning;
    details.append(english, meaning);
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "button button-quiet";
    removeButton.textContent = "حذف";
    removeButton.setAttribute("aria-label", `حذف كلمة ${word.word}`);
    removeButton.addEventListener("click", () => onRemove(word.word));
    row.append(details, removeButton);
    list.append(row);
  });
}
