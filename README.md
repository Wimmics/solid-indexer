# SOLID Indexer

*SOLID Indexer* is a POC of a [SOLID](https://solidproject.org) agent that is able to index some content on a POD.

This project provides both a client and a server:
- the server is a NodeJS app acting as the SOLID agent that makes the job of indexing;
- the client is a browser app to control the agent.

This project has been developed during the [SOLID hackathon of April, 2023](https://www.inrupt.com/event/solid-hackathon/home).

__Solid-indexer is not made and won't work for production use.__

We found this hackathond a good place for experimenting with SOLID agent. We wanted to try to develop one, very basicaly, to see what it can look like. This exercice was very interesting and fun and we did learn a lot! :)

## Introduction

Solid-indexer is an agent able to populate a [TypeIndex](https://github.com/solid/solid/blob/main/proposals/data-discovery.md) based on the data present in a pod. This can be useful for data created manually, or created by an application that does not take care of indexing the data it creates.

Solid-indexer is made of two components :
* an autonomous agent, having its own WebID and its own pod;
* a Solid application to allow users to interact with the agent.

When running the application, the user can creates *indexing jobs* (called *Jobs*), that are stored on the user's own pod. The application also gives to the agent's WebID read access to the containers to index, and write access to the TypeIndex to populate. Finally, in order to start the job, the application POSTs a notification in the agent's inbox, prompting it to start the indexing.

## How it works

We want to index some content of the user's POD (following the [TypeIndex specification](https://solid.github.io/type-indexes/)) with an autonomous program: the agent. The user send Jobs to do to the agent. The agent receives these Jobs and start indexing the user's POD. When it has finish, the agent writes the TypeIndex on the user's POD.

### Actors and storages
- User: the final user that interacts with its browser. Has its own *WebId*;
- User's POD: the user's storage;
- Client: the app that the final user uses to control the agent;
- Agent: the autonomous program that does the indexing job. Has its own *WebId*;
- Agent's POD: the agent's storage.

### Scenario

When the agent starts:
- it subscribes to *WebHook* notifications to listen to its own `ldp:inbox`;

When the user adds a new Job:
- we `POST` a new Job in the `./solid-indexer/jobs/` container into the user's POD.

When the user start a Job:
- we fetch the agent `ldp:inbox` looking at its profile;
- we grant the agent so it can read the Job;
- we `POST` a notification into the agent's `ldp:inbox`.

When the agent receive the LDP notification:
- it fetches the notification from its `ldp:inbox`;
- it gets the URL of the Job to do looking at the `object` field in this notification;
- it fetches the Job on the user's POD;
- it starts indexing by browsing every resources that it finds in the user's container;
- once it has created the index, it will `PATCH` it to the user's POD.

Then the user can see a completed [TypeIndex](https://solid.github.io/type-indexes/) on his/her POD.

### Vocabulary

We use a dedicated vocabulary except for the target class we use SHACL.

A Job is of the form:
```ttl
@prefix solid-indexer: <https://solid-indexer.org/>.
@prefix shacl: <http://www.w3.org/ns/shacl#>.
@prefix foaf: <http://xmlns.com/foaf/0.1/>.

<> a solid-indexer:IndexingJob;
    solid-indexer:targetContainer <container url>;
    solid-indexer:targetClass <#target>;
    solid-indexer:targetOutput <typeIndex url>.

<#target> shacl:targetClass foaf:Person.
```

## Setup

### 0. Install dependencies

- Go the `server` directory. Run `npm install`;
- Go to the `client` directory. Run `npm install`.

### 1. Start the Docker containers

You can start them with the `docker compose` command (or use the now deprecated `docker-compose` command):
```
docker compose up -d
```

*Remark: the ACP and WebHook notifications are not enabled by default. We had to provide a custom configuration (see the `css/file-acp-notifications-all.json` file).*

### 2. Create the PODs for the user and the agent

Go to http://localhost:8000/.

Check the box `Sign me up for an account`.

Create a POD for the user:
- In the "*Pod name*" field, type `user` (__exactly like this__);
- Fill the email and passwords;
- Click on `Complete setup`

Create a POD for the agent:

Go to http://localhost:8000/idp/register/ to register the agent:
- In the "*Pod name*" field, type `solid-indexer` (__exactly like this__);
- Fill the email and passwords;
- Click on `Sign up`.

### 3. Copy the data files

Run the following Docker command at the root of the project:

```
docker cp ./data/user/ solid-indexer_css:/data/
```

```
docker cp ./data/solid-indexer/ solid-indexer_css:/data/
```

## Try it!

### 1. Login the agent

Open a new browser private window and go to http://localhost:8080 to login the agent.

Use the credentials you defined at the previous step for the `solid-indexer` account.

Click on `Authorize`.

You should see the message `The agent is logged and active...`.

*You can close this window, as the agent is now waiting in the background...*

### 2. Login the user

In another browser window, go to http://localhost:3000 and click on the `Login` button to log the user in.

Use the credentials you defined at the previous step for the `user` account.

Click on `Authorize`.

You will be redirected to the client application that lets you control the agent.

_Warning: if you want to use the same browser window as for the agent, be sure to click on "Use an other WebId" when login the client. You don't want to login as the agent on the client!_

### 3. Create and start a Job

__Remark: notice that the current TypeIndex is empty (see the "TypeIndex content" section on the client web interface).__

Click on the `Add Job` button (note that you can't change the configuration yet).

A new job will be added to the list of job.

Click on the `Start job` button to launch the indexing process.

_At this step, the agent is indexing the `things` container to find all the `foaf:Person` resources. It will fill the `TypeIndex` with the results._

### 4. The POD has been indexed!

Wait for 10 seconds so the agent has the time to do its job (see `docker logs -f solid-indexer_server` to monitor the agent).

Click on the `Read TypeIndex` button to view the indexed resources by the agent!

It should look like:
```ttl
@prefix solid: <http://www.w3.org/ns/solid/terms#>.

<http://localhost:8000/user/public/typeIndex> a solid:TypeIndex, solid:ListedDocument.

<#2a6d302e-f5c3-49e4-99ce-0703a4ed4fd6> a solid:TypeRegistration;
    solid:forClass <http://xmlns.com/foaf/0.1/Person>;
    solid:instanceContainer <http://localhost:8000/user/things/>.

<#3850d17c-015f-4410-9ca6-370eea7ff5e6> a solid:TypeRegistration;
    solid:forClass <http://xmlns.com/foaf/0.1/Person>;
    solid:instance <http://localhost:8000/user/things/thing1#1>.

<#daa74c63-a09b-4a17-8de8-d914ce79919e> a solid:TypeRegistration;
    solid:forClass <http://xmlns.com/foaf/0.1/Person>;
    solid:instance <http://localhost:8000/user/things/thing2#1>.

<#f3e269dd-e75d-447b-a5eb-17b4e56b4d66> a solid:TypeRegistration;
    solid:forClass <http://xmlns.com/foaf/0.1/Person>;
    solid:instance <http://localhost:8000/user/things/thing2#2>.
```

### What data have been looked at?

If you did not change the default Job configuration, the processed data is the things contained in the `./data/user/things/` folder/container:

`./data/user/things/thing1`:
```ttl
@prefix foaf: <http://xmlns.com/foaf/0.1/>.

<#1> a foaf:Person.
<#2> a foaf:Project.
```

`./data/user/things/thing2`:
```ttl
@prefix foaf: <http://xmlns.com/foaf/0.1/>.

<#1> a foaf:Person.
<#2> a foaf:Person.
```

`./data/user/things/thing3`:
```ttl
@prefix foaf: <http://xmlns.com/foaf/0.1/>.

<#1> a foaf:Project.
```

## Limitations

Solid-indexer can't work with your POD yet. It is a POC developed for the hackathon and some parts have been hard coded to avoid extra complexity.

Also, we were not able to implement some tasks:
- can't log in the agent without a browser interaction. It seems there is no current way to do this with SOLID;
- can't know which resource has been created when receiving a WebHook notification. We are using CSS _6.0.0-alpha0_ which currently only supports _WebHookSubscription2021_;
- can't use the consent interface because CSS is not supporting UMA 2.0;
- can't find a way to create the ACR files and use the `universalAccess` module. The `acp:resource` predicate was missing when using the `setAgentAccess` function;
- can't find an easy way to unsubscribe to the notifications after the agent crashes. We could save the unsubscribe URL in a persistant storage.

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

## Troubleshooting and tools

### Agent crash

When the agent crashes, be sure to remove all the subscriptions to notifications with:
```
docker exec -d solid-indexer_css /bin/sh -c "rm /data/.internal/notifications/*.json"
```

Also, ensure to remove all the agent received notifications:
```
docker exec -d solid-indexer_css /bin/sh -c "rm /data/solid-indexer/inbox/*.jsonld"
```

### Monitoring

Monitor the SOLID server:
```
docker logs -f solid-indexer_css
```

Monitor the agent:
```
docker logs -f solid-indexer_server
```

Monitor the client:
```
docker logs -f solid-indexer_client
```

### Miscellaneous
Read the user's public TypeIndex:
```
docker exec solid-indexer_css /bin/cat /data/user/public/typeIndex$.ttl
```

Remove all the jobs of the user:
```
docker exec -d solid-indexer_css /bin/sh -c "rm /data/user/solid-indexer/jobs/*"
```

Ports:
- The CSS server will listen on port 8000;
- The agent server will listen on port 8080;
- The client will listen on port 3000.