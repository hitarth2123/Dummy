import React, { useRef, useState } from 'react';
import { Flag, LoaderCircle, Send, Sparkles } from 'lucide-react';
import { useAuth } from '@hooks/useAuth';
import { hallucinationService } from '@services/api.service';

const AITutor = () => {
	const { user } = useAuth();
	const [messages, setMessages] = useState([]);
	const [prompt, setPrompt] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [reported, setReported] = useState({});
	const inputRef = useRef(null);

	const sendMessage = async (event) => {
		event.preventDefault();
		const message = prompt.trim();
		if (!message || loading) return;
		setPrompt(''); setError(''); setLoading(true);
		setMessages((current) => [...current, { role: 'user', content: message }, { role: 'assistant', content: '', sources: [] }]);
		try {
			const stored = JSON.parse(localStorage.getItem('ai_buddy_user') || 'null');
			const response = await fetch('/api/llm/tutor/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: stored?.token ? `Bearer ${stored.token}` : '' }, body: JSON.stringify({ message, stream: true }) });
			if (!response.ok) throw new Error((await response.json()).message || 'Tutor request failed');
			const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = ''; let reading = true;
			while (reading) { const { value, done } = await reader.read(); if (done) { reading = false; continue; } buffer += decoder.decode(value, { stream: true }); const events = buffer.split('\n\n'); buffer = events.pop() || ''; events.forEach((eventChunk) => { const line = eventChunk.split('\n').find((lineValue) => lineValue.startsWith('data: ')); if (!line) return; const data = JSON.parse(line.slice(6)); setMessages((current) => { const copy = [...current]; const last = copy[copy.length - 1]; copy[copy.length - 1] = { ...last, content: data.delta ? last.content + data.delta : last.content, sources: data.rag_sources || last.sources }; return copy; }); }); }
		} catch (requestError) { setError(requestError.message); setMessages((current) => current.slice(0, -1)); } finally { setLoading(false); inputRef.current?.focus(); }
	};

	const reportResponse = async (index) => {
		try {
			await hallucinationService.report({ response: messages[index]?.content, source_ids: messages[index]?.sources?.map((source) => source.chunk_id) || [] });
			setReported((current) => ({ ...current, [index]: true }));
		} catch (requestError) {
			setError(requestError.response?.data?.message || 'Could not submit the report.');
		}
	};

	return <section className="flex min-h-[calc(100vh-11rem)] flex-col gap-6"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">Academic companion</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">AI tutor</h1><p className="mt-2 text-slate-600">Ask about your coursework and every answer will show its knowledge sources.</p></div><div className="flex-1 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-panel sm:p-6">{messages.length === 0 && <div className="grid min-h-64 place-items-center text-center text-slate-500"><div><Sparkles className="mx-auto mb-3 text-amber-600" /><p>What are you studying today?</p></div></div>}{messages.map((message, index) => <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-2xl rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'bg-ink text-white' : 'bg-slate-100 text-slate-700'}`}>{message.content || <LoaderCircle className="animate-spin" size={17} />}{message.role === 'assistant' && message.sources?.length > 0 && <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-200 pt-3">{message.sources.map((source) => <span key={source.chunk_id} className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-500">{source.source_document || source.chunk_id}</span>)}<button type="button" title="Report hallucination" aria-label="Report hallucination" onClick={() => reportResponse(index)} className={`ml-auto ${reported[index] ? 'text-emerald-600' : 'text-slate-400 hover:text-red-600'}`}><Flag size={15} /></button></div>}</div></div>)}</div>{error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}<form onSubmit={sendMessage} className="flex gap-3"><input ref={inputRef} value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder={`Ask AI Buddy, ${user?.name || 'student'}...`} className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-600" /><button disabled={loading || !prompt.trim()} className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-40" aria-label="Send message"><Send size={18} /></button></form></section>;
};

export default AITutor;
