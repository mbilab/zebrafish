FROM ubuntu:16.04
MAINTAINER Jhe-Ming Wu <st9007a@gmail.com>

WORKDIR /home/zebrafish
COPY package.json /home/zebrafish
COPY zebrafish.js /home/zebrafish

RUN apt-get update
RUN apt-get install -y libav-tools \
                       nodejs \
                       npm \
                       libcairo2-dev \
                       libjpeg8-dev \
                       libpango1.0-dev \
                       libgif-dev \
                       build-essential \
                       g++

RUN ln -s /usr/bin/nodejs /usr/bin/node
RUN npm i

CMD ["cd", "/home/zebrafish"]
