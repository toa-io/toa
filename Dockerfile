FROM node:14-alpine

ADD . /toa
WORKDIR /toa
RUN [ "npx", "lerna", "exec", "--", "npm link --audit false"]
ADD ./integration/contexts/todo-mono/domains/todo/tasks/ /component

WORKDIR /component

EXPOSE 3000
CMD [ "npx", "toa", "compose" ]
