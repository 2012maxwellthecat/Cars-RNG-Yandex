/**
 * Генератор звуковых эффектов с использованием Web Audio API
 * Создаёт простые, но эффективные звуки для игры
 */

export class AudioGenerator {
  private audioContext: AudioContext;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  /**
   * Генерация звука клика/нажатия кнопки
   */
  generateClickSound(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.1; // 100ms
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // Короткий щелчок с быстрым затуханием
      const envelope = Math.exp(-t * 50);
      data[i] = Math.sin(2 * Math.PI * 800 * t) * envelope * 0.3;
    }

    return buffer;
  }

  /**
   * Генерация звука спина (вращение)
   */
  generateSpinSound(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 1.5; // 1.5 секунды
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // Нарастающая частота с затуханием в конце
      const frequency = 200 + t * 400;
      const envelope = Math.sin(Math.PI * t / duration) * 0.4;
      data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope;
    }

    return buffer;
  }

  /**
   * Генерация звука выигрыша (победный звук)
   */
  generateWinSound(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.8; // 800ms
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // Восходящая арпеджио
      const note = Math.floor(t * 8);
      const frequencies = [523, 659, 784, 1047]; // C5, E5, G5, C6
      const freq = frequencies[note % frequencies.length];
      const envelope = Math.exp(-t * 3) * 0.5;
      data[i] = Math.sin(2 * Math.PI * freq * t) * envelope;
    }

    return buffer;
  }

  /**
   * Генерация звука открытия кейса
   */
  generateCaseOpenSound(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.6; // 600ms
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // Звук "whoosh" с падающей частотой
      const frequency = 1200 * Math.exp(-t * 4);
      const envelope = Math.exp(-t * 5) * 0.4;
      data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope;
    }

    return buffer;
  }

  /**
   * Генерация звука для кнопки (более мягкий клик)
   */
  generateButtonSound(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.08; // 80ms
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // Мягкий тон
      const envelope = Math.exp(-t * 40);
      data[i] = Math.sin(2 * Math.PI * 600 * t) * envelope * 0.25;
    }

    return buffer;
  }

  /**
   * Генерация простой фоновой музыки (ambient loop)
   */
  generateBackgroundMusic(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 8; // 8 секунд (будет зациклен)
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);

    // Базовые ноты (C3, G3, A3, F3)
    const bassNotes = [130.81, 196.00, 220.00, 174.61];
    // Мелодия (C5, D5, E5, G5)
    const melodyNotes = [523.25, 587.33, 659.25, 783.99];

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;

      // Бас (левый канал с акцентом)
      const bassIndex = Math.floor(t * 2) % bassNotes.length;
      const bassFreq = bassNotes[bassIndex];
      const bassEnvelope = Math.sin(Math.PI * (t % 0.5) / 0.5) * 0.15;
      dataL[i] = Math.sin(2 * Math.PI * bassFreq * t) * bassEnvelope;

      // Мелодия (правый канал с акцентом)
      const melodyIndex = Math.floor(t) % melodyNotes.length;
      const melodyFreq = melodyNotes[melodyIndex];
      const melodyEnvelope = Math.sin(Math.PI * (t % 1) / 1) * 0.1;
      dataR[i] = Math.sin(2 * Math.PI * melodyFreq * t) * melodyEnvelope;

      // Микс в оба канала (стерео эффект)
      dataL[i] += dataR[i] * 0.5;
      dataR[i] += dataL[i] * 0.3;
    }

    return buffer;
  }

  /**
   * Сохранение AudioBuffer в WAV файл
   */
  audioBufferToWav(buffer: AudioBuffer): Blob {
    const numberOfChannels = buffer.numberOfChannels;
    const length = buffer.length * numberOfChannels * 2;
    const arrayBuffer = new ArrayBuffer(44 + length);
    const view = new DataView(arrayBuffer);

    // WAV заголовок
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // PCM
    view.setUint16(20, 1, true); // format
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length, true);

    // Данные
    const channels = [];
    for (let i = 0; i < numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, channels[channel][i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  /**
   * Генерация всех звуков и сохранение в файлы
   */
  async generateAllSounds(): Promise<{ [key: string]: Blob }> {
    return {
      click: this.audioBufferToWav(this.generateClickSound()),
      spin: this.audioBufferToWav(this.generateSpinSound()),
      win: this.audioBufferToWav(this.generateWinSound()),
      caseOpen: this.audioBufferToWav(this.generateCaseOpenSound()),
      button: this.audioBufferToWav(this.generateButtonSound()),
      bgMusic: this.audioBufferToWav(this.generateBackgroundMusic()),
    };
  }
}
