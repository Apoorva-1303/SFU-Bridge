import "dotenv/config"
import { GoogleGenAI } from '@google/genai';


let ai;

function getAIClient() {
	if (!ai) {
		ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
		console.log("Initializing ai", process.env.GEMINI_API_KEY);
	}
	return ai;
}

export async function generateRoomSummary(roomId, roomState, io) {
	if (!roomState || roomState.transcripts.length === 0) return;

	const GeminiAi = getAIClient();

	const conversationText = roomState.transcripts.join('\n');
	console.log("Transcription for room summary : ", conversationText);
	roomState.transcripts = [];

	try {
		console.log(`Generating summary for room ${roomId}...`);
		console.log("conversations : ", conversationText);

		const response = await GeminiAi.models.generateContent({
			model: 'gemini-2.5-flash',
			contents: `You are an AI meeting assistant. Summarize the following 10 minutes of conversation into 2-4 concise bullet points. 
      
      Conversation:
      ${conversationText}`,
		});

		const summaryData = response.text;
		console.log("Summary Data : ", summaryData);

		io.to(roomId).emit('new-summary', {
			timestamp: new Date().toISOString(),
			text: summaryData
		});

	} catch (error) {
		console.error('LLM Summary failed:', error);
	}
}
