import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import ErrorBoundary from "~/components/ErrorBoundary";
import { routes } from "~/routes";
import NotFound from "~/pages/notfound/NotFound";

function App() {
    return (
        <>
            <ErrorBoundary>
            <BrowserRouter>
                <Routes>
                    {routes.map((route, _) => {
                        return (
                            <Route
                                key={route.path}
                                path={route.path}
                                element={<route.component />}
                            />
                        );
                    })}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </BrowserRouter>
            <ToastContainer />
            </ErrorBoundary>
        </>
    );
}

export default App;
