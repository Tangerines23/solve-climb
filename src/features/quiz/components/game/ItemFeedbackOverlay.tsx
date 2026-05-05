import { useState, useImperativeHandle, forwardRef } from 'react';
import './ItemFeedbackOverlay.css';

import { ItemFeedbackRef } from '../../types/feedback';

export const ItemFeedbackOverlay = forwardRef<ItemFeedbackRef, object>((_, ref) => {
  const [isVisible, setIsVisible] = useState(false);
  const [content, setContent] = useState({ text: '', subText: '', type: 'success' });

  useImperativeHandle(ref, () => ({
    show(text: string, subText: string = '', type: 'success' | 'info' = 'success') {
      setContent({ text, subText, type });
      setIsVisible(true);
      setTimeout(() => setIsVisible(false), 2000);
    },
  }));

  if (!isVisible) return null;

  return (
    <div className={`item-feedback-container fade-up ${content.type}`}>
      <div className="feedback-content">
        <h1 className="feedback-text">{content.text}</h1>
        {content.subText && <p className="feedback-subtext">{content.subText}</p>}
      </div>
    </div>
  );
});
