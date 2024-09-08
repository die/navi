# Use an official Node.js image as a base
FROM node:20

# Set the working directory in the container
WORKDIR /app

RUN apt-get update && \
    apt-get install -y ffmpeg
    
RUN apt-get update && \
    apt-get install -y wget && \
    wget https://dot.net/v1/dotnet-install.sh -O dotnet-install.sh && \
    chmod +x ./dotnet-install.sh && \
    ./dotnet-install.sh --channel 6.0 && \
    ln -s /root/.dotnet/dotnet /usr/local/bin/dotnet


# Copy package.json and install dependencies
COPY package*.json ./

RUN npm install

# Expose a port (optional)
EXPOSE 3000

# Start the bot
CMD ["node", "."]
