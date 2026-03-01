import React, { useState } from 'react';
import { testConnection, lookupClientByLicense } from '../services/sheetService';
import { Database, KeyRound, ArrowRight, Loader2, Globe, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { DEV_LICENSE_KEY, DEMO_LICENSE_KEY } from '../constants';

export const ConnectionScreen: React.FC = () => {
  const { pairFactory } = useAuth();
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>(''); // 'lookup', 'testing', ''
  const [error, setError] = useState('');

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatus('lookup');
    setLoading(true);

    let targetUrl = inputVal.trim();
    let licenseKey = '';
    
    // Check for DEV or DEMO keys
    if (inputVal === DEV_LICENSE_KEY) {
        pairFactory('DEV_MODE', 'MeatPro Developer Environment', DEV_LICENSE_KEY);
        setLoading(false);
        return;
    }
    if (inputVal === DEMO_LICENSE_KEY) {
        pairFactory('DEMO_MODE', 'MeatPro Customer Demo', DEMO_LICENSE_KEY);
        setLoading(false);
        return;
    }
    
    // 1. ถ้าสิ่งที่กรอกมาไม่ใช่ URL (ไม่มี http) ให้ถือว่าเป็น License Key
    if (!inputVal.includes('http')) {
        licenseKey = inputVal;
        const result = await lookupClientByLicense(inputVal);
        if (!result.success) {
            setError(result.message || 'License Key Invalid');
            setLoading(false);
            return;
        }
        if (result.url) {
            targetUrl = result.url;
        }
    }

    // 2. Test connectivity & Get Identity (Verify who we are talking to)
    setStatus('testing');
    const sysInfo = await testConnection(targetUrl);
    
    if (sysInfo && sysInfo.status === 'success') {
      // Success!
      // Use the name FROM THE SHEET (Source of Truth), not the registry
      const verifiedName = sysInfo.systemName || sysInfo.spreadsheetName;
      
      pairFactory(targetUrl, verifiedName, licenseKey);
    } else {
      setError('ไม่สามารถเชื่อมต่อ Project ได้ หรือ Script ยังไม่ถูกติดตั้ง');
    }
    setLoading(false);
    setStatus('');
  };

  return (
    <div className="h-screen w-full flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #F2F4F6 0%, #E6E1DB 100%)' }}>
      {/* Background Blobs */}
      <div className="fixed top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#C22D2E] opacity-5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="fixed bottom-[-10%] left-[10%] w-[400px] h-[400px] bg-[#E6E1DB] opacity-5 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-md border border-white/60 relative z-10">
        <div className="text-center mb-8">
          <div className="bg-slate-900 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-900/20">
            <ShieldCheck className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">MEAT PRO <span className="text-red-600">CLOUD</span></h1>
          <p className="text-slate-500 text-sm mt-2">Enterprise Login Portal</p>
        </div>

        <form onSubmit={handleConnect} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                License Key / Project ID
            </label>
            <div className="relative group">
              <KeyRound className="absolute left-3 top-3 text-slate-400 group-focus-within:text-red-500 transition-colors" size={20} />
              <input 
                type="text" 
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Ex. MP-CLIENT-001"
                className="w-full pl-10 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-base transition-all font-mono"
                required
              />
            </div>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
              <Globe size={10}/> ใช้ License Key ของแต่ละโปรเจค
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg flex items-start gap-2 animate-pulse">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-slate-200"
          >
            {loading ? (
                <span className="flex items-center gap-2">
                    <Loader2 className="animate-spin" size={18} />
                    {status === 'lookup' ? 'Verifying License...' : 'Authenticating...'}
                </span>
            ) : (
                <>Access Project <ArrowRight size={18} /></>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-200/50 text-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">
            1 Project = 1 Secure Database
          </p>
        </div>
      </div>
    </div>
  );
};