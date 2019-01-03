# Locust load testing scripts for SpiritDogs

Requires AWS credentials to access the SpiritDogs AWS account.

- `create_test_users.sh` is a script that creates users in the User Pool.
- `cognito.py` is called by `locustfile.py` to get test users to authenticate with AWS. It does not require test users to be running in a boto3 (aws-sdk) environment with developer access permissions. It interacts with Cognito User Pool and Cognito Identity Pool to gain authentication headers for accessing the API Gateway and S3 uploads bucket.
- `credentials.csv` contains usernames and passwords of locust test users in the Cognito User Pool
- `locustfile.py` configures the load tests. See [locust.io](locust.io) for Locust documentation and information on how to run tests.
- `{logs_100users_fast,stats_distribution,stats_requests}.csv` contain test results from the 100 users with 5 hatch rate test described in the report.
- `*.png` are diagrams generated using the csv's.
- `/images` is a directory with all the training images from the dog breed dataset. It is gitignore'd due to its size, but can be downloaded from https://s3-us-west-1.amazonaws.com/udacity-aind/dog-project/dogImages.zip. The images are randomly chosen by test users to be sent to the app for upload/classification.
