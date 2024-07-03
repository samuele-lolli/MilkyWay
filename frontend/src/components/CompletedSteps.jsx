import React from 'react';
import { Table, Text } from '@mantine/core';

const CompletedSteps = ({ allSteps }) => {

    const groupStepsByLot = (steps) => {
        const lots = {};
        steps.forEach((step) => {
            const lotNumber = String(step[6]);
            if (!lots[lotNumber]) {
                lots[lotNumber] = [];
            }
            lots[lotNumber].push(step);
        });
        return lots;
    };

    const lots = groupStepsByLot(allSteps);
    const lotNumbers = Object.keys(lots).sort((a, b) => a - b);

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

    return (
        <div>
            {lotNumbers.map((lotNumber) => (
                <div key={lotNumber}>
                    <h3>Lotto {Number(lotNumber)}</h3>
                    <Text mb="md">
                        Stato del lotto: <Text component="span" fw={700} c={getLotStatus(lots[lotNumber]).color}>{getLotStatus(lots[lotNumber]).text}</Text>
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
                            {lots[lotNumber].map((step, index) => (
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