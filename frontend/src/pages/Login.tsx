import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/auth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const res = await loginUser(email, password);

    if (res.token) {
      localStorage.setItem("token", res.token); // <-- Save JWT here
      alert(res.message || "Login successful");
      navigate("/dashboard", { replace: true });
    } else {
      alert("No token returned from server");
    }
  } catch (err: any) {
    alert(err.message || "Login failed");
  }
};


  return (
    <form onSubmit={handleSubmit} className="p-4">
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 m-2"
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2 m-2"
        required
      />
      <button type="submit" className="bg-green-500 text-white p-2 m-2">Login</button>
    </form>
  );
};

export default Login;
