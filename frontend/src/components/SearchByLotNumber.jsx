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

  const handleClear = () => {
    setSearchLotNumber('');
    setFilteredSteps([]);
  };

  const inputStyles = {
    input: {
      borderColor: theme.colors.brand[6], // #497DAC
      borderWidth: '2px',
      maxWidth: '500px',
      paddingRight: '40px' // Spazio per il pulsante di chiusura
    },
    wrapper: {
      maxWidth: '500px', // Imposta la larghezza massima del contenitore wrapper
      position: 'relative' // Assicurati che il wrapper abbia un contesto di posizionamento
    }
  };

  const closeButtonStyles = {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 1 // Assicurati che il pulsante sia sopra l'input
  };

  return (
    <div>
      <h2>Search by Lot Number</h2>
      <div style={inputStyles.wrapper}>
        <Input
          type="text"
          leftSection={<IconSearch size={16} />}
          radius="md"
          value={searchLotNumber}
          onChange={handleSearch}
          mt="md"
          placeholder="Inserisci il numero di lotto"
          styles={inputStyles}
        />
        {searchLotNumber && (
          <CloseButton
            aria-label="Clear input"
            onClick={handleClear}
            style={closeButtonStyles}
          />
        )}
      </div>
      {filteredSteps.length > 0 && searchLotNumber && (
        <p>Search results for lot number <b>{searchLotNumber}</b></p>
      )}
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
