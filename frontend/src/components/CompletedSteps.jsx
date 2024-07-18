import React, { useMemo, useState } from 'react';
import { Select, Badge } from '@mantine/core';
import { isDateInitialized, getLotStatus } from '../utils';

const CompletedSteps = ({ allSteps }) => {
  const [filter, setFilter] = useState('assign'); // New state for the action
  // Group steps by lot number and add properties
  const lots = useMemo(() => {
    const groupedLots = allSteps.reduce((acc, step) => {
      const lotNumber = String(step[6]);
      if (!acc[lotNumber]) {
        acc[lotNumber] = [];
      }
      acc[lotNumber].push(step);
      return acc;
    }, {});

    return Object.entries(groupedLots).map(([lotNumber, steps]) => ({
      lotNumber,
      steps,
      isIntero: steps.some(step => step[0] === 'Stoccaggio refrigerato')
    })).sort((a, b) => a.lotNumber - b.lotNumber);
  }, [allSteps]);

  const filteredLots = useMemo(() => {
    if (filter === 'all') return lots;
    const isInteroFilter = filter === '1';
    return lots.filter(lot => lot.isIntero === isInteroFilter);
  }, [lots, filter]);

  const filterOptions = [
    { value: 'all', label: 'Tutti' },
    { value: '1', label: 'Intero' },
    { value: '2', label: 'Lunga Conservazione' }
  ];

  return (
    <div style={{ marginTop: '10px', maxWidth: '80%' }}>
      <Select
        placeholder="Seleziona un filtro"
        radius="md"
        style={{maxWidth: '500px'}}
        data={filterOptions}
        value={filter}
        onChange={(value) => setFilter(value || 'all')}
        defaultValue="all"
      />
      <div>
      {filteredLots.map(({ lotNumber, steps, isIntero }) => {
          const { text: lotStatusText, color: lotStatusColor } = getLotStatus(steps);
          const failedIndex = steps.findIndex(step => step.failed);
          return (
            <div key={lotNumber}>
              <h3 style={{ display: 'flex', alignItems: 'center' }}>
                Lotto {Number(lotNumber)}
                <Badge style={{ marginLeft: '10px', fontSize: '10px' }} color={lotStatusColor}>{lotStatusText}</Badge>
                <Badge style={{ marginLeft: '10px', fontSize: '10px' }} color={isIntero ? 'blue' : 'green'}>
                  {isIntero ? 'Latte Intero' : 'Lunga Conservazione'}
                </Badge>
              </h3>
              <table>
                <thead>
                  <tr>
                    <th>Step</th>
                    <th>Supervisor</th>
                    <th>Status</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {steps.map((step, index) => {
                    const stepName = step[0];
                    const supervisor = step[1];
                    const completed = step[2];
                    const startTime = step[3];
                    const endTime = step[4];
                    const location = step[5];

                    const supervisorDisplay = [1, 5].includes(index) || (index === 7 && stepName === 'Stoccaggio refrigerato') || (index === 8 && stepName === 'Distribuzione refrigerata')
                      ? 'Sensore di temperatura'
                      : supervisor === '0x0000000000000000000000000000000000000000' ? 'Non assegnato' : supervisor;
                    
                    const statusDisplay = failedIndex !== -1 && index > failedIndex ? '-' : (step.failed ? 'Fallito' : (completed ? 'Completato' : 'In corso'));
                    const startDisplay = isDateInitialized(startTime) ? new Date(parseInt(startTime, 10) * 1000).toLocaleString() : 'Non iniziato';
                    const endDisplay = isDateInitialized(endTime) ? new Date(parseInt(endTime, 10) * 1000).toLocaleString() : 'Non terminato';

                    return (
                      <tr key={index}>
                        <td>{stepName}</td>
                        <td>{supervisorDisplay}</td>
                        <td>{statusDisplay}</td>
                        <td>{startDisplay}</td>
                        <td>{endDisplay}</td>
                        <td>{location}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
    </div>
    </div>
  );
};

export default CompletedSteps;
