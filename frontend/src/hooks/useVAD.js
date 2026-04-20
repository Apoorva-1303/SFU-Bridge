import { useRef, useCallback } from 'react';
import vadWorkletUrl from '../workers/vad.worklet.js?url';

const SILENCE_DELAY_MS = 5000;

export const useVAD = (sendAudioToWhisper) => {
  const audioContextRef = useRef(null);
  const workletNodeRef = useRef(null);
  const audioSourceRef = useRef(null);

  const isRecordingRef = useRef(false);
  const audioChunksRef = useRef([]);
  const silenceTimerRef = useRef(null);

  const finishSentence = useCallback(() => {
    isRecordingRef.current = false;

    const totalLength = audioChunksRef.current.reduce((acc, chunk) => acc + chunk.length, 0);
    const finalAudioBuffer = new Float32Array(totalLength);
    console.log(`[useVAD] finishSentence called. Total length: ${totalLength}`);

    let offset = 0;
    for (const chunk of audioChunksRef.current) {
      finalAudioBuffer.set(chunk, offset);
      offset += chunk.length;
    }

    audioChunksRef.current = [];

    if (finalAudioBuffer.length > 8000) {
      console.log(`[useVAD] Sending audio chunk to whisper. Length: ${finalAudioBuffer.length}`);
      sendAudioToWhisper(finalAudioBuffer);
    } else {
      console.log(`[useVAD] Audio chunk too short (${finalAudioBuffer.length}), discarding.`);
    }
  }, [sendAudioToWhisper]);

  const startListening = useCallback(async (mediaStream) => {
    console.log("[useVAD] startListening called");
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContextRef.current = new AudioContext({ sampleRate: 16000 });

    // 1. Load the Worklet module using the Vite URL
    await audioContextRef.current.audioWorklet.addModule(vadWorkletUrl);

    // 2. Connect the mic to the AudioContext
    audioSourceRef.current = audioContextRef.current.createMediaStreamSource(mediaStream);

    // 3. Create the Worklet Node
    workletNodeRef.current = new AudioWorkletNode(audioContextRef.current, 'vad-processor');

    // 4. Listen for messages coming from the Audio Thread
    workletNodeRef.current.port.onmessage = (event) => {
      const { event: type, audio } = event.data;

      if (type === 'speech') {
        isRecordingRef.current = true;
        audioChunksRef.current.push(audio);

        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
      } else if (type === 'silence') {
        if (isRecordingRef.current && !silenceTimerRef.current) {
          silenceTimerRef.current = setTimeout(() => {
            finishSentence();
          }, SILENCE_DELAY_MS);
        }
      }
    };

    audioSourceRef.current.connect(workletNodeRef.current);
    workletNodeRef.current.connect(audioContextRef.current.destination);

    console.log("AudioWorklet VAD is now active on a dedicated thread.");
  }, [finishSentence]);

  const stopListening = useCallback(() => {
    if (workletNodeRef.current) workletNodeRef.current.disconnect();
    if (audioSourceRef.current) audioSourceRef.current.disconnect();
    if (audioContextRef.current) audioContextRef.current.close();
  }, []);

  return { startListening, stopListening };
};

