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
    bool public isIntero;

    constructor(uint _lotNumber, address _factory, bool _isIntero) {
        lotNumber = _lotNumber;
        factory = _factory;
        isFailed = false;
        isIntero = _isIntero;
        initializeSteps();
        steps[0].startTime = block.timestamp;
    }

    function initializeSteps() internal {
        steps.push(Step("Raccolta", address(0), false, 0, 0, "", lotNumber, false));
        steps.push(Step("Trasporto", address(0), false, 0, 0, "", lotNumber, false)); // Supervisore automatico
        steps.push(Step("Pulitura", address(0), false, 0, 0, "", lotNumber, false)); 
        steps.push(Step("Standardizzazione", address(0), false, 0, 0, "", lotNumber, false));
        steps.push(Step("Omogeneizzazione", address(0), false, 0, 0, "", lotNumber, false));
        if(isIntero){
            steps.push(Step("Pastorizzazione", address(0), false, 0, 0, "", lotNumber, false)); // Supervisore automatico
        }else{
            steps.push(Step("Sterilizzazione", address(0), false, 0, 0, "", lotNumber, false)); // Supervisore automatico
        }
        steps.push(Step("Confezionamento", address(0), false, 0, 0, "", lotNumber, false));
        if(isIntero){
            steps.push(Step("Stoccaggio refrigerato", address(0), false, 0, 0, "", lotNumber, false)); // Supervisore automatico
            steps.push(Step("Distribuzione refrigerata", address(0), false, 0, 0, "", lotNumber, false));
        }else{
            steps.push(Step("Stoccaggio", address(0), false, 0, 0, "", lotNumber, false)); // Supervisore automatico
            steps.push(Step("Distribuzione", address(0), false, 0, 0, "", lotNumber, false));
        }
        steps.push(Step("Consegna", address(0), false, 0, 0, "", lotNumber, false));
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

    function isTemperatureOK(bool valid) external {
        require(!isFailed, "Process has already failed");

        Step storage step = steps[currentStepIndex];

        if (valid){
            step.completed = true;
            step.endTime = block.timestamp;
            step.location = "Procedure up to standards";
            currentStepIndex++;
            if (currentStepIndex < steps.length) {
                steps[currentStepIndex].startTime = block.timestamp;
            }
        }else{
            step.failed = true;
            isFailed = true;
            step.endTime = block.timestamp;
            if (currentStepIndex == 1){
              step.location = "Road transport failed";
            } else if ((currentStepIndex == 7 || currentStepIndex == 8) && isIntero){
                step.location = "Storage failed";
            }
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