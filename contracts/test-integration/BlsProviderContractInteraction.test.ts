import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber, utils, Wallet } from "ethers";

import { Experimental } from "../clients/src";
import getNetworkConfig from "../shared/helpers/getNetworkConfig";

describe("Provider tests", function () {
  let blsProvider;
  let fundedWallet: Wallet;

  this.beforeAll(async function () {
    const networkConfig = await getNetworkConfig("local");

    const aggregatorUrl = "http://localhost:3000";
    const verificationGateway = networkConfig.addresses.verificationGateway;
    const rpcUrl = "http://localhost:8545";
    const network = {
      name: "localhost",
      chainId: 0x7a69,
    };
    blsProvider = new Experimental.BlsProvider(
      aggregatorUrl,
      verificationGateway,
      rpcUrl,
      network,
    );
  });

  describe("ERC20", async function () {
    let mockERC20;
    let tokenSupply: BigNumber;
    let recipient;

    this.beforeAll(async function () {
      fundedWallet = new ethers.Wallet(
        "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a", // HH Account #4
        new ethers.providers.JsonRpcProvider("http://localhost:8545"),
      );
      recipient = ethers.Wallet.createRandom().address;
      tokenSupply = utils.parseUnits("1000000");
      const MockERC20 = await ethers.getContractFactory("MockERC20");
      mockERC20 = await MockERC20.connect(fundedWallet).deploy(
        "AnyToken",
        "TOK",
        tokenSupply,
      );
      await mockERC20.deployed();

      await mockERC20.transfer(recipient, tokenSupply);
    });

    it("balanceOf() call", async function () {
      const balance = await mockERC20.connect(blsProvider).balanceOf(recipient);
      expect(balance).to.equal(tokenSupply);
    });

    it("calls balanceOf successfully after instantiating Contract class with BlsProvider", async function () {
      const erc20 = new ethers.Contract(
        mockERC20.address,
        mockERC20.interface,
        blsProvider,
      );
      const balance = await erc20.balanceOf(recipient);

      expect(erc20.provider).to.equal(blsProvider);
      expect(balance).to.equal(tokenSupply);
    });

    it("should get code located at address and block number", async function () {
      // Arrange
      const provider = new ethers.providers.JsonRpcProvider();
      const expectedCode = await provider.getCode(mockERC20.address);

      // Act
      const code = await blsProvider.getCode(mockERC20.address);

      // Assert
      expect(code).to.equal(expectedCode);
    });

    it("should return '0x' if no code located at address", async function () {
      // Arrange
      const fakeAddress = ethers.Wallet.createRandom().address;
      const expectedCode = "0x";

      // Act
      const invalidAddress = await blsProvider.getCode(fakeAddress);
      const realAddressBeforeDeployment = await blsProvider.getCode(
        mockERC20.address,
        "earliest",
      );

      // Assert
      expect(invalidAddress).to.equal(expectedCode);
      expect(realAddressBeforeDeployment).to.equal(expectedCode);
    });

    it("should return the Bytes32 value of the storage slot position at erc20 address", async function () {
      // Arrange
      const provider = new ethers.providers.JsonRpcProvider();
      const expectedStorage1 = await provider.getStorageAt(
        mockERC20.address,
        1,
      );
      const expectedStorage2 = await provider.getStorageAt(
        mockERC20.address,
        2,
      );

      // Act
      const storage1 = await blsProvider.getStorageAt(mockERC20.address, 1);
      console.log(storage1);

      const storage2 = await blsProvider.getStorageAt(mockERC20.address, 2);

      // Assert
      expect(storage1).to.equal(expectedStorage1); // 0x0000000000000000000000000000000000000000000000000000000000000000
      expect(storage2).to.equal(expectedStorage2); // 0x00000000000000000000000000000000000000000000d3c21bcecceda1000000
    });
  });
});
