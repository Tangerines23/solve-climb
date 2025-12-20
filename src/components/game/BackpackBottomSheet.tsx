import { useState, useEffect } from 'react';
import { useUserStore } from '../../stores/useUserStore';
import './BackpackBottomSheet.css';

interface BackpackBottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    selectedItemIds: number[];
    onToggleItem: (itemId: number) => void;
}

export function BackpackBottomSheet({ isOpen, onClose, selectedItemIds, onToggleItem }: BackpackBottomSheetProps) {
    const { inventory } = useUserStore();
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true);
        } else {
            const timer = setTimeout(() => setIsAnimating(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen && !isAnimating) return null;

    return (
        <div className={`backpack-sheet-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
            <div
                className={`backpack-sheet-content ${isOpen ? 'open' : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="backpack-sheet-header">
                    <div className="backpack-sheet-handle" />
                    <h3 className="backpack-sheet-title">⚒️ 나의 배낭</h3>
                    <p className="backpack-sheet-subtitle">가져갈 아이템을 선택하세요</p>
                </div>

                <div className="backpack-items-grid">
                    {inventory.length > 0 ? (
                        inventory.map((item) => (
                            <div
                                key={item.id}
                                className={`backpack-item-card ${selectedItemIds.includes(item.id) ? 'selected' : ''} ${item.quantity === 0 ? 'empty' : ''}`}
                                onClick={() => item.quantity > 0 && onToggleItem(item.id)}
                            >
                                <div className="backpack-item-icon-wrapper">
                                    <span className="backpack-item-icon">{getItemEmoji(item.code)}</span>
                                    {item.quantity > 0 && <span className="backpack-item-qty">x{item.quantity}</span>}
                                </div>
                                <div className="backpack-item-info">
                                    <span className="backpack-item-name">{item.name}</span>
                                    <span className="backpack-item-desc">{item.description}</span>
                                </div>
                                <div className="backpack-item-checkbox">
                                    {selectedItemIds.includes(item.id) ? '✓' : ''}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="backpack-empty-state">
                            <p>배낭이 비어있습니다.</p>
                            <p className="backpack-empty-hint">상점에서 아이템을 준비해보세요.</p>
                        </div>
                    )}
                </div>

                <button className="backpack-sheet-close" onClick={onClose}>
                    준비 완료
                </button>
            </div>
        </div>
    );
}

function getItemEmoji(code: string) {
    switch (code) {
        case 'oxygen_tank': return '🧪';
        case 'power_gel': return '⚡';
        case 'safety_rope': return '🪢';
        case 'flare': return '🧨';
        default: return '📦';
    }
}
