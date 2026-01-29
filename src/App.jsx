import './App.css'
import Navbar from './Navbar/Navbar'
import MapSection from './MapSection/MapSection'
import Region from './Region/Region'
import Race from './Race/Race'
import Worksheet from './Worksheet/Worksheet'
import { Routes, Route } from 'react-router-dom'

function App() {

  return (
    <div className="home">
    <Navbar />

    <main>
      <Routes>
        <Route path="/" element={
          <>
            <h1>Election Day <strong>was</strong> October 24, 2022.</h1>

            <p>Update, Dec 7: Added results of Cambridge/North Dumfries WCDSB election, and tallies for the French school boards as certified by the City of Kitchener (Catholic Board) and City of London (Public Board).</p> 

            <p>Update, Nov 5: Added voting period for WCDSB election.</p>

            <p>Update, Oct 25: We have updated the site with unofficial vote counts and winners for many races, excluding the French language school boards, and the suspended race.</p>

            <MapSection />
          </>
        } />
        <Route path="/region/:ward" element={<Region />} />
        <Route path="/region/race/:race" element={<Race />} />
        <Route path="/worksheet/:ward" element={<Worksheet />} />
      </Routes>
    </main>
    </div>
  )
}

export default App
