import React, { useState } from "react";
import { registerUser } from "../api/auth";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await registerUser(email, password);
    alert(res.message);
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
      <button type="submit" className="bg-blue-500 text-white p-2 m-2">Register</button>
    </form>
  );
};

export default Register;
