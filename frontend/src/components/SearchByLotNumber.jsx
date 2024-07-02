import React from 'react';
import { Input, CloseButton, Table, Text, ActionIcon } from '@mantine/core';
import { IconSearch, IconRefresh } from '@tabler/icons-react';
import { useMantineTheme } from '@mantine/core';

const SearchByLotNumber = ({ searchLotNumber, setSearchLotNumber, filteredSteps, setFilteredSteps, allSteps }) => {
  const theme = useMantineTheme();

  const handleSearch = (event) => {
    const lotNumber = event.target.value;
    setSearchLotNumber(lotNumber);
    if (lotNumber) {
      const filtered = allSteps.filter(step => String(step[6]) === lotNumber);
      setFilteredSteps(filtered);
    } else {
      setFilteredSteps([]);
    }
  };

  const handleClear = () => {
    setSearchLotNumber('');
    setFilteredSteps([]);
  };

  const handleRefresh = () => {
    if (searchLotNumber) {
      const filtered = allSteps.filter(step => String(step[6]) === searchLotNumber);
      setFilteredSteps(filtered);
    }
  };

  const inputStyles = {
    input: {
      borderColor: theme.colors.brand[6], // #497DAC
      borderWidth: '2px',
      maxWidth: '500px'// Spazio per il pulsante di chiusura
    },
    wrapper: {
      maxWidth: '500px', // Imposta la larghezza massima del contenitore wrapper
      position: 'relative'
    }
  };

  const actionButtonStyles = {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 1 // Assicurati che i pulsanti siano sopra l'input
  };

  const actionIconStyles = {
    color: theme.colors.gray[6],
    '&:hover': {
      backgroundColor: theme.colors.gray[0]
    }
  };

  const isDateInitialized = (timestamp) => {
    return new Date(parseInt(timestamp) * 1000).getTime() > new Date('1970-01-01T00:00:00Z').getTime();
  };

  const getLotStatus = () => {
    const isCompleted = filteredSteps.every(step => step[2]);
    return {
      text: isCompleted ? 'Completato' : 'In corso',
      color: isCompleted ? 'darkgreen' : 'orange'
    };
  };

  return (
    <div>
      <div style={inputStyles.wrapper}>
        <Input
          type="text"
          leftSection={<IconSearch size={16} />}
          radius="md"
          value={searchLotNumber}
          onChange={handleSearch}
          mt="md"
          placeholder="Inserisci il numero di lotto"
          styles={{
            ...inputStyles,
            input: {
              ...inputStyles.input,
              paddingRight: '80px' // Aumentato per fare spazio al pulsante di refresh
            }
          }}
        />
        {searchLotNumber && (
          <>
            <ActionIcon
              aria-label="Refresh search"
              onClick={handleRefresh}
              style={{ ...actionButtonStyles, right: '40px' }}
              variant="subtle"
              color="gray"
              sx={actionIconStyles}
            >
              <IconRefresh size={16} />
            </ActionIcon>
            <CloseButton
              aria-label="Clear input"
              onClick={handleClear}
              style={actionButtonStyles}
              variant="subtle"
              color="gray"
            />
          </>
        )}
      </div>
      {filteredSteps.length > 0 && searchLotNumber && (
        <div>
          <p>Risultati di ricerca per il lotto numero <b>{searchLotNumber}</b></p>
          <Text>
            Stato del lotto: <Text component="span" fw={700} c={getLotStatus().color}>{getLotStatus().text}</Text>
          </Text>
        </div>
      )}
      {filteredSteps.length === 0 && searchLotNumber && (
        <p>Nessun risultato trovato per il lotto numero {searchLotNumber}</p>
      )}
      {filteredSteps.length > 0 && (
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
            {filteredSteps.map((step, index) => (
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
      )}
    </div>
  );
};

export default SearchByLotNumber;
