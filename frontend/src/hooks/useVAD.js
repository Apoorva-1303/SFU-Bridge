import { useRef, useCallback } from 'react';
// The ?url suffix tells Vite to treat this file as a static asset and return its URL
import vadWorkletUrl from '../workers/vad.worklet.js?url';

const SILENCE_DELAY_MS = 5000;

export const useVAD = (sendAudioToWhisper) => {
  const audioContextRef = useRef(null);
  const workletNodeRef = useRef(null);
  const audioSourceRef = useRef(null);

  const isRecordingRef = useRef(false);
  const audioChunksRef = useRef([]);
  const silenceTimerRef = useRef(null);

  // 1. Memoize finishSentence with useCallback
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

    // Only send if the audio is longer than ~0.5 seconds
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

    // Connect Source -> Worklet -> Destination
    audioSourceRef.current.connect(workletNodeRef.current);
    workletNodeRef.current.connect(audioContextRef.current.destination);

    console.log("AudioWorklet VAD is now active on a dedicated thread.");


    /* --- MISSING LINK REPLACEMENT CODE START --- */
    // This code was put here just to replace the missing link created by commenting out VAD
    // console.log("Using ScriptProcessorNode to bypass VAD and send audio directly.");

    // audioSourceRef.current = audioContextRef.current.createMediaStreamSource(mediaStream);

    // const bufferSize = 4096;
    // const scriptProcessor = audioContextRef.current.createScriptProcessor(bufferSize, 1, 1);

    // scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
    //   const inputBuffer = audioProcessingEvent.inputBuffer;
    //   const inputData = inputBuffer.getChannelData(0);
      
    //   // Store audio chunks
    //   audioChunksRef.current.push(new Float32Array(inputData));

    //   // Calculate total accumulated length
    //   const totalLength = audioChunksRef.current.reduce((acc, chunk) => acc + chunk.length, 0);
      
    //   // 16000Hz * 3 seconds = 48000 samples. Trigger transcription every 3 seconds.
    //   if (totalLength >= 48000) {
    //      finishSentence();
    //   }
    // };

    // audioSourceRef.current.connect(scriptProcessor);
    // scriptProcessor.connect(audioContextRef.current.destination);

    // // Save reference so we can disconnect it safely later in stopListening
    // workletNodeRef.current = scriptProcessor;
    /* --- MISSING LINK REPLACEMENT CODE END --- */
  }, [finishSentence]);

  const stopListening = useCallback(() => {
    if (workletNodeRef.current) workletNodeRef.current.disconnect();
    if (audioSourceRef.current) audioSourceRef.current.disconnect();
    if (audioContextRef.current) audioContextRef.current.close();
  }, []);

  return { startListening, stopListening };
};

