FROM node:latest

RUN mkdir /simprovweb
ADD package.json /simprovweb
COPY src/ /simprovweb/src
RUN cd /simprovweb && npm install
WORKDIR /simprovweb
EXPOSE 1234