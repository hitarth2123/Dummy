import React, { useEffect, useMemo, useState } from 'react';
import { Layers3, Sparkles, BookOpen, CheckCircle2, ChevronDown } from 'lucide-react';
import { studentService } from '@services/api.service';

const DEFAULT_CATALOG = [
  {
    number: 5,
    specializations: [
      {
        name: 'Common Core',
        subjects: [
          { name: 'Artificial Intelligence', topics: ['Intelligent Agents', 'Search Algorithms', 'Knowledge Representation', 'Machine Learning Basics'] },
          { name: 'Compiler Design', topics: ['Lexical Analysis', 'Parsing', 'Syntax Directed Translation', 'Code Generation'] },
          { name: 'Cloud Computing', topics: ['Virtualization', 'IaaS & PaaS', 'Cloud Storage', 'Serverless Architecture', 'Cloud Security'] },
          { name: 'Distributed Systems', topics: ['RPC & RMI', 'Consensus Algorithms', 'Fault Tolerance', 'Distributed Shared Memory'] },
          { name: 'Computer Graphics', topics: ['Scan Conversion', '2D/3D Transformations', 'Clipping Algorithms', 'Shading & Illumination', 'Ray Tracing'] }
        ]
      },
      {
        name: 'AI & Machine Learning',
        subjects: [
          { name: 'Deep Learning', topics: ['Neural Networks', 'CNNs', 'RNNs & LSTMs', 'Transformers'] },
          { name: 'Natural Language Processing', topics: ['Tokenization', 'Word Embeddings', 'Sequence Models', 'LLMs'] }
        ]
      },
      {
        name: 'Cyber Security',
        subjects: [
          { name: 'Network Security', topics: ['Firewalls', 'IDS/IPS', 'VPNs', 'Cryptography'] },
          { name: 'Ethical Hacking', topics: ['Reconnaissance', 'Vulnerability Assessment', 'Exploitation', 'Post-Exploitation'] }
        ]
      }
    ]
  },
  {
    number: 6,
    specializations: [
      {
        name: 'Common Core',
        subjects: [
          { name: 'Software Engineering', topics: ['Agile Methodologies', 'Requirements Engineering', 'Software Architecture', 'Testing & QA'] },
          { name: 'Computer Networks', topics: ['OSI Model', 'TCP/IP', 'Routing Protocols', 'Congestion Control'] }
        ]
      }
    ]
  }
];

const CurriculumSelector = ({ onSelectSubject, onSelectTopic, currentSubject, currentTopic, actionLabel = "Practice" }) => {
  const [curriculumData, setCurriculumData] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(5);
  const [selectedSpecialization, setSelectedSpecialization] = useState('Common Core');
  const [selectedSubject, setSelectedSubject] = useState('');

  useEffect(() => {
    studentService.getCurriculum()
      .then((res) => {
        const curriculum = res?.data || res;
        if (curriculum?.catalog?.length) {
          setCurriculumData(curriculum);
          setSelectedSemester(curriculum.semester || 5);
          setSelectedSpecialization(curriculum.specialization || 'Common Core');
        } else {
          setCurriculumData({ course: 'B.Tech', semester: 5, specialization: 'Common Core', catalog: DEFAULT_CATALOG });
        }
      })
      .catch(() => {
        setCurriculumData({ course: 'B.Tech', semester: 5, specialization: 'Common Core', catalog: DEFAULT_CATALOG });
      });
  }, []);

  const catalog = curriculumData?.catalog?.length ? curriculumData.catalog : DEFAULT_CATALOG;
  const activeSemester = catalog.find((semester) => semester.number === Number(selectedSemester)) || catalog[0];
  const specializationOptions = activeSemester?.specializations || [];
  const activeSpecialization = specializationOptions.find(({ name }) => name === selectedSpecialization)
    || specializationOptions[0];
  const activeSubjects = activeSpecialization?.subjects || [];
  
  const activeSubject = activeSubjects.find(({ name }) => name === (selectedSubject || currentSubject)) || activeSubjects[0];

  const curriculumLabel = useMemo(() => [
    curriculumData?.course || 'B.Tech',
    `Semester ${selectedSemester}`,
    activeSpecialization?.name || 'Common Core',
  ].filter(Boolean).join(' · '), [activeSpecialization?.name, curriculumData?.course, selectedSemester]);

  return (
    <section className="relative rounded-3xl border border-primary/20 bg-surface-container-low p-6 shadow-panel space-y-6">
      {/* Top Header + Dropdowns */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between border-b border-surface-variant/30 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-primary border border-primary/30 mb-2">
            <Sparkles size={12} className="text-secondary" />
            <span>Academic Path Selection</span>
          </div>
          <h2 className="text-2xl font-extrabold text-on-surface">{curriculumLabel}</h2>
          <p className="mt-1 text-xs sm:text-sm text-on-surface-variant">Choose your semester and specialization to unlock subject modules and topics.</p>
        </div>

        {/* Dropdown Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Semester Dropdown */}
          <div className="relative flex-1 sm:flex-initial min-w-[170px]">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-outline mb-1">
              Select Semester
            </label>
            <div className="relative">
              <select
                value={selectedSemester}
                onChange={(event) => {
                  const nextSemester = Number(event.target.value);
                  const next = catalog.find((semester) => semester.number === nextSemester);
                  setSelectedSemester(nextSemester);
                  setSelectedSpecialization(next?.specializations?.[0]?.name || 'Common Core');
                  setSelectedSubject('');
                }}
                className="w-full appearance-none rounded-xl border border-primary/30 bg-surface-container-high px-4 py-2.5 pr-10 text-sm font-bold text-on-surface shadow-md outline-none transition focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
              >
                {catalog.map((semester) => (
                  <option key={semester.number} value={semester.number} className="bg-slate-900 text-white font-medium py-2">
                    Semester {semester.number}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-primary" />
            </div>
          </div>

          {/* Specialization Dropdown */}
          <div className="relative flex-1 sm:flex-initial min-w-[210px]">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-outline mb-1">
              Select Specialization
            </label>
            <div className="relative">
              <select
                value={activeSpecialization?.name || selectedSpecialization}
                onChange={(event) => { 
                  setSelectedSpecialization(event.target.value); 
                  setSelectedSubject(''); 
                }}
                className="w-full appearance-none rounded-xl border border-primary/30 bg-surface-container-high px-4 py-2.5 pr-10 text-sm font-bold text-on-surface shadow-md outline-none transition focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
              >
                {specializationOptions.map((specialization) => (
                  <option key={specialization.name} value={specialization.name} className="bg-slate-900 text-white font-medium py-2">
                    {specialization.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Subject Cards Grid */}
      {activeSubjects.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">Available Subjects ({activeSubjects.length})</p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {activeSubjects.map((subject) => {
              const isSelected = activeSubject?.name === subject.name;
              return (
                <div
                  key={subject.name}
                  className={`flex flex-col justify-between rounded-2xl border p-4 transition ${
                    isSelected
                      ? 'border-primary bg-primary-container/20 shadow-glow'
                      : 'border-surface-variant/40 bg-surface-container hover:border-primary/40'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-container-low text-primary shadow-md">
                        <Layers3 size={18} />
                      </span>
                      <span className="rounded-full bg-surface-container-high px-2.5 py-1 text-[11px] font-bold text-outline">
                        {subject.topics.length} topics
                      </span>
                    </div>
                    <h3 className="mt-3 font-extrabold text-base leading-snug text-on-surface">{subject.name}</h3>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-surface-variant/20 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSubject(subject.name);
                        if (onSelectSubject) onSelectSubject(subject.name, subject.topics);
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-slate-950 hover:bg-primary-fixed transition shadow-md"
                    >
                      <BookOpen size={14} />
                      <span>{actionLabel} Entire {subject.name}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Subject Topic Tags */}
      {activeSubject && (
        <div className="rounded-2xl border border-primary/30 bg-surface-container/70 p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-surface-variant/20 pb-3">
            <div>
              <h3 className="font-extrabold text-lg text-primary">{activeSubject.name} — Topic Modules</h3>
              <p className="text-xs text-on-surface-variant">Click an individual topic or practice the entire subject syllabus at once.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedSubject(activeSubject.name);
                if (onSelectSubject) onSelectSubject(activeSubject.name, activeSubject.topics);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2 text-xs font-extrabold text-slate-950 hover:bg-secondary-fixed transition shadow-md shrink-0"
            >
              <CheckCircle2 size={15} />
              <span>{actionLabel} All {activeSubject.topics.length} Topics</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {activeSubject.topics.map((topic) => {
              const isTopicActive = currentTopic === topic;
              return (
                <button
                  key={topic}
                  type="button"
                  onClick={() => {
                    setSelectedSubject(activeSubject.name);
                    if (onSelectTopic) onSelectTopic(activeSubject.name, topic);
                  }}
                  className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    isTopicActive
                      ? 'border-primary bg-primary text-slate-950 shadow-md font-bold'
                      : 'border-primary/30 bg-surface-container-low text-on-primary-container hover:bg-primary-container/25 hover:border-primary/60'
                  }`}
                >
                  {topic}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

export default CurriculumSelector;
