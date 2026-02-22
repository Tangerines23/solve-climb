import { useState, useRef, useEffect } from 'react';
import './SegmentedControl.css';

interface SegmentedControlProps<T extends string> {
  options: {
    value: T;
    label: string;
    icon?: React.ReactNode;
    disabled?: boolean;
  }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  name?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = '',
  name = 'segmented-control',
}: SegmentedControlProps<T>) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  // Update active index when value changes
  useEffect(() => {
    const index = options.findIndex((option) => option.value === value);
    if (index !== -1) {
      setActiveIndex(index);
    }
  }, [value, options]);

  // Update indicator position for fluid animation
  useEffect(() => {
    const container = containerRef.current;
    const activeItem = itemsRef.current.at(activeIndex) ?? null;

    if (container && activeItem) {
      const containerRect = container.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();

      // Calculate relative position
      const left = itemRect.left - containerRect.left;
      const width = itemRect.width;

      setIndicatorStyle({ left, width });
    }
  }, [activeIndex, options]); // Recalculate on index change or options change

  // Handle resizing to adjust indicator
  useEffect(() => {
    const handleResize = () => {
      // Trigger update logic again
      const container = containerRef.current;
      const activeItem = itemsRef.current.at(activeIndex) ?? null;

      if (container && activeItem) {
        const containerRect = container.getBoundingClientRect();
        const itemRect = activeItem.getBoundingClientRect();
        setIndicatorStyle({
          left: itemRect.left - containerRect.left,
          width: itemRect.width,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeIndex]);

  return (
    <div
      className={`segmented-control-container ${className}`}
      ref={containerRef}
      data-name={name}
      role="radiogroup"
      aria-label={name}
    >
      {/* Sliding Indicator */}
      <div
        className="segmented-control-indicator"
        style={
          {
            '--indicator-left': `${indicatorStyle.left}px`,
            '--indicator-width': `${indicatorStyle.width}px`,
          } as React.CSSProperties
        }
      />

      {/* Items */}
      {options.map((option, index) => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            ref={(el) => {
              if (itemsRef.current && typeof index === 'number') {
                itemsRef.current[index] = el;
              }
            }}
            className={`segmented-control-item ${isSelected ? 'active' : ''} ${
              option.disabled ? 'disabled' : ''
            }`}
            onClick={() => !option.disabled && onChange(option.value)}
            disabled={option.disabled}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected ? 0 : -1}
          >
            <span className="segmented-content">
              {option.icon && <span className="segmented-icon">{option.icon}</span>}
              <span className="segmented-label">{option.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
