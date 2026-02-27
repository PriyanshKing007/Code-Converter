import { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { ArrowRightLeft, Copy, Check, Sparkles, Loader2, Code2, Github } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { motion, AnimatePresence } from 'motion/react';

const LANGUAGES = [
  'Auto-Detect',
  'JavaScript',
  'TypeScript',
  'Python',
  'Java',
  'C++',
  'C#',
  'Go',
  'Rust',
  'Swift',
  'Kotlin',
  'Ruby',
  'PHP',
  'SQL',
  'HTML',
  'CSS',
  'Bash',
];

const TARGET_LANGUAGES = LANGUAGES.filter(l => l !== 'Auto-Detect');

export default function App() {
  const [sourceCode, setSourceCode] = useState('');
  const [targetCode, setTargetCode] = useState('');
  const [sourceLang, setSourceLang] = useState('Auto-Detect');
  const [targetLang, setTargetLang] = useState('Python');
  const [isConverting, setIsConverting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConvert = async () => {
    if (!sourceCode.trim()) {
      setError('Please enter some code to convert.');
      return;
    }

    setIsConverting(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `You are an expert programmer. Convert the following code from ${sourceLang === 'Auto-Detect' ? 'its original language' : sourceLang} to ${targetLang}. 
      
CRITICAL INSTRUCTIONS:
1. Provide ONLY the raw converted code.
2. DO NOT wrap the code in markdown code blocks (e.g., no \`\`\`python or \`\`\`).
3. DO NOT include any explanations, greetings, or conversational text.
4. Preserve the original logic and structure as much as possible, adapting it idiomatically to the target language.

Source Code:
${sourceCode}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
          temperature: 0.1,
        }
      });

      let result = response.text || '';
      
      // Fallback cleanup just in case the model ignores instructions and uses markdown blocks
      if (result.startsWith('\`\`\`')) {
        const lines = result.split('\n');
        if (lines[0].startsWith('\`\`\`')) lines.shift();
        if (lines[lines.length - 1].startsWith('\`\`\`')) lines.pop();
        result = lines.join('\n');
      }

      setTargetCode(result.trim());
    } catch (err: any) {
      console.error('Conversion error:', err);
      setError(err.message || 'An error occurred during conversion.');
    } finally {
      setIsConverting(false);
    }
  };

  const handleCopy = async () => {
    if (!targetCode) return;
    try {
      await navigator.clipboard.writeText(targetCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleSwap = () => {
    if (sourceLang !== 'Auto-Detect') {
      const tempLang = sourceLang;
      setSourceLang(targetLang);
      setTargetLang(tempLang);
    } else {
      setSourceLang(targetLang);
      setTargetLang('JavaScript'); // Default fallback when swapping from Auto-Detect
    }
    setSourceCode(targetCode);
    setTargetCode('');
  };

  const getMonacoLanguage = (lang: string) => {
    switch (lang) {
      case 'Auto-Detect': return 'javascript';
      case 'C++': return 'cpp';
      case 'C#': return 'csharp';
      case 'HTML': return 'html';
      case 'CSS': return 'css';
      case 'Bash': return 'shell';
      default: return lang.toLowerCase();
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-100 font-sans selection:bg-violet-500/30">
      {/* Header */}
      <header className="border-b border-zinc-800/50 bg-[#0A0A0A] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Code<span className="text-zinc-500">Converter</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="text-zinc-400 hover:text-zinc-100 transition-colors">
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-zinc-900/50 p-2 rounded-2xl border border-zinc-800/50">
          <div className="flex-1 w-full flex items-center gap-2">
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all appearance-none cursor-pointer"
            >
              {LANGUAGES.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSwap}
            className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-all active:scale-95"
            title="Swap languages"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>

          <div className="flex-1 w-full flex items-center gap-2">
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all appearance-none cursor-pointer"
            >
              {TARGET_LANGUAGES.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleConvert}
            disabled={isConverting || !sourceCode.trim()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-zinc-100 hover:bg-white text-zinc-900 px-6 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {isConverting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Converting...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Convert</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
            {error}
          </motion.div>
        )}

        {/* Editor Grid */}
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 lg:h-[calc(100vh-280px)] lg:min-h-[500px]">
          {/* Source Editor */}
          <div className="flex flex-col rounded-2xl border border-zinc-800/50 bg-[#18181B] overflow-hidden shadow-xl shadow-black/20 h-[400px] lg:h-auto">
            <div className="h-12 border-b border-zinc-800/50 bg-zinc-900/50 flex items-center px-4 justify-between">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Source Code</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-500">{sourceLang}</span>
                {sourceCode && (
                  <button
                    onClick={() => setSourceCode('')}
                    className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 relative bg-[#1E1E1E]">
              {!sourceCode && (
                <div className="absolute inset-0 p-4 text-zinc-500 font-mono text-sm pointer-events-none z-10" style={{ top: '2px', left: '16px' }}>
                  // Paste your code here...
                </div>
              )}
              <Editor
                height="100%"
                language={getMonacoLanguage(sourceLang)}
                theme="vs-dark"
                value={sourceCode}
                onChange={(value) => setSourceCode(value || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 15,
                  fontFamily: "'JetBrains Mono', monospace",
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  padding: { top: 16, bottom: 16 },
                  smoothScrolling: true,
                  cursorBlinking: "smooth",
                  scrollbar: {
                    alwaysConsumeMouseWheel: false,
                  },
                }}
              />
            </div>
            <div className="h-8 border-t border-zinc-800/50 bg-zinc-900/30 flex items-center px-4 justify-end">
              <span className="text-[10px] text-zinc-500 font-mono">{sourceCode.length} chars</span>
            </div>
          </div>

          {/* Target Viewer */}
          <div className="flex flex-col rounded-2xl border border-zinc-800/50 bg-[#18181B] overflow-hidden shadow-xl shadow-black/20 relative group h-[400px] lg:h-auto">
            <div className="h-12 border-b border-zinc-800/50 bg-zinc-900/50 flex items-center px-4 justify-between">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Converted Code</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-500">{targetLang}</span>
                <button
                  onClick={handleCopy}
                  disabled={!targetCode}
                  className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <div className="flex-1 relative bg-[#1E1E1E]">
              {targetCode ? (
                <Editor
                  height="100%"
                  language={getMonacoLanguage(targetLang)}
                  theme="vs-dark"
                  value={targetCode}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 15,
                    fontFamily: "'JetBrains Mono', monospace",
                    wordWrap: 'on',
                    scrollBeyondLastLine: false,
                    padding: { top: 16, bottom: 16 },
                    smoothScrolling: true,
                    scrollbar: {
                      alwaysConsumeMouseWheel: false,
                    },
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-zinc-500 font-mono text-sm">
                  {isConverting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Converting...</span>
                    </div>
                  ) : (
                    'Converted code will appear here...'
                  )}
                </div>
              )}
            </div>
            <div className="h-8 border-t border-zinc-800/50 bg-zinc-900/30 flex items-center px-4 justify-end">
              <span className="text-[10px] text-zinc-500 font-mono">{targetCode.length} chars</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
