# syntax=docker/dockerfile:1
# Vietnamese speech to text (server.py): sherpa-onnx with the Zipformer 30M
# model, trained on about 6,000 hours of Vietnamese, at full precision (fp32,
# not the int8 copy); CPU only, about 50 ms a sentence.

FROM python:3.12-slim-bookworm AS model
ARG MODEL=sherpa-onnx-zipformer-vi-30M-2026-02-09
RUN apt-get update && apt-get install -y --no-install-recommends curl bzip2 ca-certificates \
    && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir sentencepiece==0.2.1
WORKDIR /models
RUN curl -fsSL "https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/${MODEL}.tar.bz2" | tar xj \
    && mv "${MODEL}" zipformer-vi-30M \
    && rm -rf zipformer-vi-30M/test_wavs
# Hotwords are split into the model's pieces through this vocabulary.
RUN python -c "import sentencepiece as spm; sp = spm.SentencePieceProcessor(model_file='zipformer-vi-30M/bpe.model'); open('zipformer-vi-30M/bpe.vocab', 'w').write(''.join(f'{sp.id_to_piece(i)}\t{sp.get_score(i)}\n' for i in range(sp.get_piece_size())))"

FROM python:3.12-slim-bookworm
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
# PyAV brings its own FFmpeg, for the WebM and MP4 that browsers record.
RUN pip install --no-cache-dir sherpa-onnx==1.13.8 numpy==2.3.4 av==15.1.0
COPY --from=model /models /models
COPY server.py /app/server.py
RUN groupadd --gid 10001 app \
    && useradd --uid 10001 --gid app --no-create-home --shell /usr/sbin/nologin app
USER 10001:10001
EXPOSE 8000
HEALTHCHECK --interval=10s --timeout=3s --retries=10 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=2)"
CMD ["python", "/app/server.py"]
