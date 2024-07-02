import React, { useState, useEffect } from 'react';
import { TextInput, Button, Select, Table } from '@mantine/core';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const RoleAssignment = ({ contract, account }) => {
  const [address, setAddress] = useState('');
  const [role, setRole] = useState('');
  const [assignedRoles, setAssignedRoles] = useState([]);
  const [removeAddress, setRemoveAddress] = useState('');

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
        toast.error("Errore durante il recupero dei ruoli assegnati: " + error.message);
      }
    };

    fetchAssignedRoles();
  }, [contract]);

  const assignRole = async () => {
    try {
      const currentRole = await contract.methods.roles(address).call();
      if (currentRole === role) {
        toast.error("L'account ha già questo ruolo");
        return;
      }
      const adminCount = assignedRoles.filter(role => role.role === '1').length;
      const isLastAdmin = currentRole === '1' && adminCount === 1;
      if (isLastAdmin) {
        toast.error("Non puoi cambiare il ruolo dell'ultimo admin");
        return;
      }
      await contract.methods.assignRole(address, role).send({ from: account });
      toast.success('Ruolo assegnato con successo');
      setAssignedRoles((prevRoles) => {
        const updatedRoles = prevRoles.filter((assignedRole) => assignedRole.account !== address);
        updatedRoles.push({ account: address, role });
        return updatedRoles;
      });
    } catch (error) {
      toast.error("Errore durante l'assegnazione del ruolo: " + error.message);
    }
  };

  const removeRole = async () => {
    try {
      const adminCount = assignedRoles.filter(role => role.role === '1').length;
      const isLastAdmin = assignedRoles.some(role => role.account === removeAddress && role.role === '1') && adminCount === 1;

      if (isLastAdmin) {
        toast.error("Non puoi rimuovere l'ultimo admin rimasto");
        return;
      }

      await contract.methods.removeRole(removeAddress).send({ from: account });
      toast.success('Ruolo rimosso con successo');
      setAssignedRoles((prevRoles) => prevRoles.filter((assignedRole) => assignedRole.account !== removeAddress));
    } catch (error) {
      toast.error("Errore durante la rimozione del ruolo: " + error.message);
    }
  };

  return (
    <div>
      <div>
        <TextInput
          label="Indirizzo"
          placeholder="Indirizzo dell'account"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <Select
          label="Ruolo"
          placeholder="Seleziona un ruolo"
          data={[
            { value: '1', label: 'Admin' },
            { value: '2', label: 'Supervisor' },
            { value: '3', label: 'Operator' },
          ]}
          value={role}
          onChange={setRole}
        />
        <Button onClick={assignRole}>Assegna Ruolo</Button>
      </div>

      <div>
        <TextInput
          label="Indirizzo per rimuovere il ruolo"
          placeholder="Indirizzo dell'account"
          value={removeAddress}
          onChange={(e) => setRemoveAddress(e.target.value)}
        />
        <Button onClick={removeRole} color="red">Rimuovi Ruolo</Button>
      </div>

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