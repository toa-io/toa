#TODO: bridge specifics

FROM node:alpine

RUN npm i -g @toa.io/runtime@0.1.0-dev.13

WORKDIR /app
ADD . .

CMD toa compose .
