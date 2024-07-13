// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./MilkProcess.sol";

contract MilkProcessFactory {
    enum Role { None, Admin, Supervisor, Operator }

    address[] public processes;
    mapping(address => Role) public roles;
    address[] public users;
    uint lotNumber = 0;

    constructor() {
        roles[msg.sender] = Role.Admin;
        users.push(msg.sender);
    }

    function createNewProcess(uint quantity, bool isIntero) external onlyAdmin returns (address[] memory) {
        address[] memory newProcesses = new address[](quantity);
        for (uint i = 0; i < quantity; i++) {
            lotNumber = lotNumber + 1;
            MilkProcess newProcess = new MilkProcess(lotNumber, address(this), isIntero);
            processes.push(address(newProcess));
            newProcesses[i] = address(newProcess);
        }
        return newProcesses;
    }

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
            } else if(roles[users[i]] == Role.Operator) {
                userRoles[i] = "3";
            } else {
                userRoles[i] = "0";
            }
        }
        return (userRoles, users);
    }

    function getRole(address account) external view returns (Role) {
        return roles[account];
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

    modifier onlyAdmin() {
        require(roles[msg.sender] == Role.Admin, "Only admin can perform this action");
        _;
    }
}
