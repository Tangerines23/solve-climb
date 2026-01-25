import React from 'react';
import './GameAlertModal.css';

interface GameAlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAction: (action: 'login' | 'charge' | 'play') => void;
    type: 'stamina' | 'anonymous' | 'both';
}

export const GameAlertModal: React.FC<GameAlertModalProps> = ({
    isOpen,
    onClose,
    onAction,
    type,
}) => {
    if (!isOpen) return null;

    const renderContent = () => {
        switch (type) {
            case 'stamina':
                return (
                    <>
                        <div className="alert-modal-header">
                            <span className="warning-icon">⚡</span>
                            <h2>체력이 부족합니다</h2>
                        </div>
                        <div className="alert-modal-body">
                            <p>스태미나가 부족하여 <strong>지친 상태</strong>로 등반하게 됩니다.</p>
                            <ul className="penalty-list">
                                <li>⚠️ 획득 점수와 미네랄이 <strong>80%</strong>로 감소합니다.</li>
                                <li>⚠️ 화면이 붉게 어두워집니다.</li>
                            </ul>
                        </div>
                    </>
                );
            case 'anonymous':
                return (
                    <>
                        <div className="alert-modal-header">
                            <span className="warning-icon">👤</span>
                            <h2>익명 등반 중입니다</h2>
                        </div>
                        <div className="alert-modal-body">
                            <p>익명 상태에서는 브라우저 캐시 삭제 시 <strong>기록이 모두 유실</strong>될 수 있습니다.</p>
                            <ul className="penalty-list">
                                <li>✅ 안전한 보관을 위해 로그인을 추천합니다.</li>
                                <li>✅ 로그인 후에는 모든 기기에서 랭킹을 확인할 수 있습니다.</li>
                            </ul>
                        </div>
                    </>
                );
            case 'both':
                return (
                    <>
                        <div className="alert-modal-header">
                            <span className="warning-icon">⚠️</span>
                            <h2>확인이 필요합니다</h2>
                        </div>
                        <div className="alert-modal-body">
                            <p>현재 <strong>체력이 부족</strong>하며 <strong>익명 상태</strong>입니다.</p>
                            <ul className="penalty-list">
                                <li>⚠️ 지친 상태 패널티 (보상 80%)가 적용됩니다.</li>
                                <li>⚠️ 로그인하지 않으면 기록이 유실될 위험이 있습니다.</li>
                            </ul>
                        </div>
                    </>
                );
        }
    };

    return (
        <div className="alert-modal-overlay">
            <div className="alert-modal-content fade-in">
                {renderContent()}
                <div className="alert-modal-footer">
                    {type !== 'stamina' && (
                        <button className="primary-button" onClick={() => onAction('login')}>
                            로그인하고 기록 보호하기
                        </button>
                    )}
                    {type !== 'anonymous' && (
                        <button className="secondary-button" onClick={() => onAction('charge')}>
                            광고 보고 충전하기
                        </button>
                    )}
                    <button className="play-button" onClick={() => onAction('play')}>
                        {type === 'stamina' || type === 'both' ? '지친 상태로 진행' : '익명으로 진행'}
                    </button>
                    <button className="close-link" onClick={onClose}>
                        취소
                    </button>
                </div>
            </div>
        </div>
    );
};
