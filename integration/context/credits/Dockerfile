FROM node:alpine

# WORKDIR /toa
# ADD ./../../../ .
# RUN npm link --workspaces

WORKDIR /app
ADD . .

CMD exec /bin/sh -c "trap : TERM INT; sleep infinity & wait"
