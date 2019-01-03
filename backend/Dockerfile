 # this is used to install npm native for linux before deploying
 # developers are on mac, so native modules must be compiled
 # inside a linux container
 
 FROM amazonlinux:latest	
 
  # set locale	
 RUN echo LC_ALL=en_GB.UTF-8 >> /etc/environment	
 ENV LC_ALL=en_GB.UTF-8	
 
  # install node 8 and build tools	
 RUN curl --silent --location https://rpm.nodesource.com/setup_8.x | bash - && \	
     yum install -y nodejs gcc-c++ make git	
 
  # install serverless	
 RUN npm install -g serverless
