import { useState, useEffect } from 'react'
import viteDenoLogo from './assets/vite-deno.svg'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'

function App() {
  const [count, setCount] = useState(0)

  useEffect(() => {
	
	fetch('/api/v1').then((res) => res.json()).then((data) => {
	  console.log('Data from /api/v1:', data)
	});

  }, [])

  return (
    <>
      <img src={viteDenoLogo} alt="Vite with Deno" />
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>React + Deno + Kitledger</h1>
      <div className="card">
        <button type="button" onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App