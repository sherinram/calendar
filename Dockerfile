FROM node:20
WORKDIR /calender
COPY calender.html .
COPY server.js .
COPY package*.json .
RUN npm install
EXPOSE 3000
CMD ["node", server.js"]
