import "./Navbar.css"
import { Link } from "react-router-dom"

export default function Navbar() {
    return <nav className="nav-bar">
        <Link to="/">Home</Link>
        <a>2022 Winners</a>
        <a>Wards</a>
        <a>Resources</a>
        <a>Events</a>
        <a>About Us</a>
    </nav>
}