import React, { useState, useCallback } from 'react';
import { Input, Badge } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useMantineTheme } from '@mantine/core';
import { isDateInitialized, getLotStatus } from '../utils';

const SearchByLotNumber = ({ allSteps }) => {
  // State for storing filtered steps and search input value
  const [filteredSteps, setFilteredSteps] = useState([]);
  const [searchLotNumber, setSearchLotNumber] = useState('');

  const theme = useMantineTheme();

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

  return (
    <div style={{ marginTop: '20px',  maxWidth:'80%' }} >
      <div style={{ position: 'relative' }}>
      <Input
        type="text"
        leftSection={<IconSearch size={16} />}
        radius="md"
        value={searchLotNumber}
        onChange={handleSearch}
        mt="md"
        placeholder="Inserisci il numero di lotto"
        styles={{input: {borderColor: theme.colors.brand[6],borderWidth: '2px',maxWidth: '500px',}}}
      />
      </div>
      {searchLotNumber && (
        <div>
          {filteredSteps.length > 0 ? (
            <>
              <h3 style={{ display: 'flex', alignItems: 'center' }}>
                Lotto {Number(searchLotNumber)}
                <Badge style={{ marginLeft: '10px', fontSize: '10px' }} color={getLotStatus(filteredSteps).color}>{getLotStatus(filteredSteps).text}</Badge>
                <Badge style={{ marginLeft: '10px', fontSize: '10px' }} color={filteredSteps[7][0] == "Stoccaggio refrigerato" ? 'blue' : 'green'}>
                  {filteredSteps[7][0] == "Stoccaggio refrigerato" ? 'Latte Intero' : 'Lunga Conservazione'}
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
