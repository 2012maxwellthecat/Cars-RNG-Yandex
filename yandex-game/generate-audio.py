# Генерация звуковых файлов для Cars RNG

import wave
import struct
import math
import os

def create_wav(filename, samples, sample_rate=44100, channels=1):
    """Создание WAV файла из массива сэмплов"""
    with wave.open(filename, 'w') as wav_file:
        wav_file.setnchannels(channels)
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(sample_rate)

        for sample in samples:
            # Конвертация в 16-bit integer
            value = int(max(-1, min(1, sample)) * 32767)
            packed = struct.pack('<h', value)
            wav_file.writeframes(packed)

def generate_click():
    """Генерация звука клика"""
    sample_rate = 44100
    duration = 0.1
    samples = int(sample_rate * duration)

    buffer = []
    for i in range(samples):
        t = i / sample_rate
        envelope = math.exp(-t * 50)
        sample = math.sin(2 * math.pi * 800 * t) * envelope * 0.3
        buffer.append(sample)

    return buffer

def generate_button():
    """Генерация звука кнопки"""
    sample_rate = 44100
    duration = 0.08
    samples = int(sample_rate * duration)

    buffer = []
    for i in range(samples):
        t = i / sample_rate
        envelope = math.exp(-t * 40)
        sample = math.sin(2 * math.pi * 600 * t) * envelope * 0.25
        buffer.append(sample)

    return buffer

def generate_spin():
    """Генерация звука спина"""
    sample_rate = 44100
    duration = 1.5
    samples = int(sample_rate * duration)

    buffer = []
    for i in range(samples):
        t = i / sample_rate
        frequency = 200 + t * 400
        envelope = math.sin(math.pi * t / duration) * 0.4
        sample = math.sin(2 * math.pi * frequency * t) * envelope
        buffer.append(sample)

    return buffer

def generate_win():
    """Генерация звука выигрыша"""
    sample_rate = 44100
    duration = 0.8
    samples = int(sample_rate * duration)

    frequencies = [523, 659, 784, 1047]  # C5, E5, G5, C6
    buffer = []

    for i in range(samples):
        t = i / sample_rate
        note = int(t * 8)
        freq = frequencies[note % len(frequencies)]
        envelope = math.exp(-t * 3) * 0.5
        sample = math.sin(2 * math.pi * freq * t) * envelope
        buffer.append(sample)

    return buffer

def generate_case_open():
    """Генерация звука открытия кейса"""
    sample_rate = 44100
    duration = 0.6
    samples = int(sample_rate * duration)

    buffer = []
    for i in range(samples):
        t = i / sample_rate
        frequency = 1200 * math.exp(-t * 4)
        envelope = math.exp(-t * 5) * 0.4
        sample = math.sin(2 * math.pi * frequency * t) * envelope
        buffer.append(sample)

    return buffer

def generate_background_music():
    """Генерация фоновой музыки"""
    sample_rate = 44100
    duration = 8  # 8 секунд loop
    samples = int(sample_rate * duration)

    bass_notes = [130.81, 196.00, 220.00, 174.61]  # C3, G3, A3, F3
    melody_notes = [523.25, 587.33, 659.25, 783.99]  # C5, D5, E5, G5

    buffer = []
    for i in range(samples):
        t = i / sample_rate

        # Бас
        bass_index = int(t * 2) % len(bass_notes)
        bass_freq = bass_notes[bass_index]
        bass_envelope = math.sin(math.pi * (t % 0.5) / 0.5) * 0.15
        bass = math.sin(2 * math.pi * bass_freq * t) * bass_envelope

        # Мелодия
        melody_index = int(t) % len(melody_notes)
        melody_freq = melody_notes[melody_index]
        melody_envelope = math.sin(math.pi * (t % 1) / 1) * 0.1
        melody = math.sin(2 * math.pi * melody_freq * t) * melody_envelope

        # Микс
        sample = bass * 0.6 + melody * 0.4
        buffer.append(sample)

    return buffer

def main():
    print("🎵 Генерация звуковых файлов для Cars RNG...\n")

    # Создание директорий
    base_dir = os.path.join("public", "assets", "audio")
    music_dir = os.path.join(base_dir, "music")
    sounds_dir = os.path.join(base_dir, "sounds")

    os.makedirs(music_dir, exist_ok=True)
    os.makedirs(sounds_dir, exist_ok=True)

    # Генерация звуков
    sounds = {
        os.path.join(sounds_dir, "click.wav"): generate_click(),
        os.path.join(sounds_dir, "button.wav"): generate_button(),
        os.path.join(sounds_dir, "spin.wav"): generate_spin(),
        os.path.join(sounds_dir, "win.wav"): generate_win(),
        os.path.join(sounds_dir, "case-open.wav"): generate_case_open(),
        os.path.join(music_dir, "background-music.wav"): generate_background_music(),
    }

    # Сохранение файлов
    for filename, samples in sounds.items():
        create_wav(filename, samples)
        print(f"✅ Создан: {filename}")

    print("\n🎉 Все звуки успешно сгенерированы!")
    print(f"📁 Папка: {base_dir}")

if __name__ == "__main__":
    main()
