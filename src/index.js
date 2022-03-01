#! /usr/bin/env node

import { Command } from "commander";
import deployAction from "./tasks/deployAction.js";
import {
  addAccountAction,
  listAccountsAction
} from "./tasks/accountsAction.js";

const run = async () => {
  const program = new Command();

  program
    .name("asgdeployer")
    .description("CLI to deploy applications structured by aws auto scaling")
    .version("0.0.1");

  const deploy = program.command("deploy");
  deploy
    .description("start application deploy")
    .argument("<asg-name>", "auto scaling group name")
    .option("-hp, --healthy-percentage <number>", "healthy percentage configuration for instance refresh", 80)
    .option("-iw, --instance-warmup <number>", "instance warmup configuration for instance refresh", 0)
    .option("-p, --path <string>", "file path for repository update")
    .option("-acc, --aws-account <string>", "aws account already saved", "default")
    .action(deployAction)

  const account = program.command("acc").description("manage aws accounts for deploy action");
  account
    .command("add")
    .description("add account keys for aws deploy")
    .option("-n, --name <string>", "aws account identifier")
    .requiredOption("-ak, --access-key <string>", "aws account access key")
    .requiredOption("-sk, --secret-key <string>", "aws account secret access key")
    .option("-r, --region <string>", "aws account default region", "us-west-2")
    .action(addAccountAction);

  account
    .command("ls")
    .description("list all aws configured accounts")
    .action(listAccountsAction);

    await program.parseAsync();
}

await run();