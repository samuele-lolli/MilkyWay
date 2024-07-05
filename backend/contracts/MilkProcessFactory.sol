// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0; // Modificato da ^0.8.20 a ^0.8.19

import "./MilkProcess.sol";

/**
 * @title MilkProcessFactory
 * @dev Factory contract to create and manage MilkProcess contracts.
 */
contract MilkProcessFactory {
    enum Role { None, Admin, Supervisor }

    address[] public processes;
    address public owner;
    uint lotNumber = 0;
    mapping(address => Role) public roles;
    address[] public users;

    event ProcessCreated(address processAddress, uint lotNumber);

    constructor() {
        owner = msg.sender;
        roles[owner] = Role.Admin;
        users.push(owner);
    }

    /**
     * @notice Crea un nuovo contratto MilkProcess.
     * @dev Solo un utente con ruolo admin può creare nuovi processi.
     * @param quantity La quantità di nuovi processi da creare.
     * @return address[] Gli indirizzi dei contratti MilkProcess appena creati.
     */
    function createNewProcess(uint quantity) external onlyAdmin returns (address[] memory) {
        address[] memory newProcesses = new address[](quantity);
        for (uint i = 0; i < quantity; i++) {
            lotNumber = lotNumber + 1;
            MilkProcess newProcess = new MilkProcess(lotNumber, msg.sender, address(this));
            processes.push(address(newProcess));
            newProcesses[i] = address(newProcess);
            emit ProcessCreated(address(newProcess), lotNumber);
        }
        return newProcesses;
    }

    /**
     * @notice Retrieves all created process addresses.
     * @return address[] List of process addresses.
     */
    function getAllProcesses() external view returns (address[] memory) {
        return processes;
    }

    function getAllRoles() external view returns (string[] memory, address[] memory) {
        string[] memory userRoles = new string[](users.length);
        for (uint i = 0; i < users.length; i++) {
            if (roles[users[i]] == Role.Admin) {
                userRoles[i] = "1";
            } else if (roles[users[i]] == Role.Supervisor) {
                userRoles[i] = "2";
            } else {
                userRoles[i] = "0";
            }
        }
        return (userRoles, users);
    }

    function assignRole(address account, Role role) external onlyAdmin {
        roles[account] = role;
        if (!isAccountInList(account)) {
            users.push(account);
        }
    }

    function removeRole(address account) external onlyAdmin {
        require(roles[account] != Role.Admin || countAdmins() > 1, "Non puoi rimuovere l'ultimo admin");
        roles[account] = Role.None;
        removeAccountFromList(account);
    }

    function countAdmins() internal view returns (uint) {
    uint count = 0;
    for (uint i = 0; i < users.length; i++) {
        if (roles[users[i]] == Role.Admin) {
            count++;
        }
    }
    return count;
    }

    function isAccountInList(address account) internal view returns (bool) {
    for (uint i = 0; i < users.length; i++) {
        if (users[i] == account) {
            return true;
        }
    }
    return false;
    }

    function removeAccountFromList(address account) internal {
        for (uint i = 0; i < users.length; i++) {
            if (users[i] == account) {
                users[i] = users[users.length - 1];
                users.pop();
                break;
            }
        }
    }

    /**
     * @notice Retrieves the role of a specific address.
     * @param account The address to check.
     * @return Role The role of the specified address.
     */
    function getRole(address account) external view returns (Role) {
        return roles[account];
    }

    modifier onlyAdmin() {
        require(roles[msg.sender] == Role.Admin, "Only admin can perform this action");
        _;
    }
}
