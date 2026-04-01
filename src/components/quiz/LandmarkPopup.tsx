import React from 'react';

interface LandmarkPopupProps {
  activeLandmark: {
    icon: string;
    text: string;
  } | null;
}

/**
 * 특정 고도(Landmark)에 도달했을 때 표시되는 팝업 컴포넌트
 */
export const LandmarkPopup: React.FC<LandmarkPopupProps> = ({ activeLandmark }) => {
  if (!activeLandmark) return null;

  return (
    <div className="landmark-popup-overlay">
      <div className="landmark-popup">
        <span className="landmark-icon">{activeLandmark.icon}</span>
        <span className="landmark-text">{activeLandmark.text}</span>
      </div>
    </div>
  );
};
