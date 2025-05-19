import Home from "~/pages/Home";
import CameraRoute from "~/pages/UseCamera/Camera";
import Login from "~/pages/Login/login";

export const routes = [
    {
        path: "/",
        component: Home,
    },
    {
        path: "/camera",
        component: CameraRoute
    },
    {
        path: "/login",
        component: Login
    }
];
