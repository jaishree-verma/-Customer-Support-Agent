import { AgentStepEvent } from '../types/chat';

export async function streamAgentQuery(
  query: string,
  sessionId: string,
  onEvent: (event: AgentStepEvent) => void,
  onError: (error: Error) => void,
  onComplete: () => void
) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

  try {
    const response = await fetch(`${backendUrl}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: query, session_id: sessionId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('ReadableStream not supported by response');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || ''; // keep trailing chunk in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const jsonStr = trimmed.slice(6);
          try {
            const event: AgentStepEvent = JSON.parse(jsonStr);
            onEvent(event);
            if (event.type === 'WORKFLOW_COMPLETE') {
              onComplete();
            }
          } catch (err) {
            console.error('Failed to parse SSE line:', jsonStr, err);
          }
        }
      }
    }
    onComplete();
  } catch (error: any) {
    console.error('Error during streaming:', error);
    onError(error instanceof Error ? error : new Error(String(error)));
  }
}
