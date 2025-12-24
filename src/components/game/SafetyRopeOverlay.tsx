import React, { useEffect } from 'react';
import './SafetyRopeOverlay.css';

interface SafetyRopeOverlayProps {
    isVisible: boolean;
    onAnimationComplete: () => void;
}

export function SafetyRopeOverlay({ isVisible, onAnimationComplete }: SafetyRopeOverlayProps) {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onAnimationComplete();
            }, 1500); // 1.5초 후 애니메이션 종료
            return () => clearTimeout(timer);
        }
    }, [isVisible, onAnimationComplete]);

    if (!isVisible) return null;

    return (
        <div className="safety-rope-overlay">
            <div className="rope-visual"></div>
            <div className="safe-text">SAFE!</div>
            <div className="safe-subtext">안전 로프가 1회 방어했습니다</div>
        </div>
    );
}
