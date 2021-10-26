import * as dotenv from "dotenv";
import "@nomiclabs/hardhat-ethers";

import { ethers } from "hardhat";
import { BigNumber, Contract, ContractFactory } from "ethers";

/**
 * 
 * @param factory factory of contract
 * @param salt unique uint256 value
 * @param constructorParamsBytes bytes of constructor parameters 
 * @returns 
 */
export default async function deployWithDeployer(
  factory: ContractFactory,
  salt: BigNumber = BigNumber.from(0),
  constructorParamsBytes: string = "0x"
): Promise<Contract> {

  let Create2Deployer = await ethers.getContractFactory("Create2Deployer");
  let create2Deployer = Create2Deployer.attach(`${process.env.DEPLOYER_CONTRACT_ADDRESS}`);

  let initCode = factory.bytecode + constructorParamsBytes.substr(2);

  await (await create2Deployer.deploy(
    salt,
    initCode
  )).wait();

  const initCodeHash = ethers.utils.solidityKeccak256(
    ["bytes"],
    [initCode]
  );

  let contractAddress = ethers.utils.getCreate2Address(
    create2Deployer.address,
    "0x"+salt.toHexString().substr(2).padStart(64, "0"),
    initCodeHash
  );

  return factory.attach(contractAddress);
}
