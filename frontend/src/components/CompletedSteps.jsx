import React, { useEffect, useMemo } from 'react';
import { Table, Text, Badge } from '@mantine/core';

const CompletedSteps = ({ allSteps }) => {
  const isDateInitialized = (timestamp) => {
    return new Date(parseInt(timestamp) * 1000).getTime() > new Date('1970-01-01T00:00:00Z').getTime();
  };

  const getLotStatus = (steps) => {
    const isFailed = steps.some(step => step.failed);
    if (isFailed) {
      return {
        text: 'Fallito',
        color: 'red'
      };
    }
    const isCompleted = steps.every(step => step[2]);
    return {
      text: isCompleted ? 'Completato' : 'In corso',
      color: isCompleted ? 'darkgreen' : 'orange'
    };
  };

  const lots = useMemo(() => {
    const groupedLots = {};
    allSteps.forEach((step) => {
      const lotNumber = String(step[6]);
      if (!groupedLots[lotNumber]) {
        groupedLots[lotNumber] = [];
      }
      groupedLots[lotNumber].push(step);
    });

    return Object.entries(groupedLots).map(([lotNumber, steps, isIntero]) => ({
      lotNumber,
      steps,
      isIntero,
    })).sort((a, b) => a.lotNumber - b.lotNumber);
  }, [allSteps]);

  return (
    <div>
      {lots.map(({ lotNumber, steps, isIntero }) => {
        const failedIndex = steps.findIndex(step => step.failed);
        return (
          <div key={lotNumber}>
            <h3 style={{ display: 'flex', alignItems: 'center'}}>
              Lotto {Number(lotNumber)}{' '}
              <Badge style={{ marginLeft: '10px', fontSize: '10px' }} color={getLotStatus(steps).color}>{getLotStatus(steps).text}</Badge>{' '}
              <Badge style={{ marginLeft: '10px', fontSize: '10px' }} color={isIntero ? 'blue' : 'green'}>{isIntero ? 'Latte Intero' : 'Lunga Conservazione'}</Badge>
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
                {steps.map((step, index) => (
                  <tr key={index}>
                    <td>{step[0]}</td>
                    <td>
                      {index === 1 || index === 5 || (index === 7 && step[0] === 'Stoccaggio refrigerato') || (index === 8 && step[0] === 'Distribuzione refrigerata') ? (
                        "Sensore di temperatura"
                      ) : (
                        step[1] === '0x0000000000000000000000000000000000000000' ? 'Non assegnato' : step[1]
                      )}
                    </td>
                    <td>{failedIndex !== -1 && index > failedIndex ? '-' : (step.failed ? 'Fallito' : (step[2] ? 'Completato' : 'In corso'))}</td>
                    <td>{isDateInitialized(step[3]) ? new Date(parseInt(step[3]) * 1000).toLocaleString() : 'Non iniziato'}</td>
                    <td>{isDateInitialized(step[4]) ? new Date(parseInt(step[4]) * 1000).toLocaleString() : 'Non terminato'}</td>
                    <td>{step[5]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
};

export default CompletedSteps;