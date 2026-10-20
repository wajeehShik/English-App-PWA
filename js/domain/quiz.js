function shuffle(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

export function createQuiz(wordList, questionCount = 5, choiceWordList = wordList) {
  if (!Array.isArray(wordList) || wordList.length < 1) {
    throw new Error("يحتاج الاختبار إلى كلمة واحدة على الأقل.");
  }
  if (!Array.isArray(choiceWordList)) {
    throw new Error("قائمة خيارات الإجابة غير صالحة.");
  }

  const quiz = {
    wordList,
    choiceWordList,
    questionCount: Math.min(Math.max(1, questionCount), wordList.length),
    questions: [],
    index: 0,
    score: 0,
    answered: false,

    reset() {
      this.questions = shuffle(this.wordList).slice(0, this.questionCount).map((entry) => {
        const eligible = this.choiceWordList.filter((candidate) =>
          candidate.word !== entry.word && candidate.meaning !== entry.meaning
        );
        const sameCategoryAndKind = eligible.filter((candidate) =>
          candidate.category === entry.category &&
          (candidate.kind || "word") === (entry.kind || "word")
        );
        const sameCategory = eligible.filter((candidate) =>
          candidate.category === entry.category
        );
        const sameKind = eligible.filter((candidate) =>
          (candidate.kind || "word") === (entry.kind || "word")
        );
        const orderedCandidates = [
          ...shuffle(sameCategoryAndKind),
          ...shuffle(sameCategory),
          ...shuffle(sameKind),
          ...shuffle(eligible)
        ];
        const distractors = [];
        const usedMeanings = new Set([entry.meaning]);
        for (const candidate of orderedCandidates) {
          if (usedMeanings.has(candidate.meaning)) continue;
          usedMeanings.add(candidate.meaning);
          distractors.push(candidate);
          if (distractors.length === 3) break;
        }
        return {
          ...entry,
          choices: shuffle([entry, ...distractors]).map((choice) => choice.meaning)
        };
      });
      this.index = 0;
      this.score = 0;
      this.answered = false;
    },

    getCurrentQuestion() {
      return this.questions[this.index];
    },

    submitAnswer(answer) {
      if (this.answered) return false;
      const correct = answer === this.getCurrentQuestion().meaning;
      this.answered = true;
      if (correct) this.score += 1;
      return correct;
    },

    advance() {
      if (!this.answered) return false;
      this.index += 1;
      this.answered = false;
      return this.index < this.questions.length;
    }
  };

  quiz.reset();
  return quiz;
}

export function setQuestionCount(quiz, questionCount) {
  if (!Number.isInteger(questionCount) || questionCount < 1) {
    throw new Error("يجب أن يكون عدد الأسئلة رقمًا صحيحًا موجبًا.");
  }
  quiz.questionCount = Math.min(questionCount, quiz.wordList.length);
  quiz.reset();
}
