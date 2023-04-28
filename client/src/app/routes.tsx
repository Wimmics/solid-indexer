import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import UserLogin from "../features/user/userLogin";

const router = createBrowserRouter([
    {
      path: "/",
      element: <App />,
    },
    {
      path: "login",
      element: <UserLogin />,
    },
]);

export default router;