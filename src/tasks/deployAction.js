import AWS from "aws-sdk";
import chalk from "chalk";
import { Listr } from "listr2";
import { getCredential } from "./accountsAction.js";

const deployAction = async (asgName, options) => {
  const ctx = {
    arguments: {
      asgName,
      ...options
    }
  };

  const credential = getCredential(options.awsAccount);
  if(credential.error) {
    console.log(`${ chalk.redBright("[Error]") } Credential not found`);
    return true;
  }

  AWS.config.update({
    accessKeyId: credential.accessKey,
    secretAccessKey: credential.secretAccessKey,
    region: credential.region,
  });
  
  const autoScaling = new AWS.AutoScaling();
  const ec2 = new AWS.EC2();

  const tasks = new Listr(
    [
      {
        title: "Preparing instance for project update...",
        task: async (ctx, task) => task.newListr([
          {
            title: "selecting instance for update...",
            task: async (subCtx, task) => {
              const autoScalingGroupsDescription = await autoScaling.describeAutoScalingGroups({
                AutoScalingGroupNames: [ ctx.arguments.asgName ] 
              }).promise();

              const autoScalingGroup = autoScalingGroupsDescription.AutoScalingGroups[0];
              ctx.launchTemplateId = autoScalingGroup.LaunchTemplate.LaunchTemplateId;
              ctx.selectedInstanceId = autoScalingGroup.Instances.find((instance) => {
                return instance.HealthStatus === "Healthy" && instance.LifecycleState === "InService";
              }).InstanceId;

              const instancesDescription = await ec2.describeInstances({
                InstanceIds: [ ctx.selectedInstanceId ]
              }).promise();

              const instance = instancesDescription.Reservations[0].Instances[0];
              ctx.selectedInstancePublicIp = instance.PublicIpAddress;
              ctx.selectedInstancePrivateIp = instance.PrivateIpAddress;

              task.title = `selected instance ${ chalk.green(`[${ ctx.selectedInstanceId }]`) }`;
              
              return true;
            }
          }, {
            title: "detaching selected instance...",
            task: async (subCtx, task) => {
              await sleep(4000);
              return true;
              
              // const response = await autoScaling.detachInstances({
                //   AutoScalingGroupName: ctx.arguments.asgName,
                //   InstanceIds: [ ctx.selectedInstanceId ],
                //   ShouldDecrementDesiredCapacity: false
                // }).promise();
            }
          }
        ])
      }, {
        title: "Updating detached instance...",
        task: async (ctx, task) => {
          await sleep(3000);
          return true;
        }
      }, {
        title: "Creating ami and beginning instance refresh...",
        task: async (ctx, task) => {
          await sleep(5000);
          return true;
        }
      }
    ], {
      concurrent: false,
      rendererOptions: {
        collapse: false
      },
      ctx
    }
  );

  await tasks.run();
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export default deployAction;