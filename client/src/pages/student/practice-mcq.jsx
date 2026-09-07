import React, { useState } from 'react';
import { CheckCircle2, ChevronRight, LoaderCircle, Sparkles, XCircle } from 'lucide-react';
import { llmService } from '@services/api.service';

const PracticeMCQ = () => {
	const [topic, setTopic] = useState('Database normalization');
	const [questions, setQuestions] = useState([]);
	const [sources, setSources] = useState([]);
	const [index, setIndex] = useState(0);
	const [selected, setSelected] = useState('');
	const [submitted, setSubmitted] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const question = questions[index];

	const generate = async (event) => {
		event.preventDefault();
		setLoading(true); setError(''); setSelected(''); setSubmitted(false); setIndex(0);
		try {
			const result = await llmService.generateMcq({ topic, count: 5 });
			const data = result.data || result;
			setQuestions(data.questions || []); setSources(data.rag_sources || []);
		} catch (requestError) {
			setError(requestError.response?.data?.message || 'Could not generate MCQs.');
		} finally { setLoading(false); }
	};

	return <section className="space-y-6">
		<div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">Practice studio</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Practice MCQs</h1><p className="mt-2 text-slate-600">Generate a cited practice set from your department knowledge base.</p></div>
		<form onSubmit={generate} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-panel sm:flex-row"><input value={topic} onChange={(event) => setTopic(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-600" placeholder="Topic" /><button disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60">{loading && <LoaderCircle size={16} className="animate-spin" />} Generate set</button></form>
		{error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
		{question && <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-panel sm:p-8"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-medium text-slate-500">Question {index + 1} of {questions.length}</span><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold capitalize text-amber-800">{question.difficulty}</span></div><h2 className="mt-6 text-xl font-semibold text-ink">{question.question_text}</h2><div className="mt-5 grid gap-3">{question.options.map((option) => <label key={option.label} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm ${selected === option.label ? 'border-teal-600 bg-teal-50' : 'border-slate-200 hover:bg-slate-50'}`}><input type="radio" name="answer" value={option.label} checked={selected === option.label} onChange={(event) => setSelected(event.target.value)} disabled={submitted} className="mt-1 accent-teal-700" /><span><b>{option.label}.</b> {option.text}</span></label>)}</div>{submitted && <div className={`mt-5 rounded-xl p-4 text-sm ${selected === question.correct_answer ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>{selected === question.correct_answer ? <CheckCircle2 className="mr-2 inline" size={18} /> : <XCircle className="mr-2 inline" size={18} />}{selected === question.correct_answer ? 'Correct.' : `Correct answer: ${question.correct_answer}.`} {question.explanation}</div>}<div className="mt-6 flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-2">{(question.rag_sources || sources).slice(0, 3).map((source) => <span key={source.chunk_id} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">Source: {source.source_document || source.chunk_id}</span>)}</div>{!submitted ? <button type="button" disabled={!selected} onClick={() => setSubmitted(true)} className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Check answer</button> : <button type="button" onClick={() => { setIndex((value) => Math.min(value + 1, questions.length - 1)); setSelected(''); setSubmitted(false); }} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white">Next <ChevronRight size={17} /></button>}</div></article>}
		{!question && !loading && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500"><Sparkles className="mx-auto mb-3 text-amber-600" /><p>Choose a topic to begin.</p></div>}
	</section>;
};

export default PracticeMCQ;
