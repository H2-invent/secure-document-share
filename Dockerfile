# Verwende das offizielle Node.js 20-Image als Basis
FROM node:23-alpine

# Setze das Arbeitsverzeichnis im Container-Dateisystem
WORKDIR /usr/src/app
RUN apk --no-cache add curl

# Kopiere die Abhängigkeiten und den Code in das Arbeitsverzeichnis
COPY package*.json ./
COPY . .

# Installiere Development Dependencies
RUN npm install

RUN npm run build
# Lösche den Node modules Ordner
RUN rm -rf node_modules

# Installiere nur Production Dependencies
RUN npm install --only=prod

RUN ["chmod", "755", "server.mjs"]
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=10s --start-period=30s --retries=5 CMD curl --fail http://localhost:3000 || exit 1


CMD [ "npm", "start" ]