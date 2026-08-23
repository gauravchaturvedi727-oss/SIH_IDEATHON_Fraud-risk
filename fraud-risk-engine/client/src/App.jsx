import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";

import { ToastContainer } from "react-toastify";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Transaction from "./pages/Transaction";
import TransactionDetails from "./pages/TransactionDetails";
import PhishingAnalyzer from "./pages/PhishingAnalyzer";
import VoiceAnalyzer from "./pages/VoiceAnalyzer";

import ProtectedRoute from "./components/ProtectedRoute";


function App() {

    return (

        <BrowserRouter>

            <Routes>

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/register"
                    element={<Register />}
                />

                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/transaction"
                    element={
                        <ProtectedRoute>
                            <Transaction />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/transaction/:id"
                    element={
                        <ProtectedRoute>
                            <TransactionDetails />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/phishing-analyzer"
                    element={
                        <ProtectedRoute>
                            <PhishingAnalyzer />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/voice-analyzer"
                    element={
                        <ProtectedRoute>
                            <VoiceAnalyzer />
                        </ProtectedRoute>
                    }
                />

            </Routes>


            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                pauseOnHover
                theme="dark"
            />

        </BrowserRouter>

    );

}


export default App;