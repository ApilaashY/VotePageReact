import "./Race.css";
import { useParams } from 'react-router-dom';
import { parseCSV } from "../Region/Region";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function Race() {
    const { race } = useParams();
    const [data, setData] = useState([]);
    const [media, setMedia] = useState([]);
    
    // We can assume the separator is the underscore.
    const separatorIndex = race.indexOf('_');
    const wardId = separatorIndex !== -1 ? race.substring(0, separatorIndex) : race;
    const raceId = separatorIndex !== -1 ? race.substring(separatorIndex + 1) : '';

    const worksheetUrl = `/worksheet/${wardId}#${raceId}`;

    useEffect(() => {
        fetch('/nominees.csv')
            .then(res => res.text())
            .then(csvText => {
            const parsed = parseCSV(csvText).filter(
                row => row.PositionUniqueName === (race.split("_")[1] === "SELF" ? race.split("_")[0] : race.split("_")[1])
            );
            // Sort winners first
            const sorted = parsed.sort((a, b) => (b.Winner === 'Y' ? 1 : 0) - (a.Winner === 'Y' ? 1 : 0));
            setData(sorted);
            })
            .catch(err => {
            console.error('Error loading CSV:', err);
            });

        fetch('/media.csv')
            .then(res => res.text())
            .then(csvText => {
            const parsed = parseCSV(csvText).filter(
                row => row.PositionIDList.includes((race.split("_")[1] === "SELF" ? race.split("_")[0] : race.split("_")[1]))
            );
            setMedia(parsed);
            })
            .catch(err => {
            console.error('Error loading CSV:', err);
            });
    }, [race]);

    const getInitials = (firstName, lastName) => {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    };

    const SocialLink = ({ url, platform, display }) => {
        if (!url) return null;
        return (
            <Link to={url} target="_blank" rel="noopener noreferrer" className={`social-link ${platform.toLowerCase()}`}>
                {display || platform}
            </Link>
        );
    };

    return (
        <div className="race-container">
            <div className="nominees-grid">
                {data.map((row, index) => (
                    <div key={index} className={`nominee-card ${row.Winner === 'Y' ? 'winner-card' : ''}`}>
                        {row.Winner === 'Y' && <div className="winner-badge">Previous Winner</div>}
                        
                        <div className="nominee-header">
                            <div className="nominee-avatar">
                                {getInitials(row.Given_Names, row.Last_Name)}
                            </div>
                            <div className="nominee-info">
                                <h2>{row.Given_Names} {row.Last_Name}</h2>
                                <p className="nominee-ward">
                                    {row.ward ? `Ward ${row.ward}` : row.Nominated_Office}
                                </p>
                            </div>
                        </div>

                        <div className="nominee-details">
                            {row.Email && (
                                <div className="detail-row">
                                    <span className="detail-icon">✉️</span>
                                    <a href={`mailto:${row.Email}`} title={row.Email}>Email</a>
                                </div>
                            )}
                            {row.Phone && (
                                <div className="detail-row">
                                    <span className="detail-icon">📞</span>
                                    <a href={`tel:${row.Phone}`}>{row.Phone}</a>
                                </div>
                            )}
                            {row.Website && (
                                <div className="detail-row">
                                    <span className="detail-icon">🌐</span>
                                    <Link to={row.Website} target="_blank" rel="noopener noreferrer">Website</Link>
                                </div>
                            )}
                        </div>

                        <div className="nominee-socials">
                            <SocialLink url={row.Twitter} platform="Twitter" display="𝕏" />
                            <SocialLink url={row.Facebook} platform="Facebook" display="FB" />
                            <SocialLink url={row.Instagram} platform="Instagram" display="IG" />
                            <SocialLink url={row.LinkedIn} platform="LinkedIn" display="in" />
                        </div>
                    </div>
                ))}
            </div>

            {media.length > 0 && (
                <>
                    {[
                        { title: 'Meeting Recordings', items: media.filter(m => m.ComparisonOrOpinion === 'Recording') },
                        { title: 'Questionnaires, Surveys, and Endorsement Lists', items: media.filter(m => m.ComparisonOrOpinion === 'Comparison') },
                        { title: 'News Items', items: media.filter(m => !['Comparison', 'Opinion', 'Recording'].includes(m.ComparisonOrOpinion)) },
                        { title: 'Opinion Pieces and Blog Posts', items: media.filter(m => m.ComparisonOrOpinion === 'Opinion') }
                    ].map((group) => (
                        group.items.length > 0 && (
                            <div key={group.title} className="section-container">
                                <h3 className="section-header">{group.title}</h3>
                                <div className="media-grid">
                                    {group.items.map((item, index) => (
                                        <div key={index} className="media-card">
                                            <h4 className="media-title">{item.Title}</h4>
                                            <p className="media-description">{item.Description}</p>
                                            {item.URL && (
                                                <Link to={item.URL} target="_blank" rel="noopener noreferrer" className="media-link">
                                                    Read Article →
                                                </Link>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    ))}
                </>
            )}
            
            {/* Floating Action Button */}
            <Link to={worksheetUrl} className="worksheet-fab">
                Go to Worksheet
            </Link>
        </div>
    );
}