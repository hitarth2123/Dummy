import React, { useEffect, useState } from 'react';
import { Flag, MessageCircle, Plus, Search, Send } from 'lucide-react';
import { forumService } from '@services/api.service';
import WeeklyFeedbackModal from '@components/feedback/WeeklyFeedbackModal';

const Forum = () => {
  const [posts, setPosts] = useState([]);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState({ title: '', body: '', type: 'question' });
  const [active, setActive] = useState(null);
  const [reply, setReply] = useState('');
  const [message, setMessage] = useState('');
  const [showFeedback, setShowFeedback] = useState(new Date().getDay() === 1);

  const load = async () => {
    const result = await forumService.getPosts({
      mine: tab === 'mine' ? 'true' : undefined,
      search: search || undefined,
    });
    setPosts(result.data?.posts || result.posts || []);
  };

  useEffect(() => {
    load().catch((error) => setMessage(error.response?.data?.message || 'Unable to load forum posts.'));
  }, [tab]);

  const create = async (event) => {
    event.preventDefault();
    try {
      await forumService.createPost(draft);
      setDraft({ title: '', body: '', type: 'question' });
      setMessage('Post published.');
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to publish post.');
    }
  };

  const openPost = async (id) => setActive((await forumService.getPost(id)).data);
  const addReply = async (event) => {
    event.preventDefault();
    await forumService.reply(active._id, { body: reply });
    setReply('');
    await openPost(active._id);
  };
  const flag = async (post) => {
    const result = await forumService.flagGrievance(post._id, { category: 'other' });
    setMessage(`Grievance submitted: ${result.data?.reference_number}`);
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">Department community</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Forum</h1>
        </div>
        <button type="button" onClick={() => document.getElementById('new-post')?.scrollIntoView()} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white"><Plus size={17} /> New post</button>
      </header>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => setTab('all')} className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === 'all' ? 'bg-ink text-white' : 'bg-white text-slate-600'}`}>All posts</button>
        <button type="button" onClick={() => setTab('mine')} className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === 'mine' ? 'bg-ink text-white' : 'bg-white text-slate-600'}`}>My posts</button>
        <form onSubmit={(event) => { event.preventDefault(); load(); }} className="ml-auto flex gap-2"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search department forum" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" /><button aria-label="Search" className="rounded-lg border border-slate-200 bg-white px-3"><Search size={17} /></button></form>
      </div>

      {message && <p className="rounded-lg bg-teal-50 p-3 text-sm text-teal-800">{message}</p>}
      <div className="grid gap-4">
        {posts.map((post) => (
          <article key={post._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel">
            <div className="flex justify-between gap-4"><div><span className="text-xs font-semibold uppercase tracking-wide text-teal-700">{post.type}</span><h2 className="mt-1 text-lg font-semibold text-ink">{post.title}</h2></div><span className="text-xs text-slate-400">{post.author?.name || 'Anonymous'}</span></div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{post.body}</p>
            <div className="mt-4 flex gap-3"><button type="button" onClick={() => openPost(post._id)} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600"><MessageCircle size={16} /> Reply</button><button type="button" onClick={() => flag(post)} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-red-600"><Flag size={16} /> Grievance</button></div>
          </article>
        ))}
      </div>

      <form id="new-post" onSubmit={create} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel"><h2 className="font-semibold text-ink">New post</h2><div className="mt-3 grid gap-3"><input required value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Title" className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm" /><select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value })} className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"><option value="question">Question</option><option value="discussion">Discussion</option><option value="grievance">Grievance</option><option value="announcement">Announcement</option></select><textarea required value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} placeholder="Write your post" className="min-h-24 rounded-lg border border-slate-200 px-3 py-2.5 text-sm" /><button className="w-fit rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white">Publish</button></div></form>

      {active && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 p-4"><div className="w-full max-w-lg rounded-2xl bg-white p-6"><h2 className="text-lg font-semibold">Replies: {active.title}</h2><div className="mt-4 space-y-3">{active.replies?.map((item) => <p key={item._id} className="rounded-lg bg-slate-50 p-3 text-sm">{item.body}</p>)}</div><form onSubmit={addReply} className="mt-4 flex gap-2"><input required value={reply} onChange={(event) => setReply(event.target.value)} className="min-w-0 flex-1 rounded-lg border px-3 py-2" placeholder="Reply" /><button aria-label="Send reply" className="rounded-lg bg-teal-700 p-2 text-white"><Send size={17} /></button></form><button type="button" onClick={() => setActive(null)} className="mt-4 text-sm text-slate-500">Close</button></div></div>}
      {showFeedback && <WeeklyFeedbackModal onClose={() => setShowFeedback(false)} />}
    </section>
  );
};

export default Forum;
