import { TimeLimit } from '@/features/quiz';
import './TimeSelector.css';

interface TimeSelectorProps {
  onSelect: (time: TimeLimit) => void;
}

const TIME_OPTIONS: { time: TimeLimit; label: string }[] = [
  { time: 60, label: '1분' },
  { time: 120, label: '2분' },
  { time: 180, label: '3분' },
];

export function TimeSelector({ onSelect }: TimeSelectorProps) {
  return (
    <div className="time-selector-container">
      <h1 className="selector-title">시간을 선택하세요</h1>
      <div className="time-options">
        {TIME_OPTIONS.map((option) => (
          <div key={option.time} className="time-card" onClick={() => onSelect(option.time)}>
            <h2>{option.label}</h2>
            <p>{option.time}초</p>
          </div>
        ))}
      </div>
    </div>
  );
}
