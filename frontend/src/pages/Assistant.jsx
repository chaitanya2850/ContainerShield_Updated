import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bot, Send, ShieldAlert, Sparkles, User, Terminal, Loader2, Info, ChevronRight, RefreshCw, FileText } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { askAssistant } from '../services/chatService';
import { getAllScans } from '../services/scanService';

export default function Assistant() {
  const [searchParams] = useSearchParams();

  const initialProject = searchParams.get('project') || searchParams.get('image') || '';
  const initialQuestion = searchParams.get('q') || '';

  const [projectOrImageName, setProjectOrImageName] = useState(initialProject);
  const [questionInput, setQuestionInput] = useState(initialQuestion);

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hello! I am your local ContainerShield Security Assistant powered by Ollama. Select a project or image scan target on the right panel, and ask me questions about your Trivy vulnerabilities or Semgrep code findings.',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [scans, setScans] = useState([]);
  const [selectedScan, setSelectedScan] = useState(null);

  useEffect(() => {
    const fetchScansList = async () => {
      try {
        const data = await getAllScans();
        setScans(data || []);

        if (initialProject) {
          const match = (data || []).find((s) => s.imageName === initialProject);
          if (match) setSelectedScan(match);
        } else if (data && data.length > 0 && !projectOrImageName) {
          setProjectOrImageName(data[0].imageName);
          setSelectedScan(data[0]);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchScansList();
  }, [initialProject]);

  const handleSelectTarget = (targetName) => {
    setProjectOrImageName(targetName);
    const match = scans.find((s) => s.imageName === targetName);
    setSelectedScan(match || null);
  };

  const handleSendMessage = async (customQuestion) => {
    const qText = customQuestion || questionInput;
    if (!qText.trim()) return;

    if (!projectOrImageName.trim()) {
      setError('Please select or specify a project or image name target.');
      return;
    }

    const userMsg = {
      role: 'user',
      content: qText,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuestionInput('');
    setError(null);
    setIsLoading(true);

    try {
      const res = await askAssistant(projectOrImageName.trim(), qText.trim());
      const botMsg = {
        role: 'assistant',
        content: res.answer || 'No response returned from assistant.',
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setError(err.message || 'Failed to communicate with local Ollama LLM assistant.');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'âš ï¸ **Error:** Failed to generate answer. Ensure Ollama service is active and scan findings exist under this target name.',
          timestamp: new Date().toLocaleTimeString(),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    'What are the most critical vulnerabilities?',
    'How should I prioritize these issues?',
    'Which dependency should I upgrade first?',
    'What code fixes are recommended?',
    'Explain the highest severity Trivy finding.',
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8.5rem)] min-h-[600px]">
      {/* Left/Main: Conversation View */}
      <div className="lg:col-span-2 flex flex-col bg-white dark:bg-dark-850 border border-slate-200 dark:border-dark-700/60 rounded-xl overflow-hidden shadow-lg transition-colors">
        {/* Chat Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-dark-700/60 bg-slate-50 dark:bg-dark-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-600/20 border border-indigo-200 dark:border-indigo-500/30 rounded-lg text-indigo-600 dark:text-indigo-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                ContainerShield Assistant
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50">
                  Ollama Local LLM 
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Target: <span className="text-brand-600 dark:text-brand-400 font-semibold">{projectOrImageName || 'Unselected'}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-brand-600 text-white'
                    : msg.isError
                    ? 'bg-rose-100 text-rose-700 border border-rose-300 dark:bg-rose-900/60 dark:text-rose-300 dark:border-rose-800'
                    : 'bg-slate-100 border border-slate-200 text-indigo-600 dark:bg-dark-800 dark:border-dark-700 dark:text-indigo-400'
                }`}
              >
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-brand-600 text-white rounded-tr-none font-sans font-medium'
                    : 'bg-slate-100 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 text-slate-800 dark:text-slate-200 rounded-tl-none font-sans'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans text-xs">{msg.content}</div>
                <div className="mt-1 text-[10px] text-slate-400 font-mono text-right">{msg.timestamp}</div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-indigo-600 dark:text-indigo-400 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-100 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 text-slate-800 dark:text-slate-300 rounded-2xl rounded-tl-none px-4 py-3 text-xs space-y-2 max-w-sm">
                <div className="flex items-center gap-2 font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generating AI Response with Ollama...
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Querying local LLM based on stored Trivy and Semgrep findings for <code className="text-slate-800 dark:text-slate-200 font-semibold">{projectOrImageName}</code>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Prompt Suggestions Bar */}
        <div className="px-4 py-2 border-t border-slate-200 dark:border-dark-700/60 bg-slate-50 dark:bg-dark-900/30 flex items-center gap-2 overflow-x-auto">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          {suggestedQuestions.map((sq, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(sq)}
              className="px-2.5 py-1 bg-white dark:bg-dark-800 hover:bg-slate-100 dark:hover:bg-dark-700 text-slate-700 dark:text-slate-300 text-[11px] font-mono rounded-lg border border-slate-200 dark:border-dark-700 shrink-0 transition-colors whitespace-nowrap shadow-2xs"
            >
              {sq}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200 dark:border-dark-700/60 bg-slate-50 dark:bg-dark-900/80">
          {error && <p className="text-xs text-rose-600 dark:text-rose-400 font-mono mb-2">{error}</p>}
          {/* Response Time Notice */}
          <div className="flex items-start gap-2 mb-3 px-3 py-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50">
            <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-indigo-700 dark:text-indigo-300">
                Responses may take a little time.
              </span>{' '}
              ContainerShield uses a locally running Ollama LLM to analyze stored Trivy
              vulnerabilities and Semgrep findings. Response time depends on the size
              of the scan report, the complexity of your question, and your system's
              available resources. Please wait while the analysis is being generated.
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder={`Ask security questions for ${projectOrImageName || 'selected target'}...`}
              value={questionInput}
              onChange={(e) => setQuestionInput(e.target.value)}
              disabled={isLoading}
              className="flex-1 bg-white dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500 font-sans shadow-xs"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={Send}
              isLoading={isLoading}
              disabled={!questionInput.trim() || isLoading}
            >
              Ask AI
            </Button>
          </form>
        </div>
      </div>

      {/* Right Side: Security Context Sidebar */}
      <div className="space-y-4 flex flex-col h-full">
        <Card title="Security Target Context" subtitle="Select project or image scan to analyze">
          <div className="space-y-4 font-mono text-xs">
            <div>
              <label className="block text-[11px] uppercase text-slate-500 dark:text-slate-400 mb-1 font-semibold">
                Analyzed Target Name
              </label>
              <input
                type="text"
                value={projectOrImageName}
                onChange={(e) => handleSelectTarget(e.target.value)}
                placeholder="e.g. redis:latest or myapp:1.0"
                className="w-full bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:border-brand-500"
              />
            </div>

            {scans.length > 0 && (
              <div>
                <label className="block text-[11px] uppercase text-slate-500 dark:text-slate-400 mb-1 font-semibold">
                  Select Stored Scan Target
                </label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {scans.map((s) => {
                    const isSelected = projectOrImageName === s.imageName;
                    return (
                      <div
                        key={s.id}
                        onClick={() => handleSelectTarget(s.imageName)}
                        className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-brand-50 border-brand-300 text-brand-700 dark:bg-dark-900 dark:border-brand-500 dark:text-brand-300 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-dark-900/60 dark:border-dark-700/60 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-200">{s.imageName}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">Scan #{s.id} â€¢ {s.totalVulnerabilities} vulnerabilities</p>
                        </div>
                        {isSelected && <ChevronRight className="w-4 h-4 text-brand-600 dark:text-brand-400" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedScan && (
              <div className="p-3 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl space-y-2">
                <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold">Target Summary</span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>Critical: <span className="text-rose-600 dark:text-rose-400 font-bold">{selectedScan.critical}</span></div>
                  <div>High: <span className="text-orange-600 dark:text-orange-400 font-bold">{selectedScan.high}</span></div>
                  <div>Medium: <span className="text-amber-700 dark:text-amber-400 font-bold">{selectedScan.medium}</span></div>
                  <div>Low: <span className="text-emerald-700 dark:text-emerald-400 font-bold">{selectedScan.low}</span></div>
                </div>
              </div>
            )}

            <div className="p-3 bg-slate-50 dark:bg-dark-900/50 border border-slate-200 dark:border-dark-700/60 rounded-xl text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
              <p className="font-semibold text-slate-800 dark:text-slate-300 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Grounded AI Analysis
              </p>
              <p className="text-slate-500 dark:text-slate-400 leading-normal">
                ContainerShield AI fetches all PostgreSQL findings stored under <code className="text-indigo-700 dark:text-indigo-300 font-semibold">{projectOrImageName || 'name'}</code> and feeds them to local Ollama.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

