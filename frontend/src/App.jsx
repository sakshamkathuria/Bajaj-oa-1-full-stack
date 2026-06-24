import { useState } from "react";
import axios from "axios";

function App() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function handleSubmit() {
    try {
      setError("");
      setResult(null);

      let arr;

      // If input starts with {, assume JSON
      if (input.trim().startsWith("{")) {
        const parsed = JSON.parse(input);

        if (!parsed.data || !Array.isArray(parsed.data)) {
          setError("JSON must contain data array");
          return;
        }

        arr = parsed.data;
      } else {
        // Simple comma separated input
        arr = input
          .split(",")
          .map(item => item.trim())
          .filter(item => item !== "");
      }

      const res = await axios.post(
        "http://localhost:3000/bfhl",
        { data: arr }
      );

      setResult(res.data);
    } catch (err) {
      setError("API call failed or invalid JSON");
    }
  }

  return (
    <div>
      <h1>BFHL Challenge</h1>

      <textarea
        rows={6}
        cols={40}
        placeholder='Enter edges like: A->B,A->C,B->D OR {"data":["A->B","A->C"]}'
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <br />
      <br />

      <button onClick={handleSubmit}>
        Submit
      </button>

      {error && (
        <p style={{ color: "red" }}>
          {error}
        </p>
      )}

      {result && (
        <pre>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default App;