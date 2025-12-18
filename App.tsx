import React, { useState, useRef, useEffect } from 'react';
import { AppStep, ArticleOutline, DraftAnalysis } from './types';
import { SEOAIService } from './services/geminiService';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.SETUP);
  const [keywords, setKeywords] = useState('');
  const [country, setCountry] = useState('台灣');
  const [competitors, setCompetitors] = useState('');
  const [outline, setOutline] = useState<ArticleOutline | null>(null);
  const [analysis, setAnalysis] = useState<DraftAnalysis | null>(null);
  const [statusText, setStatusText] = useState('');
  const [progress, setProgress] = useState(0);
  const [isAnalyzingDraft, setIsAnalyzingDraft] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success'>('idle');
  
  const [liveStats, setLiveStats] = useState({
    words: 0,
    keywords: 0,
    density: 0,
    h1: 0, h2: 0, h3: 0,
    imgs: 0,
    readingTime: 0
  });

  const editorRef = useRef<HTMLDivElement>(null);

  const updateStats = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    const text = editorRef.current.innerText || '';
    const words = text.trim().length;
    const kwRegex = new RegExp(keywords, 'gi');
    const kwCount = keywords ? (text.match(kwRegex) || []).length : 0;
    const density = words > 0 ? (kwCount / words) * 100 : 0;
    
    const h1 = (html.match(/<h1/gi) || []).length;
    const h2 = (html.match(/<h2/gi) || []).length;
    const h3 = (html.match(/<h3/gi) || []).length;
    const imgs = (html.match(/<img/gi) || []).length;
    const readingTime = Math.ceil(words / 400);

    setLiveStats({ words, keywords: kwCount, density, h1, h2, h3, imgs, readingTime });
  };

  useEffect(() => {
    let interval: number | undefined;
    if (step === AppStep.ANALYZING) {
      setProgress(0);
      const messages = ["模擬基礎 SEO 邏輯...", "掃描低競爭市場...", "分析基礎排名套路...", "生成大綱建議..."];
      let msgIdx = 0;
      setStatusText(messages[0]);
      interval = window.setInterval(() => {
        setProgress(prev => {
          const next = prev + (Math.random() * 2);
          if (next > 25 && msgIdx === 0) { msgIdx = 1; setStatusText(messages[1]); }
          if (next > 55 && msgIdx === 1) { msgIdx = 2; setStatusText(messages[2]); }
          if (next > 85 && msgIdx === 3) { msgIdx = 3; setStatusText(messages[3]); }
          return next > 98 ? 98 : next;
        });
      }, 500);
    } else {
      setProgress(100);
      if (interval) clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [step]);

  const startAnalysis = async () => {
    if (!keywords || !competitors) return;
    setStep(AppStep.ANALYZING);
    try {
      const urls = competitors.split('\n').filter(u => u.trim() !== '').slice(0, 10);
      const res = await SEOAIService.analyzeCompetitors(keywords, country, urls);
      setOutline(res);
      setStep(AppStep.OUTLINE_READY);
    } catch (e) {
      console.error(e);
      alert("分析失敗，請檢查網路。");
      setStep(AppStep.SETUP);
    }
  };

  const runDraftAnalysis = async () => {
    if (!editorRef.current || !outline) return;
    setIsAnalyzingDraft(true);
    try {
      const draft = editorRef.current.innerText;
      const res = await SEOAIService.analyzeDraft(outline, draft, keywords);
      setAnalysis(res);
    } catch (e) {
      alert("分析草稿失敗。");
    } finally {
      setIsAnalyzingDraft(false);
    }
  };

  const execCommand = (cmd: string, value: string = '') => {
    document.execCommand(cmd, false, value);
    updateStats();
  };

  const copyArticleToClipboard = async () => {
    if (editorRef.current) {
      try {
        await navigator.clipboard.writeText(editorRef.current.innerText);
        setCopyStatus('success');
        setTimeout(() => setCopyStatus('idle'), 2000);
      } catch (err) {
        alert("複製失敗");
      }
    }
  };

  const renderSetup = () => (
    <div className="max-w-5xl mx-auto py-16 px-6 space-y-12">
      <div className="bg-white rounded-[3rem] shadow-2xl p-12 border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5"><i className="fas fa-tools text-9xl"></i></div>
        <div className="text-center mb-12">
          <span className="bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-xs font-black uppercase mb-4 inline-block tracking-widest">Experimental Basic Simulator</span>
          <h1 className="text-5xl font-black text-slate-900 mb-6 tracking-tighter">SEO 基礎規劃模擬：<span className="text-amber-600 underline decoration-amber-200">適合低競爭領域</span></h1>
          <p className="text-slate-500 text-lg max-w-4xl mx-auto leading-relaxed">
            基於 300+ 場 SEO 面試觀察，模擬那些「講不出大道理但有排名」的人員邏輯。透過自動化基礎套路，幫助中小企業自主完成基礎內容佈局，節省不必要的低端代寫支出。
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-8 bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <i className="fas fa-terminal text-amber-600"></i> 配置市場參數
            </h2>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase">核心關鍵詞</label>
                  <input type="text" className="w-full bg-white px-5 py-4 rounded-2xl border-2 border-transparent focus:border-amber-500 outline-none shadow-sm" value={keywords} onChange={e=>setKeywords(e.target.value)} placeholder="如：台北搬家"/>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase">目標地區</label>
                  <input type="text" className="w-full bg-white px-5 py-4 rounded-2xl border-2 border-transparent focus:border-amber-500 outline-none shadow-sm" value={country} onChange={e=>setCountry(e.target.value)} placeholder="台灣"/>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase">競爭網址 (參考對手結構)</label>
                <textarea rows={5} className="w-full bg-white px-5 py-4 rounded-2xl border-2 border-transparent focus:border-amber-500 outline-none text-sm shadow-sm" value={competitors} onChange={e=>setCompetitors(e.target.value)} placeholder="請輸入對手網址，每行一個..."/>
              </div>
              <button onClick={startAnalysis} disabled={!keywords || !competitors} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-2xl hover:bg-amber-600 transition-all disabled:bg-slate-200 flex items-center justify-center gap-3">
                <i className="fas fa-magic"></i> 生成基礎大綱
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-800 text-white p-10 rounded-[2.5rem] shadow-xl relative overflow-hidden">
               <div className="absolute -right-10 -bottom-10 opacity-10"><i className="fas fa-info-circle text-[150px]"></i></div>
               <h3 className="text-lg font-black mb-4 flex items-center gap-2"><i className="fas fa-bullhorn text-amber-300"></i> 低端 SEO 邏輯模擬</h3>
               <div className="space-y-4 text-sm text-slate-300 leading-relaxed font-medium">
                 <p>本工具模擬的是<strong>最基礎的文章大綱套路</strong>。適合那些搜尋競爭度較小、不需要複雜戰略就能排名的關鍵詞。我們幫你自動化「看對手、模仿、微調」的過程。</p>
                 <p>如果你面對的是高競爭市場，本工具的建議可能不足以達成目標。</p>
                 <ul className="space-y-2 mt-4 text-[13px] border-t border-slate-700 pt-4">
                   <li className="flex gap-2"><i className="fas fa-check text-amber-400"></i> 自動化基礎競爭對手內容拆解。</li>
                   <li className="flex gap-2"><i className="fas fa-check text-amber-400"></i> 提供適合低門檻排名的內容骨架。</li>
                 </ul>
               </div>
            </div>
            
            <div className="bg-amber-50 border border-amber-100 p-8 rounded-[2rem] space-y-3">
              <h4 className="text-amber-800 font-black text-sm flex items-center gap-2"><i className="fas fa-exclamation-triangle"></i> 注意事項</h4>
              <p className="text-amber-700 text-xs leading-relaxed">
                SEO 是動態的。本工具是基於經驗的模擬，不保證排名。<strong>嚴禁用於任何商業收費服務。</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLoading = () => (
    <div className="max-w-2xl mx-auto py-32 px-6">
      <div className="bg-white rounded-[3rem] shadow-2xl p-16 border border-slate-100 text-center space-y-8">
        <div className="relative w-32 h-32 mx-auto">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
            <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
            <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={377} strokeDashoffset={377 - (377 * progress) / 100} className="text-amber-600 transition-all duration-500" strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-black text-slate-900">{Math.round(progress)}%</span>
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">正在模擬基礎套路...</h2>
          <p className="text-slate-400 font-medium animate-pulse">{statusText}</p>
        </div>
      </div>
    </div>
  );

  const renderOutline = () => (
    <div className="max-w-6xl mx-auto py-12 px-6 space-y-10">
      <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
        <div className="bg-slate-900 p-10 text-white flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="space-y-1">
            <h2 className="text-3xl font-black tracking-tight">基礎大綱：{keywords}</h2>
            <p className="text-amber-400 font-bold text-sm">模擬邏輯：低競爭、高效率基礎套路</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setStep(AppStep.SETUP)} className="bg-slate-800 text-slate-400 px-6 py-4 rounded-2xl font-black">重新配置</button>
            <button onClick={() => setStep(AppStep.EDITOR)} className="bg-amber-500 text-white px-10 py-4 rounded-2xl font-black hover:bg-amber-400 shadow-xl transition-all">進入寫作實驗室</button>
          </div>
        </div>
        
        <div className="p-12 grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between border-b pb-6">
               <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><i className="fas fa-sitemap"></i> 文章結構建議</h3>
               <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-black">建議字數：{outline?.targetWordCount}</span>
            </div>
            {outline?.structure.map((node, i) => (
              <div key={i} className={`p-8 rounded-[2.5rem] border-2 transition-all hover:border-amber-100 ${node.level === 'H2' ? 'bg-white border-slate-100 shadow-sm' : 'ml-12 bg-slate-50 border-transparent'}`}>
                 <div className="flex items-center gap-3 mb-4">
                   <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${node.level === 'H2' ? 'bg-amber-600 text-white' : 'bg-slate-300 text-slate-600'}`}>{node.level}</span>
                   <h4 className="font-black text-slate-800 text-xl">{node.title}</h4>
                 </div>
                 <p className="text-sm text-slate-500 mb-6 leading-relaxed">{node.description}</p>
                 <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100 text-xs text-amber-900 italic relative">
                   <i className="fas fa-quote-left absolute top-4 left-4 opacity-10 text-4xl"></i>
                   <div className="pl-6">「{node.guidelines}」</div>
                 </div>
              </div>
            ))}
          </div>

          <div className="space-y-8">
            <div className="bg-slate-800 p-8 rounded-[2.5rem] shadow-xl text-white space-y-6">
              <h4 className="font-black border-b border-white/20 pb-4 flex items-center gap-2"><i className="fas fa-camera text-amber-400"></i> 視覺佈局提示</h4>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-400 uppercase">建議張數</p>
                <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-black">{outline?.imageStrategy.totalImages} 張</span>
              </div>
              <div className="space-y-4">
                {outline?.imageStrategy.placements.map((img, i) => (
                  <div key={i} className="bg-white/5 p-5 rounded-2xl border border-white/10 space-y-3">
                    <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">位置：{img.afterSection} 之後</p>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">📷 {img.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 p-8 rounded-[2.5rem] space-y-6 border border-slate-100">
               <h4 className="font-black text-slate-800 flex items-center gap-2 border-b pb-4"><i className="fas fa-lightbulb text-amber-500"></i> 基礎 FAQ 補充</h4>
               <div className="space-y-4">
                 {outline?.faqs.map((f, i) => (
                   <div key={i} className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-2">
                     <p className="font-black text-slate-800 text-xs">Q: {f.question}</p>
                     <p className="text-[11px] text-slate-500 leading-relaxed">{f.answer}</p>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEditor = () => (
    <div className="max-w-7xl mx-auto py-12 px-6">
      <style>{`
        .editor-container { min-height: 800px; padding: 4rem; outline: none; }
        .editor-container[contenteditable]:empty::before { content: attr(data-placeholder); color: #94a3b8; pointer-events: none; }
        .toolbar-btn { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 6px; transition: all 0.15s; color: #475569; }
        .toolbar-btn:hover { background: #f1f5f9; color: #0f172a; }
        .toolbar-group { display: flex; align-items: center; gap: 4px; padding: 0 12px; border-right: 1px solid #e2e8f0; }
        .toolbar-group:last-child { border-right: none; }
      `}</style>
      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
            <div className="bg-white/90 backdrop-blur-md border-b p-4 flex flex-wrap items-center gap-2 sticky top-0 z-50">
               <div className="toolbar-group">
                 <select onChange={(e) => execCommand('formatBlock', e.target.value)} className="bg-slate-50 text-xs font-bold px-2 py-1 rounded outline-none border">
                   <option value="P">內文 (P)</option>
                   <option value="H1">主標題 (H1)</option>
                   <option value="H2">副標題 (H2)</option>
                   <option value="H3">小標題 (H3)</option>
                 </select>
               </div>
               <div className="toolbar-group">
                 <button onClick={() => execCommand('bold')} className="toolbar-btn"><i className="fas fa-bold"></i></button>
                 <button onClick={() => execCommand('italic')} className="toolbar-btn"><i className="fas fa-italic"></i></button>
               </div>
               <div className="toolbar-group">
                 <button onClick={() => execCommand('insertUnorderedList')} className="toolbar-btn"><i className="fas fa-list-ul"></i></button>
               </div>
               <div className="flex-1"></div>
               <div className="flex gap-2">
                 <button onClick={runDraftAnalysis} disabled={isAnalyzingDraft} className="px-6 py-2 bg-amber-600 text-white rounded-xl text-xs font-black shadow-lg hover:bg-amber-700 disabled:opacity-50">
                   <i className={`fas ${isAnalyzingDraft ? 'fa-spinner fa-spin' : 'fa-check-double'} mr-2`}></i>
                   {isAnalyzingDraft ? '分析中...' : '提交基礎分析'}
                 </button>
                 <button onClick={copyArticleToClipboard} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-black shadow-lg">複製</button>
               </div>
            </div>
            <div ref={editorRef} contentEditable onInput={updateStats} className="editor-container prose prose-slate max-w-none" data-placeholder="在此根據模擬大綱開始撰寫..."/>
          </div>
        </div>

        <div className="space-y-6 self-start sticky top-6">
          {analysis && (
            <div className="bg-slate-800 p-8 rounded-[2.5rem] shadow-2xl text-white space-y-6">
               <div className="text-center">
                 <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">基礎契合得分</p>
                 <h4 className="text-6xl font-black text-white my-2">{analysis.score}</h4>
               </div>
               <div className="space-y-5">
                 <div>
                   <h5 className="text-[11px] font-black text-amber-300 uppercase mb-2 border-b border-white/10 pb-1">缺少的基本元素</h5>
                   <ul className="text-xs space-y-2">
                     {analysis.missingSections.map((s, i) => <li key={i} className="flex gap-2 leading-relaxed"><i className="fas fa-times-circle text-amber-500 mt-1"></i> {s}</li>)}
                   </ul>
                 </div>
                 <div>
                   <h5 className="text-[11px] font-black text-amber-300 uppercase mb-2 border-b border-white/10 pb-1">優化建議</h5>
                   <ul className="text-xs space-y-3">
                     {analysis.suggestions.slice(0, 3).map((s, i) => <li key={i} className="bg-white/10 p-3 rounded-xl leading-relaxed">{s}</li>)}
                   </ul>
                 </div>
               </div>
            </div>
          )}

          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6">
            <h3 className="text-lg font-black text-slate-800 text-center border-b pb-4">即時數據看板</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[9px] font-black text-slate-400">總字數</p>
                  <p className="text-xl font-black text-slate-800">{liveStats.words}</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-2xl">
                  <p className="text-[9px] font-black text-amber-500">閱讀 (分)</p>
                  <p className="text-xl font-black text-amber-600">{liveStats.readingTime}</p>
                </div>
              </div>
              <div className="p-4 bg-slate-900 rounded-3xl text-white">
                 <div className="flex justify-between items-center mb-2">
                   <p className="text-[10px] font-black text-slate-400 uppercase">關鍵詞密度</p>
                   <span className="text-xs font-black text-amber-400">{liveStats.density.toFixed(2)}%</span>
                 </div>
                 <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                   <div className="h-full bg-amber-500" style={{ width: `${Math.min(100, liveStats.density * 20)}%` }}></div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 font-sans">
      <main className="flex-1">
        {step === AppStep.SETUP && renderSetup()}
        {step === AppStep.ANALYZING && renderLoading()}
        {step === AppStep.OUTLINE_READY && renderOutline()}
        {step === AppStep.EDITOR && renderEditor()}
      </main>
      <footer className="bg-white border-t border-slate-100 py-16 px-6 mt-20">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-start">
          <div className="space-y-6">
            <h5 className="font-black text-slate-800 uppercase tracking-widest text-xs border-l-4 border-amber-600 pl-3">專案宣言與免責聲明</h5>
            <div className="space-y-4 text-[12px] text-slate-500 leading-relaxed">
              <p>本工具模擬的是<strong>低端但有效</strong>的 SEO 文章大綱邏輯。這些邏輯是基於 300 多位 SEO 人員面試經驗提煉而來，特別是那些「技術說不清，但排名就是有」的基礎操作模型。</p>
              <p>它並不代表 SEO 的全部，高端戰略需要更深的邏輯。本工具旨在打破基礎內容代寫的資訊不對稱。專案開源免費，嚴禁用於商業營利。</p>
              <p>發文文章前確保你製作的文章符合最新的SEO規範。</p>
            </div>
          </div>
          <div className="md:text-right space-y-6">
            <div className="flex flex-col md:items-end gap-3">
              <span className="text-sm font-black text-slate-800">發起人：AK (SEO 模擬者)</span>
              <div className="flex gap-4">
                <a href="https://www.threads.net/@darkseoking" target="_blank" rel="noopener noreferrer" className="text-xs font-black text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-all">
                  <i className="fab fa-threads text-lg"></i> Threads 交流
                </a>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">© 2025 AK Lab. 致力於低門檻 SEO 教育。</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
