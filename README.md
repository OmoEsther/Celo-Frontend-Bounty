﻿# CELO-FE-101

# Description

This is web DApp, that allows users to be able to make reservations to nice hotels for their trips. Users pay the booking price for the hotel room and the amount is usually calculated by the number of nights the user wishes to stay in the hotel. For testing purposes a night is equivalent to 60 seconds. User's also have to pay a reservation holding fee which is then refunded back to the user after the user ends the reservation, a form of incentive to make users not hold down rooms after their reservation has ended.

# Feature

1. View list of rooms in the marketplace
2. Book down rooms

# Tech Stack
This web aplication uses the following tech stack:
- [Solidity](https://docs.soliditylang.org/) - A programming language for Ethereum smart contracts.
- [React](https://reactjs.org/) - A JavaScript library for building user interfaces.
- [Typescript](https://www.typescriptlang.org) - a strongly typed programming language that builds on JavaScript.
- [Rainbowkit-celo](https://docs.celo.org/developer/rainbowkit-celo) - RainbowKit is a React library that makes it easy to add wallet connection to dapp.
- [Wagmi](https://wagmi.sh) - wagmi is a collection of React Hooks containing everything you need to start working with Ethereum
- [Hardhat](https://hardhat.org/) - A tool for writing and deploying smart contracts.
- [TailwindCss](https://tailwindcss.com) - A CSS framework that dress up webpage.

# Installation
To run the application locally, follow these steps:

1. Clone the repository to your local machine using: ``` git clone https://github.com/OmoEsther/Celo-Frontend-Bounty.git ```
2. Move into react-app folder: ``` cd Celo-Frontend-Bounty/packages/react-app ```
3. Install: ``` npm install ``` or ``` yarn install ```
4. Start: ``` npm run dev ```
5. Open the application in your web browser at ``` http://localhost:3000 ```

# Usage
1. Install a wallet: [MetamaskExtensionWallet](https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en).
2. Create a wallet.
3. Go to [https://faucet.celo.org/alfajores](https://faucet.celo.org/alfajores) and get tokens for the alfajores testnet.
4. Switch to the alfajores testnet.
5. Connect your wallet to the app.

# Contributing
1. Fork this repository
2. Create a new branch for your changes: git checkout -b my-feature-branch
3. Make your changes and commit them: git commit -m "feat: create new feature"
4. Push your changes to your fork: git push origin my-feature-branch
5. Open a pull request to this repository with a description of your changes

Please make sure that your code follows the Solidity Style Guide and the React Style Guide. You can add tests for any new features or changes, also please make the front-end more friendly. I welcome any contributions or feedback on this project!
