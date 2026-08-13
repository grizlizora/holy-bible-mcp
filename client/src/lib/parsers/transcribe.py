#!/usr/bin/env python3
"""
Faster-Whisper transcription script.
Usage: python3 transcribe.py <wav_file_path> <model_path>
Outputs: JSON with 'text' field to stdout.
"""
import sys
import json
import os

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: transcribe.py <wav_path> <model_path>"}))
        sys.exit(1)

    wav_path = sys.argv[1]
    model_path = sys.argv[2]

    if not os.path.exists(wav_path):
        print(json.dumps({"error": f"WAV file not found: {wav_path}"}))
        sys.exit(1)

    if not os.path.exists(model_path):
        print(json.dumps({"error": f"Model not found: {model_path}"}))
        sys.exit(1)

    try:
        from faster_whisper import WhisperModel

        model = WhisperModel(model_path, device="cpu", compute_type="int8")

        segments, info = model.transcribe(
            wav_path,
            language="uk",
            beam_size=5,
            vad_filter=True,           # Voice Activity Detection — removes silence automatically
            vad_parameters=dict(
                min_silence_duration_ms=500,  # Silences shorter than 500ms are kept (for short words)
                speech_pad_ms=400,            # Extra padding around speech
                threshold=0.3,                # Lower threshold = more sensitive (catches quiet speech)
            ),
            no_speech_threshold=0.6,
            condition_on_previous_text=False,
            temperature=0.0,
        )

        text = " ".join(s.text.strip() for s in segments).strip()

        print(json.dumps({
            "text": text,
            "language": info.language,
            "language_probability": info.language_probability
        }))

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
