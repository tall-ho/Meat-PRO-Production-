import React, { useEffect, useState } from 'react';

interface WatermarkProps {
    user: {
        id: string;
        name: string;
    } | null;
}

export const Watermark: React.FC<WatermarkProps> = ({ user }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'PrintScreen') {
                setIsVisible(true);
                // Hide after 3 seconds
                setTimeout(() => setIsVisible(false), 3000);
            }
        };

        // Handle printing (Ctrl+P)
        const handleBeforePrint = () => setIsVisible(true);
        const handleAfterPrint = () => setIsVisible(false);

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('beforeprint', handleBeforePrint);
        window.addEventListener('afterprint', handleAfterPrint);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('beforeprint', handleBeforePrint);
            window.removeEventListener('afterprint', handleAfterPrint);
        };
    }, []);

    if (!user) return null;

    const text = `CONFIDENTIAL • ${user.name} • ${user.id} • ${new Date().toLocaleDateString()}`;
    
    return (
        <div 
            className={`fixed inset-0 pointer-events-none z-[9999] overflow-hidden flex flex-wrap content-center justify-center select-none transition-opacity duration-300
            ${isVisible ? 'opacity-100' : 'opacity-0'} print:opacity-100`}
        >
            {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="w-full flex justify-around my-12 transform -rotate-12">
                    {Array.from({ length: 5 }).map((_, j) => (
                        <span key={j} className="text-xl font-black uppercase whitespace-nowrap text-slate-500/15">
                            {text}
                        </span>
                    ))}
                </div>
            ))}
        </div>
    );
};
