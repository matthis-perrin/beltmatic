import {execSync} from 'child_process';
import {randomUUID} from 'crypto';
import {accessSync, readFileSync} from 'fs';
import {tmpdir} from 'os';
import {join} from 'path';

const terraformPath = join(process.cwd(), 'terraform');

function checkTerraformCredentials() {
  const credentialsPath = join(terraformPath, '.aws-credentials');
  try {
    accessSync(credentialsPath);
  } catch {
    throw new Error(
      `Missing AWS credential files at "${credentialsPath}"
To use your current credentials with this project run:
cp ~/.aws/credentials ${credentialsPath}`
    );
  }
}

function terraformOutputs() {
  const res = JSON.parse(execSync(`terraform output -json`, {cwd: terraformPath}).toString());
  return Object.fromEntries(Object.entries(res).map(([key, obj]) => [key, obj.value]));
}

function getProjects() {
  const projects = JSON.parse(readFileSync('.workspace').toString()).fragments;
  if (!Array.isArray(projects)) {
    throw new Error('No projects in the workspace');
  }
  return projects;
}

async function run() {
  // Build
  console.log('--------------------------------------------------------------------------------');
  execSync(`yarn build`, {stdio: 'inherit'});
  console.log('--------------------------------------------------------------------------------');

  // Get terraform outputs
  checkTerraformCredentials();
  let outputs = terraformOutputs();
  if (Object.keys(outputs).length === 0) {
    throw new Error('You must run "terraform apply" to deploy the infrastructure first');
  }
  const {region, code_bucket} = outputs;

  // Deploy each lambda
  const projects = getProjects();
  const lambdaProjects = projects
    .map(p => p.lambdaName ?? p.apiName ?? (p.appName ? `${p.appName}_backend` : undefined))
    .filter(Boolean);
  for (const lambdaName of lambdaProjects) {
    const lambdaUrl = outputs[`${lambdaName}_url`] ?? '';
    console.log(`Deploying lambda ${lambdaName}`, lambdaUrl);
    const tmp = tmpdir();
    const zipPath = join(tmp, randomUUID()) + '.zip';
    execSync(`pushd ${lambdaName}/dist; zip -q -r ${zipPath} *; popd`);
    execSync(
      `aws s3api put-object --bucket ${code_bucket} --key ${lambdaName}/dist.zip --tagging "Project=beltmatic" --body ${zipPath}`,
      {
        env: {AWS_SHARED_CREDENTIALS_FILE: 'terraform/.aws-credentials'},
      }
    );
    execSync(
      `aws lambda update-function-code --function-name ${
        outputs[`${lambdaName}_function_name`]
      } --s3-bucket ${code_bucket} --s3-key ${lambdaName}/dist.zip --region ${region} --publish --no-cli-pager`,
      {env: {AWS_SHARED_CREDENTIALS_FILE: 'terraform/.aws-credentials'}}
    );
  }

  // Deploy each website
  const websiteProjects = projects
    .map(p => p.websiteName ?? (p.appName ? `${p.appName}_frontend` : undefined))
    .filter(Boolean);
  for (const websiteName of websiteProjects) {
    const websiteUrl = outputs[`${websiteName}_cloudfront_domain_name`];
    console.log(`Deploying website ${websiteName}`, websiteUrl);
    execSync(`aws s3 sync ${websiteName}/dist s3://${code_bucket}/${websiteName}`, {
      env: {AWS_SHARED_CREDENTIALS_FILE: 'terraform/.aws-credentials'},
    });
  }

  console.log('--------------------------------------------------------------------------------');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
