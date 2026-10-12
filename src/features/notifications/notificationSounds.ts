export const soundKinds = [
  "approval",
  "production",
  "client",
  "message",
  "meeting",
] as const;
export type SoundKind = (typeof soundKinds)[number];
export const soundLabels: Record<SoundKind, string> = {
  approval: "Cliente aprovou",
  production: "Demanda / produção",
  client: "Cliente novo",
  message: "Mensagem ou menção",
  meeting: "Reunião / agenda",
};
export const soundNotes: Record<SoundKind, number[]> = {
  approval: [523, 659, 784],
  production: [220, 330],
  client: [392, 494, 587, 784],
  message: [880, 660],
  meeting: [330, 440, 554],
};
export function notificationSoundKind(type: string): SoundKind {
  if (/approved|approval/.test(type)) return "approval";
  if (/production|action_assigned|task/.test(type)) return "production";
  if (/client/.test(type)) return "client";
  if (/chat|message|mention/.test(type)) return "message";
  return "meeting";
}
let context: AudioContext | undefined;
export async function unlockNotificationAudio() {
  if (typeof window === "undefined" || !window.AudioContext) return false;
  context ??= new AudioContext();
  if (context.state === "suspended") await context.resume();
  return context.state === "running";
}
export function playNotificationSound(kind: SoundKind, volume: number) {
  if (!context || context.state !== "running") return false;
  const start = context.currentTime + 0.01;
  soundNotes[kind].forEach((frequency, index) => {
    const oscillator = context!.createOscillator(),
      gain = context!.createGain(),
      time = start + index * 0.14;
    oscillator.type = kind === "production" ? "sine" : "triangle";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(
      Math.min(1, Math.max(0, volume)) * 0.1,
      time + 0.012,
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.2);
    oscillator.connect(gain);
    gain.connect(context!.destination);
    oscillator.start(time);
    oscillator.stop(time + 0.22);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  });
  return true;
}
