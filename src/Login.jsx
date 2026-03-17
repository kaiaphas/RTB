import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { LogIn, Mail, Lock, Loader2, User, UserPlus } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) setError(error.message);
    setLoading(false);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError('닉네임을 입력해 주세요.');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nickname: nickname.trim(),
        }
      }
    });

    if (error) setError(error.message);
    else alert('가입 확인 이메일을 확인해 주세요!');
    setLoading(false);
  };

  const handleResetPasswordRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('비밀번호 재설정 링크가 이메일로 발송되었습니다!');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center">
          <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200">
            {isForgotPassword ? <Lock className="text-white w-8 h-8" /> : 
             isSignUp ? <UserPlus className="text-white w-8 h-8" /> : <LogIn className="text-white w-8 h-8" />}
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {isForgotPassword ? '비밀번호 재설정' : isSignUp ? '새로운 시작' : '100일 성경 읽기'}
          </h1>
          <p className="text-slate-400 mt-2 font-medium">
            {isForgotPassword ? '가입하신 이메일을 입력해주세요' : 
             isSignUp ? '성경 완독의 여정을 시작해보세요' : '오늘도 말씀과 함께 시작해요!'}
          </p>
        </div>

        <form onSubmit={isForgotPassword ? handleResetPasswordRequest : isSignUp ? handleSignUp : handleLogin} className="space-y-4">
          {isSignUp && (
            <div className="space-y-2">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="닉네임 입력"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition-all outline-none font-bold"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  required
                />
              </div>
              <p className="text-xs text-blue-600 font-bold px-4 flex items-center gap-1">
                <span>⚠️</span> 현황판 표시를 위해 **닉네임**을 입력해주세요!
              </p>
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="email"
              placeholder="이메일"
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition-all outline-none font-bold"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {!isForgotPassword && (
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="password"
                placeholder="비밀번호"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition-all outline-none font-bold"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-500 text-xs font-bold p-4 rounded-xl">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-50 text-green-600 text-xs font-bold p-4 rounded-xl">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-2xl transition-all shadow-xl active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : 
             (isForgotPassword ? '재설정 링크 보내기' : isSignUp ? '계정 만들기' : '로그인')}
          </button>
        </form>

        {!isForgotPassword && !isSignUp && (
          <div className="text-center">
            <button 
              onClick={() => {
                setIsForgotPassword(true);
                setError(null);
                setMessage(null);
              }}
              className="text-slate-400 text-sm font-bold hover:text-blue-600 transition-colors"
            >
              비밀번호를 잊으셨나요?
            </button>
          </div>
        )}

        <div className="relative flex items-center justify-center py-2">
          <div className="border-t border-slate-100 w-full"></div>
          <span className="bg-white px-4 text-slate-300 text-xs font-bold absolute">OR</span>
        </div>

        <button
          onClick={() => {
            if (isForgotPassword) {
              setIsForgotPassword(false);
            } else {
              setIsSignUp(!isSignUp);
            }
            setError(null);
            setMessage(null);
          }}
          className="w-full bg-white border-2 border-slate-100 hover:border-blue-100 text-slate-500 font-bold py-4 rounded-2xl transition-all active:scale-[0.98]"
        >
          {isForgotPassword ? '로그인으로 돌아가기' : isSignUp ? '이미 계정 있으신가요? 로그인' : '처음이신가요? 계정 만들기'}
        </button>
      </div>
      
      <p className="mt-8 text-slate-300 text-xs font-bold tracking-widest leading-relaxed text-center">
        성서공회 개역한글판 성경을 사용합니다.<br/>
        © 2026 RTB BIBLE PROJECT
      </p>
    </div>
  );
};

export default Login;
