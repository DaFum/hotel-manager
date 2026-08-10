import type { AudioPreferences } from "../game/settings/playerPreferences";
export type AudioSettings = AudioPreferences;
export type AudioBus = "music" | "ambience" | "ui" | "warnings";
const clamp = (value: number) =>
  Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
export function normalizeAudioSettings(value: AudioSettings): AudioSettings {
  return {
    master: clamp(value.master),
    music: clamp(value.music),
    ambience: clamp(value.ambience),
    ui: clamp(value.ui),
    warnings: clamp(value.warnings),
  };
}
interface GainLike {
  gain: { value: number };
  connect(node: unknown): unknown;
}
interface ContextLike {
  destination: unknown;
  createGain(): GainLike;
  resume(): Promise<void>;
  close(): Promise<void>;
  currentTime?: number;
  createOscillator?: () => {
    frequency: { value: number };
    connect(node: unknown): unknown;
    start(when?: number): void;
    stop(when?: number): void;
  };
}
export class AudioEngine {
  private readonly master: GainLike;
  private readonly buses: Record<AudioBus, GainLike>;
  constructor(
    private readonly context: ContextLike,
    settings: AudioSettings,
  ) {
    this.master = context.createGain();
    this.master.connect(context.destination);
    this.buses = {
      music: context.createGain(),
      ambience: context.createGain(),
      ui: context.createGain(),
      warnings: context.createGain(),
    };
    Object.values(this.buses).forEach((bus) => bus.connect(this.master));
    this.apply(settings);
  }
  apply(value: AudioSettings) {
    const settings = normalizeAudioSettings(value);
    this.master.gain.value = settings.master;
    this.buses.music.gain.value = settings.music;
    this.buses.ambience.gain.value = settings.ambience;
    this.buses.ui.gain.value = settings.ui;
    this.buses.warnings.gain.value = settings.warnings;
  }
  output(bus: AudioBus): GainLike {
    return this.buses[bus];
  }
  playCue(bus: AudioBus): boolean {
    const oscillator = this.context.createOscillator?.();
    if (!oscillator) return false;
    oscillator.frequency.value = bus === "warnings" ? 880 : 440;
    oscillator.connect(this.buses[bus]);
    const now = this.context.currentTime ?? 0;
    oscillator.start(now);
    oscillator.stop(now + (bus === "warnings" ? 0.18 : 0.06));
    return true;
  }
  resume() {
    return this.context.resume();
  }
  dispose() {
    return this.context.close();
  }
}
