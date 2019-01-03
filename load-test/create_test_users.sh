#!/usr/bin/env bash

# WARN WARN WARN
# Every time this script is run, new users will be
# added to Cognito User Pool. They are not temporary.

REGION="eu-west-1"
CLIENT_ID="6kgt37q6rotvjflkf11qjlsi85"
USER_POOL_ID="eu-west-1_feTC7GHwR"

for i in `seq 101 1000`;
do
  aws cognito-idp sign-up \
    --region $REGION \
    --client-id $CLIENT_ID \
    --username "locustPerformanceUser_${i}@example.com" \
    --password "Passw0rd!"

  aws cognito-idp admin-confirm-sign-up \
    --region $REGION \
    --user-pool-id $USER_POOL_ID \
    --username "locustPerformanceUser_${i}@example.com"

  echo "locustPerformanceUser_${i}@example.com,"'Passw0rd!' >> credentials.csv
done
