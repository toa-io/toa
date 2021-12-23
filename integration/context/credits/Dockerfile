FROM node:alpine

RUN npm i -g @toa.io/runtime@rt

WORKDIR /app
ADD . .

CMD toa compose .
