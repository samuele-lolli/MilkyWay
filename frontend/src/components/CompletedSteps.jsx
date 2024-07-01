import React from 'react';

const CompletedSteps = ({ completedSteps }) => {

    const groupStepsByLot = (completedSteps) => {
        const lots = {};
        completedSteps.forEach((step) => {
            const lotNumber = String(step[6]);
            if (!lots[lotNumber]) {
                lots[lotNumber] = [];
            }
            lots[lotNumber].push(step);
        });
        return lots;
    };

    const lots = groupStepsByLot(completedSteps);
    const lotNumbers = Object.keys(lots).sort((a, b) => a - b);

    return (
        <div>
            <h2>Completed Steps</h2>
            {lotNumbers.map((lotNumber) => (
                <div key={lotNumber}>
                    <h3>Lotto {Number(lotNumber)}</h3>
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
                            {lots[lotNumber].map((step, index) => (
                                <tr key={index}>
                                    <td>{step[0]}</td>
                                    <td>{step[1]}</td>
                                    <td>{step[2] ? 'Completed' : 'Pending'}</td>
                                    <td>{step[3] !== '0' ? new Date(parseInt(step[3]) * 1000).toLocaleString() : '-'}</td>
                                    <td>{step[4] !== '0' ? new Date(parseInt(step[4]) * 1000).toLocaleString() : '-'}</td>
                                    <td>{step[5]}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}
        </div>
    );
};

export default CompletedSteps;