import Koa from 'koa';
import Router from '@koa/router';
import bodyParser from 'koa-bodyparser';
import { Bundle, bundleFromDto, Aggregator } from 'bls-wallet-clients';
import reporter from 'io-ts-reporters';

import BundleDto from './BundleDto';

export default function aggregatorProxy(
  upstreamAggregatorUrl: string,
  bundleTransformer: (clientBundle: Bundle) => Bundle,
) {
  const app = new Koa();
  const upstreamAggregator = new Aggregator(upstreamAggregatorUrl);

  const router = new Router();

  router.post('/bundle', bodyParser(), async (ctx) => {
    const decodeResult = BundleDto.decode(ctx.request.body);

    if ('left' in decodeResult) {
      ctx.status = 400;
      ctx.body = reporter.report(decodeResult);
      return;
    }

    const clientBundle = bundleFromDto(decodeResult.right);
    const transformedBundle = bundleTransformer(clientBundle);

    const addResult = await upstreamAggregator.add(transformedBundle);

    ctx.status = 200;
    ctx.body = addResult;
  });

  router.post('/estimateFee', bodyParser(), async (ctx) => {
    const decodeResult = BundleDto.decode(ctx.request.body);

    if ('left' in decodeResult) {
      ctx.status = 400;
      ctx.body = reporter.report(decodeResult);
      return;
    }

    const clientBundle = bundleFromDto(decodeResult.right);
    const transformedBundle = bundleTransformer(clientBundle);

    const estimateFeeResult = await upstreamAggregator.estimateFee(transformedBundle);

    ctx.status = 200;
    ctx.body = estimateFeeResult;
  });

  router.post('/bundleReceipt/:hash', bodyParser(), async (ctx) => {
    const lookupResult = await upstreamAggregator.lookupReceipt(ctx.params.hash);

    if (lookupResult === undefined) {
      ctx.status = 404;
    } else {
      ctx.status = 200;
      ctx.body = lookupResult;
    }
  });

  app.use(router.routes());

  return app.callback();
}
