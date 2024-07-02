import React, { useState, useEffect } from 'react';
import { TextInput, Button, Select, Table, Card, Grid } from '@mantine/core';
import 'react-toastify/dist/ReactToastify.css';

const RoleAssignment = ({ contract, account }) => {
  const [address, setAddress] = useState('');
  const [role, setRole] = useState('');
  const [assignedRoles, setAssignedRoles] = useState([]);
  const [removeAddress, setRemoveAddress] = useState('');
  const [assignError, setAssignError] = useState('');
  const [removeError, setRemoveError] = useState('');

  const handleAddressFocus = () => {
    setAssignError('');
  };

  const handleRemoveAddressFocus = () => {
    setRemoveError('');
  };

  useEffect(() => {
    const fetchAssignedRoles = async () => {
      try {
        const accounts = await contract.methods.getAllAccounts().call();
        const roles = await Promise.all(accounts.map(async (acc) => {
          const role = await contract.methods.roles(acc).call();
          return { account: acc, role: role.toString() };
        }));
        setAssignedRoles(roles.filter(role => role.role !== '0')); // Filtra gli account con ruolo 'None'
      } catch (error) {
        setAssignError("Errore durante il recupero dei ruoli assegnati");
        toast.error(error.message);
      }
    };

    fetchAssignedRoles();
  }, [contract]);

  const assignRole = async () => {
    try {
      const currentRole = (await contract.methods.roles(address).call()).toString();
      if (currentRole === role) {
        setAssignError("L'utente ha già questo ruolo");
        return;
      }
      const adminCount = assignedRoles.filter(role => role.role === '1').length;
      const isLastAdmin = currentRole === '1' && adminCount === 1;
      if (isLastAdmin) {
        setAssignError("Non puoi cambiare il ruolo dell'ultimo admin");
        return;
      }
      await contract.methods.assignRole(address, role).send({ from: account });
      setAssignedRoles((prevRoles) => {
        const updatedRoles = prevRoles.filter((assignedRole) => assignedRole.account !== address);
        updatedRoles.push({ account: address, role });
        return updatedRoles;
      });
    } catch (error) {
      setAssignError("Errore durante l'assegnazione del ruolo");
      toast.error(error.message);
    }
  };

  const removeRole = async () => {
    try {
      const adminCount = assignedRoles.filter(role => role.role === '1').length;
      const isLastAdmin = assignedRoles.some(role => role.account === removeAddress && role.role === '1') && adminCount === 1;

      if (isLastAdmin) {
        setRemoveError("Non puoi rimuovere l'ultimo admin rimasto");
        return;
      }

      await contract.methods.removeRole(removeAddress).send({ from: account });
      setAssignedRoles((prevRoles) => prevRoles.filter((assignedRole) => assignedRole.account !== removeAddress));
    } catch (error) {
      setRemoveError("Errore durante la rimozione del ruolo");
      toast.error(error.message);
    }
  };

  return (
    <div>
      <Grid gutter="lg">
        <Grid.Col span={6}>
          <Card shadow="sm" padding="lg" style={{ padding: '20px', marginRight: '20px' }}>
            <div style={{ padding: '5px 0' }}>
              <TextInput
                label="Indirizzo"
                placeholder="Indirizzo dell'account"
                radius="md" 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onFocus={handleAddressFocus}
              />
            </div>
            <div style={{ padding: '5px 0' }}>
              <Select
                label="Ruolo"
                placeholder="Seleziona un ruolo"
                radius="md" 
                data={[
                  { value: '1', label: 'Admin' },
                  { value: '2', label: 'Supervisor' },
                  { value: '3', label: 'Operator' },
                ]}
                value={role}
                onChange={setRole}
              />
            </div>
            {assignError && <p style={{ color: 'red' }}>{assignError}</p>}
            <div style={{ padding: '5px 0' }}>
              <Button radius="md" onClick={assignRole}>Assegna Ruolo</Button>
            </div>
          </Card>
        </Grid.Col>
        <Grid.Col span={6}>
          <Card shadow="sm" padding="lg" style={{ padding: '20px' }}>
            <div style={{ padding: '10px 0' }}>
              <TextInput
                label="Indirizzo per rimuovere il ruolo"
                placeholder="Indirizzo dell'account"
                radius="md" 
                value={removeAddress}
                onChange={(e) => setRemoveAddress(e.target.value)}
                onFocus={handleRemoveAddressFocus}
              />
            </div>
            {removeError && <p style={{ color: 'red' }}>{removeError}</p>}
            <div style={{ padding: '5px 0' }}>
              <Button radius="md" onClick={removeRole} color="red">Rimuovi Ruolo</Button>
            </div>
          </Card>
        </Grid.Col>
      </Grid>

      <Table>
        <thead>
          <tr>
            <th>Account</th>
            <th>Ruolo</th>
          </tr>
        </thead>
        <tbody>
          {assignedRoles.map((assignedRole, index) => (
            <tr key={index}>
              <td>{assignedRole.account}</td>
              <td>{assignedRole.role === '1' ? 'Admin' : assignedRole.role === '2' ? 'Supervisor' : 'Operator'}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default RoleAssignment;