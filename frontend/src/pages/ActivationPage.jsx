import axios from "axios";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { server } from "../server";

const ActivationPage = () => {
  // accept multiple possible param names to avoid mismatch
  const params = useParams();
  const tokenParam =
    params.activation_token || params.activationToken || params.token || null;

  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!tokenParam) {
      setMessage("Activation token missing in URL.");
      setStatus("error");
      return;
    }

    const sendRequest = async () => {
      setStatus("loading");
      try {
        const token = decodeURIComponent(tokenParam);
        const { data } = await axios.post(`${server}/user/activation`, {
          activationToken: token,
        });
        console.log("Activation success:", data);
        setMessage(data.message || "Account activated.");
        setStatus("success");
      } catch (err) {
        console.error("Activation error:", err.response?.data || err.message);
        setMessage(err.response?.data?.message || "Activation failed.");
        setStatus("error");
      }
    };

    sendRequest();
  }, [tokenParam]);

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {status === "loading" && <p>Activating account…</p>}
      {status === "success" && <p>{message}</p>}
      {status === "error" && <p style={{ color: "red" }}>{message}</p>}
      {status === "idle" && <p>Preparing activation…</p>}
    </div>
  );
};

export default ActivationPage;
