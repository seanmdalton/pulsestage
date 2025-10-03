FROM node:20-alpine
WORKDIR /app
LABEL org.opencontainers.image.title="PulseStage Web"
LABEL org.opencontainers.image.description="PulseStage Web App - Ask Me Anything (AMA) platform frontend for organizational engagement"
LABEL org.opencontainers.image.vendor="Sean M. Dalton"
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
