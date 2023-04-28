import './App.css';
import { useAppDispatch, useAppSelector } from './app/hooks';
import JobCard from './features/job/jobCard';
import JobForm from './features/job/jobForm';
import { readTypeIndex, selectJobs, selectTypeIndex } from './features/job/jobSlice';
import UserCard from './features/user/userCard';
import { selectIsLoggedIn } from './features/user/userSlice';

export default function App() {

  const dispatch = useAppDispatch();

  const typeIndex = useAppSelector(selectTypeIndex);

  const userIsLoggedIn = useAppSelector(selectIsLoggedIn);
  const jobs = useAppSelector(selectJobs);

  return userIsLoggedIn ? (
    <div>
      <UserCard />

      <JobForm />

      <h3>List of jobs:</h3>

      {jobs.map((job, index) => {
        return <JobCard key={'job' + index} url={job.url} container={job.container} target={job.target} output={job.output} />
      })}

    <hr />

      <h3>TypeIndex content</h3>
      
      <div>
        <button onClick={() => dispatch(readTypeIndex())}>Read TypeIndex</button>
        <pre>
          {typeIndex}
        </pre>
      </div>
      
    </div>
    ) : <UserCard />
}