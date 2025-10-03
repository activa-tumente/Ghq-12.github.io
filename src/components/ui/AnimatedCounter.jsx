import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Animated counter component that smoothly transitions between values
 * Provides visual feedback when metrics change
 */
const AnimatedCounter = ({
  value,
  duration = 1000,
  formatValue = (val) => val,
  className = '',
  showChangeIndicator = true,
  changeIndicatorDuration = 2000
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const [changeDirection, setChangeDirection] = useState(null); // 'up', 'down', or null

  useEffect(() => {
    if (value !== displayValue) {
      const startValue = displayValue;
      const endValue = value;
      const startTime = Date.now();
      const difference = endValue - startValue;

      // Determine change direction
      if (difference > 0) {
        setChangeDirection('up');
      } else if (difference < 0) {
        setChangeDirection('down');
      }

      setIsAnimating(true);

      const animate = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function for smooth animation
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const currentValue = startValue + (difference * easeOutCubic);

        setDisplayValue(currentValue);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setDisplayValue(endValue);
          setIsAnimating(false);

          // Clear change indicator after duration
          if (showChangeIndicator) {
            setTimeout(() => setChangeDirection(null), changeIndicatorDuration);
          }
        }
      };

      requestAnimationFrame(animate);
    }
  }, [value, displayValue, duration, showChangeIndicator, changeIndicatorDuration]);

  const formattedValue = formatValue(displayValue);

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <span
        className={`transition-all duration-200 ${
          isAnimating ? 'scale-110 font-semibold' : ''
        }`}
      >
        {formattedValue}
      </span>

      {/* Change indicator */}
      {showChangeIndicator && changeDirection && (
        <div
          className={`absolute -top-1 -right-1 w-2 h-2 rounded-full animate-ping ${
            changeDirection === 'up' ? 'bg-green-400' : 'bg-red-400'
          }`}
        />
      )}

      {/* Static indicator dot */}
      {showChangeIndicator && changeDirection && (
        <div
          className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
            changeDirection === 'up' ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
      )}
    </div>
  );
};

AnimatedCounter.propTypes = {
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  duration: PropTypes.number,
  formatValue: PropTypes.func,
  className: PropTypes.string,
  showChangeIndicator: PropTypes.bool,
  changeIndicatorDuration: PropTypes.number
};

export default AnimatedCounter;