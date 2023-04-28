import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState, AppThunk, store } from '../../app/store';
import { handleIncomingRedirect, login, fetch, getDefaultSession, ISessionInfo } from '@inrupt/solid-client-authn-browser';
import { SolidDataset, buildThing, createSolidDataset, createThing, universalAccess, getContainedResourceUrlAll, getSolidDataset, getThing, getUrl, saveSolidDatasetAt, saveSolidDatasetInContainer, setThing, saveFileInContainer } from "@inrupt/solid-client";
import { RDF } from "@inrupt/vocab-common-rdf";

// TODO: make it dynamic
const storage: string = "http://localhost:8000/user";
const jobsPath: string = "/solid-indexer/jobs/";

const si: string = "https://solid-indexer.org/";
const sh: string = "http://www.w3.org/ns/shacl#";
const ldp: string = "http://www.w3.org/ns/ldp#";

export interface Job {
    url: string;
    container: string;
    target: string;
    output: string;
}

export interface JobState {
  jobs: Array<Job>;
}

const initialState: JobState = {
  jobs: new Array<Job>()
};

export const loadJobs = createAsyncThunk<Array<Job>>(
  'jobs/load',
  async (arg, { rejectWithValue }) => {
    const session = getDefaultSession();

    if (!session.info.isLoggedIn)
      throw rejectWithValue("The user is not logged in.");

    const jobs: Array<Job> = new Array<Job>();

    const jobsDataset: any = await getSolidDataset(storage + jobsPath, { fetch: session.fetch });
    const jobsUrl: Array<string> = getContainedResourceUrlAll(jobsDataset);

    for await (const jobUrl of jobsUrl) {
      const jobDataset = await getSolidDataset(jobUrl, { fetch: session.fetch });
      const jobThing = getThing(jobDataset, jobUrl + '#');

      if (jobThing) {
        const targetUrl = getUrl(jobThing, si + 'targetClass');

        if (targetUrl) {
          const targetThing = getThing(jobDataset, targetUrl)

          if (targetThing) {
            jobs.push({
              url: jobUrl,
              container: getUrl(jobThing, si + 'targetContainer') ?? '',
              target: getUrl(targetThing, sh + "targetClass") ?? '',
              output: getUrl(jobThing, si + 'targetOutput') ?? ''
            })
          }
          else throw rejectWithValue("2. Can't get the thing at " + targetUrl);
        }
        else throw rejectWithValue("Can't get the target URL of the thing " + jobUrl);
      }
      else throw rejectWithValue("Can't get the thing at " + jobUrl);
    };

    return jobs;
  }
);

export const readAccess = createAsyncThunk<any, string>(
  'jobs/readAccess',
  async (jobUrl: string, { rejectWithValue, fulfillWithValue }) => {
    const session = getDefaultSession();
    
    if (!session.info.isLoggedIn)
      throw rejectWithValue("The user is not logged in.");

    console.log(await universalAccess.getAgentAccessAll(jobUrl, { fetch: session.fetch }));
  }
);

export const grantReadAccess = createAsyncThunk<void, {jobUrl: string, agentWebId: string}>(
  'jobs/readAccess',
  async (arg: {jobUrl: string, agentWebId: string}, { rejectWithValue, fulfillWithValue }) => {
    const session = getDefaultSession();
    
    if (!session.info.isLoggedIn)
      throw rejectWithValue("The user is not logged in.");

    const rights = {
      read: true,
      write: false,
      control: false
    }

    const grant = true; //await universalAccess.setAgentAccess(arg.jobUrl, arg.agentWebId, rights, { fetch: session.fetch });

    console.log(grant);

    if (grant) {
      /*const profileDataset = await getSolidDataset(arg.agentWebId);
      const profileThing = getThing(profileDataset, arg.agentWebId);

      if (profileThing) {
        const ldpInbox = getUrl(profileThing, ldp + 'inbox');

        if (ldpInbox) {
          const notification = {
            "@context": "https://www.w3.org/ns/activitystreams",
            //"@id": "",
            "@type": "Announce",
            "actor": session.info.webId,
            "object": arg.jobUrl,
            "target": arg.agentWebId,
            //"updated": "2016-06-28T19:56:20.114Z"
          };

          const file = new Blob([JSON.stringify(notification)], { type: "plain/text" });
          const contentType: string = 'application/json'; //;profile="https://www.w3.org/ns/activitystreams"';

          const savedFile = await saveFileInContainer(ldpInbox, file, { contentType: contentType, fetch: session.fetch });

          if (savedFile)
            return;

          else throw rejectWithValue("Can't post to the LPD inbox of the agent " + arg.agentWebId + ".");
        }

        else throw rejectWithValue("Unable to find the LDP inbox of the agent " + arg.agentWebId + ".");
      }

      else throw rejectWithValue("Can't load the profile of the agent " + arg.agentWebId + ".");*/

      const notification = JSON.stringify({ url: arg.jobUrl });
      const response = await session.fetch("http://localhost:8080/job", { method: "POST", headers: { "Content-type": "application/json"}, body: notification});
      
      if (response.status === 200)
        return;

      else throw rejectWithValue("Unable to start the job.");
    }

    else throw rejectWithValue("Unable to grant the access to the agent.");
  }
);

export const addJob = createAsyncThunk<Job, {container: string, target: string, output: string}>(
  'jobs/add',
  async (arg: {container: string, target: string, output: string}, { fulfillWithValue, rejectWithValue }) => {
    const session = getDefaultSession();

    if (!session.info.isLoggedIn)
      throw rejectWithValue("The user is not logged in.");

    let jobDataset: SolidDataset = createSolidDataset();
    
    const si: string = "https://solid-indexer.org/";
    const sh: string = "http://www.w3.org/ns/shacl#";

    const target = buildThing(createThing())
        .addUrl(sh + "targetClass", arg.target)
        .build();
    
    const jobThing = buildThing(createThing({ name: "" }))
        .addUrl(RDF.type, si + 'IndexingJob')
        .addUrl(si + 'targetContainer', storage + arg.container)
        .addUrl(si + 'targetClass', target)
        .addUrl(si + 'targetOutput', arg.output)
        .build();
    
    jobDataset = setThing(jobDataset, jobThing);
    jobDataset = setThing(jobDataset, target);

    console.log(jobDataset);

    const savedSolidDataset = await saveSolidDatasetInContainer(storage + jobsPath, jobDataset, { fetch: session.fetch });

    const job = { url: savedSolidDataset.internal_resourceInfo.sourceIri, ...arg };
    return Promise.resolve(job);
  }
);

export const jobSlice = createSlice({
  name: 'jobs',
  initialState,
  // The `reducers` field lets us define reducers and generate associated actions
  reducers: {
    
  },
  // The `extraReducers` field lets the slice handle actions defined elsewhere,
  // including actions generated by createAsyncThunk or in other slices.
  extraReducers: (builder) => {
    builder
        .addCase(loadJobs.fulfilled, (state, action) => {
          state.jobs = state.jobs.concat(action.payload);
        })
        .addCase(loadJobs.rejected, (state, action) => {
            console.log(action.payload);
        })
        .addCase(addJob.fulfilled, (state, action) => {
            state.jobs = state.jobs.concat([action.payload]);
        })
        .addCase(addJob.rejected, (state, action) => {
            console.log(action.payload);
        })
  },
});

//export const { loginUser } = userSlice.actions;

// Selectors
export const selectJobs = (state: RootState) => state.jobs.jobs;

export default jobSlice.reducer;
