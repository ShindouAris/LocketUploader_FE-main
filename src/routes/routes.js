import Home from "~/pages/Home";
import CameraRoute from "~/pages/UseCamera/Camera";

export const routes = [
    {
        path: "/",
        component: Home,
    },
    {
        path: "/camera",
        component: CameraRoute
    }
];
