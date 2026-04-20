const MIN_DECIBELS = -45;

class VADProcessor extends AudioWorkletProcessor {
	process(inputs, outputs, parameters) {
		const input = inputs[0];
		if (!input || !input[0]) return true;

		const channelData = input[0];

		let sum = 0;
		for (let i = 0; i < channelData.length; i++) {
			sum += channelData[i] * channelData[i];
		}
		const rms = Math.sqrt(sum / channelData.length);
		const decibels = 20 * Math.log10(rms);

		if (decibels > MIN_DECIBELS) {
			const audioCopy = new Float32Array(channelData);

			this.port.postMessage({
				event: 'speech',
				audio: audioCopy
			}, [audioCopy.buffer]); // Transfer ownership 

		} else {
			this.port.postMessage({ event: 'silence' });
		}

		return true; // Keep the processor alive
	}
}

registerProcessor('vad-processor', VADProcessor);