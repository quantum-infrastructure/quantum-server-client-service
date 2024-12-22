import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { PlayerData } from 'src/modules/player-gateway/types/player.types';

// Initialize the AWS Lambda service object

type InvokeAuthenticationLambdaParams = {
  // for quantum auth service this object should be
  // { authToken }
  // for any other service can be corresponding
  authenticationParams: unknown;
  region: string;
  lambdaFunctionArn: string;
};

export const invokeAuthenticationLambda = async ({
  authenticationParams,
  lambdaFunctionArn,
  region,
}: InvokeAuthenticationLambdaParams): Promise<PlayerData> => {
  const lambdaClient = new LambdaClient({
    region: region, // Replace with your Lambda's region
  });

  const params = {
    FunctionName: lambdaFunctionArn, // Replace with your Lambda ARN
    Payload: JSON.stringify({
      queryStringParameters: authenticationParams,
    }),
  };

  try {
    const command = new InvokeCommand(params);
    const response = await lambdaClient.send(command);

    const result =
      JSON.parse(new TextDecoder('utf-8').decode(response.Payload)) || null;
    if (result.statusCode == 200) {
      return JSON.parse(result.body);
    }

    throw result;
  } catch (error) {
    console.error('Error invoking Lambda:', error);
    return null;
  }
};
