import React, { useState, useEffect, useCallback } from 'react';
import { TextInput, Button, Select, Text} from '@mantine/core';
import { toast } from 'react-toastify';
import { IconTrashXFilled } from '@tabler/icons-react';
import 'react-toastify/dist/ReactToastify.css';

const RoleAssignment = ({ contract, account, updateState }) => {
  // State for managing form inputs and assigned roles
  const [address, setAddress] = useState('');
  const [role, setRole] = useState('');
  const [assignedRoles, setAssignedRoles] = useState([]);
  const [assignError, setAssignError] = useState('');
  
  // Clear assign error on address input focus
  const handleAddressFocus = useCallback(() => {
    setAssignError('');
  }, []);

  // Fetch assigned roles from the contract
  useEffect(() => {
    const fetchAssignedRoles = async () => {
      try {
        const userRole = await contract.methods.getRole(account).call();
        setAddress(account);
        setRole(String(userRole));
        const rolesData = await contract.methods.getAllRoles().call();
        const roles = rolesData[0].map((role, index) => ({
          account: rolesData[1][index],
          role: role,
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
    removeRole(address);
  };

  // Assign a role to an address
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
      setAssignedRoles(prevRoles => [...prevRoles.filter(assignedRole => assignedRole.account !== address), { account: address, role }]);
      toast.success("Ruolo assegnato con successo");
      await updateState();
    } catch (error) {
      setAssignError("Errore durante l'assegnazione del ruolo");
      toast.error(error.message);
    }
  }, [contract, account, address, role, assignedRoles, updateState]);

  // Remove a role from an address
  const removeRole = useCallback(async (removeAddress) => {
    try {
      const adminCount = assignedRoles.filter(role => role.role === '1').length;
      const isLastAdmin = assignedRoles.some(role => role.account === removeAddress && role.role === '1') && adminCount === 1;
      if (isLastAdmin) {
        toast.error("Non puoi rimuovere l'ultimo admin rimasto")
        return;
      }else{
        await contract.methods.removeRole(removeAddress).send({ from: account });
        setAssignedRoles(prevRoles => prevRoles.filter(assignedRole => assignedRole.account !== removeAddress));
        toast.success("Ruolo rimosso con successo");
        updateState();
      }
    } catch (error) {
      toast.error("Errore durante la rimozione del ruolo")
      toast.error(error.message);
    }
  }, [contract, account, assignedRoles]);

  // Role options for the Select component
  const roleOptions = [
    { value: '1', label: 'Admin' },
    { value: '2', label: 'Supervisor' },
    { value: '3', label: 'Operator' },
  ];

  return (
    <div style={{ maxWidth: '60%'}} >
        <div id='assign-group'>
          <TextInput
            placeholder="Indirizzo dell'account"
            radius="md"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onFocus={handleAddressFocus}
            style={{ minWidth: '35%'}}
          />
            <Select
              placeholder="Ruolo"
              radius="md"
              data={roleOptions}
              value={role}
              defaultValue="1"
              onChange={(value) => setRole(value)}
              style={{ maxWidth: '13%', marginLeft:'10px'}}
            />
            <Button radius="md" style={{ maxWidth: '10%', marginLeft:'10px'}} onClick={assignRole}>Aggiungi</Button>
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
            {assignedRoles.map((assignedRole, index) => (
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

