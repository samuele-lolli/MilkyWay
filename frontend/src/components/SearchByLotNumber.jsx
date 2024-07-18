import React, { useState, useCallback } from 'react';
import { Input, useMantineTheme } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import StepTable from './StepTable';

const SearchByLotNumber = ({ allSteps }) => {
  // States to manage filtered steps and searched lot number
  const [filteredSteps, setFilteredSteps] = useState([]);
  const [searchLotNumber, setSearchLotNumber] = useState('');

  const theme = useMantineTheme();

  // Handle search
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
    // Render search input and results
    <div style={{ marginTop: '20px', maxWidth: '80%' }} >
      <div style={{ position: 'relative' }}>
        <Input
          type="text"
          leftSection={<IconSearch size={16} />}
          radius="md"
          value={searchLotNumber}
          onChange={handleSearch}
          mt="md"
          placeholder="Inserisci il numero di lotto"
          styles={{ input: { borderColor: theme.colors.brand[6], borderWidth: '2px', maxWidth: '500px', } }}
        />
      </div>
      {searchLotNumber && (
        <div>
          {filteredSteps.length > 0 ? (
            <StepTable steps={filteredSteps} lotNumber={searchLotNumber} />
          ) : (
            <p>Nessun risultato trovato per il lotto numero {searchLotNumber}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchByLotNumber;
