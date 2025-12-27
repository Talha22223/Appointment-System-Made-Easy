import { 
  Controller, 
  Post, 
  Body, 
  HttpException, 
  HttpStatus 
} from '@nestjs/common';

@Controller('chatbot')
export class ChatbotController {
  @Post()
  async chat(@Body() body: any) {
    try {
      const { message, conversationHistory = [] } = body;

      if (!message) {
        throw new HttpException('Message is required', HttpStatus.BAD_REQUEST);
      }

      // Use OpenRouter API key (hardcoded as per old implementation)
      const OPENROUTER_API_KEY = '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';
      
      if (!OPENROUTER_API_KEY) {
        return {
          message: 'OpenRouter API key not configured',
          reply: "I'm sorry, the AI service is not configured yet. Please contact the administrator."
        };
      }

      // Build the messages array for GPT
      const systemMessage = {
        role: 'system',
        content: `You are a helpful medical appointment assistant for a healthcare platform. 
You can help users with:
- Information about booking doctor appointments
- Information about lab tests and lab techniques
- General health-related questions
- Navigation help for the website
- Appointment scheduling guidance

Be friendly, professional, and concise. If users have urgent medical concerns, 
always advise them to contact emergency services or visit a hospital.
Do not provide specific medical diagnoses or treatment recommendations.`
      };

      const messages = [
        systemMessage,
        ...conversationHistory.map((msg: any) => ({
          role: msg.role,
          content: msg.content
        })),
        { role: 'user', content: message }
      ];

      // Call OpenRouter API
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'openai/gpt-3.5-turbo',
          messages: messages,
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('OpenAI API error:', errorData);
        return {
          message: 'Error communicating with AI service',
          reply: "I'm having trouble connecting right now. Please try again in a moment."
        };
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";

      return {
        reply,
        usage: data.usage
      };
    } catch (error: any) {
      console.error('Chatbot API error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      return {
        message: 'Server error',
        reply: "I'm sorry, something went wrong. Please try again later."
      };
    }
  }
}

