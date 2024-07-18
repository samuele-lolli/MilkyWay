// Check if date is already initialized
export const isDateInitialized = (timestamp) => {
    return new Date(parseInt(timestamp, 10) * 1000).getTime() > new Date('1970-01-01T00:00:00Z').getTime();
};

// Get lot status based on steps
export const getLotStatus = (steps) => {
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