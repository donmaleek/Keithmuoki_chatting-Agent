/**
 * ChatAgent Embeddable Widget
 * 
 * Usage: Add this script to any website to embed a chat bubble.
 * <script src="https://yourdomain.com/widget.js" data-company="your-slug"></script>
 * 
 * Or via the API endpoint (served from the backend):
 * <script src="https://api.yourdomain.com/widget/embed.js?slug=your-slug"></script>
 */
(function () {
  'use strict';

  const script = document.currentScript;
  const slug = script?.getAttribute('data-company') || new URLSearchParams(script?.src?.split('?')[1] || '').get('slug');
  const position = script?.getAttribute('data-position') || 'bottom-right';
  const primaryColor = script?.getAttribute('data-color') || '#4f46e5';
  
  // Default to the origin where this script is hosted, or override
  const chatUrl = script?.getAttribute('data-chat-url') || (script?.src ? new URL(script.src).origin : window.location.origin);

  if (!slug) {
    console.error('[ChatAgent] Missing data-company attribute or slug parameter');
    return;
  }

  // Inject styles
  const style = document.createElement('style');
  style.textContent = `
    #chatagent-bubble {
      position: fixed;
      ${position === 'bottom-left' ? 'left: 20px;' : 'right: 20px;'}
      bottom: 20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: ${primaryColor};
      color: white;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    #chatagent-bubble:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 28px rgba(0,0,0,0.2);
    }
    #chatagent-bubble svg {
      width: 28px;
      height: 28px;
    }
    #chatagent-frame-container {
      position: fixed;
      ${position === 'bottom-left' ? 'left: 20px;' : 'right: 20px;'}
      bottom: 90px;
      width: 380px;
      height: 580px;
      max-height: calc(100vh - 120px);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0,0,0,0.15);
      z-index: 99999;
      display: none;
      border: 1px solid #e2e8f0;
    }
    #chatagent-frame-container.open {
      display: block;
      animation: chatagent-slideup 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    #chatagent-frame {
      width: 100%;
      height: 100%;
      border: none;
    }
    @keyframes chatagent-slideup {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @media (max-width: 440px) {
      #chatagent-frame-container {
        width: calc(100vw - 20px);
        left: 10px;
        right: 10px;
        bottom: 80px;
        height: calc(100vh - 100px);
      }
    }
  `;
  document.head.appendChild(style);

  // Create chat bubble button
  const bubble = document.createElement('button');
  bubble.id = 'chatagent-bubble';
  bubble.setAttribute('aria-label', 'Open chat');
  bubble.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
  document.body.appendChild(bubble);

  // Create iframe container
  const container = document.createElement('div');
  container.id = 'chatagent-frame-container';
  const iframe = document.createElement('iframe');
  iframe.id = 'chatagent-frame';
  iframe.src = `${chatUrl}/chat/${slug}`;
  iframe.setAttribute('loading', 'lazy');
  iframe.setAttribute('title', 'Chat');
  container.appendChild(iframe);
  document.body.appendChild(container);

  let isOpen = false;
  bubble.addEventListener('click', function () {
    isOpen = !isOpen;
    container.classList.toggle('open', isOpen);
    bubble.innerHTML = isOpen
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
  });
})();
