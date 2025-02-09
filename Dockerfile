FROM thecodingmachine/php:8.2-v4-fpm-node22 AS builder
ARG VERSION=development

ENV PHP_EXTENSION_LDAP=1
ENV PHP_EXTENSION_INTL=1
ENV PHP_EXTENSION_BCMATH=1
ENV PHP_EXTENSION_GD=1
ENV COMPOSER_MEMORY_LIMIT=-1

COPY . /var/www/html

USER root

RUN npm install \
    && npm run build

RUN composer install --no-scripts

RUN sed -i "s/^laF_version=.*/laF_version=${VERSION}/" .env

RUN tar \
    --exclude='./.github' \
    --exclude='./.git' \
    --exclude='./node_modules' \
    --exclude='./var/cache' \
    --exclude='./var/log' \
    -zcvf /artifact.tgz .

FROM git.h2-invent.com/public-system-design/alpine-php8-cron-webserver:3.20.8
ARG VERSION=development

LABEL version="${VERSION}" \
    Maintainer="H2 invent GmbH" \
    Description="LookyLooky Application for sharing PDF documents interactive" \
    org.opencontainers.version="${VERSION}" \
    org.opencontainers.image.title="LookyLooky" \
    org.opencontainers.image.license="BSL License" \
    org.opencontainers.image.vendor="H2 invent GmbH" \
    org.opencontainers.image.authors="Andreas Holzmann <support@h2-invent.com>" \
    org.opencontainers.image.source="https://github.com/h2-invent/lookylooky" \
    org.opencontainers.image.documentation="https://h2-invent.com" \
    org.opencontainers.image.url="https://h2-invent.com"

USER root

RUN echo "#!/bin/sh" > /docker-entrypoint-init.d/02-symfony.sh \
    && echo "php bin/console cache:clear" >> /docker-entrypoint-init.d/02-symfony.sh \
    && echo "php bin/console doc:mig:mig --no-interaction" >> /docker-entrypoint-init.d/02-symfony.sh \
    && echo "php bin/console cache:clear" >> /docker-entrypoint-init.d/02-symfony.sh \
    && chmod +x /docker-entrypoint-init.d/02-symfony.sh

USER nobody

COPY --from=builder /artifact.tgz artifact.tgz

RUN tar -zxvf artifact.tgz \
    && mkdir data \
    && mkdir -p var/log \
    && mkdir -p var/cache \
    && rm artifact.tgz

ENV nginx_root_directory=/var/www/html/public \
    date_timezone=Europe/Berlin
