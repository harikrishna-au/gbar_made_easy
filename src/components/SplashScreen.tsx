import { useEffect, useState } from 'react';

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
    const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');

    useEffect(() => {
        // Phase in: 0.8s fade-in
        // Hold: 3s
        // Phase out: 0.7s fade-out
        const holdTimer = setTimeout(() => setPhase('out'), 3800);
        const doneTimer = setTimeout(() => {
            onFinish();
        }, 4500);
        return () => {
            clearTimeout(holdTimer);
            clearTimeout(doneTimer);
        };
    }, [onFinish]);

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background transition-opacity duration-700 ease-in-out"
            style={{
                opacity: phase === 'out' ? 0 : 1,
                pointerEvents: phase === 'out' ? 'none' : 'auto',
            }}
        >
            <div
                className="relative flex flex-col items-center gap-5"
                style={{
                    animation: 'splashFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) forwards',
                }}
            >
                {/* Full wordmark */}
                <img src="/logo.svg" alt="Harry The Blaze" className="w-72 md:w-96" />

                {/* Flame rule, drawn with transform */}
                <div
                    className="h-1 w-48 origin-left bg-flame"
                    style={{
                        transform: 'scaleX(0)',
                        animation: 'splashLine 1.2s cubic-bezier(0.22,1,0.36,1) 0.4s forwards',
                    }}
                />
            </div>
        </div>
    );
};

export default SplashScreen;
