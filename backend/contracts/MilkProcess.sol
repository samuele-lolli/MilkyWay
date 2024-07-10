// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

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
        bool failed;
    }

    Step[] public steps;
    uint public currentStepIndex;
    uint public lotNumber;
    address public factory;
    bool public isFailed;

    constructor(uint _lotNumber, address _factory) {
        lotNumber = _lotNumber;
        factory = _factory;
        initializeSteps();
        steps[0].startTime = block.timestamp;
        isFailed = false;
    }

    function initializeSteps() internal {
        steps.push(Step("Raccolta", address(0), false, 0, 0, "", lotNumber, false));
        steps.push(Step("Trasporto", address(0), false, 0, 0, "", lotNumber, false)); // Supervisore automatico
        steps.push(Step("Lavorazione", address(0), false, 0, 0, "", lotNumber, false));
        steps.push(Step("Confezionamento", address(0), false, 0, 0, "", lotNumber, false));
        steps.push(Step("Distribuzione", address(0), false, 0, 0, "", lotNumber, false));
        currentStepIndex = 0;
    }

    function assignSupervisor(uint stepIndex, address supervisor) external onlyAdmin {
        require(stepIndex < steps.length, "Step index out of range");
        steps[stepIndex].supervisor = supervisor;
    }

    function completeStep(string memory _location) external onlySupervisor {
        require(!isFailed, "Process has already failed");
        require(currentStepIndex < steps.length, "All steps are already completed");
        Step storage step = steps[currentStepIndex];
        require(msg.sender == step.supervisor, "Only assigned supervisor can complete the step");
        step.completed = true;
        step.endTime = block.timestamp;

        require(isReasonableLocation(_location), "Location is not reasonable for this step");

        step.location = _location;

        currentStepIndex++;

        if (currentStepIndex < steps.length) {
            steps[currentStepIndex].startTime = block.timestamp;
           /* if(currentStepIndex == 1){
                simulateTemperatureCheck();
            } */
        }
    }

    function failStep() external onlySupervisor {
        require(!isFailed, "Process has already failed");
        require(currentStepIndex < steps.length, "All steps are already completed");
        Step storage step = steps[currentStepIndex];
        require(msg.sender == step.supervisor, "Only assigned supervisor can fail the step");
        step.failed = true;
        isFailed = true;
        currentStepIndex++;
    }
    
    /* function simulateTemperatureCheck() internal {
        require(!isFailed, "Process has already failed");

        Step storage step = steps[currentStepIndex];
    
        // Genera un numero casuale tra 0 e 99
        uint random = uint(keccak256(abi.encodePacked(block.timestamp, block.difficulty))) % 100;

        // 90% di probabilità di completamento, 10% di fallimento
        if (random < 50) {
            step.completed = true;
            step.endTime = block.timestamp;
            step.location = "Automatic Transport";
            currentStepIndex++;
            if (currentStepIndex < steps.length) {
                steps[currentStepIndex].startTime = block.timestamp;
            }
        } else {
            step.failed = true;
            isFailed = true;
        }
    } */

    function isTemperatureOK(bool valid) external {
        require(!isFailed, "Process has already failed");

        Step storage step = steps[currentStepIndex];

        if (valid){
            step.completed = true;
            step.endTime = block.timestamp;
            step.location = "Automatic Transport";
            currentStepIndex++;
            if (currentStepIndex < steps.length) {
                steps[currentStepIndex].startTime = block.timestamp;
            }
        }else{
            step.failed = true;
            isFailed = true;
        }
    }

    function isReasonableLocation(string memory _location) internal pure returns (bool) {
        return bytes(_location).length > 0;
    }

    function isProcessCompleted() external view returns (bool) {
        return currentStepIndex >= steps.length;
    }

    function getSteps() external view returns (Step[] memory) {
        return steps;
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