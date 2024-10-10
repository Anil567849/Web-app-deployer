FROM ubuntu:focal

# Update the package list
RUN apt-get update

# Install curl
RUN apt-get install -y curl

# Install Git
RUN apt-get install -y git

# Download and run the Node.js setup script from NodeSource
RUN curl -sL https://deb.nodesource.com/setup_20.x | bash -

RUN apt-get upgrade -y

# Install Node.js
RUN apt-get install -y nodejs

# Set working directory
WORKDIR /home/app

COPY main.sh main.sh
COPY script.js script.js
COPY package*.json .

RUN npm install

# chmod: Command to change file permissions.
# +x: Adds executable permissions to the file.
# main.sh: The file for which you're changing the permission.
RUN chmod +x main.sh
RUN chmod +x script.js

# execute this file then 
ENTRYPOINT ["/home/app/main.sh"]




