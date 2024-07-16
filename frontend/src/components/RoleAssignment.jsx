import React, { useState, useEffect, useCallback } from 'react';
import { Group, TextInput, Button, Select, Card, Text, Title, Radio } from '@mantine/core';
import { toast } from 'react-toastify';
import { IconTrashXFilled } from '@tabler/icons-react';
import 'react-toastify/dist/ReactToastify.css';

const RoleAssignment = ({ contract, account, updateState}) => {
  const [address, setAddress] = useState('');
  const [role, setRole] = useState('');
  const [assignedRoles, setAssignedRoles] = useState([]);
  const [removeAddress, setRemoveAddress] = useState('');
  const [assignError, setAssignError] = useState('');
  const [removeError, setRemoveError] = useState('');
  const [filter, setFilter] = useState('all'); // New state for the filter
  const [action, setAction] = useState('assign'); // New state for the action

  const handleAddressFocus = useCallback(() => {
    setAssignError('');
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

  const handleClick = async (address) => {
    setRemoveAddress(address);
    removeRole();
  };

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
      await updateState();
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

  const filterOptions = [
    { value: 'all', label: 'Tutti' },
    { value: '1', label: 'Admin' },
    { value: '2', label: 'Supervisor' },
    { value: '3', label: 'Operator' },
  ];

  const filteredRoles = assignedRoles.filter((assignedRole) => {
    if (filter === 'all' || filter === null) return true;
    return assignedRole.role === filter;
  });

  return (
    <div style={{ marginLeft: '20px', maxWidth: '80%'}} >
        <div id='assign-group'>
          <TextInput
            placeholder="Indirizzo dell'account"
            radius="md"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onFocus={handleAddressFocus}
            style={{ minWidth: '32%'}}
          />
            <Select
              placeholder="Ruolo"
              radius="md"
              data={roleOptions}
              value={role}
              defaultValue="1"
              onChange={(value) => setRole(value || 'all')}
              style={{ maxWidth: '10%', marginLeft:'20px'}}
            />
            <Button radius="md" style={{ maxWidth: '10%', marginLeft:'20px'}} onClick={assignRole}>Aggiungi</Button>
            {assignError && <Text style={{ color: '#A81C07', marginLeft:'20px'}}>{assignError}</Text>}
            
        </div>
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Account</th>
              <th>Ruolo</th>
            </tr>
          </thead>
          <tbody>
            {filteredRoles.map((assignedRole, index) => (
              <tr key={index}>
                <td style={{textAlign:'center'}}><IconTrashXFilled color='#A81C07' onClick={() => handleClick(assignedRole.account)} style={{ cursor: 'pointer' }}/></td>
                <td>{assignedRole.account}</td>
                <td>{assignedRole.role === '1' ? 'Admin' : assignedRole.role === '2' ? 'Supervisor' : 'Operator'}</td>
              </tr>
            ))}
          </tbody>
        </table>
    </div>
  );
};

export default RoleAssignment;
