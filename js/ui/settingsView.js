export function setupSettingsView({
  settings,
  onSettingsChange,
  onResetStats,
  onEnableReminder
}) {
  const reminderToggle = document.querySelector("#reminder-toggle");
  const resetButton = document.querySelector("#reset-button");
  const message = document.querySelector("#settings-message");

  reminderToggle.checked = Boolean(settings.reminderEnabled);
  resetButton.addEventListener("click", () => {
    onResetStats();
    message.textContent = "تمت إعادة ضبط الإحصائيات.";
  });
  reminderToggle.addEventListener("change", async () => {
    message.textContent = "";
    if (!reminderToggle.checked) {
      onSettingsChange({ reminderEnabled: false });
      return;
    }

    reminderToggle.disabled = true;
    try {
      const result = await onEnableReminder();
      reminderToggle.checked = result.ok;
      onSettingsChange({ reminderEnabled: result.ok });
      message.textContent = result.message;
    } catch (error) {
      reminderToggle.checked = false;
      onSettingsChange({ reminderEnabled: false });
      message.textContent = "تعذّر تفعيل الإشعارات. حاول مرة أخرى.";
      console.error("تعذّر تفعيل الإشعارات:", error);
    } finally {
      reminderToggle.disabled = false;
    }
  });

  resetButton.addEventListener("click", () => {
    onResetStats();
    message.textContent = "تمت إعادة ضبط الإحصائيات.";
  });
}
