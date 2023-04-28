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

## Get started

### 0. Install dependancies

- Go the `server` directory. Run `npm install`;
- Go to the `client` directory. Run `npm install`.

### 1. Start the container

You can start it with the `docker-compose` (deprecated) or the new `docker compose` command:
```
docker compose up -d
```

- The CSS server will listen on port 8000;
- The agent server will listen on port 8080; (**but do not connect to it just yet**)
- The client will listen on port 3000.

_Remark: the ACP and WebHook notifications are not enabled by default. We had to provide a custom configuration (see the `css/file-acp-notifications-all.json` file)._

### 2. Create the PODs for the user and the agent

Go to http://localhost:8000/.

Check the box "Sign me up for an account".

Create a POD for the user:
- In the "Pod name" field, type "user" (exactly like it)
- Fill the email and passwords
- Click on "Complete setup"

Go to http://localhost:8000/idp/register/ to register the agent.

Create a POD for the agent:
- In the "Pod name" field, type "solid-indexer" (exactly like it)
- Fill the email and passwords
- Click on "Sign up"

### 3. Copy the files

```
docker cp ./data/user/ solid-indexer_css:/data/
```

```
docker cp ./data/solid-indexer/ solid-indexer_css:/data/
```

### 4. Login the agent

Go to http://localhost:8080 and login the agent.

Use the credentials you defined for `solid-indexer` at the previous step.

Click on "Authorize".

### 5. Login the user

Go to http://localhost:3000 and click on the "Login" button to log the user in.

If you are still logged in as `solid-indexer` (check "Your WebID is ..."),
then click on "Use a different WebID".

Use the credentials you defined for `user` at the previous step.

Click on "Authorize".

### 6. Create a Job

Check that there is no indexed resources yet:
```
docker exec solid-indexer_css /bin/cat /data/user/public/typeIndex$.ttl
```

Click on the "Add Job" button (note that you can't change the configuration yet).

A new job will be added to the list of job.

Click on the "Start job" button to launch the indexing process.

Wait for 10 seconds (see `docker logs -f solid-indexer_server`).

Display the indexed resources:
```
docker exec solid-indexer_css /bin/cat /data/user/public/typeIndex$.ttl
```

### Utils

Remove all the subscriptions to notifications:
```
docker exec solid-indexer_css rm -f "/data/.internal/notifications/*"
```
