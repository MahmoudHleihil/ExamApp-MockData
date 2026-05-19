/**
 * Local AIService
 * In a real-world scenario, this could integrate with a local LLM API (like Ollama or LM Studio)
 * or use a small WASM-based model in the browser.
 * For this prototype, we simulate a smart local assistant that understands the workspace context.
 */

export const aiService = {
  async sendMessage(message, context = {}) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const lowerMsg = message.toLowerCase();
    const { view, examsCount, submissionsCount, isEditing, currentExamTitle, selectedSubmissionStudent } = context;

    // --- Contextual Responses based on the current view ---
    
    // 1. Context: Form View (Creating/Editing)
    if (view === 'form') {
      if (lowerMsg.includes('help') || lowerMsg.includes('what to do')) {
        return `You are currently ${isEditing ? 'editing' : 'creating'} an exam${currentExamTitle ? ` titled "${currentExamTitle}"` : ''}. Make sure to add at least one question and specify the correct answer before saving.`;
      }
      if (lowerMsg.includes('suggest') || lowerMsg.includes('question')) {
        return "I can suggest questions! Since you're in the creator, tell me the topic and I'll give you a formatted multiple-choice question you can copy-paste.";
      }
    }

    // 2. Context: Submission Details (Grading)
    if (view === 'submission-detail') {
      if (lowerMsg.includes('student') || lowerMsg.includes('who')) {
        return `You are reviewing the submission from ${selectedSubmissionStudent || 'a student'}. You can see their answers compared to the correct ones and leave private feedback.`;
      }
      if (lowerMsg.includes('grade') || lowerMsg.includes('feedback')) {
        return "Focus on being constructive! For written answers, look for keywords. You can also add a 'Teacher Note' to specific questions if they were almost correct.";
      }
    }

    // 3. Context: Home View (Overview)
    if (view === 'home' || !view) {
      if (lowerMsg.includes('status') || lowerMsg.includes('how many')) {
        return `Currently, you have ${examsCount} active exams and ${submissionsCount} total student submissions across all your assessments.`;
      }
    }

    // 4. Context: List View
    if (view === 'list') {
      if (lowerMsg.includes('delete') || lowerMsg.includes('remove')) {
        return "To delete an exam, click the trash icon next to it. Be careful, this will also remove all associated student submissions!";
      }
    }

    // --- General Fallback Logic ---

    if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
      return "Hello Teacher! I'm your AI assistant. I've analyzed your current dashboard view and I'm ready to help. What's on your mind?";
    }

    if (lowerMsg.includes('javascript') || lowerMsg.includes('js')) {
      return "Great choice! Here is a suggested question:\n\n**Question:** What does `JSON.stringify()` do?\n1. Converts a JS object to a string\n2. Parses a JSON string to an object\n3. Formats a string\n4. None of the above\n\n**Correct Answer:** 1. Converts a JS object to a string";
    }

    if (lowerMsg.includes('how') && lowerMsg.includes('use')) {
      return "I track what you're doing in real-time. If you're in the Creator, I help with questions. If you're in Results, I help with grading. Just ask!";
    }

    return "I'm here to help! I can see you are currently in the " + (view || 'main') + " section. Feel free to ask about creating exams, grading, or managing your data.";
  }
};
