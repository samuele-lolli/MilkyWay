import React, { useState, useEffect } from 'react';
import { TextInput, Button, Select, Table } from '@mantine/core';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const RoleAssignment = ({ contract, account }) => {
  const [address, setAddress] = useState('');
  const [role, setRole] = useState('');
  const [assignedRoles, setAssignedRoles] = useState([]);

  useEffect(() => {
    const fetchAssignedRoles = async () => {
      try {
        const accounts = await contract.methods.getAllAccounts().call();
        const roles = await Promise.all(accounts.map(async (acc) => {
          const role = await contract.methods.roles(acc).call();
          return { account: acc, role: role.toString() };
        }));
        setAssignedRoles(roles);
      } catch (error) {
        toast.error("Errore durante il recupero dei ruoli assegnati: " + error.message);
      }
    };

    fetchAssignedRoles();
  }, [contract]);

  const assignRole = async () => {
    try {
      await contract.methods.assignRole(address, role).send({ from: account });
      toast.success('Ruolo assegnato con successo');
      setAssignedRoles((prevRoles) => {
        const updatedRoles = prevRoles.map((assignedRole) =>
          assignedRole.account === address ? { account: address, role } : assignedRole
        );
        if (!updatedRoles.some((assignedRole) => assignedRole.account === address)) {
          updatedRoles.push({ account: address, role });
        }
        return updatedRoles;
      });
    } catch (error) {
      toast.error("Errore durante l'assegnazione del ruolo: " + error.message);
    }
  };

  return (
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