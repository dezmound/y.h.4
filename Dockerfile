FROM node:alpine
WORKDIR /usr/src/app
COPY . .

RUN apk add --no-cache git
RUN npm install --only=production
RUN git clone --mirror -q https://github.com/dezmound/y.h.3.git test-git/.git

ENV GIT_REPO /usr/src/app/test-git

CMD npm run prod