export const getAIResponse = async (message) => {
  try {
    const response = await fetch("http://localhost:5001/api/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.reply;

  } catch (error) {
    console.error("AI Service Error:", error);
    return "AI service temporarily unavailable";
  }
};

// Legacy compatibility for existing components
export const askAI = async (message) => {
  return await getAIResponse(message);
};

export const aiService = {
  async generateResponse(prompt, userContext = {}) {
    return await askAI(prompt);
  }
};
