// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MilkChain {
    enum Role {None, Admin, Supervisor, Operator}
    
    struct Step {
        string name;
        address supervisor;
        bool completed;
        uint startTime;
        uint endTime;
        string location;
        uint lotNumber;
    }

    struct Process {
        Step[] steps;
        uint currentStepIndex;
        uint lotNumber;
    }

    mapping(uint => Process) public processes;
    mapping(address => Role) public roles;
    address[] private accountList;
    uint public currentLotNumber;
    address public owner;

    constructor() {
        owner = msg.sender;
        roles[owner] = Role.Admin;
        currentLotNumber = 1;
        accountList.push(owner);
    }

    function createNewProcess() public onlyAdmin {
        Process storage newProcess = processes[currentLotNumber];
        newProcess.lotNumber = currentLotNumber;
        initializeSteps(newProcess);
        newProcess.steps[0].startTime = block.timestamp;
        currentLotNumber++;
    }

    function initializeSteps(Process storage process) internal {
        process.steps.push(Step("Raccolta", address(0), false, 0, 0, "", process.lotNumber));
        process.steps.push(Step("Trasporto", address(0), false, 0, 0, "", process.lotNumber));
        process.steps.push(Step("Lavorazione", address(0), false, 0, 0, "", process.lotNumber));
        process.steps.push(Step("Confezionamento", address(0), false, 0, 0, "", process.lotNumber));
        process.steps.push(Step("Distribuzione", address(0), false, 0, 0, "", process.lotNumber));
        process.currentStepIndex = 0;
    }

    function assignSupervisor(uint lotNumber, uint stepIndex, address supervisor) public onlyAdmin {
        Process storage process = processes[lotNumber];
        require(stepIndex < process.steps.length, "Step index out of range");
        process.steps[stepIndex].supervisor = supervisor;
    }

    function completeStep(uint lotNumber, string memory _location) public onlySupervisor {
        Process storage process = processes[lotNumber];
        require(process.currentStepIndex < process.steps.length, "All steps are already completed");
        Step storage step = process.steps[process.currentStepIndex];
        require(msg.sender == step.supervisor, "Only assigned supervisor can complete the step");
        step.completed = true;
        step.endTime = block.timestamp;

        if (process.currentStepIndex > 0) {
            step.startTime = process.steps[process.currentStepIndex - 1].endTime;
        }

        require(isReasonableLocation(_location), "Location is not reasonable for this step");

        step.location = _location;
        step.lotNumber = process.lotNumber;

        process.currentStepIndex++;

        if (process.currentStepIndex < process.steps.length) {
            process.steps[process.currentStepIndex].startTime = block.timestamp;
        }
    }

    function isReasonableLocation(string memory _location) internal pure returns (bool) {
        return bytes(_location).length > 0;
    }

    function isProcessCompleted(uint lotNumber) public view returns (bool) {
        Process storage process = processes[lotNumber];
        return process.currentStepIndex >= process.steps.length;
    }

    function getStepsLength(uint lotNumber) public view returns (uint) {
        return processes[lotNumber].steps.length;
    }

    function getStep(uint lotNumber, uint index) public view returns (string memory, address, bool, uint, uint, string memory, uint) {
        Process storage process = processes[lotNumber];
        require(index < process.steps.length, "Step index out of range");
        Step storage step = process.steps[index];
        return (step.name, step.supervisor, step.completed, step.startTime, step.endTime, step.location, step.lotNumber);
    }

    function getCurrentStepIndex(uint lotNumber) public view returns (uint) {
        return processes[lotNumber].currentStepIndex;
    }

    function getCurrentLotNumber() public view returns (uint) {
        return currentLotNumber;
    }

    function getLot(uint lotNumber) public view returns (Step[] memory) {
        Process storage process = processes[lotNumber];
        uint count = 0;
        for (uint i = 0; i < process.steps.length; i++) {
            if (process.steps[i].completed) {
                count++;
            }
        }

        Step[] memory lotSteps = new Step[](count);
        uint index = 0;
        for (uint i = 0; i < process.steps.length; i++) {
            if (process.steps[i].completed) {
                lotSteps[index] = process.steps[i];
                index++;
            }
        }
        return lotSteps;
    }

    function getAllAccounts() public view returns (address[] memory) {
        return accountList;
    }

    function assignRole(address account, Role role) public onlyAdmin {
        require(roles[account] != Role.Admin || countAdmins() > 1, "Non puoi cambiare il ruolo dell'ultimo admin");
        require(roles[account] != role, "Questo account ha gia questo ruolo");
        roles[account] = role;
        if (!isAccountInList(account)) {
            accountList.push(account);
        }
    }

    function removeRole(address account) public onlyAdmin {
        require(roles[account] != Role.Admin || countAdmins() > 1, "Non puoi rimuovere l'ultimo admin");
        roles[account] = Role.None;
        removeAccountFromList(account);
    }

     function countAdmins() internal view returns (uint) {
        uint count = 0;
        for (uint i = 0; i < accountList.length; i++) {
            if (roles[accountList[i]] == Role.Admin) {
                count++;
            }
        }
        return count;
    }

    function isAccountInList(address account) internal view returns (bool) {
        for (uint i = 0; i < accountList.length; i++) {
            if (accountList[i] == account) {
                return true;
            }
        }
        return false;
    }

    function removeAccountFromList(address account) internal {
        for (uint i = 0; i < accountList.length; i++) {
            if (accountList[i] == account) {
                accountList[i] = accountList[accountList.length - 1];
                accountList.pop();
                break;
            }
        }
    }

    modifier onlyAdmin() {
        require(roles[msg.sender] == Role.Admin, "Only admin can perform this action");
        _;
    }

    modifier onlySupervisor() {
        require(roles[msg.sender] == Role.Supervisor, "Only supervisor can perform this action");
        _;
    }
}
