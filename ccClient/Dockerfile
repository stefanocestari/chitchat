FROM node:latest as build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Copy the EntryPoint
COPY ./entryPoint.sh /
RUN chmod +x entryPoint.sh