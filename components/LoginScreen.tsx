import React, { useState } from 'react';
import { Scan, Camera, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { DEV_CONFIG, SYSTEM_MODULES } from '../constants';

export const LoginScreen = () => {
    const { login } = useAuth();
    const [empId, setEmpId] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (empId) {
            // Special Login Codes (Bypass password for convenience in dev/demo, or require it?)
            // For now, let's keep the special codes working simply, but for normal users require password.
            
            if (empId.toUpperCase() === 'DEV') {
                const devEmail = 'tallintelligence.dcc@gmail.com';
                const devProfile = DEV_CONFIG[devEmail];
                
                // Generate full permissions from SYSTEM_MODULES
                const fullPermissions: Record<string, number[]> = {};
                SYSTEM_MODULES.forEach(module => {
                    fullPermissions[module.id] = [1];
                    if (module.subItems) {
                        module.subItems.forEach(sub => {
                            fullPermissions[sub.id] = [1];
                        });
                    }
                });

                login({
                    id: 'DEV-001',
                    name: devProfile.name,
                    email: devEmail,
                    position: devProfile.position,
                    avatar: devProfile.avatar,
                    isDev: true,
                    permissions: fullPermissions
                });
                return;
            }
            if (empId.toUpperCase() === 'DEMO') {
                login({
                    id: 'DEMO-USER',
                    name: 'Customer Demo',
                    email: 'demo@customer.com',
                    position: 'Production Manager',
                    avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=random',
                    isDev: false,
                    permissions: {
                        'home': [1],
                        'planning': [1],
                        'plan_fr_planning': [1],
                        'plan_by_prod': [1],
                        'daily_board': [1],
                        'prod_tracking': [1],
                        'mixing_plan': [1],
                        'packing_plan': [1],
                        'daily_problem': [1],
                        'unplanned_jobs': [1],
                        'machine_breakdown': [1],
                        'process': [1],
                        'premix': [1],
                        'mixing': [1],
                        'forming': [1],
                        'cooking': [1],
                        'cooling': [1],
                        'cut_peel': [1],
                        'packing': [1],
                        'prod_config': [1],
                        'master_items': [1],
                        'production_standards': [1],
                        'product_matrix': [1],
                        'equipment': [1],
                        'setting': [1],
                        'user_setting': [1]
                    }
                });
                return;
            }

            // Normal Login - Require Password (National ID)
            if (!password) {
                alert('Please enter your National ID or Passport Number');
                return;
            }

            // Mock login (Default fallback)
            login({
                id: empId,
                name: 'Production Staff',
                email: 'staff@meatpro.com',
                position: 'Operator',
                avatar: 'https://i.pravatar.cc/150?img=11',
                isDev: false,
                permissions: {
                    'home': [1],
                    'planning': [1],
                    'plan_fr_planning': [1],
                    'daily_board': [1],
                    'prod_tracking': [1]
                }
            });
        }
    };

    return (
        <div className="h-full w-full flex items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #F2F4F6 0%, #E6E1DB 100%)' }}>
            {/* Background Blobs */}
            <div className="fixed top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#C22D2E] opacity-5 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="fixed bottom-[-10%] left-[10%] w-[400px] h-[400px] bg-[#E6E1DB] opacity-5 blur-[100px] rounded-full pointer-events-none"></div>

            <div className="relative z-10 w-full max-w-4xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center justify-items-center">
                
                {/* Left Side: Primary Verification */}
                <div className="flex flex-col items-center text-center py-6 w-full">
                    <div className="mb-2">
                        <span className="text-[#C22D2E] text-xs font-bold tracking-[0.2em] uppercase">Primary Verification</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-serif text-[#2E395F] mb-6 tracking-tight">
                        SCAN ID CARD
                    </h1>

                    <div className="relative group cursor-pointer mb-6">
                        {/* Scan Circle */}
                        <div className="w-56 h-56 rounded-full border border-[#C22D2E]/20 bg-white/40 backdrop-blur-sm flex items-center justify-center relative overflow-hidden group-hover:border-[#C22D2E]/60 transition-colors duration-500 shadow-soft">
                            <div className="absolute inset-0 bg-[#C22D2E]/5 rounded-full scale-0 group-hover:scale-100 transition-transform duration-700" />
                            
                            {/* Scanning Animation Line */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-[#C22D2E]/50 shadow-[0_0_15px_#C22D2E] animate-scan" />
                            
                            <div className="flex flex-col items-center gap-3 relative z-10">
                                <Scan size={40} className="text-[#C22D2E]" strokeWidth={1.5} />
                                <span className="text-[#C22D2E] text-xs font-bold tracking-widest uppercase mt-2">Tap Here</span>
                            </div>
                        </div>
                        
                        {/* Ripple Effect Rings */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 border border-[#C22D2E]/10 rounded-full animate-ping-slow pointer-events-none" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 border border-[#C22D2E]/5 rounded-full pointer-events-none" />
                    </div>

                    <button className="flex items-center gap-3 px-6 py-3 rounded-lg border border-[#C22D2E]/30 text-[#C22D2E] hover:bg-[#C22D2E]/5 transition-all uppercase text-xs font-bold tracking-wider mb-4 group bg-white/50">
                        <Camera size={16} className="group-hover:scale-110 transition-transform" />
                        Use Camera to Scan
                    </button>

                    <p className="text-[#55738D] text-sm max-w-md font-medium">
                        กรุณาแตะบัตรพนักงานของคุณที่เครื่องอ่าน หรือใช้กล้องสแกนบาร์โค้ด
                    </p>
                </div>

                {/* Center Divider (Desktop only) */}
                <div className="hidden lg:flex flex-col items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                    <div className="h-24 w-px bg-gradient-to-b from-transparent via-[#2E395F]/20 to-transparent" />
                    <div className="bg-white border border-[#2E395F]/10 text-[#55738D] text-[10px] font-bold px-2 py-1 rounded my-2 shadow-sm">OR</div>
                    <div className="h-24 w-px bg-gradient-to-b from-transparent via-[#2E395F]/20 to-transparent" />
                </div>

                {/* Right Side: Fallback Verification */}
                <div className="flex justify-center w-full">
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="w-full max-w-md bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden"
                    >
                        {/* Card Glow Effect */}
                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#C22D2E]/5 rounded-full blur-3xl pointer-events-none" />

                        <div className="relative z-10">
                            <div className="mb-6 text-center">
                                <span className="text-[#737597] text-[10px] font-bold tracking-[0.2em] uppercase block mb-2">Fallback Verification</span>
                                <h2 className="text-2xl font-serif text-[#2E395F] mb-2">EMPLOYEE LOGIN</h2>
                                <p className="text-[#55738D] text-xs font-medium">เข้าสู่ระบบด้วยรหัสพนักงาน</p>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-4">
                                    <div className="relative">
                                        <label className="text-[10px] font-bold text-[#2E395F] uppercase tracking-wider mb-1 block ml-1">Employee ID</label>
                                        <input 
                                            type="text" 
                                            value={empId}
                                            onChange={(e) => setEmpId(e.target.value)}
                                            placeholder="รหัสพนักงาน"
                                            className="w-full bg-white/50 border border-[#2E395F]/10 rounded-xl px-4 py-3 text-[#2E395F] font-mono placeholder:text-[#737597]/50 focus:outline-none focus:border-[#C22D2E]/50 focus:ring-1 focus:ring-[#C22D2E]/50 transition-all shadow-inner"
                                        />
                                    </div>
                                    <div className="relative">
                                        <label className="text-[10px] font-bold text-[#2E395F] uppercase tracking-wider mb-1 block ml-1">Password</label>
                                        <input 
                                            type="password" 
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="เลขบัตรประชาชน / พาสปอร์ต"
                                            className="w-full bg-white/50 border border-[#2E395F]/10 rounded-xl px-4 py-3 text-[#2E395F] font-mono placeholder:text-[#737597]/50 focus:outline-none focus:border-[#C22D2E]/50 focus:ring-1 focus:ring-[#C22D2E]/50 transition-all shadow-inner"
                                        />
                                    </div>
                                </div>

                                <button 
                                    type="submit"
                                    className="w-full bg-[#C22D2E] hover:bg-[#A91B18] text-white border border-transparent rounded-xl py-3 text-xs font-bold tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-2 group shadow-lg hover:shadow-xl hover:-translate-y-0.5 mt-2"
                                >
                                    Login
                                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform text-white/80" />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Security Notice Footer */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-20">
                <div className="flex items-center justify-center gap-3 px-6 py-2 rounded-full border border-white/40 bg-white/40 backdrop-blur-md shadow-sm">
                    <ShieldCheck size={14} className="text-[#C22D2E] shrink-0" />
                    <p className="text-[10px] text-[#55738D] font-mono text-center truncate">
                        <span className="text-[#2E395F] font-bold mr-1">SECURITY NOTICE:</span> 
                        ระบบจะดึงข้อมูล <span className="text-[#C22D2E]">ชื่อ-สกุล</span> และ <span className="text-[#C22D2E]">แผนกจาก HR</span> เพื่อประทับเป็นลายน้ำ (Watermark) บนเอกสารอัตโนมัติ
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes scan {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                .animate-scan {
                    animation: scan 2s linear infinite;
                }
                .animate-spin-slow {
                    animation: spin 10s linear infinite;
                }
                .animate-ping-slow {
                    animation: ping 3s cubic-bezier(0, 0, 0.2, 1) infinite;
                }
            `}</style>
        </div>
    );
};
