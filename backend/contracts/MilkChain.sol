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

    Step[] public steps;
    uint public currentStepIndex;
    Step[] public completedSteps;
    uint public currentLotNumber;

    event StepCompleted(uint stepIndex, string name, uint startTime, uint endTime, uint lotNumber);
    event ProcessReset(uint newLotNumber);

    constructor() {
        currentLotNumber = 1; // Initialize the lot number to 1
        initializeSteps();
    }

    function initializeSteps() internal {
        steps.push(Step("Raccolta", address(0), false, 0, 0, "", currentLotNumber));
        steps.push(Step("Trasporto", address(0), false, 0, 0, "", currentLotNumber));
        steps.push(Step("Lavorazione", address(0), false, 0, 0, "", currentLotNumber));
        steps.push(Step("Confezionamento", address(0), false, 0, 0, "", currentLotNumber));
        steps.push(Step("Distribuzione", address(0), false, 0, 0, "", currentLotNumber));
        currentStepIndex = 0;
    }

    function assignSupervisor(uint stepIndex, address supervisor) public {
        require(stepIndex < steps.length, "Step index out of range");
        steps[stepIndex].supervisor = supervisor;
    }

    function completeStep(string memory _location) public {
        require(currentStepIndex < steps.length, "All steps are already completed");
        Step storage step = steps[currentStepIndex];
        require(msg.sender == step.supervisor, "Only assigned supervisor can complete the step");
        step.completed = true;
        step.endTime = block.timestamp;
        
        if (currentStepIndex == 0) {
            step.startTime = block.timestamp;
        } else {
            step.startTime = steps[currentStepIndex - 1].endTime;
        }

        require(isReasonableLocation(_location), "Location is not reasonable for this step");

        step.location = _location;
        step.lotNumber = currentLotNumber;  // Assign current lot number to the step

        completedSteps.push(step);

        emit StepCompleted(currentStepIndex, step.name, step.startTime, step.endTime, step.lotNumber);
        currentStepIndex++;

        if (currentStepIndex >= steps.length) {
            resetProcess();
        }
    }


    function isReasonableLocation(string memory _location) internal pure returns (bool) {
        return bytes(_location).length > 0; // Check that the location is not empty
    }

    function resetProcess() internal {
        delete steps;
        initializeSteps();
        currentLotNumber++;
        emit ProcessReset(currentLotNumber);
    }

    function getStepsLength() public view returns (uint) {
        return steps.length;
    }

    function getStep(uint index) public view returns (string memory, address, bool, uint, uint, string memory, uint) {
        require(index < steps.length, "Step index out of range");
        Step storage step = steps[index];
        return (step.name, step.supervisor, step.completed, step.startTime, step.endTime, step.location, step.lotNumber);
    }

    function getCompletedStepsLength() public view returns (uint) {
        return completedSteps.length;
    }

    function getCompletedStep(uint index) public view returns (string memory, address, bool, uint, uint, string memory, uint) {
        require(index < completedSteps.length, "Completed step index out of range");
        Step storage step = completedSteps[index];
        return (step.name, step.supervisor, step.completed, step.startTime, step.endTime, step.location, step.lotNumber);
    }

    function isProcessCompleted() public view returns (bool) {
        return currentStepIndex >= steps.length;
    }

    function getCurrentLotNumber() public view returns (uint) {
        return currentLotNumber;
    }

    function setStepName(uint index, string memory name) public {
        require(index < steps.length, "Step index out of range");
        steps[index].name = name;
    }

    function setStepSupervisor(uint index, address supervisor) public {
        require(index < steps.length, "Step index out of range");
        steps[index].supervisor = supervisor;
    }

    function setStepLocation(uint index, string memory location) public {
        require(index < steps.length, "Step index out of range");
        steps[index].location = location;
    }

    function setStepCompleted(uint index, bool completed) public {
        require(index < steps.length, "Step index out of range");
        steps[index].completed = completed;
    }

    function setStepStartTime(uint index, uint startTime) public {
        require(index < steps.length, "Step index out of range");
        steps[index].startTime = startTime;
    }

    function setStepEndTime(uint index, uint endTime) public {
        require(index < steps.length, "Step index out of range");
        steps[index].endTime = endTime;
    }

    function setLotNumber(uint index, uint lotNumber) public {
        require(index < steps.length, "Step index out of range");
        steps[index].lotNumber = lotNumber;
    }
}
