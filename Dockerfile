FROM node:20

WORKDIR /app

RUN apt-get update && \
    apt-get install -y ffmpeg

RUN apt-get update && \
    apt-get install -y wget && \
    wget https://dot.net/v1/dotnet-install.sh -O dotnet-install.sh && \
    chmod +x ./dotnet-install.sh && \
    ./dotnet-install.sh --channel 6.0 && \
    ln -s /root/.dotnet/dotnet /usr/local/bin/dotnet

COPY package*.json ./

RUN npm install

EXPOSE 3000

CMD ["node", "."]
