const numberFormat = new Intl.NumberFormat("ar");

export function renderStats(stats) {
  const accuracy = stats.answered
    ? Math.round((stats.correct / stats.answered) * 100)
    : 0;

  document.querySelector("#total-answered").textContent = numberFormat.format(stats.answered);
  document.querySelector("#correct-answers").textContent = numberFormat.format(stats.correct);
  document.querySelector("#accuracy").textContent = `${numberFormat.format(accuracy)}٪`;
}

export function renderLearningProgress(stats, totalWords) {
  const progress = stats.wordProgress || {};
  const entries = Object.values(progress);
  const studied = entries.filter((entry) => entry.attempts > 0).length;
  const percent = totalWords ? Math.round((studied / totalWords) * 100) : 0;
  const mistakes = entries
    .filter((entry) => entry.wrong > 0)
    .sort((left, right) => right.wrong - left.wrong);

  document.querySelector("#learned-count").textContent =
    `${numberFormat.format(studied)} / ${numberFormat.format(totalWords)}`;
  document.querySelector("#learning-progress-bar").style.width = `${percent}%`;
  document.querySelector(".learning-progress-track").setAttribute("aria-valuenow", String(percent));
  document.querySelector("#learning-progress-caption").textContent =
    `تدرّبت على ${numberFormat.format(studied)} من أصل ${numberFormat.format(totalWords)} كلمة (${numberFormat.format(percent)}٪).`;

  const count = document.querySelector("#mistakes-count");
  const list = document.querySelector("#mistakes-list");
  count.textContent = numberFormat.format(mistakes.length);
  list.replaceChildren();
  if (!mistakes.length) {
    const empty = document.createElement("p");
    empty.className = "empty-saved-words";
    empty.textContent = "لا توجد أخطاء مسجّلة بعد. واصل التعلّم!";
    list.append(empty);
    return;
  }

  mistakes.forEach((entry) => {
    const row = document.createElement("div");
    row.className = "saved-word";
    const details = document.createElement("span");
    const english = document.createElement("strong");
    english.dir = "ltr";
    english.textContent = entry.word;
    const meaning = document.createElement("small");
    meaning.textContent = `${entry.meaning} · أخطأت بها ${numberFormat.format(entry.wrong)} مرة`;
    details.append(english, meaning);
    const retryButton = document.createElement("button");
    retryButton.type = "button";
    retryButton.className = "button button-quiet";
    retryButton.textContent = "إلى المحفوظة";
    retryButton.dataset.saveWord = entry.word;
    row.append(details, retryButton);
    list.append(row);
  });
}
