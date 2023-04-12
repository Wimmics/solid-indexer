# SOLID Indexer

SOLID Indexer is a [SOLID](https://solidproject.org) agent able to index some content on a POD.

This project provides both a client and a server:
- the server is a NodeJS app acting as the SOLID agent that makes the job of indexing.
- the client is a browser app to configure, run and monitor the agent.

## Technical specifications

We use the [Community Solid Server](https://communitysolidserver.github.io/CommunitySolidServer/5.x/). It is available as a [Docker image](https://hub.docker.com/r/solidproject/community-server). To use the WebHook notifications, be sure to use CSS version 6 or higher.

### Agent / server

- NodeJS
- TypeScript
- ExpressJS

### Browser app / client

- TypeScript
- React
- Redux

## Development

### Start the CSS

You first need to run the [Community Solid Server](https://communitysolidserver.github.io/CommunitySolidServer/5.x/). You can start it with the `docker-compose` (deprecated) or the new `docker compose` command:
```
docker compose up -d
```

That will start the CSS on port 8000.

_Remark: the WebHook notifications are not enabled by default. We had to provide a custom configuration (see the `css/file-notifications-all.json` file)._

### Run the agent

Then, you have to run the server.
```
cd server
npm run serve
```

This will start the agent on port 8080.

### Run the browser app

To run the client, just run the React app:
```
cd client
npm start
```

That will start the client on port 3000.