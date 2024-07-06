import React, { useState, useEffect, useCallback } from 'react';
import { TextInput, Button, Select, Table, Card, Grid, Text } from '@mantine/core';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const RoleAssignment = ({ contract, account }) => {
  const [address, setAddress] = useState('');
  const [role, setRole] = useState('');
  const [assignedRoles, setAssignedRoles] = useState([]);
  const [removeAddress, setRemoveAddress] = useState('');
  const [assignError, setAssignError] = useState('');
  const [removeError, setRemoveError] = useState('');

  const handleAddressFocus = useCallback(() => {
    setAssignError('');
  }, []);

  const handleRemoveAddressFocus = useCallback(() => {
    setRemoveError('');
  }, []);

  useEffect(() => {
    const fetchAssignedRoles = async () => {
      try {
        const rolesData = await contract.methods.getAllRoles().call();
        const roles = rolesData[0].map((role, index) => ({
          account: rolesData[1][index],
          role: role
        }));
        setAssignedRoles(roles.filter(role => role.role !== '0'));
      } catch (error) {
        setAssignError("Errore durante il recupero dei ruoli assegnati");
        toast.error(error.message);
      }
    };

    fetchAssignedRoles();
  }, [contract]);

  const assignRole = useCallback(async () => {
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
      toast.success("Ruolo assegnato con successo");
    } catch (error) {
      setAssignError("Errore durante l'assegnazione del ruolo");
      toast.error(error.message);
    }
  }, [contract, account, address, role, assignedRoles]);

  const removeRole = useCallback(async () => {
    try {
      const adminCount = assignedRoles.filter(role => role.role === '1').length;
      const isLastAdmin = assignedRoles.some(role => role.account === removeAddress && role.role === '1') && adminCount === 1;

      if (isLastAdmin) {
        setRemoveError("Non puoi rimuovere l'ultimo admin rimasto");
        return;
      }

      await contract.methods.removeRole(removeAddress).send({ from: account });
      setAssignedRoles((prevRoles) => prevRoles.filter((assignedRole) => assignedRole.account !== removeAddress));
      toast.success("Ruolo rimosso con successo");
    } catch (error) {
      setRemoveError("Errore durante la rimozione del ruolo");
      toast.error(error.message);
    }
  }, [contract, account, removeAddress, assignedRoles]);

  const roleOptions = [
    { value: '1', label: 'Admin' },
    { value: '2', label: 'Supervisor' },
    { value: '3', label: 'Operator' },
  ];

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
                data={roleOptions}
                value={role}
                onChange={setRole}
              />
            </div>
            {assignError && <Text color="red">{assignError}</Text>}
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
            {removeError && <Text color="red">{removeError}</Text>}
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
