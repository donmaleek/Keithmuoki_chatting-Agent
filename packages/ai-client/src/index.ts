import type { AiReplyRequest, AiReplyResponse } from '@chat/shared';

export interface AiClientOptions {
  baseUrl: string;
  apiKey?: string;
}

export function createAiClient(options: AiClientOptions) {
  async function respond(payload: AiReplyRequest): Promise<AiReplyResponse> {
    const response = await fetch(`${options.baseUrl}/ai/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(options.apiKey ? { Authorization: `Bearer ${options.apiKey}` } : {})
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`AI request failed: ${response.status}`);
    }

    return (await response.json()) as AiReplyResponse;
  }

  return { respond };
}
