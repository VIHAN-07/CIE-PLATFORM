// ==========================================
// AI Tools Page — All 5 AI features
// ==========================================

import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

// ==========================================
// Hardcoded Conduction Guidelines per Activity Type
// (Written for faculty — how to plan, conduct, and evaluate)
// ==========================================
const ACTIVITY_GUIDELINES = {
  PPT: {
    icon: '📊',
    title: 'PPT Presentation',
    objective: 'Assess students\u2019 ability to research a topic, organize content logically, and deliver an effective oral presentation with visual aids.',
    sections: [
      {
        heading: 'Pre-Activity Preparation',
        items: [
          'Announce the activity at least one week in advance with clear topic assignments or topic-selection rules.',
          'Share the rubric with students beforehand so they know the evaluation criteria (e.g., content depth, slide design, delivery, Q\u0026A handling).',
          'Define constraints: maximum slides (10\u201315 recommended), time limit per student (8\u201312 min), mandatory Q\u0026A slot (2\u20133 min).',
          'Prepare the classroom with a projector, screen, pointer, and backup laptop.',
          'Create a presentation schedule/order and share it with the class.',
        ],
      },
      {
        heading: 'During the Activity',
        items: [
          'Brief students on decorum: audience must remain attentive, phones on silent, no cross-talk.',
          'Start each presentation by asking the student to introduce the topic and its relevance.',
          'Use a timer visible to the presenter; give a 2-minute warning before time runs out.',
          'After each presentation, open 2\u20133 audience questions before faculty questions.',
          'Score each rubric criterion immediately while observations are fresh.',
          'Note standout strengths or areas of improvement per student for qualitative feedback.',
        ],
      },
      {
        heading: 'Post-Activity & Evaluation',
        items: [
          'Compile scores and share individual feedback within 48 hours.',
          'Highlight top 3 presentations in class for peer motivation.',
          'If a student missed the slot, schedule a make-up within the same week.',
          'Record common issues (e.g., text-heavy slides, lack of citations) and address them in the next lecture.',
        ],
      },
      {
        heading: 'Best Practices',
        items: [
          'Encourage use of diagrams, charts, and live demos over plain text.',
          'Disallow reading directly from slides\u2014promote free speaking.',
          'Rotate Q\u0026A questioners so all students participate.',
          'Consider peer evaluation forms for a small weightage component.',
        ],
      },
    ],
  },
  'Flip Classroom': {
    icon: '🔄',
    title: 'Flip Classroom',
    objective: 'Students study assigned material beforehand and demonstrate understanding through an in-class teaching/discussion session led by them.',
    sections: [
      {
        heading: 'Pre-Activity Preparation',
        items: [
          'Select and distribute study material (videos, papers, textbook chapters) at least 5\u20137 days before the session.',
          'Clearly define what students are expected to learn and be able to explain.',
          'Assign specific sub-topics to individual students or small groups.',
          'Share the rubric covering criteria like conceptual clarity, explanation quality, use of examples, and audience engagement.',
          'Prepare 3\u20135 probing questions per sub-topic to test depth during the session.',
        ],
      },
      {
        heading: 'During the Activity',
        items: [
          'Begin with a quick 5-minute quiz or poll to verify that students studied the material.',
          'Let each student/group present their sub-topic (10\u201315 min) followed by Q\u0026A.',
          'Encourage the presenting student to use the whiteboard, code demos, or diagrams\u2014not just slides.',
          'Intervene to correct misconceptions immediately\u2014do not let wrong explanations propagate.',
          'Facilitate peer discussion: ask audience members to add to or challenge the explanation.',
          'Score based on depth of understanding, not just delivery style.',
        ],
      },
      {
        heading: 'Post-Activity & Evaluation',
        items: [
          'Summarize key takeaways and clarify any remaining doubts.',
          'Provide individual scores and written feedback on conceptual gaps.',
          'Assign a short follow-up problem or reflection note to reinforce learning.',
        ],
      },
      {
        heading: 'Best Practices',
        items: [
          'Vary the material format\u2014mix videos, research papers, and textbook readings.',
          'Pair weaker students with stronger ones for group-based flip sessions.',
          'Track which students consistently come unprepared and intervene early.',
        ],
      },
    ],
  },
  GD: {
    icon: '💬',
    title: 'Group Discussion',
    objective: 'Evaluate communication skills, logical reasoning, teamwork, leadership, and the ability to articulate and defend viewpoints.',
    sections: [
      {
        heading: 'Pre-Activity Preparation',
        items: [
          'Form groups of 6\u201310 students. Mix strong and reserved speakers for balanced dynamics.',
          'Prepare 3\u20134 topic options per round (technical, current affairs, or abstract) and reveal only at the start.',
          'Share evaluation rubric covering: content relevance, communication clarity, body language, listening, leadership, and conclusion ability.',
          'Arrange seating in a circle or U-shape so all participants face each other.',
          'Assign one faculty observer per group if multiple groups run in parallel.',
        ],
      },
      {
        heading: 'During the Activity',
        items: [
          'Announce the topic and give 2\u20133 minutes for students to collect their thoughts (no phones/notes).',
          'Set a total time of 12\u201315 minutes per discussion round.',
          'Do NOT intervene unless the discussion goes completely off-track or becomes heated.',
          'Track individual participation: note who initiates, who builds on others\u2019 points, who summarizes.',
          'Watch for negative behaviors: interrupting, dominating, personal attacks\u2014mark accordingly.',
          'After time is up, optionally ask each student for a one-line conclusion.',
        ],
      },
      {
        heading: 'Post-Activity & Evaluation',
        items: [
          'Score each student individually on the rubric\u2014avoid giving the whole group one score.',
          'Provide group-level feedback: what went well, what the group missed.',
          'Give private feedback to students who dominated or didn\u2019t participate.',
        ],
      },
      {
        heading: 'Best Practices',
        items: [
          'Conduct a practice/mock GD first so students understand expectations.',
          'Use a fish-bowl format for large classes: inner circle discusses, outer circle observes and scores.',
          'Rotate group compositions across GD rounds so students interact with different peers.',
        ],
      },
    ],
  },
  Viva: {
    icon: '🎤',
    title: 'Viva Voce',
    objective: 'Assess individual conceptual understanding, depth of knowledge, and the ability to think and respond under pressure.',
    sections: [
      {
        heading: 'Pre-Activity Preparation',
        items: [
          'Define the syllabus scope for the viva and communicate it to students at least one week prior.',
          'Prepare a question bank with easy, medium, and hard questions (at least 30\u201340 per batch).',
          'Share the rubric: conceptual clarity, depth of explanation, application ability, confidence, and response to follow-up questions.',
          'Schedule time slots (5\u201310 min per student) and post the schedule in advance.',
          'Arrange a quiet, distraction-free room. If two faculty members are available, use a panel format.',
        ],
      },
      {
        heading: 'During the Activity',
        items: [
          'Start with an easy warm-up question to settle the student\u2019s nerves.',
          'Progress from basic recall to application and then analysis-level questions.',
          'Ask follow-up \u201cwhy\u201d and \u201chow\u201d questions to test depth\u2014don\u2019t accept surface-level answers.',
          'If a student is stuck, give one hint and note whether they recover.',
          'Keep the tone professional and encouraging\u2014viva should assess, not intimidate.',
          'Score immediately after each student while the interaction is fresh.',
        ],
      },
      {
        heading: 'Post-Activity & Evaluation',
        items: [
          'Record per-student scores and brief qualitative notes.',
          'Identify common weak topics and address them in subsequent lectures or tutorials.',
          'For students who performed poorly, offer optional re-viva or extra study material.',
        ],
      },
      {
        heading: 'Best Practices',
        items: [
          'Avoid yes/no questions\u2014use open-ended questions that require explanation.',
          'Standardize difficulty: every student should get at least one easy and one hard question.',
          'If using a panel, decide beforehand who leads questioning to avoid overlap.',
        ],
      },
    ],
  },
  Lab: {
    icon: '🔬',
    title: 'Lab / Practical',
    objective: 'Evaluate hands-on skills, problem-solving ability, code/experiment quality, and understanding of underlying concepts.',
    sections: [
      {
        heading: 'Pre-Activity Preparation',
        items: [
          'Design the lab problem statement clearly\u2014include expected inputs, outputs, and constraints.',
          'Test the problem/experiment yourself to estimate realistic completion time.',
          'Ensure all systems, tools, compilers, and lab equipment are functional before the session.',
          'Share the rubric: correctness, code quality/experiment procedure, efficiency, viva/explanation, documentation.',
          'Optionally provide a starter template to avoid students wasting time on boilerplate.',
        ],
      },
      {
        heading: 'During the Activity',
        items: [
          'State the problem at the start and clarify doubts in the first 5 minutes\u2014no clarifications after that.',
          'Allow students to use documentation/man pages but NOT full solutions from the internet.',
          'Walk around and observe: check for copy-pasting, note who is genuinely coding/experimenting.',
          'Conduct a brief 2\u20133 minute viva per student while they work\u2014ask them to explain their approach.',
          'Note partial progress: a student who designed well but didn\u2019t finish deserves partial credit.',
        ],
      },
      {
        heading: 'Post-Activity & Evaluation',
        items: [
          'Collect submissions (code, reports, screenshots) before students leave the lab.',
          'Run automated test cases if applicable to verify correctness at scale.',
          'Score based on the rubric; weigh the viva component to catch students who copied.',
          'Return graded work with inline comments highlighting what could be improved.',
        ],
      },
      {
        heading: 'Best Practices',
        items: [
          'Design problems at varying difficulty: a base task all must complete + a bonus challenge.',
          'Rotate problems across batches to prevent answer sharing.',
          'Encourage students to write comments/documentation as they code\u2014not as an afterthought.',
        ],
      },
    ],
  },
  Assignment: {
    icon: '📝',
    title: 'Assignment',
    objective: 'Evaluate students\u2019 ability to independently research, solve problems, and present written work with clarity and rigor.',
    sections: [
      {
        heading: 'Pre-Activity Preparation',
        items: [
          'Design assignments that require analysis and application\u2014avoid questions with directly Google-able answers.',
          'Clearly state submission format (PDF, handwritten, code repo), page/word limits, and deadline.',
          'Share the rubric: correctness, originality, presentation/formatting, depth of analysis, references.',
          'Set a submission deadline with a clear late penalty policy (e.g., \u221210% per day).',
          'Provide reference material or recommended readings to guide students.',
        ],
      },
      {
        heading: 'During the Activity',
        items: [
          'Allow 1\u20132 weeks for completion depending on complexity.',
          'Keep a Q\u0026A window (e.g., first 3 days) for doubt clarification\u2014after that, students work independently.',
          'Remind students about academic integrity and plagiarism policies.',
          'For coding assignments, require students to include a README explaining their approach.',
        ],
      },
      {
        heading: 'Post-Activity & Evaluation',
        items: [
          'Use plagiarism detection tools for written assignments and code similarity checkers for programs.',
          'Grade using the rubric consistently\u2014if multiple evaluators, calibrate with 2\u20133 sample papers first.',
          'Return graded assignments with specific comments\u2014not just a score.',
          'Discuss common mistakes and model answers in the next class session.',
        ],
      },
      {
        heading: 'Best Practices',
        items: [
          'Vary assignment types: problem sets, case studies, mini-projects, literature reviews.',
          'Include a reflection component: ask students what they learned and what was challenging.',
          'For group assignments, require individual contribution statements.',
        ],
      },
    ],
  },
  Quiz: {
    icon: '❓',
    title: 'Quiz',
    objective: 'Quickly assess recall, conceptual understanding, and readiness across a defined syllabus portion.',
    sections: [
      {
        heading: 'Pre-Activity Preparation',
        items: [
          'Define the exact syllabus scope and communicate it at least 3\u20135 days before the quiz.',
          'Prepare the question paper: mix MCQs (for breadth), short-answer (for understanding), and 1\u20132 application questions.',
          'Ensure questions are unambiguous\u2014have a colleague review the paper if possible.',
          'Prepare a model answer key with marks distribution before the quiz.',
          'Decide duration (typically 15\u201330 min) and communicate it clearly.',
          'Arrange seating to minimize copying; prepare 2 sets if needed.',
        ],
      },
      {
        heading: 'During the Activity',
        items: [
          'Distribute papers face-down and start the timer for everyone simultaneously.',
          'No questions after the first 2 minutes\u2014all clarifications should be handled upfront.',
          'Actively invigilate: walk the rows, ensure no phones or cheat sheets.',
          'Give a 5-minute warning before time ends.',
          'Collect all papers strictly at the deadline\u2014no extra time.',
        ],
      },
      {
        heading: 'Post-Activity & Evaluation',
        items: [
          'Grade using the answer key consistently\u2014award partial marks for partially correct short answers.',
          'Return graded quizzes within one week.',
          'Discuss the answers in class: go through each question, explain the correct approach.',
          'Track score distributions to identify topics that need re-teaching.',
        ],
      },
      {
        heading: 'Best Practices',
        items: [
          'Conduct surprise quizzes occasionally to encourage continuous study habits.',
          'Use online quiz tools (Google Forms, Moodle) for instant grading of MCQ-only quizzes.',
          'Keep difficulty progressive: early quizzes easier, later quizzes more challenging.',
          'Ensure quizzes collectively cover the entire syllabus by end of semester.',
        ],
      },
    ],
  },
};

/** Renders hardcoded faculty conduction guidelines for a given activity type */
function HardcodedGuidelines({ activityType }) {
  const data = ACTIVITY_GUIDELINES[activityType];
  if (!data) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{data.icon}</span>
          <div>
            <h3 className="text-white font-bold text-lg">{data.title} — Conduction Guidelines</h3>
            <p className="text-primary-100 text-sm mt-0.5">For faculty: how to plan, conduct, and evaluate this activity</p>
          </div>
        </div>
      </div>

      {/* Objective */}
      <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
        <p className="text-sm font-semibold text-blue-900 mb-1">🎯 Objective</p>
        <p className="text-sm text-blue-800 leading-relaxed">{data.objective}</p>
      </div>

      {/* Sections */}
      <div className="px-6 py-4 space-y-5">
        {data.sections.map((section, idx) => (
          <div key={idx}>
            <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center">
                {idx + 1}
              </span>
              {section.heading}
            </h4>
            <ul className="space-y-1.5 ml-8">
              {section.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-primary-400 mt-1 shrink-0">•</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AIToolsPage() {
  const [subjects, setSubjects] = useState([]);
  const [activities, setActivities] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedActivity, setSelectedActivity] = useState('');
  const [activeTab, setActiveTab] = useState('rubrics');

  // AI Results
  const [rubricResult, setRubricResult] = useState(null);
  const [guidelinesResult, setGuidelinesResult] = useState('');
  const [insightsResult, setInsightsResult] = useState(null);
  const [reportResult, setReportResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form fields
  const [aiType, setAiType] = useState('PPT');
  const [aiTopic, setAiTopic] = useState('');

  useEffect(() => {
    api.get('/subjects').then((r) => setSubjects(r.data));
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      api.get(`/activities?subject=${selectedSubject}`).then((r) => {
        setActivities(r.data);
        if (r.data.length) setSelectedActivity(r.data[0]._id);
      });
    }
  }, [selectedSubject]);

  const tabs = [
    { id: 'rubrics', label: '✨ Rubric Generator' },
    { id: 'guidelines', label: '📋 Guidelines' },
    { id: 'insights', label: '📊 Class Insights' },
    { id: 'report', label: '📄 NAAC/NBA Report' },
  ];

  // ---- 1. Generate Rubrics ----
  const handleGenerateRubrics = async () => {
    if (!aiType || !aiTopic) return toast.error('Fill type & topic');
    setLoading(true);
    try {
      const { data } = await api.post('/ai/generate-rubrics', { activityType: aiType, topic: aiTopic });
      setRubricResult(data.rubrics);
      toast.success('Rubrics generated!');
    } catch (err) {
      toast.error('Generation failed');
    } finally {
      setLoading(false);
    }
  };

  // ---- 2. Generate Guidelines ----
  const handleGenerateGuidelines = async () => {
    if (!aiType || !aiTopic) return toast.error('Fill type & topic');
    setLoading(true);
    try {
      const { data } = await api.post('/ai/generate-guidelines', { activityType: aiType, topic: aiTopic });
      setGuidelinesResult(data.guidelines);
      toast.success('Guidelines generated!');
    } catch (err) {
      toast.error('Generation failed');
    } finally {
      setLoading(false);
    }
  };

  // ---- 3. Class Insights ----
  const handleClassInsights = async () => {
    if (!selectedActivity) return toast.error('Select an activity');
    setLoading(true);
    try {
      const { data } = await api.post('/ai/class-insights', { activityId: selectedActivity });
      setInsightsResult(data);
      toast.success('Insights generated!');
    } catch (err) {
      toast.error('Generation failed');
    } finally {
      setLoading(false);
    }
  };

  // ---- 4. NAAC Report ----
  const handleNAACReport = async () => {
    if (!selectedSubject) return toast.error('Select a subject');
    setLoading(true);
    try {
      const { data } = await api.post('/ai/naac-report', { subjectId: selectedSubject, reportType: 'NAAC' });
      setReportResult(data.report);
      toast.success('Report generated!');
    } catch (err) {
      toast.error('Generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">🤖 AI Tools</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              activeTab === t.id ? 'bg-white shadow-sm text-primary-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        {/* Rubric Generator */}
        {activeTab === 'rubrics' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Auto Rubric Generator</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">Activity Type</label>
                <select value={aiType} onChange={(e) => setAiType(e.target.value)} className="input">
                  {['PPT', 'Flip Classroom', 'GD', 'Viva', 'Lab', 'Assignment', 'Quiz'].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Topic</label>
                <input value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} className="input" placeholder="e.g. Data Structures" />
              </div>
            </div>
            <button onClick={handleGenerateRubrics} disabled={loading} className="btn-primary">
              {loading ? '⏳ Generating...' : '✨ Generate Rubrics'}
            </button>

            {rubricResult && (
              <div className="mt-6 space-y-3">
                <h3 className="font-medium text-gray-700">Generated Rubrics:</h3>
                {rubricResult.map((r, i) => (
                  <div key={i} className="border rounded-lg p-4">
                    <h4 className="font-semibold">{r.name}</h4>
                    <div className="grid grid-cols-5 gap-2 mt-2 text-xs">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <div key={s} className="bg-gray-50 p-2 rounded">
                          <span className="font-medium">Score {s}:</span> {r.criteria[`scale${s}`]}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Guidelines Generator */}
        {activeTab === 'guidelines' && (
          <div>
            {/* Activity type selector for hardcoded guidelines */}
            <h2 className="text-lg font-semibold mb-4">Activity Conduction Guidelines</h2>
            <div className="mb-4">
              <label className="label">Activity Type</label>
              <select value={aiType} onChange={(e) => setAiType(e.target.value)} className="input w-80">
                {['PPT', 'Flip Classroom', 'GD', 'Viva', 'Lab', 'Assignment', 'Quiz'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Hardcoded Guidelines */}
            <HardcodedGuidelines activityType={aiType} />

            {/* AI Topic-Specific Generator */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h2 className="text-lg font-semibold mb-1">🤖 AI Topic-Specific Guidelines</h2>
              <p className="text-sm text-gray-500 mb-4">Generate additional topic-specific guidelines using AI.</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="label">Activity Type</label>
                  <select value={aiType} onChange={(e) => setAiType(e.target.value)} className="input">
                    {['PPT', 'Flip Classroom', 'GD', 'Viva', 'Lab', 'Assignment', 'Quiz'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Topic</label>
                  <input value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} className="input" placeholder="e.g. Machine Learning" />
                </div>
              </div>
              <button onClick={handleGenerateGuidelines} disabled={loading} className="btn-primary">
                {loading ? '⏳ Generating...' : '🤖 Generate AI Guidelines'}
              </button>

              {guidelinesResult && (
                <div className="mt-6 bg-gray-50 rounded-lg p-6 prose prose-sm max-w-none
                  prose-headings:text-gray-900 prose-headings:font-bold
                  prose-h1:text-xl prose-h1:border-b prose-h1:border-gray-200 prose-h1:pb-2 prose-h1:mb-4
                  prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-2
                  prose-h3:text-base prose-h3:mt-4 prose-h3:mb-2
                  prose-p:text-gray-700 prose-p:leading-relaxed
                  prose-strong:text-gray-900
                  prose-ul:my-2 prose-li:my-0.5 prose-li:text-gray-700
                  prose-ol:my-2
                  prose-hr:my-4 prose-hr:border-gray-200
                  prose-table:border-collapse prose-th:bg-gray-100 prose-th:border prose-th:border-gray-300 prose-th:px-3 prose-th:py-1.5 prose-th:text-left prose-th:text-xs prose-th:font-semibold
                  prose-td:border prose-td:border-gray-300 prose-td:px-3 prose-td:py-1.5 prose-td:text-sm">
                  <ReactMarkdown>{guidelinesResult}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Class Insights */}
        {activeTab === 'insights' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Class Weakness Insight</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">Subject</label>
                <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="input">
                  <option value="">Select Subject</option>
                  {subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Activity</label>
                <select value={selectedActivity} onChange={(e) => setSelectedActivity(e.target.value)} className="input">
                  {activities.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
                </select>
              </div>
            </div>
            <button onClick={handleClassInsights} disabled={loading} className="btn-primary">
              {loading ? '⏳ Analyzing...' : '📊 Generate Insights'}
            </button>

            {insightsResult && (
              <div className="mt-6 space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Summary</h3>
                  <p className="text-sm text-blue-800">{insightsResult.insights}</p>
                </div>
                {insightsResult.weakAreas?.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">Weak Areas</h3>
                    {insightsResult.weakAreas.map((w, i) => (
                      <div key={i} className="flex items-center gap-4 p-3 bg-red-50 rounded-lg mb-2">
                        <div className="text-center">
                          <span className="text-xl font-bold text-red-600">{w.avgScore}</span>
                          <p className="text-xs text-red-500">/5</p>
                        </div>
                        <div>
                          <p className="font-medium">{w.rubricName}</p>
                          <p className="text-sm text-gray-600">{w.suggestion}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* NAAC/NBA Report */}
        {activeTab === 'report' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">NAAC/NBA Report Generator</h2>
            <div className="mb-4">
              <label className="label">Subject</label>
              <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="input w-80">
                <option value="">Select Subject</option>
                {subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <button onClick={handleNAACReport} disabled={loading} className="btn-primary">
              {loading ? '⏳ Generating Report...' : '📄 Generate NAAC Report'}
            </button>

            {reportResult && (
              <div className="mt-6 space-y-4">
                {['activitiesConducted', 'rubrics', 'evaluationMethod', 'scoreDistribution',
                  'observations', 'weaknessAnalysis', 'improvementActions', 'outcomeNarrative'].map((key) => (
                  reportResult.content?.[key] && (
                    <div key={key} className="border-l-4 border-primary-500 pl-4">
                      <h3 className="font-semibold capitalize text-gray-800 mb-1">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </h3>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{reportResult.content[key]}</p>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
