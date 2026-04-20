import { pipeline, env } from '@huggingface/transformers';

env.allowLocalModels = false;

let transcriber = null;

self.addEventListener('message', async (event) => {
  const { type, audio } = event.data;

  if (type === 'load') {
    console.log("[WhisperWorker] Received 'load' command");
    try {
      self.postMessage({ status: 'loading' });

      transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en', {
        device: 'wasm',
        dtype: 'fp32',
      });

      self.postMessage({ status: 'ready' });
    } catch (error) {
      self.postMessage({ status: 'error', error: error.message });
    }
  }

  if (type === 'transcribe') {
    console.log(`[WhisperWorker] Received 'transcribe' command. Audio length: ${audio ? audio.length : 'undefined'}`);
    if (!transcriber) {
      console.warn("[WhisperWorker] Transcriber not ready yet!");
      return;
    }

    try {
      console.log("[WhisperWorker] Sending audio to transcriber : ", audio.slice(0, 10));
      const output = await transcriber(audio, {
        chunk_length_s: 30,
        stride_length_s: 5,
      });

      console.log("[WhisperWorker] Raw output:", output);

      let transcribedText = "";
      if (Array.isArray(output)) {
        transcribedText = output[0]?.text || "";
      } else {
        transcribedText = output.text || "";
      }

      self.postMessage({
        status: 'complete',
        text: transcribedText
      });
      console.log("[WhisperWorker] Transcription complete:", transcribedText);
    } catch (error) {
      self.postMessage({ status: 'error', error: error.message });
    }
  }
});