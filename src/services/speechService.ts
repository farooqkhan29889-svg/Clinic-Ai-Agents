// Web Speech Synthesis and Speech Recognition for J.A.R.V.I.S.
import { VoicePreset } from '../types/jarvis';

export const VOICE_PRESETS: Record<string, VoicePreset> = {
  'JARVIS (Avengers)': {
    name: 'JARVIS (Avengers)',
    voiceNames: ['Google UK English Male', 'Daniel', 'Microsoft George', 'Microsoft Ryan', 'UK English Male', 'Arthur'],
    rate: 0.94,
    pitch: 0.72,
    lang: 'en-GB',
  },
  'British (JARVIS)': {
    name: 'British (JARVIS)',
    voiceNames: ['Google UK English Male', 'Daniel', 'Microsoft George', 'Microsoft Ryan', 'UK English Male'],
    rate: 1.0,
    pitch: 0.85,
    lang: 'en-GB',
  },
  'British (female)': {
    name: 'British (female)',
    voiceNames: ['Google UK English Female', 'Kate', 'Microsoft Sonia', 'Microsoft Hazel'],
    rate: 1.0,
    pitch: 1.0,
    lang: 'en-GB',
  },
  'Hindi (हिन्दी)': {
    name: 'Hindi (हिन्दी)',
    voiceNames: ['Google हिन्दी', 'Microsoft Heera', 'Microsoft Kalpana', 'Hindi'],
    rate: 1.0,
    pitch: 1.0,
    lang: 'hi-IN',
  },
  'US (male)': {
    name: 'US (male)',
    voiceNames: ['Google US English', 'Alex', 'Microsoft David', 'Microsoft Mark'],
    rate: 1.0,
    pitch: 0.9,
    lang: 'en-US',
  },
  'System default': {
    name: 'System default',
    voiceNames: [],
    rate: 1.0,
    pitch: 1.0,
    lang: 'en-US',
  },
};

const HINDI_REGEX = /[\u0900-\u097f]/;
const MD_NOISE = /[*_`#>-]+/g;
const CODE_BLOCKS = /```[\s\S]*?```/g;
const URL_REGEX = /https?:\/\/\S+/g;

export class JarvisSpeechService {
  private synth: SpeechSynthesis | null = null;
  private recognition: any = null;
  private wakeRecognition: any = null;
  private isWakeListening = false;
  private onWakeCallback?: (command: string) => void;
  private onWakeArmed?: () => void;
  private onSpeechStateChange?: (speaking: boolean) => void;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public setSpeechStateCallback(cb: (speaking: boolean) => void) {
    this.onSpeechStateChange = cb;
  }

  public stopSpeaking() {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {
        console.warn('Speech cancellation error', e);
      }
      this.onSpeechStateChange?.(false);
    }
  }

  public speak(
    text: string,
    presetName: string = 'JARVIS (Avengers)',
    customRate?: number,
    customPitch?: number,
    onFinish?: () => void
  ) {
    if (!this.synth) return;

    this.stopSpeaking();

    // Clean text for speech
    let clean = text
      .replace(CODE_BLOCKS, ' Code block omitted. ')
      .replace(URL_REGEX, ' link ')
      .replace(MD_NOISE, '')
      .replace(/\[Tool:.*?\]/g, '')
      .replace(/---+/g, '')
      .trim();

    if (!clean) {
      onFinish?.();
      return;
    }

    const isHindi = HINDI_REGEX.test(clean);
    const preset = isHindi ? VOICE_PRESETS['Hindi (हिन्दी)'] : (VOICE_PRESETS[presetName] || VOICE_PRESETS['JARVIS (Avengers)']);

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = customRate ?? preset.rate;
    utterance.pitch = customPitch ?? preset.pitch;

    // Pick best voice
    const voices = this.synth.getVoices();
    let selectedVoice = null;

    if (isHindi) {
      selectedVoice = voices.find(v => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi'));
    } else {
      for (const name of preset.voiceNames) {
        const found = voices.find(v => v.name.toLowerCase().includes(name.toLowerCase()));
        if (found) {
          selectedVoice = found;
          break;
        }
      }
      if (!selectedVoice && preset.lang) {
        selectedVoice = voices.find(v => v.lang.toLowerCase() === preset.lang.toLowerCase());
      }
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
      this.onSpeechStateChange?.(true);
    };

    utterance.onend = () => {
      this.onSpeechStateChange?.(false);
      onFinish?.();
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error', e);
      this.onSpeechStateChange?.(false);
      onFinish?.();
    };

    this.synth.speak(utterance);
  }

  public isRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  public listenOnce(
    lang: string = 'en-US',
    onResult: (text: string) => void,
    onError: (err: string) => void,
    onEnd: () => void
  ) {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onError('Speech Recognition is not supported in this browser.');
      return;
    }

    try {
      if (this.recognition) {
        this.recognition.abort();
      }

      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = lang;

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0]?.[0]?.transcript || '';
        onResult(transcript);
      };

      this.recognition.onerror = (event: any) => {
        onError(event.error || 'Voice input error');
      };

      this.recognition.onend = () => {
        onEnd();
      };

      this.recognition.start();
    } catch (e: any) {
      onError(e.message || 'Failed to start microphone');
    }
  }

  public startWakeWordListener(
    lang: 'en' | 'hi',
    onWakeArmed: () => void,
    onCommandReceived: (command: string) => void,
    onError?: (err: string) => void,
    onLiveTranscript?: (transcript: string, isArmed: boolean) => void
  ) {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onError?.('Microphone wake word listener requires a Web Speech compatible browser.');
      return;
    }

    this.onWakeArmed = onWakeArmed;
    this.onWakeCallback = onCommandReceived;
    this.isWakeListening = true;

    // Matches "hello jarvis", "hallo jarice", "hey jarvis", "jarvis", "ok jarvis", or Hindi "जार्विस"
    const wakeRegex = /(^|[\s,.])((hey|hello|hallo|hi|okay|ok)\s+)?(jar+vi[sc]|jar+vis|jarvice|जार्विस|जारविस|जर्विस)\b/i;
    let armed = false;

    const initListener = () => {
      if (!this.isWakeListening) return;

      try {
        if (this.wakeRecognition) {
          try { this.wakeRecognition.abort(); } catch {}
        }

        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = lang === 'hi' ? 'hi-IN' : 'en-US';

        rec.onresult = (ev: any) => {
          for (let i = ev.resultIndex; i < ev.results.length; i++) {
            const transcript = ev.results[i][0]?.transcript || '';
            const isFinal = ev.results[i].isFinal;

            onLiveTranscript?.(transcript, armed);

            const match = transcript.match(wakeRegex);
            if (match && !armed) {
              armed = true;
              this.onWakeArmed?.();
              this.speak('Yes, Sir?', 'JARVIS (Avengers)', 1.05, 0.85);

              const rest = transcript.slice(match.index! + match[0].length).replace(/^[\s,.]+/, '');
              if (rest.trim().length > 3) {
                armed = false;
                onLiveTranscript?.('', false);
                this.onWakeCallback?.(rest.trim());
              }
              return;
            }

            if (armed && isFinal) {
              // Strip wake word if repeated
              let cmd = transcript.replace(wakeRegex, '').trim();
              if (cmd.length > 2) {
                armed = false;
                onLiveTranscript?.('', false);
                this.onWakeCallback?.(cmd);
              }
            }
          }
        };

        rec.onerror = (e: any) => {
          if (e.error === 'not-allowed') {
            this.isWakeListening = false;
            onError?.('Microphone permission was denied. Please allow microphone in browser settings.');
          }
        };

        rec.onend = () => {
          if (this.isWakeListening) {
            setTimeout(initListener, 250);
          }
        };

        this.wakeRecognition = rec;
        rec.start();
      } catch (err: any) {
        if (this.isWakeListening) {
          setTimeout(initListener, 1000);
        }
      }
    };

    initListener();
  }

  public stopWakeWordListener() {
    this.isWakeListening = false;
    if (this.wakeRecognition) {
      try {
        this.wakeRecognition.stop();
        this.wakeRecognition.abort();
      } catch (e) {}
      this.wakeRecognition = null;
    }
  }
}

export const speechService = new JarvisSpeechService();
