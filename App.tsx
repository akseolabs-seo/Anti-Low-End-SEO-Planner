
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
      const messages = ["正在掃描市場...", "分析競爭對手...", "提取戰略關鍵點...", "構建內容大綱..."];
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
        <div className="absolute top-0 right-0 p-8 opacity-5"><i className="fas fa-chess-knight text-9xl"></i></div>
        <div className="text-center mb-12">
          <span className="bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-black uppercase mb-4 inline-block tracking-widest">Experimental Open Source Project</span>
          <h1 className="text-5xl font-black text-slate-900 mb-6 tracking-tighter">SEO 內容規劃師：<span className="text-indigo-600 underline decoration-indigo-200">消除低端 SEO 計畫</span></h1>
          <p className="text-slate-500 text-lg max-w-4xl mx-auto leading-relaxed">
            這不是為了打擊所有 SEO 從業者，而是為了<strong>回歸專業</strong>。透過與 300 多位 SEO 專家面談所得出的邏輯，我們幫助中小企業主自主完成內容規劃，從而能更精確地辨別服務品質，避免將預算浪費在無效的低端 SEO 上。
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-8 bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <i className="fas fa-terminal text-indigo-600"></i> 配置市場參數
            </h2>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase">核心關鍵詞</label>
                  <input type="text" className="w-full bg-white px-5 py-4 rounded-2xl border-2 border-transparent focus:border-indigo-500 outline-none shadow-sm" value={keywords} onChange={e=>setKeywords(e.target.value)} placeholder="如：台北搬家"/>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase">目標地區</label>
                  <input type="text" className="w-full bg-white px-5 py-4 rounded-2xl border-2 border-transparent focus:border-indigo-500 outline-none shadow-sm" value={country} onChange={e=>setCountry(e.target.value)} placeholder="台灣"/>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase">競爭網址 (前三名或標竿網站)</label>
                <textarea rows={5} className="w-full bg-white px-5 py-4 rounded-2xl border-2 border-transparent focus:border-indigo-500 outline-none text-sm shadow-sm" value={competitors} onChange={e=>setCompetitors(e.target.value)} placeholder="請輸入對手網址，每行一個..."/>
              </div>
              <button onClick={startAnalysis} disabled={!keywords || !competitors} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-2xl hover:bg-indigo-600 transition-all disabled:bg-slate-200 flex items-center justify-center gap-3">
                <i className="fas fa-bolt"></i> 生成戰略藍圖
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-indigo-900 text-white p-10 rounded-[2.5rem] shadow-xl relative overflow-hidden">
               <div className="absolute -right-10 -bottom-10 opacity-10"><i className="fas fa-shield-alt text-[150px]"></i></div>
               <h3 className="text-lg font-black mb-4 flex items-center gap-2"><i className="fas fa-bullhorn text-indigo-300"></i> 計畫宣言：讓專業回歸專業</h3>
               <div className="space-y-4 text-sm text-indigo-100 leading-relaxed font-medium">
                 <p>本專案的核心在於<strong>資訊對稱</strong>。中小企業主透過本工具自行規劃低競爭領域的內容，不僅能節省初期開支，更能在未來需要進階 SEO 服務時，具備足夠的辨識能力，挑選出真正有能力的專家。</p>
                 <p>本計畫為<strong>實驗性質、開源免費</strong>，禁止任何營利行為。</p>
                 <ul className="space-y-2 mt-4 text-[13px] border-t border-indigo-800 pt-4">
                   <li className="flex gap-2"><i className="fas fa-check text-emerald-400"></i> 整合 300+ 位 SEO 專家面談的核心邏輯。</li>
                   <li className="flex gap-2"><i className="fas fa-check text-emerald-400"></i> 專注於中小企業主與讀者的價值連結。</li>
                 </ul>
               </div>
            </div>
            
            <div className="bg-amber-50 border border-amber-100 p-8 rounded-[2rem] space-y-3">
              <h4 className="text-amber-800 font-black text-sm flex items-center gap-2"><i className="fas fa-exclamation-triangle"></i> 發布前必讀</h4>
              <p className="text-amber-700 text-xs leading-relaxed">
                SEO 是一門持續演進的科學。本藍圖僅為當前數據的最佳推論。發布前請務必自行根據最新的 Google 政策判斷。<strong>我們不鼓勵為了排名而發布垃圾內容。</strong>
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
            <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={377} strokeDashoffset={377 - (377 * progress) / 100} className="text-indigo-600 transition-all duration-500" strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-black text-slate-900">{Math.round(progress)}%</span>
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">正在解構對手戰術...</h2>
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
            <h2 className="text-3xl font-black tracking-tight">戰略藍圖：{keywords}</h2>
            <p className="text-indigo-400 font-bold text-sm">數據來源：300+ 專家面談邏輯模型</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setStep(AppStep.SETUP)} className="bg-slate-800 text-slate-400 px-6 py-4 rounded-2xl font-black">重新配置</button>
            <button onClick={() => setStep(AppStep.EDITOR)} className="bg-indigo-500 text-white px-10 py-4 rounded-2xl font-black hover:bg-indigo-400 shadow-xl transition-all">進入寫作實驗室</button>
          </div>
        </div>
        
        <div className="p-12 grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between border-b pb-6">
               <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><i className="fas fa-sitemap"></i> 文章結構建議</h3>
               <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-black">建議字數：{outline?.targetWordCount}</span>
            </div>
            {outline?.structure.map((node, i) => (
              <div key={i} className={`p-8 rounded-[2.5rem] border-2 transition-all hover:border-indigo-100 ${node.level === 'H2' ? 'bg-white border-slate-100 shadow-sm' : 'ml-12 bg-slate-50 border-transparent'}`}>
                 <div className="flex items-center gap-3 mb-4">
                   <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${node.level === 'H2' ? 'bg-indigo-600 text-white' : 'bg-slate-300 text-slate-600'}`}>{node.level}</span>
                   <h4 className="font-black text-slate-800 text-xl">{node.title}</h4>
                 </div>
                 <p className="text-sm text-slate-500 mb-6 leading-relaxed">{node.description}</p>
                 <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 text-xs text-indigo-900 italic relative">
                   <i className="fas fa-quote-left absolute top-4 left-4 opacity-10 text-4xl"></i>
                   <div className="pl-6">「{node.guidelines}」</div>
                 </div>
              </div>
            ))}
          </div>

          <div className="space-y-8">
            <div className="bg-indigo-900 p-8 rounded-[2.5rem] shadow-xl text-white space-y-6">
              <h4 className="font-black border-b border-white/20 pb-4 flex items-center gap-2"><i className="fas fa-camera-retro text-indigo-400"></i> 視覺佈局策略</h4>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-indigo-300 uppercase">總建議張數</p>
                <span className="bg-indigo-500 text-white px-3 py-1 rounded-full text-xs font-black">{outline?.imageStrategy.totalImages} 張</span>
              </div>
              <div className="space-y-4">
                {outline?.imageStrategy.placements.map((img, i) => (
                  <div key={i} className="bg-white/5 p-5 rounded-2xl border border-white/10 space-y-3 hover:bg-white/10 transition-all">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">位置：{img.afterSection} 之後</p>
                    <p className="text-xs text-slate-200 leading-relaxed font-medium">📷 {img.description}</p>
                    <div className="p-3 bg-black/40 rounded-xl text-[9px] font-mono text-slate-400 break-words leading-normal">
                      <span className="text-indigo-300 block mb-1 font-black">AI 繪圖提示詞：</span>
                      {img.aiPrompt}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 p-8 rounded-[2.5rem] space-y-6 border border-slate-100">
               <h4 className="font-black text-slate-800 flex items-center gap-2 border-b pb-4"><i className="fas fa-lightbulb text-indigo-500"></i> 權威 FAQ 補充</h4>
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
        /* CSS for contentEditable placeholder */
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
                 <button onClick={runDraftAnalysis} disabled={isAnalyzingDraft} className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-lg hover:bg-indigo-700 disabled:opacity-50">
                   <i className={`fas ${isAnalyzingDraft ? 'fa-spinner fa-spin' : 'fa-vial'} mr-2`}></i>
                   {isAnalyzingDraft ? '深度診斷中...' : '提交草稿分析'}
                 </button>
                 <button onClick={copyArticleToClipboard} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-black shadow-lg">複製</button>
               </div>
            </div>
            {/* Fix: changed 'placeholder' to 'data-placeholder' for TypeScript compatibility on a div element */}
            <div ref={editorRef} contentEditable onInput={updateStats} className="editor-container prose prose-indigo max-w-none" data-placeholder="在此根據藍圖開始撰寫內容..."/>
          </div>
        </div>

        <div className="space-y-6 self-start sticky top-6">
          {analysis && (
            <div className="bg-emerald-900 p-8 rounded-[2.5rem] shadow-2xl text-white space-y-6">
               <div className="text-center">
                 <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">藍圖契合度得分</p>
                 <h4 className="text-6xl font-black text-white my-2">{analysis.score}</h4>
               </div>
               <div className="space-y-5">
                 <div>
                   <h5 className="text-[11px] font-black text-emerald-300 uppercase mb-2 border-b border-white/10 pb-1">缺失內容區塊</h5>
                   <ul className="text-xs space-y-2">
                     {analysis.missingSections.map((s, i) => <li key={i} className="flex gap-2 leading-relaxed"><i className="fas fa-times-circle text-red-400 mt-1"></i> {s}</li>)}
                   </ul>
                 </div>
                 <div>
                   <h5 className="text-[11px] font-black text-emerald-300 uppercase mb-2 border-b border-white/10 pb-1">優化具體行動</h5>
                   <ul className="text-xs space-y-3">
                     {analysis.suggestions.slice(0, 3).map((s, i) => <li key={i} className="bg-white/10 p-3 rounded-xl leading-relaxed">{s}</li>)}
                   </ul>
                 </div>
               </div>
            </div>
          )}

          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6">
            <h3 className="text-lg font-black text-slate-800 text-center border-b pb-4">即時 SEO 儀表板</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[9px] font-black text-slate-400">總字數</p>
                  <p className="text-xl font-black text-slate-800">{liveStats.words}</p>
                </div>
                <div className="p-4 bg-indigo-50 rounded-2xl">
                  <p className="text-[9px] font-black text-indigo-500">閱讀 (分)</p>
                  <p className="text-xl font-black text-indigo-600">{liveStats.readingTime}</p>
                </div>
              </div>
              <div className="p-4 bg-slate-900 rounded-3xl text-white">
                 <div className="flex justify-between items-center mb-2">
                   <p className="text-[10px] font-black text-slate-400 uppercase">關鍵詞密度</p>
                   <span className="text-xs font-black text-indigo-400">{liveStats.density.toFixed(2)}%</span>
                 </div>
                 <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                   <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, liveStats.density * 20)}%` }}></div>
                 </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                 <div className="p-2 border rounded-xl"><p className="text-[8px] text-slate-400 uppercase">H1</p><p className="font-black">{liveStats.h1}</p></div>
                 <div className="p-2 border rounded-xl"><p className="text-[8px] text-slate-400 uppercase">H2</p><p className="font-black">{liveStats.h2}</p></div>
                 <div className="p-2 border rounded-xl"><p className="text-[8px] text-slate-400 uppercase">Img</p><p className="font-black">{liveStats.imgs}</p></div>
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
            <h5 className="font-black text-slate-800 uppercase tracking-widest text-xs border-l-4 border-indigo-600 pl-3">專案核心理念與免責聲明</h5>
            <div className="space-y-4 text-[12px] text-slate-500 leading-relaxed">
              <p>本計畫為<strong>「消除低端 SEO 計畫」</strong>的一環。我們並非針對所有 SEO 專家，而是希望掃除那些濫竽充數、利用資訊不對稱來收割中小企業預算的劣質服務。我們堅信，透過教育與工具，讓業主掌握基礎內容規劃，能讓市場資源重新流向真正具備專業技術與策略思維的頂尖 SEO 團隊。</p>
              <p>本工具基於 300 多位專業人士的深度訪談數據。發布內容前，請務必根據最新規則校對。專案開源免費，嚴禁用於商業營利。</p>
            </div>
          </div>
          <div className="md:text-right space-y-6">
            <div className="flex flex-col md:items-end gap-3">
              <span className="text-sm font-black text-slate-800">專案發起人：AK (SEO 大師計畫)</span>
              <div className="flex gap-4">
                <a href="https://www.threads.net/@darkseoking" target="_blank" rel="noopener noreferrer" className="text-xs font-black text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-all">
                  <i className="fab fa-threads text-lg"></i> 加入討論 (Threads)
                </a>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">© 2025 AK SEO Lab. 致力於內容民主化與消除資訊不對稱。</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
