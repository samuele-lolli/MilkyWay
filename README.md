# MilkChain
## A supply chain management decentralized application

### Description
The task of this application is to keep track of milk industry's supply chain through a decentralized network. The aim is to have better record of the product path from local farmers to the shelved product, and to increase transparency of the company to final consumer. The application comes with [its companion app](https://github.com/gbekss/MilkChain-Consumer) for smartphones.
MilkyWay tracks the production path of milk from collection to distribution dividing the process in a series of steps. Each step is controlled by a supervisor (human or sensor) that is in charge of verifying the correct execution of every part of the job. The supervisors are created and managed by administrators. The informations collected for a specific lot can be read by the final consumer upon scanning a QR code placed on the final product's carton.

### Architecture
The smart contracts, written in Solidity, are deployed using Truffle on the local blockchain network created using Ganache GUI.The frontend employs Web3.js to interact with the smart contract on the local blockchain network and is written using React.
The [mobile app](https://github.com/gbekss/MilkChain-Consumer) uses React-Native

![Project architecture](https://github.com/samuele-lolli/MilkChain/assets/58303470/bc31109b-aace-400c-9fa5-7174c5158e6c)

### Installation & Setup
Requires:
* Node.js
* npm

#### 1. Install Truffle.js
```
npm install -g truffle
```

#### 2. Install and setup Ganache GUI
You can install the program from [this link](https://archive.trufflesuite.com/ganache/)

#### 3. Clone the project
Clone the project in the target folder via zip or ``` git clone ```

#### 4. Deploy contracts
Deploy the contracts on your local blockchain by running the following command in the backend folder:
```
truffle migrate
 ```

#### 5. Run the dApp
Launch these two commands to install dependencies and run the frontend
```
npm install
npm run dev
 ```

> [!NOTE]  
> For the mobile application, refer to MilkChain-Consumer readme

