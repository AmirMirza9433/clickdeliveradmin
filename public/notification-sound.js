// Notification sound - Generated audio beep
// This creates a simple beep sound using Web Audio API
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playNotificationSound() {
  try {
    const now = audioContext.currentTime;

    // Create oscillator for beep
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Beep parameters
    oscillator.frequency.value = 800; // Hz
    oscillator.type = "sine";

    // Volume envelope
    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    oscillator.start(now);
    oscillator.stop(now + 0.5);
  } catch (error) {}
}

export default playNotificationSound;
