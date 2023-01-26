import { ContractTransaction } from "ethers";
import { Bundle } from "../../../clients/src";
import { createTransferAction } from "../token";
import {
  GasMeasurementContext,
  GasMeasurementTransactionConfig,
} from "../types";

const createBlsTransfers = async (
  ctx: GasMeasurementContext,
): Promise<ContractTransaction[]> => {
  const signer = ctx.fx.signers[0];

  const bundles: Bundle[] = [];
  const walletNonces = await Promise.all(
    ctx.blsWallets.map(async (w) => {
      const n = await w.Nonce();
      return n.toNumber();
    }),
  );

  for (let i = 0; i < ctx.numTransactions; i++) {
    const walletIdx = ctx.rng.int(0, ctx.blsWallets.length);
    const blsWallet = ctx.blsWallets[walletIdx];
    const toAddress = ctx.rng.item(ctx.blsWallets, [blsWallet]).address;

    const nonce = walletNonces[walletIdx]++;
    const bundle = blsWallet.sign({
      nonce,
      actions: [createTransferAction(ctx, toAddress)],
    });

    bundles.push(bundle);
  }

  const aggBundle = ctx.fx.blsWalletSigner.aggregate(bundles);

  const txn = await ctx.fx.verificationGateway
    .connect(signer)
    .processBundle(aggBundle);
  return [txn];
};

export const blsTransferConfig: GasMeasurementTransactionConfig = {
  type: "transfer",
  mode: "bls",
  factoryFunc: createBlsTransfers,
};
