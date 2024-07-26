import React, { useMemo, useState } from 'react';
import { Select } from '@mantine/core';
import StepTable from './StepTable';

const CompletedSteps = ({ allSteps }) => {
  // State for current filter ("All, "Intero", "Lunga Conservazione")
  const [filter, setFilter] = useState('all');

  // Memoize grouped and sorted lots
  const lots = useMemo(() => {
    const groupedLots = allSteps.reduce((acc, step) => {
      const lotNumber = String(step[6]);
      (acc[lotNumber] = acc[lotNumber] || []).push(step);
      return acc;
    }, {});

    return Object.entries(groupedLots).map(([lotNumber, steps]) => ({
      lotNumber,
      steps,
      isIntero: steps.some(step => step[0] === 'Stoccaggio refrigerato')
    })).sort((a, b) => {
      const numA = parseInt(a.lotNumber, 10);
      const numB = parseInt(b.lotNumber, 10);
      return numA - numB;
    });
  }, [allSteps]);

  // Filter lots based on selected filter
  const filteredLots = useMemo(() =>
    filter === 'all' ? lots : lots.filter(lot => lot.isIntero === (filter === '1')),
    [lots, filter]);

  // Filter options
  const filterOptions = [
    { value: 'all', label: 'Tutti' },
    { value: '1', label: 'Intero' },
    { value: '2', label: 'Lunga Conservazione' }
  ];

  return (
    // Render filter selector and tables of filtered lots
    <div style={{ marginTop: '10px', maxWidth: '80%' }}>
      <Select
        placeholder="Seleziona un filtro"
        radius="md"
        style={{ maxWidth: '500px' }}
        data={filterOptions}
        value={filter}
        onChange={(value) => setFilter(value || 'all')}
        defaultValue="all"
      />
      <div>
        {filteredLots.map(({ lotNumber, steps }) => (
          <StepTable key={lotNumber} steps={steps} lotNumber={lotNumber} />
        ))}
      </div>
    </div>
  );
};

export default CompletedSteps;