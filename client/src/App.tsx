import './App.css';
import { useAppSelector } from './app/hooks';
import JobCard from './features/job/jobCard';
import JobForm from './features/job/jobForm';
import { selectJobs } from './features/job/jobSlice';
import UserCard from './features/user/userCard';
import { selectIsLoggedIn } from './features/user/userSlice';

export default function App() {

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
      
    </div>
    ) : <UserCard />
}