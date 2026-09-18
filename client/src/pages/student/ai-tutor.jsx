import React, { useRef, useState } from 'react';
import { Bot, FileWarning, LoaderCircle, Send, Sparkles, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import DistressPrompt from '@components/safety/DistressPrompt';
import { safetyService } from '@services/api.service';
import ThinkingOrb from '@components/three/ThinkingOrb';

const escapeHtml = (value) => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character]));
const inlineMarkup = (value) => escapeHtml(value).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>');
const tableRow = (line) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
const isTableLine = (line) => (line.match(/\|/g) || []).length >= 2;
const isTableDivider = (line) => /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
const normalizeMath = (value) => value
  .replace(/\\\[\s*/g, '')
  .replace(/\s*\\\]/g, '')
  .replace(/\\\((.*?)\\\)/g, '$1');
const readErrorMessage = async (response) => {
  const body = await response.text();
  if (!body.trim()) return `Tutor request failed (${response.status})`;
  try {
    const payload = JSON.parse(body);
    return payload.message || payload.error?.message || `Tutor request failed (${response.status})`;
  } catch {
    return body.trim().slice(0, 240) || `Tutor request failed (${response.status})`;
  }
};

const TutorContent = ({ content }) => {
  const lines = normalizeMath(content).replace(/<details>[\s\S]*?<\/details>/gi, '').replace(/<summary>[\s\S]*?<\/summary>/gi, '').replace(/<br\s*\/?>(\n)?/gi, '\n').replace(/\r/g, '').trim().split('\n');
  const output = [];
  let paragraph = [];
  let code = null;
  let codeLanguage = '';
  let tableRows = [];
  const flushParagraph = () => {
    if (!paragraph.length) return;
    output.push(<p key={`p-${output.length}`} className="ai-tutor-paragraph" dangerouslySetInnerHTML={{ __html: inlineMarkup(paragraph.join(' ')) }} />);
    paragraph = [];
  };
  const flushTable = () => {
    if (tableRows.length < 2) { tableRows = []; return; }
    const [header, ...rows] = tableRows;
    output.push(<div key={`table-${output.length}`} className="ai-tutor-table-wrap"><table className="ai-tutor-table"><thead><tr>{header.map((cell, index) => <th key={`th-${index}`} dangerouslySetInnerHTML={{ __html: inlineMarkup(cell) }} />)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={`tr-${rowIndex}`}>{header.map((_, index) => <td key={`td-${index}`} dangerouslySetInnerHTML={{ __html: inlineMarkup(row[index] || '') }} />)}</tr>)}</tbody></table></div>);
    tableRows = [];
  };
  lines.forEach((line, index) => {
    if (line.startsWith('```')) {
      if (code === null) { flushParagraph(); code = []; codeLanguage = line.slice(3).trim(); }
      else { output.push(<div key={`code-${index}`} className="ai-tutor-code-block">{codeLanguage && <div className="ai-tutor-code-label">{codeLanguage}</div>}<pre><code>{escapeHtml(code.join('\n'))}</code></pre></div>); code = null; codeLanguage = ''; }
      return;
    }
    if (code !== null) { code.push(line); return; }
    if (isTableLine(line)) { flushParagraph(); if (!isTableDivider(line)) tableRows.push(tableRow(line)); return; }
    flushTable();
    if (!line.trim()) { flushParagraph(); return; }
    if (/^#{1,3} /.test(line)) { flushParagraph(); const level = line.match(/^#+/)[0].length; const Heading = level === 1 ? 'h2' : 'h3'; output.push(<Heading key={`h-${index}`} className={`ai-tutor-heading ${level === 1 ? 'ai-tutor-heading-primary' : ''}`} dangerouslySetInnerHTML={{ __html: inlineMarkup(line.replace(/^#{1,3} /, '')) }} />); return; }
    if (/^\s*[-•] /.test(line)) { flushParagraph(); output.push(<div key={`li-${index}`} className="ai-tutor-list-item"><span className="ai-tutor-bullet">•</span><span dangerouslySetInnerHTML={{ __html: inlineMarkup(line.replace(/^\s*[-•] /, '')) }} /></div>); return; }
    if (/^\s*\d+[.)] /.test(line)) { flushParagraph(); output.push(<div key={`ol-${index}`} className="ai-tutor-list-item"><span className="ai-tutor-number">{line.match(/^\s*\d+/)[0].trim()}.</span><span dangerouslySetInnerHTML={{ __html: inlineMarkup(line.replace(/^\s*\d+[.)] /, '')) }} /></div>); return; }
    if (/^\s*[-*_]{3,}\s*$/.test(line)) { flushParagraph(); output.push(<hr key={`hr-${index}`} className="my-2 border-surface-variant/40" />); return; }
    paragraph.push(line);
  });
  flushTable();
  if (code !== null) output.push(<pre key="code-final" className="ai-tutor-code-block"><code>{escapeHtml(code.join('\n'))}</code></pre>);
  flushParagraph();
  return <div className="ai-tutor-content">{output}</div>;
};

const SourceList = ({ sources = [] }) => !sources.length ? null : <div className="mt-5 border-t border-surface-variant/40 pt-3"><p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">References</p><div className="flex flex-wrap gap-2">{sources.slice(0, 6).map((source) => <a key={source.chunk_id} href={source.url || '#'} target={source.url ? '_blank' : undefined} rel="noreferrer" className="rounded-full bg-primary-container/15 px-3 py-1 text-xs font-medium text-on-primary-container hover:bg-primary-container/20">{source.source_document || source.topic || 'Knowledge source'}</a>)}</div></div>;

const AITutor = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [conversationTitle, setConversationTitle] = useState('New conversation');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [distressDetection, setDistressDetection] = useState(null);
  const [distressStatus, setDistressStatus] = useState('');
  const inputRef = useRef(null);

  const sendMessage = async (event) => {
    event.preventDefault();
    const message = prompt.trim();
    if (!message || loading) return;
    const history = messages.filter((item) => item.content).map(({ role, content }) => ({ role, content }));
    setPrompt('');
    setError('');
    setLoading(true);
    setMessages((current) => [...current, { role: 'user', content: message }, { role: 'assistant', content: '', sources: [] }]);
    try {
      const stored = JSON.parse(localStorage.getItem('ai_buddy_user') || 'null');
      const response = await fetch('/api/llm/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: stored?.token ? `Bearer ${stored.token}` : '' },
        body: JSON.stringify({ message, stream: true, conversation_id: conversationId, history }),
      });
      if (!response.ok) throw new Error(await readErrorMessage(response));
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';
        events.forEach((chunk) => {
          const line = chunk.split('\n').find((item) => item.startsWith('data: '));
          if (!line) return;
          const data = JSON.parse(line.slice(6));
          if (data.conversation_id) setConversationId(String(data.conversation_id));
          if (data.conversation_title) setConversationTitle(data.conversation_title);
          if (data.distress_detection?.flagged) setDistressDetection(data.distress_detection);
          setMessages((current) => {
            const copy = [...current];
            const last = copy[copy.length - 1];
            copy[copy.length - 1] = { ...last, content: data.delta ? last.content + data.delta : last.content, sources: data.rag_sources || last.sources, knowledge: data.knowledge || last.knowledge };
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

  const confirmDistress = async () => {
    const lastUser = [...messages].reverse().find((message) => message.role === 'user');
    const lastAssistant = [...messages].reverse().find((message) => message.role === 'assistant');
    await safetyService.confirmDistress({ prompt: lastUser?.content, response: lastAssistant?.content });
    setDistressStatus('help_on_the_way');
  };

  return (
    <section className="flex min-h-[calc(100vh-11rem)] min-w-0 flex-col gap-6">
      <DistressPrompt detection={distressDetection} status={distressStatus} onConfirm={confirmDistress} onDismiss={() => setDistressDetection(null)} />
      <header className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-r from-surface-container-low via-slate-900/90 to-surface-container p-6 text-on-surface shadow-panel sm:p-8">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary border border-primary/30 shadow-glow">
            <Bot size={24} />
          </div>
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-primary border border-primary/30">
              <Sparkles size={12} className="text-secondary" />
              <span className="text-primary-fixed">AI Academic Tutor</span>
            </div>
            <h1 className="mt-2 truncate text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-indigo-200">{conversationTitle}</span>
            </h1>
          </div>
        </div>
        <p className="relative z-10 mt-3 max-w-2xl text-sm font-medium text-on-surface-variant">
          Ask a question naturally; your AI academic companion references your syllabus & keeps full context of your discussion.
        </p>
      </header>

      <div className="min-w-0 flex-1 space-y-5 overflow-hidden rounded-3xl border border-surface-variant/40 bg-surface-container-low p-4 shadow-panel sm:p-6">
        {messages.length === 0 && (
          <div className="grid min-h-64 place-items-center text-center text-on-surface-variant">
            <div>
              <Sparkles className="mx-auto mb-3 text-secondary" size={28} />
              <p className="font-semibold text-on-surface">What are you studying today?</p>
              <p className="mt-1 text-sm">Ask about a topic or start a normal conversation.</p>
            </div>
          </div>
        )}
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`flex min-w-0 gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.role === 'assistant' && (
              <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary-container/15 text-primary">
                <Bot size={16} />
              </div>
            )}
            <div className={`min-w-0 max-w-3xl rounded-2xl px-5 py-4 text-sm ${message.role === 'user' ? 'bg-primary text-slate-950 font-medium' : 'border border-surface-variant/40 bg-surface-container text-on-surface'}`}>
              {message.role === 'assistant' ? (
                message.content ? (
                  <>
                    <TutorContent content={message.content} />
                    <SourceList sources={message.sources} />
                  </>
                ) : (
                  <ThinkingOrb />
                )
              ) : (
                <div className="flex items-start gap-2">
                  <UserRound size={16} className="mt-0.5 shrink-0" />
                  {message.content}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {error && <p role="alert" className="rounded-xl bg-error-container/15 p-3 text-sm text-error">{error}</p>}

      <form onSubmit={sendMessage} className="flex items-center gap-3 rounded-2xl border border-surface-variant/40 bg-surface-container-low p-3 shadow-panel">
        <button type="button" onClick={() => navigate('/student/report-hallucination')} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-amber-300/25 text-amber-200" aria-label="Report AI response"><FileWarning size={17} /></button>
        <input
          ref={inputRef}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Ask a question or follow up..."
          className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-on-surface outline-none placeholder:text-outline"
        />
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-slate-950 transition hover:bg-primary-fixed disabled:cursor-not-allowed disabled:opacity-40 shadow-md"
          aria-label="Send message"
        >
          <Send size={17} />
        </button>
      </form>
    </section>
  );
};

export default AITutor;
