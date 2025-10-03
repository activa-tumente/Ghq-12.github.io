import React from 'react';

const SkipNavigation = () => {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <a
        href="#main-content"
        className="absolute top-0 left-0 z-50 bg-blue-600 text-white px-4 py-2 rounded-br-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform -translate-y-full focus:translate-y-0 transition-transform duration-200"
        onFocus={(e) => {
          e.target.style.transform = 'translateY(0)';
        }}
        onBlur={(e) => {
          e.target.style.transform = 'translateY(-100%)';
        }}
      >
        Saltar al contenido principal
      </a>
      <a
        href="#navigation"
        className="absolute top-0 left-32 z-50 bg-blue-600 text-white px-4 py-2 rounded-br-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform -translate-y-full focus:translate-y-0 transition-transform duration-200"
        onFocus={(e) => {
          e.target.style.transform = 'translateY(0)';
        }}
        onBlur={(e) => {
          e.target.style.transform = 'translateY(-100%)';
        }}
      >
        Saltar a la navegación
      </a>
    </div>
  );
};

export default SkipNavigation;