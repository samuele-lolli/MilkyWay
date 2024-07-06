// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0; // Modificato da ^0.8.20 a ^0.8.19

import "./MilkProcessFactory.sol";

contract MilkProcess {
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
    uint public lotNumber;
    address public owner;
    address public factory;

    event StepCompleted(uint stepIndex, string location, uint endTime);

    constructor(uint _lotNumber, address _owner, address _factory) {
        lotNumber = _lotNumber;
        owner = _owner;
        factory = _factory;
        initializeSteps();
        steps[0].startTime = block.timestamp;
    }

    function initializeSteps() internal {
        steps.push(Step("Raccolta", address(0), false, 0, 0, "", lotNumber));
        steps.push(Step("Trasporto", address(0), false, 0, 0, "", lotNumber));
        steps.push(Step("Lavorazione", address(0), false, 0, 0, "", lotNumber));
        steps.push(Step("Confezionamento", address(0), false, 0, 0, "", lotNumber));
        steps.push(Step("Distribuzione", address(0), false, 0, 0, "", lotNumber));
        currentStepIndex = 0;
    }

    function assignSupervisor(uint stepIndex,address supervisor) external onlyAdmin {
        require(stepIndex < steps.length, "Step index out of range");
        steps[stepIndex].supervisor = supervisor;
    }

    function completeStep(string memory _location) external onlySupervisor {
        require(currentStepIndex < steps.length, "All steps are already completed");
        Step storage step = steps[currentStepIndex];
        require(msg.sender == step.supervisor,"Only assigned supervisor can complete the step");
        step.completed = true;
        step.endTime = block.timestamp;

        require(isReasonableLocation(_location), "Location is not reasonable for this step");

        step.location = _location;

        currentStepIndex++;

        if (currentStepIndex < steps.length) {
            steps[currentStepIndex].startTime = block.timestamp;
        }

        emit StepCompleted(currentStepIndex - 1, _location, block.timestamp);
    }

    function isReasonableLocation(
        string memory _location
    ) internal pure returns (bool) {
        return bytes(_location).length > 0;
    }

    function isProcessCompleted() external view returns (bool) {
        return currentStepIndex >= steps.length;
    }

    function getStep(uint index) external view returns (string memory, address, bool, uint, uint, string memory, uint){
        require(index < steps.length, "Step index out of range");
        Step storage step = steps[index];
        return (step.name, step.supervisor, step.completed, step.startTime, step.endTime, step.location, step.lotNumber);
    }

    modifier onlyAdmin() {
        MilkProcessFactory factoryContract = MilkProcessFactory(factory);
        MilkProcessFactory.Role role = factoryContract.getRole(msg.sender);
        require(role == MilkProcessFactory.Role.Admin, "Only admin can perform this action");
        _;
    }

    modifier onlySupervisor() {
        MilkProcessFactory factoryContract = MilkProcessFactory(factory);
        MilkProcessFactory.Role role = factoryContract.getRole(msg.sender);
        require(role == MilkProcessFactory.Role.Supervisor, "Only supervisor can perform this action");
        _;
    }
}
