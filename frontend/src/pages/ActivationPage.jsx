import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import { server } from "../server";

const ActivationPage = () => {
  const { activation_token } = useParams();
  const [error, setError] = React.useState(false);
  useEffect(() => {
    if (activation_token) {
      const activationEmail = async () => {
        try {
          const res = await axios.post(`${server}/activation`, {
            activation_token,
          });
          console.log(res.data.message);
        } catch (error) {
          console.log(error.responce.data.message);
        }
      };
      activationEmail();
    }
  }, [activation_token]);
  return(
    <div
    style={{
      width: "100%",
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    {error ? (
      <p>Your token is expired!</p>
    ) : (
      <p>Your account has been created suceessfully!</p>
    )}
  </div>
  );
};

export default ActivationPage;
