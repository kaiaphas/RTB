import React from 'react';
import { X, ExternalLink, Bookmark, ChevronLeft, List, Check } from 'lucide-react';

const BibleViewer = ({ plan, allPlans, progress, onToggleDay, currentDay, onClose }) => {
  if (!plan) return null;

  const [showAllPlans, setShowAllPlans] = React.useState(false);
  const isCompleted = progress.includes(plan.day_number);
  const isFuture = plan.day_number > currentDay;

  // DB의 url_code 컬럼 사용 (예: "1SA.1")
  const getUrl = (urlCode) => `https://www.bible.com/bible/88/${urlCode}.KRV`;

  if (showAllPlans) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
        <div className="bg-white w-full max-w-md h-[80vh] rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="p-8 pb-4 flex items-center justify-between border-b border-slate-100">
            <button 
              onClick={() => setShowAllPlans(false)}
              className="bg-slate-100 p-2 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-slate-800">전체 읽기 계획</h2>
            <button 
              onClick={onClose}
              className="bg-slate-100 p-2 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {allPlans.map((p) => {
              const pCompleted = progress.includes(p.day_number);
              const pIsFuture = p.day_number > currentDay;
              const pIsToday = p.day_number === currentDay;

              return (
                <div
                  key={p.day_number}
                  className={`
                    flex items-center justify-between p-4 rounded-2xl transition-all
                    ${p.day_number === plan.day_number 
                      ? 'bg-blue-50 border-2 border-blue-200' 
                      : pIsFuture
                      ? 'bg-slate-50 opacity-40 grayscale'
                      : 'bg-slate-50 border-2 border-transparent hover:bg-slate-100'}
                  `}
                >
                  <a
                    href={getUrl(p.url_code)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-black uppercase ${pIsToday ? 'text-blue-500' : 'text-slate-400'}`}>Day {p.day_number}</span>
                      {pCompleted && <Check className="w-3 h-3 text-green-500 stroke-[4]" />}
                    </div>
                    <p className={`font-bold ${pIsFuture ? 'text-slate-300' : 'text-slate-800'}`}>{p.reading_range}</p>
                  </a>
                  <button 
                    onClick={() => onToggleDay(p.day_number)}
                    disabled={pIsFuture}
                    className={`p-2 rounded-xl transition-all ${
                      pCompleted 
                      ? 'bg-green-100 text-green-600' 
                      : pIsFuture 
                      ? 'bg-slate-100 text-slate-200 cursor-not-allowed' 
                      : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    <Check className="w-5 h-5 stroke-[3]" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        <div className="relative p-8 pt-10">
          <button 
            onClick={onClose}
            className="absolute right-6 top-6 bg-slate-100 p-2 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <span className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest ${isFuture ? 'bg-slate-100 text-slate-400' : 'bg-blue-100 text-blue-600'}`}>
              Day {plan.day_number} {isFuture && '(예정)'}
            </span>
          </div>

          <h2 className="text-3xl font-black text-slate-900 mb-2 leading-tight">
            {plan.reading_range}
          </h2>
          
          <p className="text-slate-500 text-lg mb-8 leading-relaxed">
            {plan.description || "오늘의 말씀을 읽으며 은혜 충만한 시간 되세요!"}
          </p>

          <div className="grid grid-cols-1 gap-4 mb-2">
            <a 
              href={getUrl(plan.url_code)}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-between p-6 rounded-3xl transition-all shadow-xl shadow-blue-200"
            >
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-2 rounded-xl">
                  <ExternalLink className="w-6 h-6" />
                </div>
                <span className="text-lg font-bold">성경 본문 읽기</span>
              </div>
              <Bookmark className="w-6 h-6 text-white/40 group-hover:fill-white/20" />
            </a>

            <button 
              onClick={() => onToggleDay(plan.day_number)}
              disabled={isFuture}
              className={`w-full flex items-center justify-center gap-3 py-5 rounded-3xl font-bold transition-all ${
                isCompleted 
                ? 'bg-green-500 text-white shadow-lg shadow-green-100' 
                : isFuture
                ? 'bg-slate-100 text-slate-300 btn-disabled cursor-not-allowed border-2 border-dashed border-slate-200 shadow-none'
                : 'bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-200'
              }`}
            >
              <Check className={`w-6 h-6 ${isCompleted ? 'text-white' : 'text-white/40'}`} />
              {isCompleted ? '읽기 완료됨' : isFuture ? '체크할 수 없음 (예정)' : '오늘 말씀 읽기 완료'}
            </button>

            <button 
              onClick={() => setShowAllPlans(true)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-5 rounded-3xl transition-all flex items-center justify-center gap-2"
            >
              <List className="w-5 h-5" />
              전체 읽기 계획 보기
            </button>
          </div>
        </div>
        
        <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 text-center">
          <p className="text-slate-400 text-xs font-medium italic">
            "주의 말씀은 내 발의 등이요 내 길의 빛이니이다" (시 119:105)
          </p>
        </div>
      </div>
    </div>
  );
};

export default BibleViewer;
