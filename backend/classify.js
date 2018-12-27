import uuid from "uuid";
import * as dynamoDbLib from "./libs/dynamodb-lib";
import { success, failure } from "./libs/response-lib";
import AWS from "aws-sdk";
import nj from "numjs";
import Jimp from "jimp";

// AWS.config.update({
//   accessKeyId: "<Access Key Here>",
//   secretAccessKey: "<Secret Access Key Here>"
// });

console.log("attempt aws connection...");
const s3 = new AWS.S3();
const sageMakerRuntime = new AWS.SageMakerRuntime();
console.log("...constructed.");

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
      try {
        /*
        * DO CLASSIFICATION
        */
        const classifyResult = await classify(resultNote.Item);

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
          UpdateExpression: "SET dog = :dog, dogNumber = :dogNumber, content = :readableDog",
          ExpressionAttributeValues: {
            ":dog": classifyResult.dog || null,
            ":dogNumber": classifyResult.dogNumber || null,
            ":readableDog": classifyResult.readableDog || null
          },
          // 'ReturnValues' specifies if and how to return the item's attributes,
          // where ALL_NEW returns all attributes of the item after the update; you
          // can inspect 'result' below to see how it works with different settings
          ReturnValues: "NONE"
        };

        await dynamoDbLib.call("update", params);
        return success(classifyResult);
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

async function classify(noteItem) {
  const { attachment, userId, } = noteItem;

  // talk to notes bucket to get image
  const imageObj = await s3.getObject({
    Bucket: 'ahmerb-notesapp-uploads',
    Key: `private/${userId}/${attachment}`
  }).promise();
  const imageAsBuffer = imageObj.Body; // type Buffer

  const image = await Jimp.read(imageAsBuffer);
  image.resize(224, 224);
  // const resizedImageAsBuffer = await image.getBufferAsync(Jimp.AUTO);
  const resizedImageAsBuffer = image.bitmap.data;
  const resizedImage = [...resizedImageAsBuffer];
  // console.log(image.bitmap.width, image.bitmap.height);
  // console.log(image.bitmap.data);
  console.log(resizedImage.length);

  // divide by 255, reshape to (224,224,4), remove alpha channel (224,224,3), convert to list
  const imageArr = nj.array(resizedImage.map(digit => digit / 255.0)).reshape(224, 224, 4).slice(null, null, [null, 3]).tolist();
  //console.log(`imageFlat.shape=${imageFlat}`);

  // send image to sagemaker
  const params = {
    //Body: new Buffer('{"instances": [1.0,2.0,5.0]}'),
    //ContentType: 'application/x-image',
    Body: new Buffer(`{ "instances": ${JSON.stringify([imageArr])} }`),
    EndpointName: 'dog-breed-classifier'
  };
  const res = await sageMakerRuntime.invokeEndpoint(params).promise();
  const responseData = JSON.parse(Buffer.from(res.Body).toString('utf8'))

  // return result
  const body = decodeResponse(responseData);
  console.log(body);
  return body;
}

function decodeResponse(responseData) {
  const predictions = responseData['predictions'][0];

  const dog_names = ['Affenpinscher', 'Afghan_hound', 'Airedale_terrier', 'Akita', 'Alaskan_malamute', 'American_eskimo_dog', 'American_foxhound', 'American_staffordshire_terrier', 'American_water_spaniel', 'Anatolian_shepherd_dog', 'Australian_cattle_dog', 'Australian_shepherd', 'Australian_terrier', 'Basenji', 'Basset_hound', 'Beagle', 'Bearded_collie', 'Beauceron', 'Bedlington_terrier', 'Belgian_malinois', 'Belgian_sheepdog', 'Belgian_tervuren', 'Bernese_mountain_dog', 'Bichon_frise', 'Black_and_tan_coonhound', 'Black_russian_terrier', 'Bloodhound', 'Bluetick_coonhound', 'Border_collie', 'Border_terrier', 'Borzoi', 'Boston_terrier', 'Bouvier_des_flandres', 'Boxer', 'Boykin_spaniel', 'Briard', 'Brittany', 'Brussels_griffon', 'Bull_terrier', 'Bulldog', 'Bullmastiff', 'Cairn_terrier', 'Canaan_dog', 'Cane_corso', 'Cardigan_welsh_corgi', 'Cavalier_king_charles_spaniel', 'Chesapeake_bay_retriever', 'Chihuahua', 'Chinese_crested', 'Chinese_shar-pei', 'Chow_chow', 'Clumber_spaniel', 'Cocker_spaniel', 'Collie', 'Curly-coated_retriever', 'Dachshund', 'Dalmatian', 'Dandie_dinmont_terrier', 'Doberman_pinscher', 'Dogue_de_bordeaux', 'English_cocker_spaniel', 'English_setter', 'English_springer_spaniel', 'English_toy_spaniel', 'Entlebucher_mountain_dog', 'Field_spaniel', 'Finnish_spitz', 'Flat-coated_retriever', 'French_bulldog', 'German_pinscher', 'German_shepherd_dog', 'German_shorthaired_pointer', 'German_wirehaired_pointer', 'Giant_schnauzer', 'Glen_of_imaal_terrier', 'Golden_retriever', 'Gordon_setter', 'Great_dane', 'Great_pyrenees', 'Greater_swiss_mountain_dog', 'Greyhound', 'Havanese', 'Ibizan_hound', 'Icelandic_sheepdog', 'Irish_red_and_white_setter', 'Irish_setter', 'Irish_terrier', 'Irish_water_spaniel', 'Irish_wolfhound', 'Italian_greyhound', 'Japanese_chin', 'Keeshond', 'Kerry_blue_terrier', 'Komondor', 'Kuvasz', 'Labrador_retriever', 'Lakeland_terrier', 'Leonberger', 'Lhasa_apso', 'Lowchen', 'Maltese', 'Manchester_terrier', 'Mastiff', 'Miniature_schnauzer', 'Neapolitan_mastiff', 'Newfoundland', 'Norfolk_terrier', 'Norwegian_buhund', 'Norwegian_elkhound', 'Norwegian_lundehund', 'Norwich_terrier', 'Nova_scotia_duck_tolling_retriever', 'Old_english_sheepdog', 'Otterhound', 'Papillon', 'Parson_russell_terrier', 'Pekingese', 'Pembroke_welsh_corgi', 'Petit_basset_griffon_vendeen', 'Pharaoh_hound', 'Plott', 'Pointer', 'Pomeranian', 'Poodle', 'Portuguese_water_dog', 'Saint_bernard', 'Silky_terrier', 'Smooth_fox_terrier', 'Tibetan_mastiff', 'Welsh_springer_spaniel', 'Wirehaired_pointing_griffon', 'Xoloitzcuintli', 'Yorkshire_terrier'];

  const breedNum = argMax(predictions);
  const breed = dog_names[breedNum];
  const confidence = predictions[breedNum];

  return {
    dog: breed,
    dogNumber: breedNum,
    readableDog: breed.replace("_", " ")
  };
}

function argMax(array) {
  return array.map((x, i) => [x, i]).reduce((r, a) => (a[0] > r[0] ? a : r))[1];
}
