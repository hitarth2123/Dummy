import { useRef, useState } from 'react';
import { Bot, ExternalLink, LoaderCircle, Send, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import botImage from '@assets/aibud.png';

const ChatbotWidget = () => {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I am AI Buddy. How can I help you today?' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const sendMessage = async (event) => {
    event.preventDefault();
    const message = prompt.trim();
    if (!message || loading) return;
    const history = messages.map(({ role, content }) => ({ role, content }));
    setPrompt('');
    setError('');
    setLoading(true);
    setMessages((current) => [...current, { role: 'user', content: message }, { role: 'assistant', content: '' }]);

    try {
      const stored = JSON.parse(localStorage.getItem('ai_buddy_user') || 'null');
      const response = await fetch('/api/llm/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: stored?.token ? `Bearer ${stored.token}` : '' },
        body: JSON.stringify({ message, stream: true, history }),
      });
      if (!response.ok) throw new Error('I could not reach the tutor right now.');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let done = false;
      while (!done) {
        const { value, done: streamDone } = await reader.read();
        if (streamDone) { done = true; break; }
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';
        events.forEach((chunk) => {
          const line = chunk.split('\n').find((item) => item.startsWith('data: '));
          if (!line) return;
          const data = JSON.parse(line.slice(6));
          if (!data.delta) return;
          setMessages((current) => {
            const copy = [...current];
            copy[copy.length - 1] = { ...copy[copy.length - 1], content: copy[copy.length - 1].content + data.delta };
            return copy;
          });
        });
      }
    } catch (requestError) {
      setError(requestError.message);
      setMessages((current) => current.slice(0, -1));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return <>
    {open && <div className="fixed bottom-24 right-4 z-[10001] flex h-[min(30rem,calc(100vh-8rem))] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-primary/30 bg-slate-950/95 shadow-2xl backdrop-blur-xl" role="dialog" aria-label="AI Buddy chat">
      <header className="flex items-center justify-between border-b border-white/10 bg-primary-container/30 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3"><img src={botImage} alt="" className="h-9 w-9 rounded-xl object-cover" /><div className="min-w-0"><p className="truncate font-bold text-white">AI Buddy</p><p className="text-xs text-slate-300">Your campus assistant</p></div></div>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-300 hover:bg-white/10" aria-label="Close AI Buddy"><X size={18} /></button>
      </header>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {messages.map((message, index) => <div key={`${message.role}-${index}`} className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          {message.role === 'assistant' && <div className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-primary-container/40 text-primary"><Bot size={13} /></div>}
          <p className={`max-w-[82%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-5 ${message.role === 'user' ? 'bg-primary text-slate-950' : 'bg-surface-container text-slate-200'}`}>{message.content || <LoaderCircle size={15} className="animate-spin" />}</p>
        </div>)}
        {error && <p role="alert" className="rounded-lg bg-error-container/30 px-3 py-2 text-xs text-red-200">{error}</p>}
      </div>
      <div className="border-t border-white/10 p-3">
        <form onSubmit={sendMessage} className="flex items-center gap-2">
          <input ref={inputRef} value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Ask AI Buddy..." className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-primary/60" aria-label="Message AI Buddy" />
          <button type="submit" disabled={loading || !prompt.trim()} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-slate-950 disabled:opacity-40" aria-label="Send message"><Send size={16} /></button>
        </form>
        <Link to="/student/ai-tutor" onClick={() => setOpen(false)} className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:text-white">Open full tutor <ExternalLink size={12} /></Link>
      </div>
    </div>}
    <button type="button" onClick={() => setOpen((current) => !current)} className="fixed bottom-5 right-[5.5rem] z-[9999] grid h-14 w-14 place-items-center overflow-hidden rounded-full border-2 border-primary/60 bg-slate-950 shadow-2xl shadow-primary/25 transition hover:scale-105" aria-label={open ? 'Close AI Buddy' : 'Open AI Buddy'} aria-expanded={open}>
      <img src={botImage} alt="AI Buddy" className="h-full w-full object-cover" />
    </button>
  </>;
};

export default ChatbotWidget;