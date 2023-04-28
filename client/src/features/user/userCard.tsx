import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { logUserIn, selectIsLoggedIn, selectLoginStatus, selectWebId } from "./userSlice";

export default function UserCard() {

    const dispatch = useAppDispatch();

    const loginStatus = useAppSelector(selectLoginStatus);
    const isLoggedIn = useAppSelector(selectIsLoggedIn);
    const webId = useAppSelector(selectWebId);
    const user: string = (loginStatus === 'idle' && isLoggedIn)? "Logged as " + webId: (loginStatus === 'loading')? "loading...": "User is not logged in";

    return (
        <div>
            {!isLoggedIn && <a href="#" onClick={() => dispatch(logUserIn())}>Login</a>}
            <p>{user}</p>
        </div>
    )

}