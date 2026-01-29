import "./Region.css";
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Parse CSV text into array of objects (no library needed)
export function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).filter(line => line.trim()).map(line => {
    // Handle quoted values (for the Races column with commas)
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    return headers.reduce((obj, header, i) => {
      obj[header.trim()] = values[i] || '';
      return obj;
    }, {});
  });
}

function capitalize(string) {
  return string.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

export default function Region() {
  const { ward } = useParams();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/municipality-map.csv')
      .then(res => res.text())
      .then(csvText => {
        const parsed = parseCSV(csvText);
        setData(parsed);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading CSV:', err);
        setLoading(false);
      });
  }, []);

  // Find ward data - matching by Name (case-insensitive, replacing dashes with spaces)
  const wardName = ward?.split("-").slice(0, ward?.split("-").length - 2).join(" ");
  const wardData = data.find(
    row => row.Name?.toLowerCase() === wardName?.toLowerCase()
  );

  if (loading) return <h1>Loading...</h1>;
  if (!wardData) return <h1>Ward not found: {ward}</h1>;

  return (
    <div style={{ width: "100%" }}>
      <h1>{wardData.Name}</h1>
      <p>Type: {wardData.MunicipalityType}</p>
      <div className="races">
        {wardData.Races.split(",").map((race, index) => {
          return  <Link to={`/region/race/${ward.replace("_SELF", "")}_${race.replace("_", "")}`} key={index}>
          <div className="race">
            <h2>
              {race.replace("SchoolBoard", "School Board")
                .replace("_SELF", `${capitalize(ward.replace("-", " "))} Councillor`)
                .split("-")
                .reduce((acc, word, i) => acc + (i%2 == 0 ? " " : "\n") + word, "")
                .split('\n')
                .map((line, i, arr) => (
                  <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
                ))}
            </h2>
          </div>
          </Link>
        })}
      </div>
    </div>
  );
}
