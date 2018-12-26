#!/usr/bin/env bash

MODEL_NAME=dog-breed-classifier-v1

ENDPOINT_CONFIG_NAME=dog-breed-classifier-config-v1

ENDPOINT_NAME=dog-breed-classifier

# ml.m4.xlarge is free tier (125 hours)
# but after that expires, can use ml.t2.medium is cheapest
PRODUCTION_VARIANTS="VariantName=Default,ModelName=${MODEL_NAME},"\
"InitialInstanceCount=1,InstanceType=ml.t2.medium"

aws sagemaker create-endpoint-config --endpoint-config-name ${ENDPOINT_CONFIG_NAME} \
--production-variants ${PRODUCTION_VARIANTS}

aws sagemaker create-endpoint --endpoint-name ${ENDPOINT_NAME} \
--endpoint-config-name ${ENDPOINT_CONFIG_NAME}