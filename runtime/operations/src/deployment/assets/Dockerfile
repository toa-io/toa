# TODO: bridge specifics

FROM node:alpine

RUN npm i -g @toa.io/runtime@{{version}}

WORKDIR /composition
ADD . .

CMD toa compose *
