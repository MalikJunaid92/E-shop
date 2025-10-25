import { useEffect, useState } from "react";
import axios from "axios";
import { server } from "../server";
import { Navigate } from "react-router-dom";

const SellerProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const res = await axios.get(`${server}/shop/getSeller`, {
          withCredentials: true,
        });
        if (isMounted) {
          if (res.data && res.data.success) {
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
        }
      } catch (err) {
        if (isMounted) setIsAuthenticated(false);
      }
    };

    checkAuth();

    // ✅ cleanup when component unmounts
    return () => {
      isMounted = false;
    };
  }, []);

  if (isAuthenticated === null)
    return (
      <div className="w-full h-screen flex items-center justify-center text-lg">
        Checking authentication...
      </div>
    );

  return isAuthenticated ? children : <Navigate to="/shop-login" replace />;
};

export default SellerProtectedRoute;
