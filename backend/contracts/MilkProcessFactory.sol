// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./MilkProcess.sol";

// The MilkProcessFactory contract is responsible for creating and managing MilkProcess instances
// and handling user roles and permissions.
contract MilkProcessFactory {
    // Enum to define different user roles
    enum Role { None, Admin, Supervisor, Operator }

    // Array to store addresses of all MilkProcess contracts created by this factory
    address[] public processes;
    
    // Mapping from user addresses to their roles
    mapping(address => Role) public roles;
    
    // Array to store all user addresses
    address[] public users;
    
    // Counter to generate unique lot numbers for new MilkProcess contracts
    uint lotNumber = 0;

    // Constructor initializes the contract, sets the deployer as Admin, and adds them to the users list
    constructor() {
        roles[msg.sender] = Role.Admin;
        users.push(msg.sender);
    }

    // Creates new MilkProcess instances and returns their addresses
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

    // Returns the addresses of all MilkProcess contracts created by this factory
    function getAllProcesses() external view returns (address[] memory) {
        return processes;
    }

    // Returns the roles and addresses of all users
    function getAllRoles() external view returns (string[] memory, address[] memory) {
        string[] memory userRoles = new string[](users.length);
        for (uint i = 0; i < users.length; i++) {
            if (roles[users[i]] == Role.Admin) {
                userRoles[i] = "1";  // Admin role
            } else if (roles[users[i]] == Role.Supervisor) {
                userRoles[i] = "2";  // Supervisor role
            } else if(roles[users[i]] == Role.Operator) {
                userRoles[i] = "3";  // Operator role
            } else {
                userRoles[i] = "0";  // No role assigned
            }
        }
        return (userRoles, users);
    }

    // Returns the role of a specific user
    function getRole(address account) external view returns (Role) {
        return roles[account];
    }

    // Assigns a role to a user and adds them to the users list if not already present
    function assignRole(address account, Role role) external onlyAdmin {
        roles[account] = role;
        if (!isAccountInList(account)) {
            users.push(account);  // Add account to users list if not already present
        }
    }

    // Removes a role from a user and removes them from the users list
    function removeRole(address account) external onlyAdmin {
        require(roles[account] != Role.Admin || countAdmins() > 1, "Cannot remove the last admin");
        roles[account] = Role.None;
        removeAccountFromList(account);
    }

    // Counts the number of admins in the users list
    function countAdmins() internal view returns (uint) {
        uint count = 0;
        for (uint i = 0; i < users.length; i++) {
            if (roles[users[i]] == Role.Admin) {
                count++;
            }
        }
        return count;
    }

    // Checks if a specific account is in the users list
    function isAccountInList(address account) internal view returns (bool) {
        for (uint i = 0; i < users.length; i++) {
            if (users[i] == account) {
                return true;
            }
        }
        return false;
    }

    // Removes a specific account from the users list
    function removeAccountFromList(address account) internal {
        for (uint i = 0; i < users.length; i++) {
            if (users[i] == account) {
                users[i] = users[users.length - 1];  // Replace with the last element
                users.pop();  // Remove the last element
                break;
            }
        }
    }

    // Modifier to restrict access to functions to only admins
    modifier onlyAdmin() {
        require(roles[msg.sender] == Role.Admin, "Only admin can perform this action");
        _;
    }
}
