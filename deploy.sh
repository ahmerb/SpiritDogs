cd ./backend && sudo serverless deploy; cd ..;
cd ./notes-app-client && npm run build && aws s3 sync build/ s3://notes-app-api-prod-serverlessdeploymentbucket-owc3h386iojk
