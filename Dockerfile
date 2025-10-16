FROM node:23-alpine
ARG VERSION=development

LABEL Version="${VERSION}" \
    Maintainer="H2 invent GmbH" \
    Description="LookyLooky Docker Image" \
    org.opencontainers.version="${VERSION}" \
    org.opencontainers.image.title="LookyLooky Docker Image" \
    org.opencontainers.image.license="Business Source License" \
    org.opencontainers.image.vendor="H2 invent GmbH" \
    org.opencontainers.image.authors="Emanuel Holzmann <support@h2-invent.com>" \
    org.opencontainers.image.source="https://github.com/h2-invent/lookylooky" \
    org.opencontainers.image.documentation="https://h2-invent.com" \
    org.opencontainers.image.url="https://h2-invent.com"

# Setze das Arbeitsverzeichnis im Container-Dateisystem
WORKDIR /usr/src/app

RUN apk --no-cache add \
    curl \
    && rm -rf /var/cache/apk/*

# Kopiere die Abhängigkeiten und den Code in das Arbeitsverzeichnis
COPY --chown=nobody . .

# Installiere Development Dependencies
#RUN npm install \
#    && npm run build \
#    && rm -rf node_modules

# Installiere nur Production Dependencies
RUN npm install --only=prod

RUN chmod 755 server.mjs

USER nobody

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=10s --start-period=30s --retries=5 CMD curl --fail http://localhost:3000 || exit 1

ENV APP_VERSION=${VERSION}

CMD [ "npm", "start" ]
