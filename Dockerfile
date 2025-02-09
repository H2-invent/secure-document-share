FROM node:23-alpine

ARG VERSION

LABEL version="${VERSION}" \
    Maintainer="H2 invent GmbH" \
    Description="LookyLooky Application" \
    org.opencontainers.version="${VERSION}" \
    org.opencontainers.image.title="LookyLooky" \
    org.opencontainers.image.license="BSL-2" \
    org.opencontainers.image.vendor="H2 invent GmbH" \
    org.opencontainers.image.authors="Emanuel Holzmann <support@h2-invent.com>" \
    org.opencontainers.image.source="https://github.com/h2-invent/lookylooky" \
    org.opencontainers.image.documentation="https://h2-invent.com" \
    org.opencontainers.image.url="https://h2-invent.com"

WORKDIR /opt/app

COPY --chown=node:node . .

RUN apk --no-cache add \
    curl \
    && rm -rf /var/cache/apk/*

RUN npm install \
    npm run build

USER node

EXPOSE 3000

HEALTHCHECK --timeout=10s CMD curl --silent --fail http://127.0.0.1:3000/ || exit 1

CMD [ "node", "run server" ] 
