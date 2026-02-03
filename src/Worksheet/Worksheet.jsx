import "./Worksheet.css";
import { useParams, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { parseCSV } from "../Region/Region";

export default function Worksheet() {
  const { ward } = useParams();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [groupedNominees, setGroupedNominees] = useState({});
  const fileInputRef = useRef(null);

  // Load notes from local storage initially
  const [notes, setNotes] = useState(() => {
    try {
        const saved = localStorage.getItem(`vote_demo_worksheet_notes_${ward}`);
        return saved ? JSON.parse(saved) : {};
    } catch (e) {
        console.error("Failed to load notes", e);
        return {};
    }
  });

  // Save notes to local storage whenever they change
  useEffect(() => {
    localStorage.setItem(`vote_demo_worksheet_notes_${ward}`, JSON.stringify(notes));
  }, [notes, ward]);

  // Scroll to hash on load
  useEffect(() => {
    if (!loading && location.hash) {
        const id = location.hash.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    }
  }, [loading, location.hash]);

  const handleNoteChange = (id, text) => {
    setNotes(prev => ({
        ...prev,
        [id]: text
    }));
  };

  const handleExport = () => {
    // Collect all nominees flat list for easy mapping
    const allIds = Object.keys(notes);
    if (allIds.length === 0) {
        alert("No notes to export!");
        return;
    }

    let csvContent = "NomineeID,Name,Note\n";
    allIds.forEach(id => {
        // Find nominee name (OPTIONAL: makes CSV readable)
        let name = "Unknown Candidate";
        Object.values(groupedNominees).forEach(list => {
            const match = list.find(n => n.UniqueID === id);
            if (match) name = `${match.Given_Names} ${match.Last_Name}`;
        });
        
        // Escape quotes in note
        const safeNote = `"${notes[id].replace("\"", '\"\"')}"`;
        csvContent += `${id},"${name}",${safeNote}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `worksheet_notes_${ward}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
        const text = evt.target.result;
        try {
            const rows = parseCSV(text); // Reusing existing parser or simple parse since we just need ID and Note
            const newNotes = { ...notes };
            let importedCount = 0;
            
            rows.forEach(row => {
                if (row.NomineeID && row.Note) {
                    newNotes[row.NomineeID] = row.Note;
                    importedCount++;
                }
            });
            
            setNotes(newNotes);
            alert(`Successfully imported ${importedCount} notes.`);
        } catch (err) {
            console.error("Import error", err);
            alert("Failed to parse CSV. Please ensure formatting is correct (NomineeID,Name,Note).");
        }
        // Reset input
        e.target.value = null;
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    Promise.all([
      fetch('/municipality-map.csv').then(res => res.text()),
      fetch('/nominees.csv').then(res => res.text())
    ]).then(([mapText, nomineesText]) => {
      const municipalityData = parseCSV(mapText);
      const allNominees = parseCSV(nomineesText);

      // Parse ward param: e.g., "Kitchener-Ward-1"
      const parts = ward.split("-");
      // Assuming format "City-Ward-Number"
      // Municipality is everything before "Ward"
      const wardIndex = parts.indexOf("Ward");
      const municipalityName = parts.slice(0, wardIndex).join(" ");
      const wardNumber = parts[parts.length - 1];

      // Find municipality config
      const muniConfig = municipalityData.find(
        row => row.Name.toLowerCase() === municipalityName.toLowerCase()
      );

      if (!muniConfig) {
        console.error("Municipality not found");
        setLoading(false);
        return;
      }

      const racesToCheck = [];
      const rawRaces = muniConfig.Races.split(",");

      // Format ward number to match CSV (e.g., "1" -> "01")
      const formattedWardNum = wardNumber.length === 1 ? `0${wardNumber}` : wardNumber;
      const wardRaceId = `${municipalityName.replace(" ", "")}-Ward-${formattedWardNum}`;

      rawRaces.forEach(race => {
        if (race === "_SELF") {
          racesToCheck.push(wardRaceId);
        } else {
            racesToCheck.push(race);
        }
      });

      // Filter and group nominees
      const grouped = {};
      
      // Initialize groups based on the races we expect
      racesToCheck.forEach(raceId => {
          grouped[raceId] = [];
      });

      allNominees.forEach(nominee => {
        if (racesToCheck.includes(nominee.PositionUniqueName)) {
            if (!grouped[nominee.PositionUniqueName]) {
                grouped[nominee.PositionUniqueName] = [];
            }
            grouped[nominee.PositionUniqueName].push(nominee);
        }
      });

        // Sort each group: Alphabetical only
        Object.keys(grouped).forEach(key => {
            grouped[key].sort((a, b) => {
                return a.Last_Name.localeCompare(b.Last_Name);
            });
        });

      setGroupedNominees(grouped);
      setLoading(false);

    }).catch(err => {
      console.error("Error loading data:", err);
      setLoading(false);
    });
  }, [ward]);

  if (loading) return <div className="worksheet-container">Loading...</div>;

  return (
    <div className="worksheet-container">
      <div className="worksheet-header-row">
        <h1 className="worksheet-title">Worksheet for {ward.replace("-", " ")}</h1>
        <div className="worksheet-controls">
            <button className="control-btn" onClick={handleExport}>Export Notes</button>
            <button className="control-btn" onClick={handleImportClick}>Import Notes</button>
            <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept=".csv"
                onChange={handleFileChange}
            />
        </div>
      </div>
      
      {Object.entries(groupedNominees).map(([raceId, nominees]) => (
        <div key={raceId} id={raceId} className="worksheet-race-section">
          <h2 className="worksheet-race-title">
            {raceId.replace("-", " ").replace("SchoolBoard", "School Board")}
          </h2>
          {nominees.length > 0 ? (
            <div className="worksheet-nominees-list">
              {nominees.map((nominee, idx) => (
                <div key={idx} className="worksheet-nominee-item">
                  <div className="nominee-header">
                    <span className="nominee-name">
                        {nominee.Given_Names} {nominee.Last_Name}
                    </span>
                    {nominee.Website && (
                        <a href={nominee.Website} target="_blank" rel="noopener noreferrer" className="nominee-link">
                            Website
                        </a>
                    )}
                  </div>
                  <textarea 
                    className="worksheet-note-area"
                    placeholder="Write your notes here..."
                    value={notes[nominee.UniqueID] || ''}
                    onChange={(e) => handleNoteChange(nominee.UniqueID, e.target.value)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="no-nominees">No nominees found for this race.</p>
          )}
        </div>
      ))}
    </div>
  );
}