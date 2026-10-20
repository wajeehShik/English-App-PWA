export function speakText(text, language = "en-US") {
  if (!("speechSynthesis" in window)) {
    throw new Error("هذا المتصفح لا يدعم القراءة الصوتية.");
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language;
  utterance.rate = 0.88;
  window.speechSynthesis.speak(utterance);
}
