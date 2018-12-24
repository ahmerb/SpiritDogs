./node_modules/.bin/apig-test \
    --username='ahmerb3@hotmail.co.uk' \
    --password='Passw0rd!' \
    --user-pool-id='eu-west-1_feTC7GHwR' \
    --app-client-id='6kgt37q6rotvjflkf11qjlsi85' \
    --cognito-region='eu-west-1' \
    --identity-pool-id='eu-west-1:0b73f0f5-1316-41bc-b757-7dc5603135a9' \
    --invoke-url='https://epo4si2417.execute-api.eu-west-1.amazonaws.com/prod' \
    --api-gateway-region='eu-west-1' \
    --path-template='/notes' \
    --method='POST' \
    --body='{"content":"hello world","attachment":"hello.jpg"}'

