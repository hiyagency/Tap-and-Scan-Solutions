// Run locally after `vercel link`. Secrets are passed over stdin, never argv.
import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const local = parseEnv(readFileSync('.env.local', 'utf8'));
const entry = join(process.env.APPDATA, 'npm/node_modules/vercel/dist/vc.js');
const values = {
  RAZORPAY_KEY_ID: local.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: local.RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET: local.RAZORPAY_WEBHOOK_SECRET,
  RAZORPAY_ENV: 'production',
  NIMBUSPOST_API_KEY: local.NIMBUSPOST_API_KEY,
  NIMBUSPOST_API_SECRET: local.NIMBUSPOST_API_SECRET,
  NIMBUSPOST_PICKUP_PINCODE: '484001',
  NIMBUSPOST_WAREHOUSE_ID: 'f5215912-0894-45a7-acac-2a5de4de21b1',
  NIMBUSPOST_VERIFIED: 'true',
  // Explicitly fail closed until the owner completes provider/policy approval.
  RAZORPAY_WEBHOOK_CONFIGURED: 'false',
  COMMERCE_LIVE: 'false',
  COMMERCE_POLICIES_APPROVED: 'false',
  COMMERCE_PROVIDERS_VERIFIED: 'false',
};
const sensitive = new Set(['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET', 'NIMBUSPOST_API_KEY', 'NIMBUSPOST_API_SECRET']);
for (const environment of ['production', 'preview']) {
  for (const [name, value] of Object.entries(values)) {
    if (!value) { console.log(`${environment}: ${name} not supplied; unchanged`); continue; }
    const args = [entry, 'env', 'add', name, environment, '--force', '--yes'];
    // Preview otherwise prompts for a branch and can exit 0 without saving on EOF.
    if (environment === 'preview') args.splice(5, 0, 'feat/ecommerce-preview');
    if (sensitive.has(name)) args.push('--sensitive');
    const result = spawnSync(process.execPath, args, { input: value, encoding: 'utf8', timeout: 60000 });
    if (result.status !== 0 || !/Environment Variable.*(?:to Project|added)/i.test(result.stderr + result.stdout)) throw new Error(`Vercel update failed for ${environment}/${name}; inspect the CLI separately without exposing secret values.`);
    console.log(`${environment}: ${name} configured`);
  }
}
