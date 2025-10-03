import React from 'react';
import { chartTheme } from '../../utils/chartConfig';

const ChartConfigTest = () => {
  console.log('chartTheme:', chartTheme);
  return (
    <div>
      <h1>Chart Config Test</h1>
      <p>Check the console to see if the chartTheme object is loaded correctly.</p>
    </div>
  );
};

export default ChartConfigTest;