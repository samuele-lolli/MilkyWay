import React from 'react';
import { Input, CloseButton } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useMantineTheme } from '@mantine/core';

const SearchByLotNumber = ({ searchLotNumber, setSearchLotNumber, filteredSteps, setFilteredSteps, completedSteps }) => {
  const theme = useMantineTheme();

  const handleSearch = (event) => {
    const lotNumber = event.target.value;
    setSearchLotNumber(lotNumber);
    if (lotNumber) {
      const filtered = completedSteps.filter(step => String(step[6]) === lotNumber);
      setFilteredSteps(filtered);
    } else {
      setFilteredSteps([]);
    }
  };

  const clearSearch = () => {
    setSearchLotNumber('');
    setFilteredSteps([]);
  };

  const inputStyles = {
    input: {
      borderColor: theme.colors.brand[6], // #497DAC
      borderWidth: '2px',
      maxWidth: '500px'
    },
    wrapper: {
      maxWidth: '500px', // Imposta la larghezza massima del contenitore wrapper
    }
  };

  return (
    <div>
      <h2>Search by Lot Number</h2>
      <Input
        type="text"
        leftSection={<IconSearch size={16} />}
        radius="md"
        value={searchLotNumber}
        onChange={handleSearch}
        mt="md"
        placeholder="Inserisci il numero di lotto"
        rightSection={
          <CloseButton
            aria-label="Clear input"
            onClick={clearSearch}
            />
          }
          styles={inputStyles}
        />
        {filteredSteps.length === 0 && searchLotNumber && (
          <p>Nessun risultato trovato</p>
        )}
        {filteredSteps.length > 0 && (
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
              {filteredSteps.map((step, index) => (
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
        )}
      </div>
    );
  };
  
  export default SearchByLotNumber;