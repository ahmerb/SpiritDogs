export default {
  s3: {
    REGION: "eu-west-1",
    BUCKET: "ahmerb-notesapp-uploads"
  },
  apiGateway: {
    REGION: "eu-west-1",
    URL: "https://epo4si2417.execute-api.eu-west-1.amazonaws.com/prod"
  },
  cognito: {
    REGION: "eu-west-1",
    USER_POOL_ID: "eu-west-1_feTC7GHwR",
    APP_CLIENT_ID: "6kgt37q6rotvjflkf11qjlsi85",
    IDENTITY_POOL_ID: "eu-west-1:0b73f0f5-1316-41bc-b757-7dc5603135a9"
  },
  MAX_ATTACHMENT_SIZE: 5000000,
};
