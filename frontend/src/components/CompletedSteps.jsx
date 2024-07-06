import React, { useMemo } from 'react';
import { Table, Text } from '@mantine/core';

const CompletedSteps = ({ allSteps }) => {

  const isDateInitialized = (timestamp) => {
    return new Date(parseInt(timestamp) * 1000).getTime() > new Date('1970-01-01T00:00:00Z').getTime();
  };

  const getLotStatus = (steps) => {
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

    return Object.entries(groupedLots).map(([lotNumber, steps]) => ({
      lotNumber,
      steps,
    })).sort((a, b) => a.lotNumber - b.lotNumber);
  }, [allSteps]);

  return (
    <div>
      {lots.map(({ lotNumber, steps }) => (
        <div key={lotNumber}>
          <h3>Lotto {Number(lotNumber)}</h3>
          <Text mb="md">
            Stato del lotto: <Text component="span" fw={700} c={getLotStatus(steps).color}>{getLotStatus(steps).text}</Text>
          </Text>
          <Table>
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
                  <td>{step[1] === '0x0000000000000000000000000000000000000000' ? 'Non assegnato' : step[1]}</td>
                  <td>{step[2] ? 'Completato' : 'In corso'}</td>
                  <td>{isDateInitialized(step[3]) ? new Date(parseInt(step[3]) * 1000).toLocaleString() : 'Non iniziato'}</td>
                  <td>{isDateInitialized(step[4]) ? new Date(parseInt(step[4]) * 1000).toLocaleString() : 'Non terminato'}</td>
                  <td>{step[5]}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      ))}
    </div>
  );
};

export default CompletedSteps;
