import React from 'react';
import { Badge } from '@mantine/core';

const StepTable = ({ steps, lotNumber }) => {

    // Check if a date is initialized
    const isDateInitialized = (timestamp) => {
        return new Date(parseInt(timestamp, 10) * 1000).getTime() > new Date('1970-01-01T00:00:00Z').getTime();
    };

    // Get the status color and text of the lot
    const getLotStatus = (steps) => {
        const isFailed = steps.some(step => step.failed);
        if (isFailed) {
            return { text: 'Fallito', color: '#A81C07' };
        }
        const isCompleted = steps.every(step => step[2]);
        return {
            text: isCompleted ? 'Completato' : 'In corso',
            color: isCompleted ? 'darkgreen' : 'orange'
        };
    };

    // Calculate lot status and other information about steps
    const { text: lotStatusText, color: lotStatusColor } = getLotStatus(steps);
    const failedIndex = steps.findIndex(step => step.failed);
    const isIntero = steps.some(step => step[0] === 'Stoccaggio refrigerato');

    return (
        // Render the table with lot information and its steps
        <div>
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
};

export default StepTable;