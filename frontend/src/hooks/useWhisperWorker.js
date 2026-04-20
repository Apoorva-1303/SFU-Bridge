import { useEffect, useRef, useState } from 'react';

export const useWhisperWorker = (onNewTranscript) => {
  const workerRef = useRef(null);
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const [transcripts, setTranscripts] = useState([]);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/whisper.worker.js', import.meta.url),
      { type: 'module' }
    );

    workerRef.current.onmessage = (event) => {
      const { status, text, error } = event.data;
      console.log("Status in worker : ", status);
      console.log("Text in worker : ", text);

      if (status === 'ready') {
        console.log('Whisper model loaded and ready!');
        setIsWorkerReady(true);
      } else if (status === 'complete') {
        console.log('Transcription received:', text);
        setTranscripts((prev) => [...prev, text]);
        if (onNewTranscript) onNewTranscript(text);
      } else if (status === 'error') {
        console.error('Whisper Worker Error:', error);
      }
    };

    // start downloading/loading the model
    workerRef.current.postMessage({ type: 'load' });

    // cleanup when component unmounts
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  // to send audio to the worker later
  const sendAudioToWhisper = (float32Array) => {
    if (!isWorkerReady || !workerRef.current) return;
    
    workerRef.current.postMessage(
      { type: 'transcribe', audio: float32Array },
      [float32Array.buffer]
    );
  };

  return { isWorkerReady, transcripts, sendAudioToWhisper };
};