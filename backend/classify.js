import uuid from "uuid";
import * as dynamoDbLib from "./libs/dynamodb-lib";
import { success, failure } from "./libs/response-lib";

export async function main(event, context) {
  let params = {
    TableName: "notes",
    // 'Key' defines the partition key and sort key of the item to be retrieved
    // - 'userId': Identity Pool identity id of the authenticated user
    // - 'noteId': path parameter
    Key: {
      userId: event.requestContext.identity.cognitoIdentityId,
      noteId: event.pathParameters.id
    }
  };

  try {
    const resultNote = await dynamoDbLib.call("get", params);
    
    if (resultNote.Item) {
      /*
      * DO CLASSIFICATION
      */
      const classifyResult = classify(resultNote.Item);

      params = {
        TableName: "notes",
        // 'Key' defines the partition key and sort key of the item to be updated
        // - 'userId': Identity Pool identity id of the authenticated user
        // - 'noteId': path parameter
        Key: {
          userId: event.requestContext.identity.cognitoIdentityId,
          noteId: event.pathParameters.id
        },
        // 'UpdateExpression' defines the attributes to be updated
        // 'ExpressionAttributeValues' defines the value in the update expression
        UpdateExpression: "SET dog = :dog, dogNumber = :dogNumber",
        ExpressionAttributeValues: {
          ":dog": classifyResult.dog || null,
          ":dogNumber": classifyResult.dogNumber || null
        },
        // 'ReturnValues' specifies if and how to return the item's attributes,
        // where ALL_NEW returns all attributes of the item after the update; you
        // can inspect 'result' below to see how it works with different settings
        ReturnValues: "NONE"
      };

      try {
        await dynamoDbLib.call("update", params);
        return success({status: true});
      } catch (e) {
        console.log(e);
        return failure({ status: false, error: "Item couldn't be classified."});
      }
    } else {
      console.log(e);
      return failure({ status: false, error: "Item not found." });
    }
  } catch (e) {
    console.log(e);
    return failure({ status: false })
  }
}

function classify(noteItem) {
  return {
    dog: 'borderCollie',
    dogNumber: 1
  };
}