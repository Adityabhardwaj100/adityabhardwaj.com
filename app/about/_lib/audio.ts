'use client';

/**
 * The About page's sound, synthesized live with the Web Audio API — no
 * audio files, no licensing. Off until the visitor asks for it.
 *
 * Scenes set the bed:  'bed'      low detuned drone under the reading
 *                      'silence'  everything drops out (the cut to black)
 *                      'resolve'  the drone returns a fifth higher, warmer
 * Cues play on top:    click()    the cylinder turning, a round seating
 *                      shot()     the hammer falls
 *                      impact()   the round goes through the poster
 *                      toll()     one deep note as the poster swings
 *
 * A licensed track can later be layered in by routing an <audio> element
 * through `bedGain` alongside the oscillators.
 */

export type SoundScene = 'bed' | 'silence' | 'resolve';

const ROOT = 55; // A1
const FIFTH = 1.5;
const BED_LEVEL = 0.16;

type Listener = (enabled: boolean) => void;

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private bedGain!: GainNode;
  private filter!: BiquadFilterNode;
  private reverbSend!: GainNode;
  private oscillators: { osc: OscillatorNode; ratio: number }[] = [];
  private noise!: AudioBuffer;
  private longNoise!: AudioBuffer;

  private enabled = false;
  private scene: SoundScene = 'bed';
  private listeners = new Set<Listener>();

  get isEnabled() {
    return this.enabled;
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  async toggle() {
    if (this.enabled) this.disable();
    else await this.enable();
  }

  async enable() {
    if (!this.ctx) this.build();
    const ctx = this.ctx;
    if (!ctx) return;
    await ctx.resume();
    this.enabled = true;
    const now = ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(0.9, now, 0.4);
    this.applyScene(true);
    this.emit();
  }

  disable() {
    const ctx = this.ctx;
    this.enabled = false;
    this.emit();
    if (!ctx) return;
    const now = ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(0, now, 0.15);
    window.setTimeout(() => {
      if (!this.enabled) void ctx.suspend();
    }, 900);
  }

  setScene(scene: SoundScene) {
    if (scene === this.scene) return;
    this.scene = scene;
    if (this.enabled) this.applyScene(false);
  }

  /** A revolver cylinder indexing one chamber: two ratchet ticks and a thump. */
  click() {
    const ctx = this.ctx;
    if (!ctx || !this.enabled) return;
    const t = ctx.currentTime + 0.01;
    this.tick(t, 3400, 0.55);
    this.tick(t + 0.055, 2600, 0.35);

    const thump = ctx.createOscillator();
    const env = ctx.createGain();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(120, t);
    thump.frequency.exponentialRampToValueAtTime(42, t + 0.1);
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(0.5, t + 0.006);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    thump.connect(env).connect(this.master);
    thump.start(t);
    thump.stop(t + 0.2);
  }

  /** A gunshot: a hard crack of noise, a chest-thump, and the room ringing after. */
  shot() {
    const ctx = this.ctx;
    if (!ctx || !this.enabled) return;
    const t = ctx.currentTime + 0.01;

    const crack = ctx.createBufferSource();
    crack.buffer = this.longNoise;
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.setValueAtTime(6000, t);
    tone.frequency.exponentialRampToValueAtTime(400, t + 0.5);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(1.1, t + 0.004);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
    crack.connect(tone).connect(env);
    env.connect(this.master);
    env.connect(this.reverbSend);
    crack.start(t);
    crack.stop(t + 0.8);

    const boom = ctx.createOscillator();
    const boomEnv = ctx.createGain();
    boom.type = 'sine';
    boom.frequency.setValueAtTime(95, t);
    boom.frequency.exponentialRampToValueAtTime(32, t + 0.35);
    boomEnv.gain.setValueAtTime(0.0001, t);
    boomEnv.gain.exponentialRampToValueAtTime(0.9, t + 0.006);
    boomEnv.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    boom.connect(boomEnv).connect(this.master);
    boom.start(t);
    boom.stop(t + 0.6);
  }

  /** The round going through paper into timber: a dull thud and a splintering tick. */
  impact() {
    const ctx = this.ctx;
    if (!ctx || !this.enabled) return;
    const t = ctx.currentTime + 0.01;
    const thud = ctx.createOscillator();
    const env = ctx.createGain();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(140, t);
    thud.frequency.exponentialRampToValueAtTime(45, t + 0.18);
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(0.7, t + 0.004);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    thud.connect(env).connect(this.master);
    thud.start(t);
    thud.stop(t + 0.35);
    this.tick(t, 1400, 0.6);
    this.tick(t + 0.03, 2600, 0.3);
  }

  /** One deep, long note that blooms into the reverb. */
  toll() {
    const ctx = this.ctx;
    if (!ctx || !this.enabled) return;
    const t = ctx.currentTime + 0.02;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(0.55, t + 0.09);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 7);
    env.connect(this.master);
    env.connect(this.reverbSend);

    const partials: [OscillatorType, number, number][] = [
      ['sine', 36.71, 1], // D1
      ['sine', 73.42, 0.55],
      ['triangle', 110.13, 0.12],
      ['sine', 146.83, 0.08],
    ];
    for (const [type, freq, level] of partials) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.value = level;
      osc.connect(gain).connect(env);
      osc.start(t);
      osc.stop(t + 7.2);
    }
  }

  private build() {
    const Ctor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    this.ctx = ctx;

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.ratio.value = 3;
    compressor.connect(ctx.destination);

    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(compressor);

    // Reverb: a convolver fed a generated, exponentially decaying impulse.
    const reverb = ctx.createConvolver();
    reverb.buffer = this.impulse(ctx, 3.8);
    const wet = ctx.createGain();
    wet.gain.value = 0.55;
    this.reverbSend = ctx.createGain();
    this.reverbSend.connect(reverb).connect(wet).connect(this.master);

    // The drone: detuned saws and a sub, through a slowly breathing low-pass.
    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 360;
    this.filter.Q.value = 4;

    const lfo = ctx.createOscillator();
    const lfoDepth = ctx.createGain();
    lfo.frequency.value = 0.07;
    lfoDepth.gain.value = 110;
    lfo.connect(lfoDepth).connect(this.filter.frequency);
    lfo.start();

    this.bedGain = ctx.createGain();
    this.bedGain.gain.value = 0;
    this.filter.connect(this.bedGain);
    this.bedGain.connect(this.master);
    this.bedGain.connect(this.reverbSend);

    const voices: [OscillatorType, number, number][] = [
      ['sawtooth', 1, 0.22],
      ['sawtooth', 1.0045, 0.22],
      ['triangle', 0.5, 0.5],
      ['sine', FIFTH, 0.12],
    ];
    for (const [type, ratio, level] of voices) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = ROOT * ratio;
      gain.gain.value = level;
      osc.connect(gain).connect(this.filter);
      osc.start();
      this.oscillators.push({ osc, ratio });
    }

    const longLength = Math.floor(ctx.sampleRate * 1);
    this.longNoise = ctx.createBuffer(1, longLength, ctx.sampleRate);
    const longData = this.longNoise.getChannelData(0);
    for (let i = 0; i < longLength; i++) longData[i] = Math.random() * 2 - 1;

    const length = Math.floor(ctx.sampleRate * 0.05);
    this.noise = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  }

  private applyScene(immediate: boolean) {
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime;
    const bed = this.bedGain.gain;
    bed.cancelScheduledValues(now);

    if (this.scene === 'silence') {
      bed.setTargetAtTime(0, now, 0.1); // ~300ms to nothing
      return;
    }

    const warm = this.scene === 'resolve';
    const root = warm ? ROOT * FIFTH : ROOT;
    const glide = immediate ? 0.01 : 1.4;
    for (const { osc, ratio } of this.oscillators) {
      osc.frequency.cancelScheduledValues(now);
      osc.frequency.setTargetAtTime(root * ratio, now, glide);
    }
    this.filter.frequency.setTargetAtTime(warm ? 620 : 360, now, glide);
    bed.setTargetAtTime(warm ? BED_LEVEL * 0.8 : BED_LEVEL, now, immediate ? 0.8 : 1.2);
  }

  private tick(t: number, freq: number, level: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = freq;
    band.Q.value = 7;
    const env = ctx.createGain();
    env.gain.setValueAtTime(level, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
    src.connect(band).connect(env).connect(this.master);
    env.connect(this.reverbSend);
    src.start(t);
  }

  private impulse(ctx: AudioContext, seconds: number) {
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.6);
      }
    }
    return buffer;
  }

  private emit() {
    for (const fn of this.listeners) fn(this.enabled);
  }
}

export const sound = new SoundEngine();
