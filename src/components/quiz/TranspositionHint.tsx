import React from 'react';
import './TranspositionHint.css';

interface TranspositionHintProps {
    term: string;
    targetSide: 'LHS' | 'RHS';
    targetResult: string;
}

export const TranspositionHint: React.FC<TranspositionHintProps> = ({
    term,
    targetSide,
    targetResult,
}) => {
    return (
        <div className={`transposition-hint ${targetSide.toLowerCase()}`}>
            <span className="moving-term">{term}</span>
            <span className="arrow">→</span>
            <span className="result-term">{targetResult}</span>
        </div>
    );
};
