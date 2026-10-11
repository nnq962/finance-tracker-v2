"""Vietnamese speech to text on this server, with sherpa-onnx and Zipformer.

POST /transcribe takes the audio as the request body (the WebM and MP4
browsers record, read through PyAV's bundled FFmpeg) and, in the X-Hotwords header,
the names to favour, URL-encoded and separated by "/". It answers JSON:
{"text": "...", "ms": decode time}. GET /health answers 200 once the
model is loaded. Only the compose network reaches it.
"""

import io
import json
import os
import time
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import av
import numpy as np
import sherpa_onnx

MODEL = os.environ.get("STT_MODEL_DIR", "/models/zipformer-vi-30M")
SAMPLE_RATE = 16000
# Recordings the app sends are a few seconds; anything far larger is refused.
MAX_BYTES = 2_000_000

recognizer = sherpa_onnx.OfflineRecognizer.from_transducer(
    encoder=f"{MODEL}/encoder.onnx",
    decoder=f"{MODEL}/decoder.onnx",
    joiner=f"{MODEL}/joiner.onnx",
    tokens=f"{MODEL}/tokens.txt",
    num_threads=int(os.environ.get("STT_THREADS", "4")),
    # Beam search, for the hotwords: names favoured only where the sound fits them.
    decoding_method="modified_beam_search",
    # Eight paths kept, not four: the same on clean speech, a little more
    # room on real speech, at about 10 ms more a sentence.
    max_active_paths=int(os.environ.get("STT_ACTIVE_PATHS", "8")),
    modeling_unit="bpe",
    bpe_vocab=f"{MODEL}/bpe.vocab",
    hotwords_score=float(os.environ.get("STT_HOTWORDS_SCORE", "2.0")),
)


def decode_audio(data: bytes) -> np.ndarray:
    """A browser's recording, as 16 kHz mono float samples."""
    resampler = av.AudioResampler(format="flt", layout="mono", rate=SAMPLE_RATE)
    chunks = []
    with av.open(io.BytesIO(data)) as container:
        for frame in container.decode(audio=0):
            chunks.extend(resampled.to_ndarray().reshape(-1) for resampled in resampler.resample(frame))
        chunks.extend(resampled.to_ndarray().reshape(-1) for resampled in resampler.resample(None))
    return np.concatenate(chunks) if chunks else np.zeros(0, dtype=np.float32)


def hotwords(header: str) -> str:
    """The model's words are upper case; one hotword per name."""
    names = [urllib.parse.unquote(name).strip().upper() for name in header.split("/")]
    return "/".join(name for name in names if name)


class Handler(BaseHTTPRequestHandler):
    def _send(self, status: int, body: dict) -> None:
        payload = json.dumps(body, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self) -> None:
        self._send(200, {"ok": True}) if self.path == "/health" else self._send(404, {"error": "not found"})

    def do_POST(self) -> None:
        if self.path != "/transcribe":
            return self._send(404, {"error": "not found"})
        length = int(self.headers.get("Content-Length") or 0)
        if not 0 < length <= MAX_BYTES:
            return self._send(413, {"error": "audio missing or too large"})
        try:
            samples = decode_audio(self.rfile.read(length))
        except (av.error.FFmpegError, ValueError):
            return self._send(400, {"error": "unreadable audio"})
        words = hotwords(self.headers.get("X-Hotwords", ""))
        stream = recognizer.create_stream(hotwords=words) if words else recognizer.create_stream()
        stream.accept_waveform(SAMPLE_RATE, samples)
        started = time.perf_counter()
        recognizer.decode_stream(stream)
        self._send(200, {"text": stream.result.text.strip(), "ms": round((time.perf_counter() - started) * 1000)})

    def log_message(self, format: str, *args) -> None:
        # Requests carry what people said about their money: not logged.
        pass


if __name__ == "__main__":
    ThreadingHTTPServer(("0.0.0.0", int(os.environ.get("PORT", "8000"))), Handler).serve_forever()
