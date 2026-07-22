// (c) Dr. Ralf Korell
// Globe - DOM-Anbindung des Dashboards: Zeitanzeige, Zeit-Regler,
// Nachthelligkeits-Regler, Lade-/Fehlermeldungen. Keine Kalender-,
// Zeitzonen- oder Astronomie-Rechnung; die UTC-Anzeige nutzt
// Date.prototype.toISOString() (FA-8).
// Modified: [2026-07-22 22:15] - Erstellt (AP-06)
// Modified: [2026-07-22 23:24] - Kuestenlinien-Toggle ergaenzt

export function createUI({ onTimeOffsetChange, onRealtime, onNightBrightnessChange, onCoastlineToggle }) {
  const overlay = document.getElementById('overlay');
  const overlayText = document.getElementById('overlay-text');
  const timeDisplay = document.getElementById('time-display');
  const timeSlider = document.getElementById('time-slider');
  const nowButton = document.getElementById('time-now');
  const nightSlider = document.getElementById('night-slider');
  const nightValue = document.getElementById('night-value');
  const modeLabel = document.getElementById('time-mode');
  const coastToggle = document.getElementById('coastline-toggle');

  coastToggle.addEventListener('change', () => {
    onCoastlineToggle(coastToggle.checked);
  });

  timeSlider.addEventListener('input', () => {
    onTimeOffsetChange(Number(timeSlider.value));
  });

  nowButton.addEventListener('click', () => {
    timeSlider.value = '0';
    onRealtime();
  });

  nightSlider.addEventListener('input', () => {
    const v = Number(nightSlider.value);
    nightValue.textContent = `${Math.round(v * 100)} %`;
    onNightBrightnessChange(v);
  });

  return {
    showLoading(message) {
      overlay.classList.remove('error', 'hidden');
      overlayText.textContent = message;
    },
    showError(message) {
      overlay.classList.remove('hidden');
      overlay.classList.add('error');
      overlayText.textContent = message;
    },
    hideOverlay() {
      overlay.classList.add('hidden');
    },
    setTime(date, realtime) {
      timeDisplay.textContent = date.toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
      modeLabel.textContent = realtime ? 'Echtzeit' : 'manuell';
    }
  };
}
