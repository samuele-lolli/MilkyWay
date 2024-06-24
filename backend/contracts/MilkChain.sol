// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MilkChain {
    struct Step {
        string name;
        address supervisor;
        bool completed;
        uint startTime;
        uint endTime;
    }

    Step[] public steps;
    uint public currentStepIndex;
    Step[] public completedSteps;

    event StepCompleted(uint stepIndex, string name, uint startTime, uint endTime);
    event ProcessReset();

    constructor() {
        initializeSteps();
    }

    function initializeSteps() internal {
        steps.push(Step("Raccolta", address(0), false, 0, 0));
        steps.push(Step("Trasporto", address(0), false, 0, 0));
        steps.push(Step("Lavorazione", address(0), false, 0, 0));
        steps.push(Step("Confezionamento", address(0), false, 0, 0));
        steps.push(Step("Distribuzione", address(0), false, 0, 0));
        currentStepIndex = 0;
    }

    function assignSupervisor(uint stepIndex, address supervisor) public {
        require(stepIndex < steps.length, "Step index out of range");
        steps[stepIndex].supervisor = supervisor;
    }

    function completeStep() public {
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

        completedSteps.push(step);

        emit StepCompleted(currentStepIndex, step.name, step.startTime, step.endTime);
        currentStepIndex++;
    }

    function resetProcess() public {
        delete steps;
        initializeSteps();
        emit ProcessReset();
    }

    function getStepsLength() public view returns (uint) {
        return steps.length;
    }

    function getStep(uint index) public view returns (string memory, address, bool, uint, uint) {
        require(index < steps.length, "Step index out of range");
        Step storage step = steps[index];
        return (step.name, step.supervisor, step.completed, step.startTime, step.endTime);
    }

    function getCompletedStepsLength() public view returns (uint) {
        return completedSteps.length;
    }

    function getCompletedStep(uint index) public view returns (string memory, address, bool, uint, uint) {
        require(index < completedSteps.length, "Completed step index out of range");
        Step storage step = completedSteps[index];
        return (step.name, step.supervisor, step.completed, step.startTime, step.endTime);
    }

    function isProcessCompleted() public view returns (bool) {
        return currentStepIndex >= steps.length;
    }
}