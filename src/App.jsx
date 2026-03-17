import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Login from './Login';
import BibleViewer from './BibleViewer';
import {
  BookOpen,
  ChevronRight,
  LogOut,
  Calendar as CalendarIcon,
  Check,
  LayoutDashboard,
  User as UserIcon,
  Home,
  Users,
  Lock,
  Loader2
} from 'lucide-react';

function App() {
  const [session, setSession] = useState(null);
  const [plans, setPlans] = useState([]);
  const [progress, setProgress] = useState([]);
  const [allUserProgress, setAllUserProgress] = useState([]); // 모든 사용자 진도 데이터
  const [loading, setLoading] = useState(true);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home'); // 'home' or 'status'
  const [isRecovering, setIsRecovering] = useState(false); // 비밀번호 재설정(복구) 모드 여부
  const [newPassword, setNewPassword] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovering(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session && !isRecovering) {
      fetchData();
    }
  }, [session, isRecovering]);

  const fetchData = async () => {
    setLoading(true);

    // 1. 사용자 레코드 존재 확인 및 보완/동기화 (public.users)
    const { data: userData } = await supabase
      .from('users')
      .select('nickname')
      .eq('id', session.user.id)
      .single();

    const currentMetadataNickname = session.user.user_metadata?.nickname || session.user.email.split('@')[0];

    if (!userData) {
      // 레코드가 없으면 생성
      await supabase.from('users').insert({
        id: session.user.id,
        nickname: currentMetadataNickname
      });
    } else if (userData.nickname !== currentMetadataNickname) {
      // 레코드는 있으나 이름이 다르면(예: 이전의 이메일 아이디인 경우) 업데이트
      await supabase.from('users').update({ nickname: currentMetadataNickname }).eq('id', session.user.id);
    }

    // 2. 데이터 가져오기 (비동기 병렬 처리)
    const [plansRes, progressRes, allProgressRes] = await Promise.all([
      supabase.from('reading_plans').select('*').order('day_number', { ascending: true }),
      supabase.from('user_progress').select('day_number').eq('user_id', session.user.id),
      supabase.from('user_progress').select('user_id, users(nickname), day_number')
    ]);

    if (plansRes.data) setPlans(plansRes.data);
    if (progressRes.data) setProgress(progressRes.data.map(p => p.day_number));
    if (allProgressRes.data) setAllUserProgress(allProgressRes.data);

    setLoading(false);
  };

  const getTodayDayNumber = () => {
    const startDate = new Date('2026-03-16');
    const today = new Date();
    startDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Math.min(Math.max(diffDays, 1), 100);
  };

  const currentDay = getTodayDayNumber();
  const processingRef = React.useRef(new Set());

  const toggleDay = async (dayNumber) => {
    if (dayNumber > currentDay) {
      alert('미래는 체크할 수 없어요. 해당 날짜에 완료해 주세요! 😊');
      return;
    }

    if (processingRef.current.has(dayNumber)) return;
    processingRef.current.add(dayNumber);

    try {
      if (progress.includes(dayNumber)) {
        const { error } = await supabase
          .from('user_progress')
          .delete()
          .eq('user_id', session.user.id)
          .eq('day_number', dayNumber);
        if (!error) setProgress(prev => prev.filter(d => d !== dayNumber));
      } else {
        const { error } = await supabase
          .from('user_progress')
          .insert({ user_id: session.user.id, day_number: dayNumber });

        if (!error) {
          setProgress(prev => [...new Set([...prev, dayNumber])]);
        } else if (error.code === '23505') {
          if (!progress.includes(dayNumber)) {
            setProgress(prev => [...new Set([...prev, dayNumber])]);
          }
        }
      }
      // 데이터 갱신 (전체 현황 업데이트를 위해)
      const { data } = await supabase.from('user_progress').select('user_id, users(nickname), day_number');
      if (data) setAllUserProgress(data);
    } finally {
      processingRef.current.delete(dayNumber);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setUpdating(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      alert('비밀번호 변경 실패: ' + error.message);
    } else {
      alert('비밀번호가 성공적으로 변경되었습니다!');
      setIsRecovering(false);
      setNewPassword('');
    }
    setUpdating(false);
  };

  if (isRecovering) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="text-center">
            <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200">
              <Lock className="text-white w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">새 비밀번호 설정</h1>
            <p className="text-slate-400 mt-2 font-medium">안전한 비밀번호를 새로 설정해 주세요.</p>
          </div>
          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="password"
                placeholder="새 비밀번호 입력"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition-all outline-none font-bold"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={updating}
              className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-2xl transition-all shadow-xl active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {updating ? <Loader2 className="animate-spin" /> : '비밀번호 업데이트'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!session) return <Login />;
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-16 w-16 bg-blue-600 rounded-3xl mb-4 shadow-xl shadow-blue-100 flex items-center justify-center">
          <BookOpen className="text-white w-8 h-8" />
        </div>
        <p className="text-slate-400 font-bold">말씀을 불러오는 중...</p>
      </div>
    </div>
  );

  const completedCount = progress.length;

  // 전체 현황 통계 계산
  const stats = allUserProgress.reduce((acc, curr) => {
    const userId = curr.user_id;
    const name = curr.users?.nickname || '익명';
    if (!acc[userId]) acc[userId] = { name, count: 0 };
    acc[userId].count += 1;
    return acc;
  }, {});

  const sortedStats = Object.values(stats).sort((a, b) => b.count - a.count);

  return (
    <div className="min-h-screen bg-slate-50 pb-36">
      {/* [상단 헤더] */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-5 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <BookOpen className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            {activeTab === 'home' ? `${session.user.user_metadata?.nickname || '나'}의 읽기` : '읽기 현황'}
          </h1>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="bg-slate-50 p-2 rounded-xl text-slate-400 hover:text-red-500 transition-colors border border-slate-100">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <main className="p-6 max-w-md mx-auto space-y-8 animate-in fade-in duration-500">
        {activeTab === 'home' ? (
          <>
            {/* [진도율 섹션] */}
            <section className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200/50 border border-white">
              <div className="justify-between flex items-end mb-6">
                <div>
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">진행율</p>
                  <h2 className="text-4xl font-black text-slate-900">{completedCount}%</h2>
                </div>
                <div className="bg-blue-50 text-blue-600 font-black text-sm px-4 py-2 rounded-2xl">
                  {completedCount}일 완료
                </div>
              </div>
              <div className="w-full bg-slate-100 h-5 rounded-full overflow-hidden p-1">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-1000 ease-out shadow-lg shadow-blue-200"
                  style={{ width: `${completedCount}%` }}
                ></div>
              </div>
              <div className="mt-6 flex items-center gap-2 text-slate-500 font-bold text-sm">
                <span>🚢 100일 중 {currentDay}일째 순항 중!</span>
              </div>
            </section>

            {/* [달력 섹션] */}
            <section className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200/50 border border-white">
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-slate-100 p-2 rounded-xl">
                  <CalendarIcon className="w-5 h-5 text-slate-600" />
                </div>
                <h3 className="font-black text-slate-900 text-lg">100일 성경 읽기</h3>
              </div>

              <div className="grid grid-cols-5 gap-4">
                {plans.map((plan) => {
                  const isCompleted = progress.includes(plan.day_number);
                  const isToday = plan.day_number === currentDay;
                  const isFuture = plan.day_number > currentDay;
                  const isPast = plan.day_number < currentDay;

                  return (
                    <button
                      key={plan.day_number}
                      onClick={() => toggleDay(plan.day_number)}
                      className={`
                        relative aspect-square rounded-2xl flex items-center justify-center text-sm font-black transition-all active:scale-90
                        ${isCompleted
                          ? 'bg-green-500 text-white shadow-xl shadow-green-100 border-2 border-green-400'
                          : isToday
                            ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 ring-8 ring-blue-50'
                            : isFuture
                              ? 'bg-slate-50 text-slate-200 border-2 border-transparent opacity-40'
                              : 'bg-slate-100 text-slate-400 border-2 border-transparent'
                        }
                      `}
                    >
                      {isCompleted ? <Check className="w-5 h-5 stroke-[4]" /> : plan.day_number}
                      {isPast && !isCompleted && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full border-2 border-white"></span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="mt-6 text-xs text-slate-400 font-bold text-center">
                * 미래의 날짜는 미리 체크할 수 없습니다. (읽기는 가능)
              </p>
            </section>
          </>
        ) : (
          /* [현황 대시보드 섹션] */
          <section className="space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200/50 border border-white">
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-blue-100 p-2 rounded-xl">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-black text-slate-900 text-lg">읽기 현황</h3>
              </div>

              <div className="space-y-6">
                {sortedStats.length > 0 ? sortedStats.map((u, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <span className="font-black text-slate-800 flex items-center gap-2">
                        {i < 3 && <span className="text-xl">{['🥇', '🥈', '🥉'][i]}</span>}
                        {u.name}
                      </span>
                      <span className="text-blue-600 font-black">{u.count}%</span>
                    </div>
                    <div className="w-full bg-slate-50 h-4 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${i === 0 ? 'bg-blue-600' : 'bg-slate-300'}`}
                        style={{ width: `${u.count}%` }}
                      ></div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-12">
                    <p className="text-slate-300 font-bold">아직 활동 중인 인원이 없습니다.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-600 rounded-[2.5rem] p-8 shadow-2xl shadow-blue-200 text-white">
              <h4 className="font-black text-xl mb-2">함께 읽는 힘! 🔥</h4>
              <p className="opacity-80 font-bold leading-relaxed">
                현재 {sortedStats.length}명의 친구들이 함께 말씀의 바다를 항해하고 있어요. 끝까지 함께해요!
              </p>
            </div>
          </section>
        )}
      </main>

      {/* [하단 고정 버튼 - 홈 탭일 때만] */}
      {activeTab === 'home' && (
        <div className="fixed bottom-24 left-0 right-0 px-6 max-w-md mx-auto z-10 transition-all">
          <button
            onClick={() => setIsViewerOpen(true)}
            className="w-full bg-slate-900 hover:bg-black text-white h-20 rounded-[1.5rem] shadow-2xl flex items-center justify-between px-8 transition-all group active:scale-95"
          >
            <div className="flex items-center gap-4">
              <div className="bg-white/10 p-3 rounded-2xl">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-0.5">Today's Word</p>
                <p className="font-black text-lg">{plans.find(p => p.day_number === currentDay)?.reading_range || '축복합니다!'}</p>
              </div>
            </div>
            <div className="bg-white/10 p-2 rounded-full group-hover:bg-white/20 transition-colors">
              <ChevronRight className="w-6 h-6 text-white" />
            </div>
          </button>
        </div>
      )}

      {/* [하단 탭 바] */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 px-10 pb-8 pt-4 flex justify-between items-center z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'home' ? 'text-blue-600 scale-110' : 'text-slate-300'}`}
        >
          <Home className={`w-7 h-7 ${activeTab === 'home' ? 'fill-blue-600/10 stroke-[3]' : 'stroke-[2]'}`} />
          <span className="text-[10px] font-black uppercase">Home</span>
        </button>

        <button
          onClick={() => setActiveTab('status')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'status' ? 'text-blue-600 scale-110' : 'text-slate-300'}`}
        >
          <Users className={`w-7 h-7 ${activeTab === 'status' ? 'fill-blue-600/10 stroke-[3]' : 'stroke-[2]'}`} />
          <span className="text-[10px] font-black uppercase">List</span>
        </button>
      </nav>

      {/* [성경 본문 뷰어] */}
      {isViewerOpen && (
        <BibleViewer
          plan={plans.find(p => p.day_number === currentDay)}
          allPlans={plans}
          progress={progress}
          onToggleDay={toggleDay}
          currentDay={currentDay}
          onClose={() => setIsViewerOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
