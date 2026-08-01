#!/usr/bin/env node

/**
 * Скрипт для генерации звуковых файлов для игры Cars RNG
 * Использует Web Audio API через node-web-audio-api
 */

const fs = require('fs');
const path = require('path');

// Простая генерация WAV файлов без внешних зависимостей
class SimpleAudioGenerator {
  constructor(sampleRate = 44100) {
    this.sampleRate = sampleRate;
  }

  // Генерация звука клика
  generateClick() {
    const duration = 0.1;
    const samples = Math.floor(this.sampleRate * duration);
    const buffer = new Float32Array(samples);

    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;
      const envelope = Math.exp(-t * 50);
      buffer[i] = Math.sin(2 * Math.PI * 800 * t) * envelope * 0.3;
    }

    return buffer;
  }

  // Генерация звука кнопки
  generateButton() {
    const duration = 0.08;
    const samples = Math.floor(this.sampleRate * duration);
    const buffer = new Float32Array(samples);

    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;
      const envelope = Math.exp(-t * 40);
      buffer[i] = Math.sin(2 * Math.PI * 600 * t) * envelope * 0.25;
    }

    return buffer;
  }

  // Генерация звука спина
  generateSpin() {
    const duration = 1.5;
    const samples = Math.floor(this.sampleRate * duration);
    const buffer = new Float32Array(samples);

    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;
      const frequency = 200 + t * 400;
      const envelope = Math.sin(Math.PI * t / duration) * 0.4;
      buffer[i] = Math.sin(2 * Math.PI * frequency * t) * envelope;
    }

    return buffer;
  }

  // Генерация звука выигрыша
  generateWin() {
    const duration = 0.8;
    const samples = Math.floor(this.sampleRate * duration);
    const buffer = new Float32Array(samples);

    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;
      const note = Math.floor(t * 8);
      const frequencies = [523, 659, 784, 1047];
      const freq = frequencies[note % frequencies.length];
      const envelope = Math.exp(-t * 3) * 0.5;
      buffer[i] = Math.sin(2 * Math.PI * freq * t) * envelope;
    }

    return buffer;
  }

  // Генерация звука открытия кейса
  generateCaseOpen() {
    const duration = 0.6;
    const samples = Math.floor(this.sampleRate * duration);
    const buffer = new Float32Array(samples);

    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;
      const frequency = 1200 * Math.exp(-t * 4);
      const envelope = Math.exp(-t * 5) * 0.4;
      buffer[i] = Math.sin(2 * Math.PI * frequency * t) * envelope;
    }

    return buffer;
  }

  // Генерация фоновой музыки
  generateBackgroundMusic() {
    const duration = 8;
    const samples = Math.floor(this.sampleRate * duration);
    const bufferL = new Float32Array(samples);
    const bufferR = new Float32Array(samples);

    const bassNotes = [130.81, 196.00, 220.00, 174.61];
    const melodyNotes = [523.25, 587.33, 659.25, 783.99];

    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;

      const bassIndex = Math.floor(t * 2) % bassNotes.length;
      const bassFreq = bassNotes[bassIndex];
      const bassEnvelope = Math.sin(Math.PI * (t % 0.5) / 0.5) * 0.15;
      bufferL[i] = Math.sin(2 * Math.PI * bassFreq * t) * bassEnvelope;

      const melodyIndex = Math.floor(t) % melodyNotes.length;
      const melodyFreq = melodyNotes[melodyIndex];
      const melodyEnvelope = Math.sin(Math.PI * (t % 1) / 1) * 0.1;
      bufferR[i] = Math.sin(2 * Math.PI * melodyFreq * t) * melodyEnvelope;

      bufferL[i] += bufferR[i] * 0.5;
      bufferR[i] += bufferL[i] * 0.3;
    }

    return { left: bufferL, right: bufferR };
  }

  // Конвертация в WAV формат
  toWav(buffer, stereo = false) {
    const numberOfChannels = stereo ? 2 : 1;
    const length = (stereo ? buffer.left.length : buffer.length) * numberOfChannels * 2;
    const arrayBuffer = Buffer.alloc(44 + length);

    // WAV заголовок
    arrayBuffer.write('RIFF', 0);
    arrayBuffer.writeUInt32LE(36 + length, 4);
    arrayBuffer.write('WAVE', 8);
    arrayBuffer.write('fmt ', 12);
    arrayBuffer.writeUInt32LE(16, 16);
    arrayBuffer.writeUInt16LE(1, 20);
    arrayBuffer.writeUInt16LE(numberOfChannels, 22);
    arrayBuffer.writeUInt32LE(this.sampleRate, 24);
    arrayBuffer.writeUInt32LE(this.sampleRate * numberOfChannels * 2, 28);
    arrayBuffer.writeUInt16LE(numberOfChannels * 2, 32);
    arrayBuffer.writeUInt16LE(16, 34);
    arrayBuffer.write('data', 36);
    arrayBuffer.writeUInt32LE(length, 40);

    // Данные
    let offset = 44;
    const samples = stereo ? buffer.left.length : buffer.length;

    for (let i = 0; i < samples; i++) {
      if (stereo) {
        const sampleL = Math.max(-1, Math.min(1, buffer.left[i]));
        const sampleR = Math.max(-1, Math.min(1, buffer.right[i]));
        arrayBuffer.writeInt16LE(sampleL < 0 ? sampleL * 0x8000 : sampleL * 0x7FFF, offset);
        arrayBuffer.writeInt16LE(sampleR < 0 ? sampleR * 0x8000 : sampleR * 0x7FFF, offset + 2);
        offset += 4;
      } else {
        const sample = Math.max(-1, Math.min(1, buffer[i]));
        arrayBuffer.writeInt16LE(sample < 0 ? sample * 0x8000 : sample * 0x7FFF, offset);
        offset += 2;
      }
    }

    return arrayBuffer;
  }
}

// Основная функция
async function main() {
  console.log('🎵 Генерация звуковых файлов для Cars RNG...\n');

  const generator = new SimpleAudioGenerator();
  const audioDir = path.join(__dirname, 'public', 'assets', 'audio');
  const musicDir = path.join(audioDir, 'music');
  const soundsDir = path.join(audioDir, 'sounds');

  // Создание директорий
  [audioDir, musicDir, soundsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Генерация звуков
  const sounds = {
    'sounds/click.wav': generator.toWav(generator.generateClick()),
    'sounds/button.wav': generator.toWav(generator.generateButton()),
    'sounds/spin.wav': generator.toWav(generator.generateSpin()),
    'sounds/win.wav': generator.toWav(generator.generateWin()),
    'sounds/case-open.wav': generator.toWav(generator.generateCaseOpen()),
    'music/background-music.wav': generator.toWav(generator.generateBackgroundMusic(), true),
  };

  // Сохранение файлов
  for (const [filename, data] of Object.entries(sounds)) {
    const filepath = path.join(audioDir, filename);
    fs.writeFileSync(filepath, data);
    console.log(`✅ Создан: ${filename}`);
  }

  console.log('\n🎉 Все звуки успешно сгенерированы!');
  console.log(`📁 Папка: ${audioDir}`);
}

main().catch(err => {
  console.error('❌ Ошибка:', err);
  process.exit(1);
});
