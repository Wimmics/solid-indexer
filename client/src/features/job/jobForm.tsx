import { useEffect, useState } from "react"
import { addJob } from "./jobSlice";
import { useAppDispatch } from "../../app/hooks";

export default function JobForm() {

    const dispatch = useAppDispatch();

    const [ targetedContainer, setTargetedContainer ] = useState<string>("/things/");
    const [ targetedClass, setTargetedClass ] = useState<string>("http://xmlns.com/foaf/0.1/Person");
    const [ targetedOutput, setTargetedOutput ] = useState<string>("http://localhost:8000/user/public/typeIndex");

    const createJob = () => {
        dispatch(addJob({container: targetedContainer, target: targetedClass, output: targetedOutput}));
    }

    return (
        <div style={{
            display: "flex", 
            flexDirection: "column",
            alignItems: "start",
            background: "#eee",
            borderRadius: "8px",
            maxWidth: "500px",
            padding: "8px"
        }}>
            <div style={{ width: "100%", display: "flex", marginBottom: "16px" }}>
                <label htmlFor="targetedContainer">Targeted container: </label>
                <input 
                    style={{ flexGrow: 1 }}
                    type="text" 
                    id="targetedContainer" 
                    value={targetedContainer} 
                    onChange={(e) => setTargetedContainer(e.target.value)} 
                />
            </div>

            <div style={{ width: "100%", display: "flex", marginBottom: "16px" }}>
                <label htmlFor="targetedClass">Targeted class: </label>
                <input
                    style={{ flexGrow: 1 }}
                    type="text" 
                    id="targetedClass" 
                    value={targetedClass} 
                    onChange={(e) => setTargetedClass(e.target.value)} 
                />
            </div>
            
            <div style={{ width: "100%", display: "flex", marginBottom: "16px" }}>
                <label htmlFor="targetedOuput">Targeted output: </label>
                <input
                    style={{ flexGrow: 1 }} 
                    type="text" 
                    id="targetedOutput" 
                    value={targetedOutput}
                    onChange={(e) => setTargetedOutput(e.target.value)} 
                />
            </div>

            <button onClick={() => createJob()}>Add Job</button>
        </div>
    )
}