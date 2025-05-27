const { MAX_RETRIES } = require('../config/constants');
const { GoogleGenAI } = require("@google/genai");

/**
 * Fetch AI recommendations from Gemini model with retries.
 * @param {Object} ai - AI client instance
 * @param {string} channelName - Name of the channel (for logging)
 * @param {string} recommendationPrompt - Prompt to send to AI model
 * @returns {Promise<Array>} Parsed recommendations array or empty array on failure
 */
const getAIRecommendationsGemini = async (recommendationPrompt, channelName) => {

  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[AI] Fetching suggestions for channel: ${channelName}, attempt ${attempt}`);
      
      // Call AI model to generate content
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-05-20",
        contents: recommendationPrompt
      });

      const responseText = await response.text;
      
      // Match JSON array in the response string
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        try {
          // Parse and return the JSON array if found
          const parsedJson = JSON.parse(jsonMatch[0]);
          console.log(`[AI] Successfully parsed suggestions: ${parsedJson.length} items`);
          return parsedJson;

        } catch (jsonErr) {
          console.error('[AI] JSON parse error:', jsonErr);
          // Continue to retry if parsing fails
        }
      } else {
        console.error('[AI] No JSON array found in response');
        // Continue to retry if no JSON array found
      }
    } catch (err) {
      console.error(`[AI] Error fetching suggestions (attempt ${attempt}):`, err);
      // Continue to retry on error
    }
    
    // Optional: Wait a bit before retrying to avoid hammering the API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // After all retries failed, return empty array
  return [];
};

module.exports = {
  getAIRecommendationsGemini
};
