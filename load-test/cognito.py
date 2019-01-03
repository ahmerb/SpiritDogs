import boto3
import datetime
import json
from requests_aws4auth import AWS4Auth
import requests
from warrant.aws_srp import AWSSRP
from pprint import pprint

# AWS account id
account_id = '716107353291'

boto3.setup_default_session(
  region_name='eu-west-1',
)

def authenticate(email='', password=''):
  # Use AWS-SRP to log in to Cognito User Pool to Provide access tokens for Cognito Pool Identity
  provider = boto3.client('cognito-idp')
  aws = AWSSRP(username=email, password=password, pool_id='eu-west-1_feTC7GHwR',
              client_id='6kgt37q6rotvjflkf11qjlsi85', client=provider)
  tokens = aws.authenticate_user()
  #accessToken = tokens['AuthenticationResult']['AccessToken']
  idToken = tokens['AuthenticationResult']['IdToken'] # (only need to use this one)
  #refreshToken = tokens['AuthenticationResult']['RefreshToken']

  # Now access Cognito Identity Pool (using provided tokens) to get the IdentityId for this user
  identity = boto3.client('cognito-identity', region_name='eu-west-1')
  identity_pool_id='eu-west-1:0b73f0f5-1316-41bc-b757-7dc5603135a9'
  response = identity.get_id(
    AccountId=account_id,
    IdentityPoolId=identity_pool_id,
    Logins={
      "cognito-idp.eu-west-1.amazonaws.com/eu-west-1_feTC7GHwR": idToken
    }
  )
  identity_id = response['IdentityId']
  if verbose:
    print ("Identity ID: %s"%identity_id)

  # Use this user's IdentityId to get credentials for accessing the API
  resp = identity.get_credentials_for_identity(
    IdentityId=identity_id,
    Logins={
      "cognito-idp.eu-west-1.amazonaws.com/eu-west-1_feTC7GHwR": idToken
    }
  )
  secretKey = resp['Credentials']['SecretKey']
  accessKey = resp['Credentials']['AccessKeyId']
  sessionToken = resp['Credentials']['SessionToken']
  expiration = resp['Credentials']['Expiration']

  if verbose:
    print ("\nSecret Key: %s"%(secretKey))
    print ("\nAccess Key %s"%(accessKey))
    print ("\nSession Token: %s"%(sessionToken))
    print ("\nExpiration: %s"%(expiration))

  # Generate aws4auth HTTP headers using credentials, so can access the API
  region = 'eu-west-1'
  authApi = AWS4Auth(accessKey, secretKey, region, 'execute-api', session_token=sessionToken)
  authS3 = AWS4Auth(accessKey, secretKey, region, 's3', session_token=sessionToken)

  return authApi, authS3, identity_id

verbose = False
if __name__ == "__main__":
    verbose = True
    authenticate('ahmerb3@hotmail.co.uk', 'Passw0rd!')

