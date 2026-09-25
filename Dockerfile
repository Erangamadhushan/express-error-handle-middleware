FROM node:22-alpine

LABEL org.opencontainers.image.title="express-error-handle-middleware-validation"
LABEL org.opencontainers.image.description="Validation environment for the Express error handling package"

ENV NODE_ENV=test

WORKDIR /workspace

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npx tsc --noEmit \
	&& npm test -- --runInBand --silent \
	&& npm run smoke:package

CMD ["npm", "test", "--", "--runInBand", "--silent"]