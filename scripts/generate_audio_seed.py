import wave
import math
import struct

# Parameters
sample_rate = 44100
duration = 1.0  # seconds
frequency = 440.0  # A4 note

# Generate sine wave
num_samples = int(sample_rate * duration)
samples = []
for i in range(num_samples):
    value = int(32767.0 * math.sin(2.0 * math.pi * frequency * i / sample_rate))
    samples.append(struct.pack('<h', value))

# Save as WAV
with wave.open('data/uploads/audio_seed.wav', 'wb') as wav_file:
    wav_file.setnchannels(1)
    wav_file.setsampwidth(2)
    wav_file.setframerate(sample_rate)
    wav_file.writeframes(b''.join(samples))

print("Audio seed generated at data/uploads/audio_seed.wav")
