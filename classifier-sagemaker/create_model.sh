#!/usr/bin/env bash

MODEL_NAME=dog-breed-classifier-v1

# the role named created with
# https://gist.github.com/mvsusp/599311cb9f4ee1091065f8206c026962
ROLE_NAME=SageMakerRole

# the name of the image created with
# https://gist.github.com/mvsusp/07610f9cfecbec13fb2b7c77a2e843c4
ECS_IMAGE_NAME=sagemaker-tf-serving

# the role arn of the role
EXECUTION_ROLE_ARN=$(aws iam get-role --role-name ${ROLE_NAME} | jq -r .Role.Arn)

# the ECS image URI
ECS_IMAGE_URI=$(aws ecr describe-repositories --repository-name ${ECS_IMAGE_NAME} |\
jq -r .repositories[0].repositoryUri)

# defines the SageMaker model primary container image as the ECS image
PRIMARY_CONTAINER="Image=${ECS_IMAGE_URI}"

# creates the model
aws sagemaker create-model --model-name ${MODEL_NAME} \
--primary-container=${PRIMARY_CONTAINER}  --execution-role-arn ${EXECUTION_ROLE_ARN}