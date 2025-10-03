/**
 * Skeleton Loading Components
 * Provides smooth loading states for better UX
 */
import React from 'react';
import PropTypes from 'prop-types';

// Base skeleton component with animation
const SkeletonBase = ({ className = '', width, height, rounded = false, animated = true }) => {
  const baseClasses = `
    bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 
    ${animated ? 'animate-pulse' : ''}
    ${rounded ? 'rounded-full' : 'rounded'}
    ${className}
  `;

  const style = {
    width: width || '100%',
    height: height || '1rem'
  };

  return <div className={baseClasses} style={style} />;
};

// Card skeleton for dashboard cards
export const CardSkeleton = ({ showHeader = true, lines = 3, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      {showHeader && (
        <div className="mb-4">
          <SkeletonBase height="1.5rem" width="60%" className="mb-2" />
          <SkeletonBase height="1rem" width="40%" />
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <SkeletonBase 
            key={index} 
            height="1rem" 
            width={`${Math.random() * 40 + 60}%`} 
          />
        ))}
      </div>
    </div>
  );
};

// Table skeleton for data tables
export const TableSkeleton = ({ rows = 5, columns = 4, showHeader = true, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border overflow-hidden ${className}`}>
      {showHeader && (
        <div className="border-b bg-gray-50 p-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, index) => (
              <SkeletonBase key={index} height="1rem" width="80%" />
            ))}
          </div>
        </div>
      )}
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <SkeletonBase 
                  key={colIndex} 
                  height="1rem" 
                  width={`${Math.random() * 30 + 70}%`} 
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Chart skeleton for dashboard charts
export const ChartSkeleton = ({ type = 'bar', className = '' }) => {
  const renderBarChart = () => (
    <div className="flex items-end justify-between h-48 px-4 pb-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex flex-col items-center space-y-2">
          <SkeletonBase 
            height={`${Math.random() * 120 + 40}px`} 
            width="24px" 
            className="bg-blue-200"
          />
          <SkeletonBase height="0.75rem" width="40px" />
        </div>
      ))}
    </div>
  );

  const renderLineChart = () => (
    <div className="h-48 p-4">
      <svg className="w-full h-full">
        <defs>
          <linearGradient id="skeleton-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#e5e7eb" />
            <stop offset="50%" stopColor="#d1d5db" />
            <stop offset="100%" stopColor="#e5e7eb" />
          </linearGradient>
        </defs>
        <path 
          d="M 0 150 Q 50 100 100 120 T 200 110 T 300 130 T 400 100" 
          stroke="url(#skeleton-gradient)" 
          strokeWidth="3" 
          fill="none"
          className="animate-pulse"
        />
        {Array.from({ length: 5 }).map((_, index) => (
          <circle 
            key={index}
            cx={index * 80 + 20}
            cy={Math.random() * 100 + 50}
            r="4"
            fill="#d1d5db"
            className="animate-pulse"
          />
        ))}
      </svg>
    </div>
  );

  const renderPieChart = () => (
    <div className="flex items-center justify-center h-48">
      <div className="relative">
        <SkeletonBase 
          width="120px" 
          height="120px" 
          rounded={true} 
          className="bg-gray-200"
        />
        <div className="absolute inset-4">
          <SkeletonBase 
            width="88px" 
            height="88px" 
            rounded={true} 
            className="bg-white"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="p-4 border-b">
        <SkeletonBase height="1.25rem" width="50%" className="mb-2" />
        <SkeletonBase height="0.875rem" width="30%" />
      </div>
      <div className="p-4">
        {type === 'bar' && renderBarChart()}
        {type === 'line' && renderLineChart()}
        {type === 'pie' && renderPieChart()}
      </div>
    </div>
  );
};

// Stats skeleton for metric cards
export const StatsSkeleton = ({ count = 4, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <SkeletonBase width="32px" height="32px" rounded={true} />
            <SkeletonBase width="60px" height="20px" />
          </div>
          <SkeletonBase height="2rem" width="80%" className="mb-2" />
          <SkeletonBase height="1rem" width="60%" />
        </div>
      ))}
    </div>
  );
};

// Form skeleton for questionnaire forms
export const FormSkeleton = ({ fields = 5, showSubmit = true, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <div className="mb-6">
        <SkeletonBase height="1.5rem" width="70%" className="mb-2" />
        <SkeletonBase height="1rem" width="90%" />
      </div>
      
      <div className="space-y-6">
        {Array.from({ length: fields }).map((_, index) => (
          <div key={index} className="space-y-2">
            <SkeletonBase height="1rem" width="40%" />
            <SkeletonBase height="2.5rem" width="100%" className="rounded-md" />
          </div>
        ))}
      </div>
      
      {showSubmit && (
        <div className="mt-8 flex justify-end space-x-4">
          <SkeletonBase height="2.5rem" width="100px" className="rounded-md" />
          <SkeletonBase height="2.5rem" width="120px" className="rounded-md bg-blue-200" />
        </div>
      )}
    </div>
  );
};

// List skeleton for item lists
export const ListSkeleton = ({ items = 5, showAvatar = false, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border divide-y ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="p-4 flex items-center space-x-4">
          {showAvatar && (
            <SkeletonBase width="40px" height="40px" rounded={true} />
          )}
          <div className="flex-1 space-y-2">
            <SkeletonBase height="1rem" width="60%" />
            <SkeletonBase height="0.875rem" width="80%" />
          </div>
          <SkeletonBase width="80px" height="32px" className="rounded-md" />
        </div>
      ))}
    </div>
  );
};

// Dashboard skeleton - combines multiple skeleton types
export const DashboardSkeleton = ({ className = '' }) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <SkeletonBase height="2rem" width="40%" className="mb-2" />
        <SkeletonBase height="1rem" width="60%" />
      </div>
      
      {/* Stats Cards */}
      <StatsSkeleton count={4} />
      
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton type="bar" />
        <ChartSkeleton type="pie" />
      </div>
      
      {/* Data Table */}
      <TableSkeleton rows={6} columns={5} />
    </div>
  );
};

// PropTypes
SkeletonBase.propTypes = {
  className: PropTypes.string,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  rounded: PropTypes.bool,
  animated: PropTypes.bool
};

CardSkeleton.propTypes = {
  showHeader: PropTypes.bool,
  lines: PropTypes.number,
  className: PropTypes.string
};

TableSkeleton.propTypes = {
  rows: PropTypes.number,
  columns: PropTypes.number,
  showHeader: PropTypes.bool,
  className: PropTypes.string
};

ChartSkeleton.propTypes = {
  type: PropTypes.oneOf(['bar', 'line', 'pie']),
  className: PropTypes.string
};

StatsSkeleton.propTypes = {
  count: PropTypes.number,
  className: PropTypes.string
};

FormSkeleton.propTypes = {
  fields: PropTypes.number,
  showSubmit: PropTypes.bool,
  className: PropTypes.string
};

ListSkeleton.propTypes = {
  items: PropTypes.number,
  showAvatar: PropTypes.bool,
  className: PropTypes.string
};

DashboardSkeleton.propTypes = {
  className: PropTypes.string
};

export default SkeletonBase;