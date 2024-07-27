// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./MilkProcessFactory.sol";

// The MilkProcess contract tracks and manages the steps in the milk processing workflow.
contract MilkProcess {

    // Step struct represents a single step in the milk processing workflow.
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

    // Array to store all steps in the process.
    Step[] public steps;
    // Index of the current step being executed.
    uint public currentStepIndex;
    // Lot number for the current process.
    uint public lotNumber;
    // Address of the factory contract.
    address public factory;
    // Indicates if the process has failed.
    bool public isFailed;
    // Indicates if the process is for whole milk.
    bool public isIntero;

    // Constructor initializes the contract with the lot number, factory address, and milk type.
    constructor(uint _lotNumber, address _factory, bool _isIntero) {
        lotNumber = _lotNumber;
        factory = _factory;
        isFailed = false;
        isIntero = _isIntero;
        initializeSteps();               
        steps[0].startTime = block.timestamp;  
    }

    // Internal function to initialize the steps based on the milk type.
    function initializeSteps() internal {
        steps.push(Step("Raccolta", address(0), false, 0, 0, "", lotNumber, false));
        steps.push(Step("Trasporto", address(0), false, 0, 0, "", lotNumber, false)); // Supervisore automatico
        steps.push(Step("Pulitura", address(0), false, 0, 0, "", lotNumber, false)); 
        steps.push(Step("Standardizzazione", address(0), false, 0, 0, "", lotNumber, false));
        steps.push(Step("Omogeneizzazione", address(0), false, 0, 0, "", lotNumber, false));
        if (isIntero) {
            steps.push(Step("Pastorizzazione", address(0), false, 0, 0, "", lotNumber, false)); // Supervisore automatico
        } else {
            steps.push(Step("Sterilizzazione", address(0), false, 0, 0, "", lotNumber, false)); // Supervisore automatico
        }
        steps.push(Step("Confezionamento", address(0), false, 0, 0, "", lotNumber, false));
        if (isIntero) {
            steps.push(Step("Stoccaggio refrigerato", address(0), false, 0, 0, "", lotNumber, false)); // Supervisore automatico
            steps.push(Step("Distribuzione refrigerata", address(0), false, 0, 0, "", lotNumber, false));
        } else {
            steps.push(Step("Stoccaggio", address(0), false, 0, 0, "", lotNumber, false)); // Supervisore automatico
            steps.push(Step("Distribuzione", address(0), false, 0, 0, "", lotNumber, false));
        }
        steps.push(Step("Consegna", address(0), false, 0, 0, "", lotNumber, false));
        currentStepIndex = 0;
    }

    // Assigns supervisors to specific steps in the process.
    function assignSupervisors(address[] memory supervisors) external onlyAdmin {
        require(steps.length > 0, "Steps array cannot be empty");
        uint j = 0;
        for (uint i = 0; i < steps.length; i++) {
            if (i != 1 && i != 5 && !(isIntero && (i == 7 || i == 8))) {
                steps[i].supervisor = supervisors[j];
                j++;
            }
        }
    }

    // Completes the current step and records the location where it was completed.
    function completeStep(string memory _location) external onlySupervisor {
        require(!isFailed, "Process has already failed");
        require(currentStepIndex < steps.length, "All steps are already completed");
        Step storage step = steps[currentStepIndex];
        require(msg.sender == step.supervisor, "Only assigned supervisor can complete the step");
        step.completed = true;
        step.endTime = block.timestamp;
        step.location = _location;

        currentStepIndex++;

        if (currentStepIndex < steps.length) {
            steps[currentStepIndex].startTime = block.timestamp;
        }
    }

    // Marks the current step as failed.
    function failStep() external onlySupervisor {
        require(!isFailed, "Process has already failed");
        require(currentStepIndex < steps.length, "All steps are already completed");
        Step storage step = steps[currentStepIndex];
        require(msg.sender == step.supervisor, "Only assigned supervisor can fail the step");
        step.failed = true;
        isFailed = true;
        currentStepIndex++;
    }

    // Validates the temperature and completes or fails the step accordingly.
    function isTemperatureOK(bool valid) external {
        require(!isFailed, "Process has already failed");

        Step storage step = steps[currentStepIndex];

        if (valid) {
            step.completed = true;
            step.endTime = block.timestamp;
            step.location = "Procedura adeguata agli standard";
            currentStepIndex++;
            if (currentStepIndex < steps.length) {
                steps[currentStepIndex].startTime = block.timestamp;
            }
        } else {
            step.failed = true;
            isFailed = true;
            step.endTime = block.timestamp;
            if (currentStepIndex == 1) {
                step.location = "Il camion di raccolta non ha mantenuto la temperatura richiesta";
            } else if ((currentStepIndex == 7) && isIntero) {
                step.location = "La cella non ha mantenuto la temperatura richiesta";
            } else if ((currentStepIndex == 8) && isIntero) {
                 step.location = "Il camion di consegna non ha mantenuto la temperatura richiesta";
            }
        }
    }

    // Validates the location and completes or fails the step accordingly.
    function isLocationReasonable(bool valid, string memory _location) external {
        Step storage step = steps[currentStepIndex];
        if (valid) {
            step.completed = true;
            step.endTime = block.timestamp;
            if (currentStepIndex == 9) {
                step.location = _location;
            } else {
                step.location = "Procedura adeguata agli standard";
            }
            currentStepIndex++;
            if (currentStepIndex < steps.length) {
                steps[currentStepIndex].startTime = block.timestamp;
            }
        } else {
            step.failed = true;
            isFailed = true;
            step.endTime = block.timestamp;
            step.location = "La location del truck e' diversa dall'address di destinazione";
        }
    }

    // Checks if the entire process is completed.
    function isProcessCompleted() external view returns (bool) {
        return currentStepIndex >= steps.length;
    }

    // Returns all the steps in the process.
    function getSteps() external view returns (Step[] memory) {
        return steps;
    }

    // Modifier to restrict access to only admins.
    modifier onlyAdmin() {
        MilkProcessFactory factoryContract = MilkProcessFactory(factory);
        MilkProcessFactory.Role role = factoryContract.getRole(msg.sender);
        require(role == MilkProcessFactory.Role.Admin, "Only admin can perform this action");
        _;
    }

    // Modifier to restrict access to only supervisors.
    modifier onlySupervisor() {
        MilkProcessFactory factoryContract = MilkProcessFactory(factory);
        MilkProcessFactory.Role role = factoryContract.getRole(msg.sender);
        require(role == MilkProcessFactory.Role.Supervisor, "Only supervisor can perform this action");
        _;
    }
}
