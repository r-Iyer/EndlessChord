const { MAX_RETRIES } = require('../config/constants');
const { GoogleGenAI } = require("@google/genai");
const logger = require('../utils/loggerUtils');

/**
 * Fetch AI recommendations from Gemini model with retries.
 * @param {string} recommendationPrompt - Prompt to send to AI model
 * @param {string} channelName - Name of the channel (for logging)
 * @returns {Promise<Array>} Parsed recommendations array or empty array on failure
 */
const getAIRecommendationsGemini = async (recommendationPrompt, channelName) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        logger.info(`[AI] Fetching suggestions for channel: ${channelName}, attempt ${attempt}`);

        // Call AI model to generate content
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-05-20",
          contents: recommendationPrompt
        });

        const responseText = await response.text;

        if (!responseText) {
          logger.warn(`[AI] Empty response on attempt ${attempt}`);
          continue;
        }

        const jsonMatch = responseText.match(/\[[\s\S]*\]/);

        if (jsonMatch) {
          try {
            const parsedJson = JSON.parse(jsonMatch[0]);
            logger.info(`[AI] Successfully parsed suggestions: ${parsedJson.length} items`);
            return parsedJson;
          } catch (jsonErr) {
            logger.error('[AI] JSON parse error:', jsonErr);
            // Proceed to next attempt
          }
        } else {
          logger.error('[AI] No JSON array found in response');
        }

      } catch (err) {
        logger.error(`[AI] Error fetching suggestions (attempt ${attempt}):`, err);
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

  } catch (outerErr) {
    logger.error('[AI] Unexpected error during AI recommendation process:', outerErr);
  }

  // All retries failed
  return [];
};

module.exports = {
  getAIRecommendationsGemini
};
