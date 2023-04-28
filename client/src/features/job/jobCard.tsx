import { useState } from "react";
import { useAppDispatch } from "../../app/hooks";
import { Job, grantReadAccess, readAccess } from "./jobSlice";

export default function JobCard(props: Job) {

    const { url, container, target, output } = props;

    const dispatch = useAppDispatch();
    const [ agentWebId, setAgentWebId ] = useState<string>("http://localhost:8000/solid-indexer/profile/card#me");

    return (
        <div>
            <hr />
            <b>Job: {url}</b><br />
            Container: <i>{container}</i><br />
            Target: <i>{target}</i><br />
            Output: <i>{output}</i><br /><br />

            <input 
                type="text" 
                value={agentWebId} 
                onChange={(e) => setAgentWebId(e.target.value)} 
                readOnly
                style={{ width: "400px"}}
            /> 
            
            <button onClick={() => dispatch(grantReadAccess({jobUrl: url, agentWebId: agentWebId}))}>Start job</button>
        </div>
    )
}