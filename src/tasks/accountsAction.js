import fs from "fs";
import path from "path";
import chalk from "chalk";
import ConfigParser from "configparser";

const config = new ConfigParser();
const credentialsFilePath = path.join(".asgdeployer", ".credentials");

const getCredential = (credentialIdentifier) => {
  try {
    config.read(credentialsFilePath);
    const sections = config.sections();
    if(!sections.some((section) => section === credentialIdentifier)) {
      throw new Error("Credential not found");
    }

    return {
      identifier: credentialIdentifier,
      accessKey: config.get(credentialIdentifier, "access_key"),
      secretKey: config.get(credentialIdentifier, "secret_access_key"),
      region: config.get(credentialIdentifier, "region")
    };
    
  } catch(e) {
    return {
      error: true,
      message: e.message ?? "Credential not found"
    }
  }
}

const listAccountsAction = () => {
  try {
    try {
      fs.readFileSync(credentialsFilePath);
    } catch(e) {
      console.log(chalk.green(`${ jsonCredentials.length } credentials added`));
    }
    
    config.read(credentialsFilePath);
    const sections = config.sections();

    console.log(chalk.green(`${ sections.length } credentials added`));
    sections.forEach((section, index) => {
      const accessKey = config.get(section, "access_key");
      let message = `${ index } - identifier:${ section }`;
      message += ` access-key:[${ accessKey.replace(/\S(?=\S{6})/g, "*") }]`;

      console.log(message);
    });

  } catch(e) {
    console.log(`${ chalk.redBright("[Error]") } 0 credentials added`);
  }
}

const addAccountAction = (options) => {
  try {
    fs.readFileSync(credentialsFilePath);
  } catch(e) {
    fs.mkdirSync(path.dirname(credentialsFilePath), { recursive: true });
    fs.writeFileSync(credentialsFilePath, "");
  }
  
  config.read(credentialsFilePath);
  const sections = config.sections();
  if(sections.some((section) => section === options.name)) {
    console.log(`${ chalk.redBright("[Error]") } Already exists an aws account with this identifier`);
    return true;
  }

  config.addSection(options.name);
  config.set(options.name, "access_key", options.accessKey);
  config.set(options.name, "access_secret_key", options.secretKey);
  config.set(options.name, "region", options.region);
  config.write(credentialsFilePath);
}

export {
  getCredential,
  listAccountsAction,
  addAccountAction
}