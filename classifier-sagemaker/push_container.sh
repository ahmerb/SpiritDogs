#!/usr/bin/env bash

IMAGE_NAME=sagemaker-tf-serving
REGION=$(aws configure get region)
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)

# If the ECS repository doesn't exist, creates it.
aws ecr create-repository --repository-name ${IMAGE_NAME} > /dev/null 2>&1

# ECR requires the image name to be in this format:
REPOSITORY_NAME=${ACCOUNT}.dkr.ecr.${REGION}.amazonaws.com/${IMAGE_NAME}:latest

# Tags the image with the expect ECR format
docker tag ${IMAGE_NAME} ${REPOSITORY_NAME}

# Allows docker access to ECR
$(aws ecr get-login --no-include-email)

# pushes the image to ECR
docker push ${REPOSITORY_NAME}
