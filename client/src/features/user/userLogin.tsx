import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { Fragment, useEffect } from "react";
import { logUserIn, selectIsLoggedIn } from "./userSlice";

export default function UserLogin() {

    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const userIsLoggedIn = useAppSelector(selectIsLoggedIn);

    useEffect(() => {
        if (userIsLoggedIn) navigate('/');
        else dispatch(logUserIn());
    }, [userIsLoggedIn]);

    return (
        <Fragment>
            Login you in...
        </Fragment>
    );

}