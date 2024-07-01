// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MilkChain {
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
    uint public currentLotNumber;

    event StepCompleted(uint lotNumber, uint stepIndex, string name, uint startTime, uint endTime);
    event ProcessReset(uint newLotNumber);

    constructor() {
        currentLotNumber = 1; 
    }

    function createNewProcess() public {
        Process storage newProcess = processes[currentLotNumber];
        newProcess.lotNumber = currentLotNumber;
        initializeSteps(newProcess);
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

    function assignSupervisor(uint lotNumber, uint stepIndex, address supervisor) public {
        Process storage process = processes[lotNumber];
        require(stepIndex < process.steps.length, "Step index out of range");
        process.steps[stepIndex].supervisor = supervisor;
    }

    function completeStep(uint lotNumber, string memory _location) public {
        Process storage process = processes[lotNumber];
        require(process.currentStepIndex < process.steps.length, "All steps are already completed");
        Step storage step = process.steps[process.currentStepIndex];
        require(msg.sender == step.supervisor, "Only assigned supervisor can complete the step");
        step.completed = true;
        step.endTime = block.timestamp;
        
        if (process.currentStepIndex == 0) {
            step.startTime = block.timestamp;
        } else {
            step.startTime = process.steps[process.currentStepIndex - 1].endTime;
        }

        require(isReasonableLocation(_location), "Location is not reasonable for this step");

        step.location = _location;
        step.lotNumber = process.lotNumber;

        emit StepCompleted(process.lotNumber, process.currentStepIndex, step.name, step.startTime, step.endTime);
        process.currentStepIndex++;

        if (process.currentStepIndex >= process.steps.length) {
            emit ProcessReset(process.lotNumber);
        }
    }

    function isReasonableLocation(string memory _location) internal pure returns (bool) {
        return bytes(_location).length > 0;
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

    function isProcessCompleted(uint lotNumber) public view returns (bool) {
        Process storage process = processes[lotNumber];
        return process.currentStepIndex >= process.steps.length;
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
}