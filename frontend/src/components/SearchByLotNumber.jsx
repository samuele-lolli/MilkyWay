import React, { useState, useCallback } from 'react';
import { Input, CloseButton, Text, ActionIcon, Badge } from '@mantine/core';
import { IconSearch, IconRefresh } from '@tabler/icons-react';
import { useMantineTheme } from '@mantine/core';

const SearchByLotNumber = ({ allSteps }) => {
  // State for storing filtered steps and search input value
  const [filteredSteps, setFilteredSteps] = useState([]);
  const [searchLotNumber, setSearchLotNumber] = useState('');

  const theme = useMantineTheme();

  // Utility function to check if a date is valid
  const isDateInitialized = (timestamp) => {
    return new Date(parseInt(timestamp) * 1000).getTime() > new Date('1970-01-01T00:00:00Z').getTime();
  };

  // Get lot status based on filtered steps
  const getLotStatus = useCallback(() => {
    const isFailed = filteredSteps.some(step => step.failed);
    if (isFailed) {
      return { text: 'Fallito', color: '#A81C07' };
    }
    const isCompleted = filteredSteps.every(step => step.completed);
    return { text: isCompleted ? 'Completato' : 'In corso', color: isCompleted ? 'darkgreen' : 'orange' };
  }, [filteredSteps]);

  // Handle search input change
  const handleSearch = useCallback((event) => {
    const lotNumber = event.target.value;
    setSearchLotNumber(lotNumber);
    if (lotNumber) {
      const filtered = allSteps.filter(step => String(step[6]) === lotNumber);
      setFilteredSteps(filtered);
    } else {
      setFilteredSteps([]);
    }
  }, [allSteps]);

  // Clear search input
  const handleClear = useCallback(() => {
    setSearchLotNumber('');
    setFilteredSteps([]);
  }, []);

  // Refresh search results
  const handleRefresh = useCallback(() => {
    if (searchLotNumber) {
      const filtered = allSteps.filter(step => String(step[6]) === searchLotNumber);
      setFilteredSteps(filtered);
    }
  }, [allSteps, searchLotNumber]);

  const inputStyles = {
    input: {
      borderColor: theme.colors.brand[6],
      borderWidth: '2px',
      maxWidth: '500px',
    }
  };

  return (
    <div style={{ marginTop: '20px', marginLeft: '20px', maxWidth:'80%' }} >
      <div style={{ position: 'relative' }}>
      <Input
        type="text"
        leftSection={<IconSearch size={16} />}
        radius="md"
        value={searchLotNumber}
        onChange={handleSearch}
        mt="md"
        placeholder="Inserisci il numero di lotto"
        styles={{
          input: {
            ...inputStyles.input,// Assicurati che il contenitore input sia relativo
          }
        }}
      />
      </div>
      {searchLotNumber && (
        <div>
          {filteredSteps.length > 0 ? (
            <>
              <p>Risultati di ricerca per il lotto numero <b>{searchLotNumber}</b></p>
              <Text>
                <Badge color={getLotStatus().color}>{getLotStatus().text}</Badge>
              </Text>
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
                  {filteredSteps.map((step, index) => {
                    const failedIndex = filteredSteps.findIndex(step => step.failed);
                    return (
                      <tr key={index}>
                        <td>{step[0]}</td>
                        <td>
                          {(index === 1 || index === 5 || index === 7 || index === 8) ? (
                            "Sensore di temperatura"
                          ) : (
                            step[1] === '0x0000000000000000000000000000000000000000' ? 'Non assegnato' : step[1]
                          )}
                        </td>
                        <td>{failedIndex !== -1 && index > failedIndex ? '-' : (step.failed ? 'Fallito' : (step.completed ? 'Completato' : 'In corso'))}</td>
                        <td>{isDateInitialized(step[3]) ? new Date(parseInt(step[3]) * 1000).toLocaleString() : 'Non iniziato'}</td>
                        <td>{isDateInitialized(step[4]) ? new Date(parseInt(step[4]) * 1000).toLocaleString() : 'Non terminato'}</td>
                        <td>{step[5]}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          ) : (
            <p>Nessun risultato trovato per il lotto numero {searchLotNumber}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchByLotNumber;
