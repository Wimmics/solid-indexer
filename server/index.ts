import express, { Request, Response } from 'express';
import cookieSession  from 'cookie-session';
import cors from 'cors';
import { getSessionFromStorage, Session } from '@inrupt/solid-client-authn-node';
import { getFile, deleteFile, buildThing, createContainerAt, createThing, getContainedResourceUrlAll, getSolidDataset, getThing, getThingAll, getUrl, saveSolidDatasetAt, setThing } from '@inrupt/solid-client';
import { RDF } from "@inrupt/vocab-common-rdf";
import { SOLID } from "@inrupt/vocab-solid";

// We can't use these libraries yet.
// import { AccessRequest, issueAccessRequest, redirectToAccessManagementUi } from '@inrupt/solid-client-access-grants';
// import { buildAuthenticatedFetch, createDpopHeader, generateDpopKeyPair } from '@inrupt/solid-client-authn-core';

const app = express();
const port = 8080;

const oidcIssuer = 'http://localhost:8000';
const clientName = 'Solid Indexer';

let sessionId: string;

// let keys: any;
// let token: any;

app.use(
  cookieSession({
    name: "session",
    // These keys are required by cookie-session to sign the cookies.
    keys: [
      "key1",
      "key2",
    ],
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  }),

  cors(/*{
    origin: [ oidcIssuer, 'http://localhost:3000' ]
  }*/)
);

app.use(express.json({ type: 'application/*+json' }));
app.use(express.urlencoded());

app.listen(port, () => {
  console.log(`server started at http://localhost:${port}`);
});

// The home page asks to login if not already.
app.get("/", async (req: Request, res: Response, next) => {
  const session = await getSessionFromStorage(sessionId);

  if (session) {
    res.send("The agent is logged and active...");
  }

  else if (req.session) {
    const session = new Session();
    req.session.sessionId = session.info.sessionId;
    
    await session.login({
      clientId: `http://localhost:${port}/id`,
      redirectUrl: `http://localhost:${port}/redirect-from-solid-idp`,
      oidcIssuer: oidcIssuer,
      clientName: clientName,
      handleRedirect: (url: string) => res.redirect(url)
    });
  }

  else res.send("Can't login the agent.");
});


// Returns the SOLID client identifier.
app.get("/id", async (req: Request, res: Response, next) => {
  console.log("get client id");

  res.contentType('application/ld+json');

  res.send(`{
    "@context": ["https://www.w3.org/ns/solid/oidc-context.jsonld"],
  
    "client_id": "http://localhost:8080/id",
    "client_name": "Solid Indexer",
    "redirect_uris": ["http://localhost:8080/redirect-from-solid-idp"],
    "post_logout_redirect_uris": ["http://localhost:8080/logout"],
    "client_uri": "http://localhost:8080/",
    "logo_uri" : "http://localhost:8080/logo.png",
    "tos_uri" : "http://localhost:8080/tos.html",
    "scope" : "openid profile offline_access webid",
    "grant_types" : ["refresh_token","authorization_code"],
    "response_types" : ["code"],
    "default_max_age" : 3600,
    "require_auth_time" : true
  }`);
});

app.get("/redirect-from-solid-idp", async (req: Request, res: Response) => {
  if (req.session) {
    const session = await getSessionFromStorage(req.session.sessionId);

    if (session) {
      await session.handleIncomingRedirect(`${req.url}`);

      sessionId = session.info.sessionId;

      try {
        await createContainerAt("http://localhost:8000/solid-indexer/inbox", { fetch: session.fetch });
      }
      catch(e) { console.log("Can't create the inbox container. It may already exists.") }

      // Subscribe to notification on the LDP inbox
      const subscription = `{
        "@context": ["https://www.w3.org/ns/solid/notification/v1"],
        "type": "WebHookSubscription2021",
        "topic": "http://localhost:8000/solid-indexer/inbox/", 
        "target": "http://localhost:8080/job",
        "state": "opaque-state",
        "expiration": "2023-12-23T12:37:15Z",
        "rate": "PT10S"
      }`;

      // https://github.com/solid/notifications/blob/main/webhook-subscription-2021.md
      const saved = await session.fetch("http://localhost:8000/.notifications/WebHookSubscription2021/", { method: 'POST', headers: { "content-type": "application/ld+json" }, body: subscription });
      console.log(await saved.text());

      res.redirect("http://localhost:8080");
    }
  }

  else {
    console.log("Bad redirect request from IDP");
    res.sendStatus(500);
  }
});

app.get("/logout", async (req: Request, res: Response, next) => {
  const session = await getSessionFromStorage(sessionId);
  if (session) {
    session.logout();
    res.send(`<p>Logged out.</p>`);
  }
});

/*
Treat all the received webhooks.
Entry point.
*/
app.post("/job", async (req: Request, res: Response, next) => {
  console.log("New Job received...");

  const session = await getSessionFromStorage(sessionId);

  if (session) {
    if (req.body) {
      
      const inboxDataset = await getSolidDataset("http://localhost:8000/solid-indexer/inbox/", { fetch: session.fetch });
      const notifications: Array<string> = getContainedResourceUrlAll(inboxDataset);
      
      if (notifications.length === 0) {
        console.error("No notification found.");
        res.sendStatus(500);
        return;
      }
      
      const lastNotificationUrl = notifications.pop()!;
      const notificationBlob = await getFile(lastNotificationUrl, { fetch: session.fetch });
      const notificationData: string = await notificationBlob.text();
      
      if (!notificationData) {
        console.error("Unable to read the notification.");
        res.send(500);
        return;
      }
      
      res.sendStatus(200);

      const notification = JSON.parse(notificationData);
      const jobUrl: string = notification.object;
      
      console.log("Found a job to do in the notification at: <" + jobUrl + ">.");
      
      const jobDataset = await getSolidDataset(jobUrl, { fetch: session.fetch });
      const jobThing = getThing(jobDataset, jobUrl + "#");

      if (jobThing) {
        const container = getUrl(jobThing, "https://solid-indexer.org/targetContainer");
        const targetUrl = getUrl(jobThing, "https://solid-indexer.org/targetClass");
        const output = getUrl(jobThing, "https://solid-indexer.org/targetOutput");

        if (targetUrl) {
          const targething = getThing(jobDataset, targetUrl);

          if (targething) {
            const target = getUrl(targething, "http://www.w3.org/ns/shacl#targetClass");

            console.log("Job details: (" + container + ", " + target + ", " + output + ").");

            if (container && target && output) {
              runJob(container, target, output);

              await deleteFile(lastNotificationUrl, { fetch: session.fetch });
              console.log("Successfully deleted the notification <" + lastNotificationUrl + ">.");
            }
            else console.log("Can't start the job: invalid data.");
          }
        }
          
      }
    }
    
    else {
      console.log("Can't process the webhook: invalid body.");
      console.log(req.body);
      res.sendStatus(500);
    }
  }

  else {
    console.log("Error: not logged in.")
    res.sendStatus(403);
  }

});

const runJob = async(container: string, target: string, output: string) => {
  console.log("Starting Job(" + container + ", " + target + ", " + output + ").");
  
  const session = await getSessionFromStorage(sessionId);
  
  if (session) {
    // We assume that the TypeIndex already exists.
    let typeIndexDataset = await getSolidDataset(output, { fetch: session.fetch });
    
    const typeIndexThing = getThing(typeIndexDataset, output);

    if (!typeIndexThing) {
      console.log("Unable to load the TypeIndex thing");
      return;
    }

    // If the TypeIndex does not exist
    /*const typeIndexThing = buildThing(createThing({ name: "" }))
      .addUrl(RDF.type, SOLID.TypeIndex)
      .addUrl(RDF.type, SOLID.ListedDocument)
      .build();*/

    typeIndexDataset = setThing(typeIndexDataset, typeIndexThing);

    const containerDataset = await getSolidDataset(container, { fetch: session.fetch });
    const toBeLookedAt: Array<string> = getContainedResourceUrlAll(containerDataset);

    if (toBeLookedAt.length > 0) {
      const registration = buildThing(createThing())
        .addUrl(RDF.type, SOLID.TypeRegistration)
        .addUrl(SOLID.forClass, target)
        .addUrl(SOLID.instanceContainer, container)
        .build();

      typeIndexDataset = setThing(typeIndexDataset, registration);
    }

    for await (const resourceUrl of toBeLookedAt) {
      const resourceDataset = await getSolidDataset(resourceUrl, { fetch: session.fetch });
      const thingsToBeLookedAt = getThingAll(resourceDataset);
      const thingsToBeIndexed = thingsToBeLookedAt.filter((thing) => getUrl(thing, RDF.type) === target);
      
      thingsToBeIndexed.forEach(thingToBeIndexed => {
        const registration = buildThing(createThing())
        .addUrl(RDF.type, SOLID.TypeRegistration)
        .addUrl(SOLID.forClass, target)
        .addUrl(SOLID.instance, thingToBeIndexed.url)
        .build();

        typeIndexDataset = setThing(typeIndexDataset, registration);

        console.log("Resource <" + thingToBeIndexed.url + "> has been indexed.");
      });

      await sleep(2000);
    }

    console.log("Job is complete.");

    const savedTypeIndexDataset = await saveSolidDatasetAt(output, typeIndexDataset, { fetch: session.fetch });

    if (savedTypeIndexDataset)
      console.log("The Job result has been successfully saved to the user's storage.");

    else console.log("Can't save the index on the storage.");
  }

  else {
    console.log("Error: not logged in.");
  }

};

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/*
// We can't use the client_credential API because the SOLID client_id will not be included.
// There is no alternative to authenticate without the browser yet.
app.get("/token", async (req: Request, res: Response, next) => {
  const response = await fetch('http://localhost:8000/idp/credentials/', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: '', password: '', name: 'solid-indexer' })
  });

  const { id, secret } = await response.json();

  const dpopKey = await generateDpopKeyPair();
  keys = dpopKey;

  // These are the ID and secret generated in the previous step.
  // Both the ID and the secret need to be form-encoded.
  const authString = `${encodeURIComponent(id)}:${encodeURIComponent(secret)}`;
  // This URL can be found by looking at the "token_endpoint" field at
  // http://localhost:3000/.well-known/openid-configuration
  // if your server is hosted at http://localhost:3000/.
  const tokenUrl = 'http://localhost:8000/.oidc/token';

  const tokenResponse = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      // The header needs to be in base64 encoding.
      authorization: `Basic ${Buffer.from(authString).toString('base64')}`,
      'content-type': 'application/x-www-form-urlencoded',
      dpop: await createDpopHeader(tokenUrl, 'POST', dpopKey),
    },
    body: 'grant_type=client_credentials&scope=webid',
  });

  const tokenJson = await tokenResponse.json();
  console.log(tokenJson);

  // This is the Access token that will be used to do an authenticated request to the server.
  // The JSON also contains an "expires_in" field in seconds,
  // which you can use to know when you need request a new Access token.
  const { access_token: accessToken } = tokenJson;

  token = accessToken;

  const authFetch = await buildAuthenticatedFetch(fetch, accessToken, { dpopKey });
  // authFetch can now be used as a standard fetch function that will authenticate as your WebID.
  // This request will do a simple GET for example.
  const authResponse = await authFetch('http://localhost:8000/lecoqlibre/test');

  res.send(await authResponse.text());
});

// Example of patch request
app.get("/patch", async (req: Request, res: Response, next) => {
  if (req.session) {
    const session = await getSessionFromStorage(req.session.sessionId);
    if (session) {
      const job1 = "http://localhost:8000/user/solid-indexer/jobs/job1";
      const request = `@prefix solid: <http://www.w3.org/ns/solid/terms#>.
            @prefix ex: <http://www.example.org/terms#>.
            @prefix foaf: <http://xmlns.com/foaf/0.1/>.
            
            _:rename a solid:InsertDeletePatch;
              solid:where   { <${job1}> foaf:firstName ?o. };
              solid:inserts { <${job1}> foaf:firstName "Test. };
              solid:deletes { <${job1}> foaf:firstName ?o. }.`;

            const result = await session.fetch(job1, {
                "method": "PATCH",
                headers: { "Content-Type": "text/n3" },
                body: request
            })

        res.send(await result.text());
    }
  }
});

// We can't use the grant API because UMA2 is not supported by the CSS yet.
app.get("/grantAccess", async (req: Request, res: Response) => {
  if (req.session) {
    const session = await getSessionFromStorage(req.session.sessionId);

    
    if (session) {
      console.log(session.fetch);
      const webId: string = session.info.webId!;
      
      const accessExpiration = new Date( Date.now() +  5 * 60000 );
      const file = ".acr.backup";
      const pod = "http://localhost:8000/lecoqlibre/";
      
      try {

        const requestVC: AccessRequest = await issueAccessRequest(
          {
            "access":  { read: true },
            "resources": [ pod + file ],
            "resourceOwner": webId,
            "expirationDate": accessExpiration,
            "purpose": [ `http://localhost:${port}` ],
          },
          { fetch: session.fetch } // From the requestor's (i.e., ExamplePrinter's) authenticated session
        );
        
        redirectToAccessManagementUi(
          requestVC.id,
          `http://localhost:${port}/granted`,
          {
            redirectCallback: (url: string) => res.redirect(url)
          }
       );
      }

      catch(e) {
        console.log(e);
      }
      
    }
  }
});
*/

