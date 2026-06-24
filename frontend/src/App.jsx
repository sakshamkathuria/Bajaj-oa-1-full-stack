import { useState } from "react";
import axios from "axios";

function App() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);

  async function handleSubmit() {
    const arr = input.split(",");

    const res = await axios.post(
      "http://localhost:3000/bfhl",
      { data: arr }
    );

    setResult(res.data);
  }

  return (
    <div>
      <h1>BFHL Challenge</h1>

      <textarea
        rows={5}
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <br />

      <button onClick={handleSubmit}>
        Submit
      </button>

      {result && (
        <pre>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default App;