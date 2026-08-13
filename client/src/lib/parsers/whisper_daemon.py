#!/usr/bin/env python3
"""
Faster-Whisper persistent daemon.
Reads JSON commands from stdin line-by-line, writes JSON results to stdout.
Keeps the model loaded in memory between requests — eliminates cold-start overhead.
Protocol:
  Input:  {"id": "...", "wav_path": "...", "model_path": "...", "short": true/false}
  Output: {"id": "...", "text": "...", "language": "...", "language_probability": 0.99}
  Error:  {"id": "...", "error": "..."}
"""
import sys
import json
import os
import time

def main():
    model = None
    model_path_loaded = None

    # Flush stdout immediately so Node.js can read line-by-line
    sys.stdout.reconfigure(line_buffering=True)
    sys.stderr.reconfigure(line_buffering=True)

    # Signal ready to parent process
    print(json.dumps({"status": "ready"}), flush=True)

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue

        try:
            cmd = json.loads(line)
        except json.JSONDecodeError as e:
            print(json.dumps({"error": f"Invalid JSON: {e}"}), flush=True)
            continue

        req_id = cmd.get("id", "")
        is_ping = cmd.get("ping", False)
        wav_path = cmd.get("wav_path", "")
        model_path = cmd.get("model_path", "")
        is_short = cmd.get("short", True)

        if is_ping:
            try:
                if model is None or model_path_loaded != model_path:
                    from faster_whisper import WhisperModel
                    sys.stderr.write(f"[DAEMON] Pre-warming model from {model_path}...\n")
                    sys.stderr.flush()
                    model = WhisperModel(model_path, device="cpu", compute_type="int8")
                    model_path_loaded = model_path
                print(json.dumps({"id": req_id, "status": "pong"}), flush=True)
            except Exception as e:
                print(json.dumps({"id": req_id, "error": f"Ping fail: {e}"}), flush=True)
            continue

        if not wav_path or not os.path.exists(wav_path):
            print(json.dumps({"id": req_id, "error": f"WAV not found: {wav_path}"}), flush=True)
            continue

        if not model_path or not os.path.exists(model_path):
            print(json.dumps({"id": req_id, "error": f"Model not found: {model_path}"}), flush=True)
            continue

        try:
            # Lazy-load model and keep it in memory
            if model is None or model_path_loaded != model_path:
                from faster_whisper import WhisperModel
                sys.stderr.write(f"[DAEMON] Loading model from {model_path}...\n")
                sys.stderr.flush()
                model = WhisperModel(model_path, device="cpu", compute_type="int8")
                model_path_loaded = model_path
                sys.stderr.write("[DAEMON] Model loaded and cached.\n")
                sys.stderr.flush()

            t0 = time.time()

            # Adaptive parameters based on audio duration
            # Short voice messages: beam_size=1 (greedy, 6x faster, still accurate for clear speech)
            # Long files: beam_size=5 (more accurate for complex speech)
            beam_size = 1 if is_short else 5

            segments, info = model.transcribe(
                wav_path,
                language="uk",
                beam_size=beam_size,
                vad_filter=True,
                vad_parameters=dict(
                    min_silence_duration_ms=300,
                    speech_pad_ms=400,
                    threshold=0.25,  # Very sensitive — catches quiet/whispered speech
                ),
                no_speech_threshold=0.6,
                condition_on_previous_text=False,
                temperature=0.0,
                without_timestamps=True,
                hallucination_silence_threshold=2.0,  # Suppress hallucinations on silence > 2s
            )

            text = " ".join(s.text.strip() for s in segments).strip()
            elapsed = time.time() - t0

            sys.stderr.write(f"[DAEMON] Transcribed in {elapsed:.2f}s, beam={beam_size}: \"{text[:80]}\"\n")
            sys.stderr.flush()

            print(json.dumps({
                "id": req_id,
                "text": text,
                "language": info.language,
                "language_probability": info.language_probability,
                "elapsed_ms": round(elapsed * 1000)
            }), flush=True)

        except Exception as e:
            print(json.dumps({"id": req_id, "error": str(e)}), flush=True)


if __name__ == "__main__":
    main()
