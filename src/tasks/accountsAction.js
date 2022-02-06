import fs from "fs";
import path from "path";
import chalk from "chalk";

const credentialsFilePath = path.join(".asgdeployer", ".credentials");

const getCredential = (credentialIdentifier) => {
  try {
    const credentials = fs.readFileSync(credentialsFilePath);
    const jsonCredentials = JSON.parse(credentials.toString());

    const credential = jsonCredentials.find((credential) => {
      if(credentialIdentifier === "default") {
        return credential.default;
      }

      return credential.identifier === credentialIdentifier;
    });

    if(!credential) {
      throw new Error("Credential not found");
    }

    return credential;
    
  } catch(e) {
    return {
      error: true,
      message: e.message ?? "Credential not found"
    }
  }
}

const listAccountsAction = () => {
  try {
    const credentials = fs.readFileSync(credentialsFilePath);
    const jsonCredentials = JSON.parse(credentials.toString());

    console.log(chalk.green(`${ jsonCredentials.length } credentials added`));
    jsonCredentials.forEach((credential, index) => {
      let message = `${ index } - identifier:${ credential.identifier }` 
      message += ` access-key:[${ credential.accessKey.replace(/\S(?=\S{6})/g, "*") }]`;
      message += credential.default ? " [DEFAULT]" : "";

      console.log(message);
    });

  } catch(e) {
    console.log(`${ chalk.redBright("[Error]") } 0 credentials added`);
  }
}

const addAccountAction = (options) => {
  let credentials = "[]";

  try {
    credentials = fs.readFileSync(credentialsFilePath);
  } catch(e) {
    fs.mkdirSync(path.dirname(credentialsFilePath), { recursive: true });
  }

  const jsonCredentials = JSON.parse(credentials.toString());

  const credentialIdentifierAlreadyExists = jsonCredentials.findIndex((credential) => {
    return credential.identifier === options.name;
  });
  if(credentialIdentifierAlreadyExists !== -1) {
    console.log(`${ chalk.redBright("[Error]") } Already exists an aws account with this identifier`);
    return true;
  }

  const credentialDefaultAlreadyExists = jsonCredentials.findIndex((credential) => {
    return credential.default === options.default;
  });
  if(credentialDefaultAlreadyExists !== -1) {
    console.log(`${ chalk.redBright("[Error]") } Already exists an aws account setted as default`);
    return true;
  }

  jsonCredentials.push({
    identifier: options.name,
    accessKey: options.accessKey,
    secretAccessKey: options.secretKey,
    region: options.region,
    default: Boolean(options.default)
  });

  fs.writeFileSync(credentialsFilePath, JSON.stringify(jsonCredentials));
}

export {
  getCredential,
  listAccountsAction,
  addAccountAction
}