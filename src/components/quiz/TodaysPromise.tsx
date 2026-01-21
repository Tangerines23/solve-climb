import React, { useEffect, useState } from 'react';
import './TodaysPromise.css';

interface TodaysPromiseProps {
    isVisible: boolean;
    rule: string;
    example: string;
    onComplete: () => void;
}

export const TodaysPromise: React.FC<TodaysPromiseProps> = ({
    isVisible,
    rule,
    example,
    onComplete,
}) => {
    const [countdown, setCountdown] = useState(3);

    useEffect(() => {
        if (!isVisible) return;

        setCountdown(3);
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setTimeout(onComplete, 500);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isVisible, onComplete]);

    if (!isVisible) return null;

    return (
        <div className="promise-overlay">
            <div className="promise-card">
                <div className="promise-badge">오늘의 약속 🤝</div>
                <h2 className="promise-rule">{rule}</h2>
                <div className="promise-example">예: {example}</div>
                <div className="promise-timer">{countdown}</div>
                <div className="promise-footer">잠시 후 등반이 시작됩니다.</div>
            </div>
        </div>
    );
};
